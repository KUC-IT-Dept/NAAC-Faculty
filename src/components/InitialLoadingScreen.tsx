import { useEffect, useState } from 'react';
import qaiLogo from '../assets/qai-logo-transparent.png';
import './InitialLoadingScreen.css';

// PRESENTATION_MODE: Set to true to restore company logo after demonstration
const SHOW_COMPANY_LOGO = false;

interface Props {
  /** Fatal startup error. Stops the animation and shows a Retry button. */
  error?: string;
  onRetry?: () => void;
  /** Real startup progress, 0..1 (completed steps / total steps). */
  progress?: number;
  /** Startup finished: fade out, then unmount. The app renders underneath meanwhile. */
  ready?: boolean;
}

const FADE_OUT_MS = 400; // slightly above the 0.35s CSS transition
const SLOW_HINT_AFTER_MS = 4000; // real elapsed time, not simulated progress
const MIN_VISIBLE_FILL = 0.08; // keeps the rounded bar end visible at 0 steps

export default function InitialLoadingScreen({ error, onRetry, progress = 0, ready = false }: Props) {
  const [mounted, setMounted] = useState(true);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!ready) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), FADE_OUT_MS);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (ready || error) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), SLOW_HINT_AFTER_MS);
    return () => clearTimeout(t);
  }, [ready, error]);

  if (!mounted) return null;

  const pct = Math.round(Math.min(1, Math.max(ready ? 1 : progress, MIN_VISIBLE_FILL)) * 100);

  return (
    <div className="qai-loader" data-state={error ? 'error' : 'loading'} data-leaving={ready ? 'true' : 'false'}>
      <div className="qai-ring" aria-hidden="true">
        <div className="qai-ring__spin">
          <div className="qai-ring__glow"><div className="qai-ring__arc" /></div>
          <div className="qai-ring__arc" />
          <span className="qai-ring__head" />
        </div>
        {SHOW_COMPANY_LOGO && (
          <div className="qai-logo">
            <img src={qaiLogo} alt="" draggable={false} decoding="async" />
          </div>
        )}
      </div>

      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {SHOW_COMPANY_LOGO ? 'QAI / QARTINT' : 'IQAC Faculty Profile Portal'}
      </span>

      {error ? (
        <>
          <p className="qai-loader__error" role="alert">{error}</p>
          {onRetry && (
            <button type="button" className="qai-loader__retry" onClick={onRetry}>
              Try again
            </button>
          )}
        </>
      ) : (
        <>
          <p className="qai-loader__text" role="status" aria-live="polite">Preparing your workspace…</p>
          <div
            className="qai-bar"
            role="progressbar"
            aria-label="Loading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div className="qai-bar__fill" style={{ width: `${pct}%` }} />
          </div>
          {slow && !ready && (
            <p className="qai-loader__hint">
              Still connecting. The server may be waking up, which can take up to 30 seconds.
            </p>
          )}
        </>
      )}
    </div>
  );
}
