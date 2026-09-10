/**
 * chartLabelUtils.ts
 *
 * Shared logic for department-name-bearing charts (DepartmentBarChart,
 * StackedBarChart). Factored out because the label-wrapping and
 * responsive-width math is non-trivial and both charts need the same
 * behavior — duplicating it would be the kind of drift that caused the
 * original 260px-cap bug to only get fixed in one of the two files.
 */

export const CHARS_PER_LINE_PX = 6.2; // ~12px font, approximate monospaced-ish width
export const MAX_LABEL_LINES = 2;

/** Wrap a label into at most MAX_LABEL_LINES lines that each fit within
 *  `widthPx`. If it still doesn't fit after that many lines, the last
 *  line is ellipsized. The *full, untruncated* name always remains
 *  available via tooltip — this only controls what's drawn on the axis. */
export function wrapLabel(label: string, widthPx: number): string[] {
  const charsPerLine = Math.max(4, Math.floor(widthPx / CHARS_PER_LINE_PX));
  if (label.length <= charsPerLine) return [label];

  const words = label.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= charsPerLine) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === MAX_LABEL_LINES - 1) break;
    }
  }
  if (current) lines.push(current);

  if (lines.length >= MAX_LABEL_LINES) {
    // Whatever's left over (unconsumed words) gets folded into the last
    // line and ellipsized rather than silently dropped.
    const consumed = lines.join(' ').length;
    if (consumed < label.length) {
      const last = lines[lines.length - 1];
      const room = Math.max(3, charsPerLine - 1);
      lines[lines.length - 1] = last.length > room ? last.slice(0, room) + '…' : last + '…';
    }
  }
  return lines.slice(0, MAX_LABEL_LINES);
}

/** Desired (uncapped) label width for a set of labels — same formula as
 *  before, just extracted so both charts stay in sync. */
export function desiredLabelWidth(labels: string[]): number {
  const longest = labels.reduce((max, l) => Math.max(max, l.length), 0);
  return Math.max(longest * CHARS_PER_LINE_PX, 90);
}

/** Responsive label width: never let the label column eat more than
 *  ~42% of the actual rendered container width, so the plot area always
 *  keeps the majority of the space — this is the fix for the mobile
 *  (390px) case where a fixed 260px cap left almost no room for bars. */
export function adaptiveLabelWidth(labels: string[], containerWidth: number): number {
  const desired = desiredLabelWidth(labels);
  const cap = Math.max(70, containerWidth * 0.42);
  return Math.min(desired, cap, 260);
}

export type TopNOption = 10 | 15 | 25 | 'all';

/** Top-N selection: sort descending by value, optionally slice.
 *  Only changes what's *displayed* — never mutates or recomputes the
 *  underlying values, per the "must not change the metric values" rule. */
export function applyTopN<T extends { value: number }>(data: T[], topN: TopNOption): T[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return topN === 'all' ? sorted : sorted.slice(0, topN);
}

/** Default Top-N for a given dataset size, per spec: don't show the
 *  control at all for <=25 departments (return 'all' — no visual change
 *  from before), default to 15 once it's actually needed. */
export function defaultTopN(count: number): TopNOption {
  return count > 25 ? 15 : 'all';
}
