import { useCallback, useEffect, useState } from 'react';
import { loadDropdownOptionsFromServer } from '../shared/dropdownOptions';

/**
 * Real startup work for the app shell. Nothing here is simulated:
 *   1. session  - AuthContext finished restoring the stored login (passed in)
 *   2. server   - GET /api/health answered 2xx (fatal if it fails or times out)
 *   3. options  - shared dropdown options loaded (non-fatal: cached/default
 *                 options are used if the server is slow or unreachable)
 *
 * Both network steps are time-bounded so the loading screen can never hang
 * forever; on a fatal failure the caller gets an error + retry().
 */

export const HEALTH_TIMEOUT_MS = 30_000; // covers a cold-starting free-tier host
export const DROPDOWN_TIMEOUT_MS = 10_000;

export const MSG_UNREACHABLE =
  'Cannot connect to the backend server. Please check your connection or try again later.';
export const MSG_TIMEOUT =
  'The server is taking too long to respond. Please try again in a moment.';

export function resolveHealthUrl(): string {
  const baseUrl = import.meta.env.VITE_API_URL || '/api/faculty';
  return baseUrl.endsWith('/faculty')
    ? baseUrl.replace('/faculty', '/health')
    : baseUrl.endsWith('/api')
      ? `${baseUrl}/health`
      : `${baseUrl}/api/health`;
}

async function checkHealth(signal: AbortSignal): Promise<void> {
  const res = await fetch(resolveHealthUrl(), { signal });
  if (!res.ok) throw new Error('Backend is not responding properly.');
  await res.json();
}

function settleWithin(work: Promise<unknown>, ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      console.warn(`Dropdown options did not load within ${ms}ms; continuing with cached/default options.`);
      resolve();
    }, ms);
    work.then(
      () => { clearTimeout(timer); resolve(); },
      () => { clearTimeout(timer); resolve(); },
    );
  });
}

export type BootstrapStatus = 'loading' | 'ready' | 'error';

export function useAppBootstrap(sessionReady: boolean) {
  const [attempt, setAttempt] = useState(0);
  const [serverReady, setServerReady] = useState(false);
  const [optionsReady, setOptionsReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timedOut = false;
    const controller = new AbortController();

    setServerReady(false);
    setOptionsReady(false);
    setError('');

    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, HEALTH_TIMEOUT_MS);

    checkHealth(controller.signal)
      .then(() => { if (!cancelled) setServerReady(true); })
      .catch(() => { if (!cancelled) setError(timedOut ? MSG_TIMEOUT : MSG_UNREACHABLE); })
      .finally(() => clearTimeout(timer));

    settleWithin(loadDropdownOptionsFromServer(), DROPDOWN_TIMEOUT_MS)
      .then(() => { if (!cancelled) setOptionsReady(true); });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const status: BootstrapStatus = error
    ? 'error'
    : sessionReady && serverReady && optionsReady
      ? 'ready'
      : 'loading';
  const progress = ([sessionReady, serverReady, optionsReady].filter(Boolean).length) / 3;

  return { status, error, progress, retry };
}
