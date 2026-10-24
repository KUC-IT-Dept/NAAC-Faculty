/**
 * benchmarkScoring.js
 *
 * Pure (no database) helpers for NAAC benchmark score bands:
 *   - parseBandLabel   : ">=20", "15-20", "<5", "<=20:1", "20:1-30:1", "A"
 *   - normalizeBands   : stored bands -> intervals with explicit inclusivity
 *   - inferDirection   : higherIsBetter / lowerIsBetter from the band geometry
 *   - validateBands    : structural problems (missing score, gaps, overlaps)
 *   - evaluateNumeric / evaluateCategorical
 *
 * Interval convention (matches how NAAC tables are read):
 *   ">=x"  -> [x, +inf)      ">x" -> (x, +inf)
 *   "<=x"  -> (-inf, x]      "<x" -> (-inf, x)
 *   "a-b"  -> [a, b)         a value equal to the shared boundary belongs to
 *                            the band whose lower bound it is.
 *   "a:1"  -> ratio expressed as the number a (students per teacher etc.).
 *
 * Nothing here ever invents a number: unparseable labels return kind 'invalid'.
 */

'use strict';

const NUM = '(\\d+(?:\\.\\d+)?)(?::1)?';

function clean(label) {
  return String(label == null ? '' : label)
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2265/g, '>=')
    .replace(/\u2264/g, '<=')
    .replace(/\s+/g, '');
}

/**
 * @returns {{kind:'range'|'option'|'invalid'|'empty', min:number|null, max:number|null,
 *            minInclusive:boolean, maxInclusive:boolean, ratio:boolean, label:string}}
 */
function parseBandLabel(rawLabel) {
  const label = clean(rawLabel);
  const base = { min: null, max: null, minInclusive: true, maxInclusive: true, ratio: /:1/.test(label), label };
  if (!label) return { ...base, kind: 'empty' };
  if (/^[A-Ea-e]$/.test(label)) return { ...base, kind: 'option', label: label.toUpperCase() };

  let m;
  if ((m = label.match(new RegExp(`^>=${NUM}$`)))) return { ...base, kind: 'range', min: Number(m[1]), minInclusive: true, max: null };
  if ((m = label.match(new RegExp(`^>${NUM}$`))))  return { ...base, kind: 'range', min: Number(m[1]), minInclusive: false, max: null };
  if ((m = label.match(new RegExp(`^<=${NUM}$`)))) return { ...base, kind: 'range', max: Number(m[1]), maxInclusive: true, min: null };
  if ((m = label.match(new RegExp(`^<${NUM}$`))))  return { ...base, kind: 'range', max: Number(m[1]), maxInclusive: false, min: null };
  if ((m = label.match(new RegExp(`^${NUM}-${NUM}$`)))) {
    const lo = Number(m[1]); const hi = Number(m[2]);
    if (!(lo < hi)) return { ...base, kind: 'invalid' };
    return { ...base, kind: 'range', min: lo, max: hi, minInclusive: true, maxInclusive: false };
  }
  if ((m = label.match(new RegExp(`^${NUM}$`)))) {
    const v = Number(m[1]);
    return { ...base, kind: 'range', min: v, max: v, minInclusive: true, maxInclusive: true };
  }
  return { ...base, kind: 'invalid' };
}

/** Representative point of a band (used only to compare bands against each other). */
function repValue(p) {
  if (p.min !== null && p.max !== null) return (p.min + p.max) / 2;
  if (p.min !== null) return p.min;
  if (p.max !== null) return p.max;
  return null;
}

/**
 * Stored band -> parsed band. The label (the PDF text) is authoritative when it
 * parses; otherwise fall back to stored min/max with inclusive ends (legacy docs).
 */
function normalizeBand(b) {
  const p = parseBandLabel(b.label);
  if (p.kind === 'range' || p.kind === 'option') return { score: b.score, ...p };
  return {
    score: b.score,
    kind: (b.min == null && b.max == null) ? 'empty' : 'range',
    min: b.min == null ? null : b.min, max: b.max == null ? null : b.max,
    minInclusive: true, maxInclusive: true, ratio: false, label: b.label || '',
  };
}

function normalizeBands(bands) {
  return (bands || []).map(normalizeBand);
}

function isCategorical(bands) {
  const nb = normalizeBands(bands);
  return nb.length > 0 && nb.every((b) => b.kind === 'option');
}

/**
 * Direction from the geometry of the top (4) and bottom (0) bands.
 * Returns null when it cannot be determined (categorical / missing bands).
 */
function inferDirection(bands) {
  const nb = normalizeBands(bands);
  const top = nb.find((b) => b.score === 4);
  const bottom = nb.find((b) => b.score === 0);
  if (!top || !bottom || top.kind !== 'range' || bottom.kind !== 'range') return null;
  const a = repValue(top); const z = repValue(bottom);
  if (a === null || z === null || a === z) return null;
  // Open-ended top: ">=x" means higher is better, "<x" means lower is better.
  if (top.min !== null && top.max === null) return 'higherIsBetter';
  if (top.max !== null && top.min === null) return 'lowerIsBetter';
  return a > z ? 'higherIsBetter' : 'lowerIsBetter';
}

/** The number a metric must reach (higher) or stay under (lower) for score 4. */
function benchmarkTarget(bands, direction) {
  const top = normalizeBands(bands).find((b) => b.score === 4);
  if (!top || top.kind !== 'range') return null;
  const dir = direction || inferDirection(bands);
  if (dir === 'lowerIsBetter') return top.max !== null ? top.max : top.min;
  return top.min !== null ? top.min : top.max;
}

function contains(p, v) {
  if (p.min !== null) { if (p.minInclusive ? v < p.min : v <= p.min) return false; }
  if (p.max !== null) { if (p.maxInclusive ? v > p.max : v >= p.max) return false; }
  return !(p.min === null && p.max === null);
}

/**
 * Structural validation of an (edited) 4..0 band set.
 * @returns {Array<{code:string, severity:'error'|'warning', message:string}>}
 */
function validateBands(bands) {
  const out = [];
  const list = bands || [];
  const scores = list.map((b) => b.score).sort().join(',');
  if (list.length === 0) {
    out.push({ code: 'no_bands', severity: 'error', message: 'No score bands (4 to 0) were found.' });
    return out;
  }
  if (scores !== '0,1,2,3,4') {
    out.push({ code: 'incomplete_bands', severity: 'error', message: 'Exactly one band is required for each score 4, 3, 2, 1 and 0.' });
    return out;
  }
  const nb = normalizeBands(list);
  const bad = nb.filter((b) => b.kind === 'invalid' || b.kind === 'empty');
  if (bad.length) {
    out.push({ code: 'unreadable_band', severity: 'error', message: `Unreadable band value for score ${bad.map((b) => b.score).join(', ')}.` });
    return out;
  }
  const kinds = new Set(nb.map((b) => b.kind));
  if (kinds.size > 1) {
    out.push({ code: 'mixed_band_types', severity: 'error', message: 'Bands mix options (A-E) and numeric ranges.' });
    return out;
  }
  if (kinds.has('option')) {
    const letters = nb.slice().sort((x, y) => y.score - x.score).map((b) => b.label).join('');
    if (letters !== 'ABCDE') out.push({ code: 'option_order', severity: 'warning', message: `Option bands read ${letters}; expected A,B,C,D,E for scores 4..0.` });
    return out;
  }
  const dir = inferDirection(list);
  if (!dir) {
    out.push({ code: 'direction_unknown', severity: 'error', message: 'Scoring direction cannot be determined from the bands.' });
    return out;
  }
  // Order bands from worst (0) to best (4); in lowerIsBetter the sequence of values descends.
  const ordered = nb.slice().sort((x, y) => x.score - y.score);
  for (let i = 0; i < ordered.length - 1; i += 1) {
    const lowScore = ordered[i]; const highScore = ordered[i + 1];
    const a = repValue(lowScore); const b = repValue(highScore);
    const ok = dir === 'higherIsBetter' ? a < b : a > b;
    if (!ok) {
      out.push({ code: 'non_monotonic', severity: 'error', message: `Band ${highScore.score} (${highScore.label}) is not ${dir === 'higherIsBetter' ? 'above' : 'below'} band ${lowScore.score} (${lowScore.label}).` });
      return out;
    }
    // adjacency: shared boundary between neighbouring bands
    const edgeLow = dir === 'higherIsBetter' ? lowScore.max : lowScore.min;
    const edgeHigh = dir === 'higherIsBetter' ? highScore.min : highScore.max;
    if (edgeLow !== null && edgeHigh !== null && edgeLow !== edgeHigh) {
      out.push({
        code: edgeLow < edgeHigh === (dir === 'higherIsBetter') ? 'band_gap' : 'band_overlap',
        severity: 'warning',
        message: `Bands ${lowScore.score} (${lowScore.label}) and ${highScore.score} (${highScore.label}) do not share a boundary.`,
      });
    }
  }
  return out;
}

/**
 * Numeric evaluation.
 * @returns {{score:number|null, status:string, bandLabel:string|null, direction:string|null,
 *            target:number|null, gap:number|null}}
 */
function evaluateNumeric(bands, value, directionHint) {
  const direction = inferDirection(bands) || directionHint || null;
  const target = benchmarkTarget(bands, direction);
  if (value === null || value === undefined || typeof value !== 'number' || !Number.isFinite(value)) {
    return { score: null, status: 'insufficient', bandLabel: null, direction, target, gap: null };
  }
  const nb = normalizeBands(bands);
  let hit = null;
  for (const b of nb) if (b.kind === 'range' && contains(b, value)) { hit = b; break; }
  if (!hit) return { score: null, status: 'insufficient', bandLabel: null, direction, target, gap: null };
  let gap = null;
  if (target !== null) {
    const raw = direction === 'lowerIsBetter' ? value - target : target - value;
    gap = Number(raw.toFixed(4));
  }
  return { score: hit.score, status: statusForScore(hit.score), bandLabel: hit.label, direction, target, gap };
}

/** Categorical value must be exactly one of the option letters. Never coerced from numbers. */
function evaluateCategorical(bands, value) {
  const nb = normalizeBands(bands);
  const v = typeof value === 'string' ? value.trim().toUpperCase() : null;
  const hit = v ? nb.find((b) => b.kind === 'option' && b.label === v) : null;
  if (!hit) return { score: null, status: 'insufficient', bandLabel: null, direction: null, target: null, gap: null };
  return { score: hit.score, status: statusForScore(hit.score), bandLabel: hit.label, direction: null, target: null, gap: null };
}

function statusForScore(score) {
  if (score >= 3) return 'above';
  if (score === 2) return 'meets';
  return 'below';
}

module.exports = {
  parseBandLabel, normalizeBands, isCategorical, inferDirection, benchmarkTarget,
  validateBands, evaluateNumeric, evaluateCategorical, statusForScore,
};
