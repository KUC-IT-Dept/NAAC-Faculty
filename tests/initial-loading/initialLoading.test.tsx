import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { readFileSync } from 'fs';
import path from 'path';

const loadDropdowns = vi.fn();
vi.mock('../../src/shared/dropdownOptions', () => ({
  loadDropdownOptionsFromServer: () => loadDropdowns(),
}));

import InitialLoadingScreen from '../../src/components/InitialLoadingScreen';
import {
  useAppBootstrap,
  HEALTH_TIMEOUT_MS,
  DROPDOWN_TIMEOUT_MS,
  MSG_UNREACHABLE,
  MSG_TIMEOUT,
} from '../../src/lib/useAppBootstrap';

// Same wiring shape as AppRoutes in src/App.tsx.
function Harness({ sessionReady = true }: { sessionReady?: boolean }) {
  const { status, error, progress, retry } = useAppBootstrap(sessionReady);
  return (
    <>
      {status === 'ready' && <div data-testid="app">APP</div>}
      <InitialLoadingScreen
        error={status === 'error' ? error : undefined}
        onRetry={retry}
        progress={progress}
        ready={status === 'ready'}
      />
    </>
  );
}

const flush = async (ms = 0) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const okResponse = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) });

beforeEach(() => {
  vi.useFakeTimers();
  loadDropdowns.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('startup loading screen', () => {
  it('success: shows the screen, app mounts with NO artificial delay, overlay fades out then unmounts', async () => {
    vi.stubGlobal('fetch', vi.fn(okResponse));
    const { container } = render(<Harness />);

    expect(screen.getByText('Preparing your workspace…')).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.queryByTestId('app')).toBeNull();

    await flush(0); // microtasks only - the old code waited a hard-coded 500ms here
    expect(screen.getByTestId('app')).toBeTruthy();
    expect(container.querySelector('.qai-loader')?.getAttribute('data-leaving')).toBe('true');

    await flush(450);
    expect(container.querySelector('.qai-loader')).toBeNull();
    expect(screen.getByTestId('app')).toBeTruthy();
  });

  it('progress reflects real steps only', async () => {
    let resolveHealth!: (v: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((r) => { resolveHealth = r; })));
    render(<Harness />);
    await flush(0); // session + dropdown options done, server still pending => 2/3
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('67');
    await act(async () => { resolveHealth({ ok: true, json: () => Promise.resolve({}) }); });
    await flush(0);
    expect(screen.getByTestId('app')).toBeTruthy();
  });

  it('waits for the session before declaring ready', async () => {
    vi.stubGlobal('fetch', vi.fn(okResponse));
    const { rerender } = render(<Harness sessionReady={false} />);
    await flush(0);
    expect(screen.queryByTestId('app')).toBeNull();
    rerender(<Harness sessionReady />);
    await flush(0);
    expect(screen.getByTestId('app')).toBeTruthy();
  });

  it('slow response: stays loading, shows an honest hint after 4s, still completes', async () => {
    let resolveHealth!: (v: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((r) => { resolveHealth = r; })));
    render(<Harness />);
    await flush(3900);
    expect(screen.queryByText(/Still connecting/)).toBeNull();
    await flush(200);
    expect(screen.getByText(/Still connecting/)).toBeTruthy();
    await act(async () => { resolveHealth({ ok: true, json: () => Promise.resolve({}) }); });
    await flush(0);
    expect(screen.getByTestId('app')).toBeTruthy();
  });

  it('backend failure (network): exits loading into error + retry, then recovers', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockImplementation(okResponse);
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<Harness />);
    await flush(0);

    expect(screen.getByRole('alert').textContent).toBe(MSG_UNREACHABLE);
    expect(container.querySelector('.qai-loader')?.getAttribute('data-state')).toBe('error');
    expect(screen.queryByText('Preparing your workspace…')).toBeNull();
    expect(screen.queryByTestId('app')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await flush(0);
    expect(screen.getByTestId('app')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('backend failure (non-2xx) is also surfaced', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) })));
    render(<Harness />);
    await flush(0);
    expect(screen.getByRole('alert').textContent).toBe(MSG_UNREACHABLE);
  });

  it('hung backend cannot leave the screen stuck: aborts after the timeout', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => new Promise((_res, rej) => {
      init?.signal?.addEventListener('abort', () => rej(new DOMException('Aborted', 'AbortError')));
    })));
    render(<Harness />);
    await flush(HEALTH_TIMEOUT_MS - 100);
    expect(screen.queryByRole('alert')).toBeNull();
    await flush(200);
    expect(screen.getByRole('alert').textContent).toBe(MSG_TIMEOUT);
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
  });

  it('dropdown options hanging is non-fatal and bounded', async () => {
    loadDropdowns.mockReturnValue(new Promise(() => {})); // never settles
    vi.stubGlobal('fetch', vi.fn(okResponse));
    render(<Harness />);
    await flush(DROPDOWN_TIMEOUT_MS - 100);
    expect(screen.queryByTestId('app')).toBeNull();
    await flush(200);
    expect(screen.getByTestId('app')).toBeTruthy();
  });

  it('dropdown options rejecting is non-fatal', async () => {
    loadDropdowns.mockRejectedValue(new Error('boom'));
    vi.stubGlobal('fetch', vi.fn(okResponse));
    render(<Harness />);
    await flush(0);
    expect(screen.getByTestId('app')).toBeTruthy();
  });

  it('unmounting mid-flight aborts the request and does not update state', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn((_u: string, init?: RequestInit) => { signal = init?.signal ?? undefined; return new Promise(() => {}); }));
    const { unmount } = render(<Harness />);
    await flush(0);
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});

describe('static guarantees', () => {
  const css = readFileSync(path.resolve(__dirname, '../../src/components/InitialLoadingScreen.css'), 'utf8');
  const tsx = readFileSync(path.resolve(__dirname, '../../src/components/InitialLoadingScreen.tsx'), 'utf8');

  it('honours prefers-reduced-motion for spin, sheen and fades', () => {
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(block).toMatch(/\.qai-ring__spin\s*{\s*animation:\s*none/);
    expect(block).toMatch(/\.qai-bar__fill::after[^}]*display:\s*none/);
    expect(block).toMatch(/\.qai-loader\s*{[^}]*animation:\s*none/);
  });

  it('uses the project\'s original logo asset, unmodified aspect ratio', () => {
    expect(tsx).toContain("../assets/qai-logo-transparent.png");
    expect(css).toMatch(/\.qai-logo img[^}]*height:\s*auto/);
  });
});
