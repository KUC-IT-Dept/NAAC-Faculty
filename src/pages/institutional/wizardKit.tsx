/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components */
// src/pages/institutional/wizardKit.tsx
//
// Shared pieces for the Library and MMTTC full-page wizards: field
// components, the wizard shell (stepper + single bottom action bar) and
// payload helpers. Styles live in wizard.css.
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import './wizard.css';

export type Errors = Record<string, string>;

interface BaseProps { label: string; error?: string; full?: boolean; hint?: string }
const wrap = (full?: boolean) => (full ? 'form-group wz-full' : 'form-group');
const Err = ({ error }: { error?: string }) => (error ? <div className="wz-err">{error}</div> : null);

export function TextField({ label, value, onChange, error, full, hint, type = 'text', placeholder }: BaseProps & { value: any; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className={wrap(full)}>
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <div className="text-muted text-sm">{hint}</div>}
      <Err error={error} />
    </div>
  );
}

/** Non-negative whole number. Keeps a string while typing so "" is editable; commits a number. */
export function NumField({ label, value, onChange, error, full, hint, min = 0, max }: BaseProps & { value: any; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className={wrap(full)}>
      <label className="form-label">{label}</label>
      <input
        className="form-input" type="number" inputMode="numeric" step={1} min={min} max={max}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? (undefined as any) : Number(e.target.value))}
        onKeyDown={(e) => { if (['.', ',', 'e', 'E', '+', '-', ' '].includes(e.key)) e.preventDefault(); }}
      />
      {hint && <div className="text-muted text-sm">{hint}</div>}
      <Err error={error} />
    </div>
  );
}

export function DateField({ label, value, onChange, error, full }: BaseProps & { value: any; onChange: (v: string) => void }) {
  return (
    <div className={wrap(full)}>
      <label className="form-label">{label}</label>
      <input className="form-input" type="date" value={toDateInput(value)} onChange={(e) => onChange(e.target.value)} />
      <Err error={error} />
    </div>
  );
}

export function SelectField({ label, value, onChange, options, error, full }: BaseProps & { value: any; onChange: (v: string) => void; options: Array<string | { value: string; label: string }> }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const hasValue = value === '' || value == null || opts.some((o) => o.value === String(value));
  return (
    <div className={wrap(full)}>
      <label className="form-label">{label}</label>
      <select className="form-select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Select —</option>
        {!hasValue && <option value={String(value)}>{String(value)}</option>}
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Err error={error} />
    </div>
  );
}

export function YesNoField({ label, value, onChange, full }: { label: string; value: any; onChange: (v: boolean) => void; full?: boolean }) {
  return (
    <div className={wrap(full)}>
      <label className="form-label">{label}</label>
      <select className="form-select" value={value ? 'yes' : 'no'} onChange={(e) => onChange(e.target.value === 'yes')}>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  );
}

export function TextAreaField({ label, value, onChange, full = true, rows = 3 }: BaseProps & { value: any; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className={wrap(full)}>
      <label className="form-label">{label}</label>
      <textarea className="form-textarea" rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export const Sub = ({ children }: { children: ReactNode }) => <div className="wz-sub">{children}</div>;
export const Note = ({ children }: { children: ReactNode }) => <p className="wz-note">{children}</p>;

export function toDateInput(v: any): string {
  if (!v) return '';
  const s = String(v);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
}

const META_KEYS = ['_id', '__v', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'];

/** Deep-copies a record for sending: drops bookkeeping keys, turns '' dates into null and undefined numbers into 0. */
export function cleanPayload<T extends Record<string, any>>(rec: T, dateKeys: string[], dropKeys: string[] = []): any {
  const walk = (val: any, key?: string): any => {
    if (Array.isArray(val)) return val.map((v) => walk(v));
    if (val && typeof val === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(val)) {
        if (META_KEYS.includes(k)) continue;
        out[k] = walk(v, k);
      }
      return out;
    }
    if (key && dateKeys.includes(key) && (val === '' || val === undefined)) return null;
    return val;
  };
  const out = walk(rec);
  dropKeys.forEach((k) => delete out[k]);
  return out;
}


interface ShellProps {
  title: string; subtitle: string; steps: string[]; step: number; maxStep: number;
  onStep: (i: number) => void; onNext: () => void; onBack: () => void; onCancel: () => void;
  onSave: () => void; saving: boolean; editing: boolean; stepTitle: string; children: ReactNode;
}

export function WizardShell(p: ShellProps) {
  const last = p.step === p.steps.length - 1;
  return (
    <div className="wz">
      <div className="wz-head">
        <div><h2>{p.title}</h2><p>{p.subtitle}</p></div>
        <button className="btn btn-outline btn-sm" onClick={p.onCancel} disabled={p.saving}>Back to Records</button>
      </div>
      <div className="wz-stepper" role="tablist">
        {p.steps.map((label, i) => (
          <button
            key={label} type="button" role="tab" aria-selected={i === p.step} disabled={i > p.maxStep || p.saving}
            className={`wz-step ${i === p.step ? 'active' : ''} ${i < p.step ? 'done' : ''}`} onClick={() => p.onStep(i)}
          >
            <span className="wz-num">{i < p.step ? <Check size={12} /> : i + 1}</span>{label}
          </button>
        ))}
      </div>
      <div className="wz-panel">
        <h3>{p.stepTitle}</h3>
        {p.children}
      </div>
      <div className="wz-bar">
        <button className="btn btn-outline" onClick={p.onBack} disabled={p.step === 0 || p.saving}><ArrowLeft size={14} /> Back</button>
        <button className="btn btn-outline" onClick={p.onCancel} disabled={p.saving}>Cancel</button>
        <div className="wz-spacer" />
        {p.editing && !last && <button className="btn btn-outline" onClick={p.onSave} disabled={p.saving}>{p.saving ? 'Saving…' : 'Save Changes'}</button>}
        {last
          ? <button className="btn btn-primary" onClick={p.onSave} disabled={p.saving}>{p.saving ? 'Saving…' : p.editing ? 'Save Changes' : 'Save Record'}</button>
          : <button className="btn btn-primary" onClick={p.onNext} disabled={p.saving}>Next <ArrowRight size={14} /></button>}
      </div>
    </div>
  );
}
