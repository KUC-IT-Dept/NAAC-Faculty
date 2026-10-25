import { useEffect, useState } from 'react';
import { getMetricOptions, type MetricOption } from '../../lib/benchmarkImportApi';

const CRITERIA: Record<number, string> = {
  1: 'Curricular Aspects', 2: 'Teaching-Learning and Evaluation', 3: 'Research, Innovations and Extension',
  4: 'Infrastructure and Learning Resources', 5: 'Student Support and Progression',
  6: 'Governance, Leadership and Management', 7: 'Institutional Values and Best Practices',
};

/** Mirrors server metricUnits.unitCompatibility so the picker can warn before saving. */
function unitFits(kind: string | null | undefined, unit: string): boolean {
  if (!kind || !unit) return true;
  if (unit === 'option') return false;
  return kind === unit || (unit === 'amount_lakhs' && kind === 'currency_inr') || (unit === 'days' && kind === 'decimal');
}

interface Props {
  value: string | null;
  unit: string;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  ariaLabel?: string;
  style?: React.CSSProperties;
  unmappedLabel?: string;
  options?: MetricOption[];
}

/** Every analytics metric from the registry, grouped by NAAC criterion. Incompatible/unsupported ones are disabled. */
export default function MetricMappingSelect({ value, unit, onChange, disabled, ariaLabel, style, unmappedLabel, options: given }: Props) {
  const [fetched, setFetched] = useState<MetricOption[]>([]);
  useEffect(() => { if (!given) getMetricOptions().then(setFetched).catch(() => setFetched([])); }, [given]);
  const options = given || fetched;

  const groups = new Map<string, MetricOption[]>();
  for (const o of options) {
    const key = o.criterionNumber ? `Criterion ${o.criterionNumber} \u2013 ${CRITERIA[o.criterionNumber] || ''}` : 'Other metrics';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(o);
  }
  const known = !value || options.some((o) => o.metricId === value);

  return (
    <select aria-label={ariaLabel} style={style} disabled={disabled} value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{unmappedLabel || '\u2014 Unmapped (current value will read "Insufficient data") \u2014'}</option>
      {!known && <option value={value!}>{value} (not in analytics catalogue)</option>}
      {[...groups.entries()].map(([label, list]) => (
        <optgroup key={label} label={label}>
          {list.map((o) => {
            const fits = unitFits(o.unitKind, unit);
            const unsupported = o.supported === false;
            const note = unsupported ? ' \u2014 unsupported' : !fits ? ` \u2014 unit differs (${o.unitKind})` : '';
            return <option key={o.metricId} value={o.metricId} disabled={(unsupported || !fits) && o.metricId !== value} title={o.unsupportedReason || o.description || undefined}>{o.metricId} \u2014 {o.metricName}{note}</option>;
          })}
        </optgroup>
      ))}
    </select>
  );
}
