/**
 * benchmarkPdfParser.js
 *
 * Turns a NAAC "Benchmark Document" PDF (General University Manual layout) into
 * editable DRAFT rows. Nothing here touches the database and nothing is
 * activated: the output is a proposal that an administrator must review.
 *
 * Pipeline
 *   extractPagesChunked(buffer,{onPage}) -> pages streamed in bounded chunks      (pdfjs-dist)
 *   createPageParser().feed(page)/finish() -> incremental parse (parsePages = wrapper)
 *   parsePages(pages)     -> { rows, criteria, warnings, scannedPages }
 *   validateRow(row, ctx) -> [{ code, severity, message }]      (also used on every edit)
 *
 * Scanned pages (no text layer) are NOT OCR'd; they are reported in
 * `scannedPages` so the UI can direct the administrator to manual entry.
 */

'use strict';

const {
  parseBandLabel, validateBands, inferDirection, isCategorical,
} = require('./benchmarkScoring');

const UNITS = ['count', 'percentage', 'ratio', 'amount_lakhs', 'days', 'years', 'option'];
const MIN_TEXT_CHARS_PER_PAGE = 40;

// ── PDF text extraction ──────────────────────────────────────────────────────

// ── PDF engine loading / compatibility ───────────────────────────────────────

const SUPPORTED_PDFJS_MAJOR = 3; // we use pdfjs-dist/legacy/build/pdf.js (CommonJS), which exists in 3.x only

/** The PDF engine itself is unusable (not installed / wrong major version). Never caused by the uploaded file. */
class ExtractorError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = 'ExtractorError';
    this.code = code; // 'EXTRACTOR_UNAVAILABLE' | 'EXTRACTOR_INCOMPATIBLE'
    if (cause) this.cause = cause;
  }
}

let pdfjsLib = null;
let pdfjsVersion = null;

function loadPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  let lib;
  try {
    // eslint-disable-next-line global-require
    lib = require('pdfjs-dist/legacy/build/pdf.js');
  } catch (e) {
    const loadFailure = ['MODULE_NOT_FOUND', 'ERR_PACKAGE_PATH_NOT_EXPORTED', 'ERR_REQUIRE_ESM'].includes(e && e.code);
    throw new ExtractorError(
      'EXTRACTOR_UNAVAILABLE',
      loadFailure
        ? 'pdfjs-dist (3.x) could not be loaded. Run "npm install" in the server folder.'
        : `pdfjs-dist failed to initialise: ${String(e && e.message).split('\n')[0].slice(0, 200)}`,
      e,
    );
  }
  let version = lib.version || null;
  try { version = require('pdfjs-dist/package.json').version || version; } catch { /* keep lib.version */ }
  const major = Number(String(version || '').split('.')[0]);
  if (major !== SUPPORTED_PDFJS_MAJOR) {
    throw new ExtractorError('EXTRACTOR_INCOMPATIBLE', `pdfjs-dist ${version || 'unknown'} is installed but major version ${SUPPORTED_PDFJS_MAJOR} is required.`);
  }
  pdfjsLib = lib; pdfjsVersion = version;
  return lib;
}

/** A one-page PDF with a known sentence, built in memory (used only for the deep self-check). */
function selfTestPdf() {
  const text = 'Benchmark self test';
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let out = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return { buffer: Buffer.from(out, 'latin1'), text };
}

/**
 * Is the PDF engine usable on THIS server? `deep` also extracts text from a tiny built-in PDF,
 * which catches worker/runtime problems that a plain require() does not.
 * Never throws; safe to call from diagnostics.
 */
async function checkExtractor({ deep = false } = {}) {
  const info = { available: false, compatible: false, pdfjsVersion: null, supportedMajor: SUPPORTED_PDFJS_MAJOR, node: process.version, deepCheck: null, problem: null };
  try {
    loadPdfjs();
    info.available = true; info.compatible = true; info.pdfjsVersion = pdfjsVersion;
  } catch (e) {
    info.problem = e.code || e.name; info.detail = String(e.message).slice(0, 300);
    info.available = e.code !== 'EXTRACTOR_UNAVAILABLE';
    return info;
  }
  if (deep) {
    try {
      const t = selfTestPdf();
      let seen = '';
      await extractPagesChunked(t.buffer, { chunkSize: 1, onPage: (pg) => { seen = pg.items.map((i) => i.str).join(''); } });
      info.deepCheck = seen.includes(t.text) ? 'ok' : 'failed';
      if (info.deepCheck === 'failed') { info.problem = 'SELF_TEST_NO_TEXT'; }
    } catch (e) {
      info.deepCheck = 'failed'; info.problem = e.code || e.name || 'SELF_TEST_ERROR'; info.detail = String(e.message).slice(0, 300);
    }
  }
  return info;
}

/**
 * Reads the PDF in bounded chunks. Pages are handed to `onPage` one at a time and
 * released immediately, so memory stays flat for large manuals; the event loop is
 * yielded between chunks and a wall-clock budget aborts runaway documents.
 *
 * @param opts.chunkSize     pages processed between event-loop yields (default 4)
 * @param opts.maxPages      refuse documents longer than this (returns tooManyPages)
 * @param opts.timeBudgetMs  abort (throws code EXTRACTION_TIMEOUT) when exceeded
 * @param opts.onPage        async (pageObj) => void ; when omitted pages are collected and returned
 */
async function extractPagesChunked(buffer, opts = {}) {
  const { chunkSize = 4, maxPages = Infinity, timeBudgetMs = 90000, onPage = null } = opts;
  const pdfjs = loadPdfjs();
  const started = Date.now();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer), disableFontFace: true, useSystemFonts: false, isEvalSupported: false, verbosity: 0,
  }).promise;
  try {
    const numPages = doc.numPages;
    if (numPages > maxPages) return { numPages, pages: [], tooManyPages: true, chunks: 0, chunkSize };
    const collected = [];
    let chunks = 0;
    for (let start = 1; start <= numPages; start += chunkSize) {
      const end = Math.min(numPages, start + chunkSize - 1);
      for (let i = start; i <= end; i += 1) {
        if (Date.now() - started > timeBudgetMs) {
          const err = new Error('PDF extraction exceeded its time budget.'); err.code = 'EXTRACTION_TIMEOUT'; throw err;
        }
        const page = await doc.getPage(i);
        const tc = await page.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: true });
        const pageObj = {
          page: i,
          items: tc.items.filter((it) => typeof it.str === 'string').map((it) => ({
            str: it.str, x: Number(it.transform[4]), y: Number(it.transform[5]), w: Number(it.width || 0),
          })),
        };
        if (onPage) await onPage(pageObj); else collected.push(pageObj);
        try { page.cleanup(); } catch { /* ignore */ }
      }
      chunks += 1;
      await new Promise((resolve) => setImmediate(resolve)); // yield between chunks
    }
    return { numPages, pages: collected, chunks, chunkSize, ms: Date.now() - started };
  } finally {
    try { await doc.destroy(); } catch { /* ignore */ }
  }
}

/** Convenience wrapper (tests, small files): all pages in memory. */
async function extractPages(buffer, opts = {}) {
  return extractPagesChunked(buffer, opts);
}

// ── Line building ────────────────────────────────────────────────────────────

function buildLines(items) {
  const real = items.filter((i) => i.str && i.str.trim() !== '');
  const sorted = real.slice().sort((a, b) => (b.y - a.y) || (a.x - b.x));
  const lines = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - it.y) <= 2.6) last.items.push(it);
    else lines.push({ y: it.y, items: [it] });
  }
  lines.forEach((l) => { l.items.sort((a, b) => a.x - b.x); l.text = joinItems(l.items); });
  return lines;
}

function joinItems(items) {
  let out = '';
  let prev = null;
  for (const it of items) {
    if (prev) {
      const gap = it.x - (prev.x + prev.w);
      const needSpace = gap > 1.6 && !/\s$/.test(out) && !/^\s/.test(it.str);
      if (needSpace) out += ' ';
    }
    out += it.str;
    prev = it;
  }
  return out.replace(/\s+/g, ' ').trim();
}

const center = (it) => it.x + it.w / 2;

// ── Recognisers ──────────────────────────────────────────────────────────────

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
const RE_CRITERION = /^Criterion\s*(\d|VII|VI|IV|V|III|II|I)(?=[^A-Za-z]|[A-Z][a-z]|\s|$)\s*[-\u2013\u2014]?\s*(.+?)\s*\((\d+)\)\s*$/;
const RE_KEY_INDICATOR = /Key\s*Indicators?\s*[-\u2013\u2014]?\s*(\d\.\d+)\s*(.+)$/i;
// What a score-band cell can look like; anything else sitting in the band area is description text.
const RE_BAND_TOKEN = /^[0-9.:<>=\-\u2013\u2265\u2264\s]+$|^[A-Ea-e]$/;
const RE_METRIC_ID = /^(\d\.\d+\.\d+)(?![.\d])/;

function prettifyTitle(t) {
  return t.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
}

/** A metric line starts with an id like 3.4.2, which pdf.js may split into several items ("3.4." + "2"). */
function leadingId(line) {
  const m = line.text.match(RE_METRIC_ID);
  if (!m) return null;
  for (let k = 1; k <= Math.min(5, line.items.length); k += 1) {
    if (joinItems(line.items.slice(0, k)).replace(/\s+/g, '') === m[1]) return { id: m[1], items: line.items.slice(0, k) };
  }
  return null;
}

function findHeader(line) {
  if (!/^Metric\b/i.test(line.text) || !/Description/i.test(line.text)) return null;
  const digits = line.items.filter((i) => /^[0-4]$/.test(i.str.trim()));
  if (digits.length < 5) return null;
  const five = digits.slice(-5);
  const centers = five.map(center);
  const spacing = (centers[4] - centers[0]) / 4;
  return { centers, bandStart: centers[0] - spacing * 0.55 };
}

function nearestColumn(c, centers) {
  let best = 0; let bd = Infinity;
  centers.forEach((cc, i) => { const d = Math.abs(cc - c); if (d < bd) { bd = d; best = i; } });
  return best; // 0 => score 4 ... 4 => score 0
}

// ── Unit / period inference ──────────────────────────────────────────────────

function inferUnit(description, isOptions) {
  if (isOptions) return { unit: 'option', cues: ['options'] };
  const d = description.toLowerCase();
  const cues = [];
  if (/\bratio\b/.test(d)) cues.push('ratio');
  if (/\bpercentage\b|\bpercent\b|%/.test(d)) cues.push('percentage');
  if (/\binr in lakhs\b|\bin lakhs\b|\blakhs\b/.test(d)) cues.push('amount_lakhs');
  if (/\bnumber of days\b/.test(d)) cues.push('days');
  if (/\bnumber of years\b|\baverage teaching experience\b/.test(d)) cues.push('years');
  const order = ['ratio', 'percentage', 'amount_lakhs', 'days', 'years'];
  const unit = order.find((u) => cues.includes(u)) || 'count';
  return { unit, cues };
}

function inferPeriod(description) {
  const d = description.toLowerCase();
  if (/latest completed academic year/.test(d)) return 'latest completed academic year';
  if (/last five years|last 5 years|during last five years/.test(d)) return 'last five years';
  if (/average per year|per year/.test(d)) return 'per year';
  return null;
}

// ── Block -> row ─────────────────────────────────────────────────────────────

const COMMON_SHORT = new Set(('a an of to in is by or as at on be if it no so we and for the etc inr qnm last five full time year years from that with this such also each than data only both more most will were been non per are not all any can has had its who one two new use out off our may way ugc phd mou mous moocs nptel swayam cec lms ict bpl sc st obc ' +
  'days date till end week month day text list name type over into when upon ever case plan area work base ph.d d.m m.ch d.n.b fdp mdp slet net upsc jrf srf jrfs srfs ie e-content nba nirf cgpa ugc-care gate cat').split(/\s+/));

/** PDF kerning sometimes splits words ("ensu res implem entation"); flag text that looks like that. */
function spacingArtifacts(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length < 8) return false;
  const frag = tokens.filter((t) => /^[a-z]{2,4}$/.test(t) && !COMMON_SHORT.has(t)).length;
  return frag >= 2 && frag / tokens.length >= 0.1;
}

function joinBandPieces(rawPieces) {
  const pieces = rawPieces.map((p) => p.replace(/[\u2013\u2014\u2212]/g, '-').replace(/\s+/g, ''));
  if (pieces.length === 0) return '';
  if (pieces.length === 1) return pieces[0];
  let out = pieces[0];
  for (let i = 1; i < pieces.length; i += 1) {
    const p = pieces[i];
    if (/[-]$/.test(out) || /^[-]/.test(p)) out += p;
    else out += `-${p}`;
  }
  return out.replace(/-{2,}/g, '-');
}

function blockToRow(block, ctx) {
  const { idLine, idItems, lines, columns } = block;
  const metricId = block.metricId;
  const lastId = idItems[idItems.length - 1];
  const afterId = idLine.items.find((i) => !idItems.includes(i) && i.x > lastId.x + lastId.w - 0.5);
  const descStart = afterId ? afterId.x : lastId.x + lastId.w + 20;

  const descLines = [];
  const bandCells = [[], [], [], [], []];
  for (const line of lines) {
    const dItems = []; const perCol = [[], [], [], [], []];
    for (const it of line.items) {
      if (idItems.includes(it)) continue;
      if (it.x < descStart - 3) continue; // gutter: "QnM"/"QlM" marker
      if (columns && center(it) >= columns.bandStart && RE_BAND_TOKEN.test(it.str.trim())) perCol[nearestColumn(center(it), columns.centers)].push(it);
      else dItems.push(it);
    }
    perCol.forEach((arr, i) => { if (arr.length) bandCells[i].push(joinItems(arr.sort((a, b) => a.x - b.x))); });
    const t = joinItems(dItems);
    if (t) descLines.push(t);
  }

  // description / options / details
  const options = [];
  const details = [];
  const main = [];
  let section = 'main';
  for (const t of descLines) {
    if (/^Options\s*:?$/i.test(t)) { section = 'options'; continue; }
    const opt = t.match(/^([A-E])\s*\.\s*(.*)$/);
    if (opt && (section === 'options' || options.length > 0 || /^A\s*\./.test(t))) {
      section = 'options';
      options.push({ label: opt[1], text: opt[2].trim() });
      continue;
    }
    if (section === 'options') {
      if (options.length && !/^\d+\./.test(t) && !/^[-\u2013]?\s*opt any one/i.test(t)) {
        // wrapped option text, or "None of the above"
        if (/^none of the above/i.test(t) && options.length === 4) options.push({ label: 'E', text: t });
        else options[options.length - 1].text += ` ${t}`;
      }
      continue;
    }
    if (/^\d+\.\d+\.\d+\.\d+/.test(t) || /^\d+\s*\./.test(t)) { section = 'details'; details.push(t); continue; }
    if (section === 'details') { details.push(t); continue; }
    main.push(t);
  }

  let maxScore = null;
  for (let i = 0; i < main.length; i += 1) {
    const m = main[i].match(/\((\d{1,3})\)\s*$/);
    if (m) { maxScore = Number(m[1]); main[i] = main[i].replace(/\s*\(\d{1,3}\)\s*$/, ''); break; }
  }
  if (maxScore === null) {
    for (let i = 0; i < details.length; i += 1) {
      const m = details[i].match(/\((\d{1,3})\)\s*$/);
      if (m && !/^\d/.test(details[i])) { maxScore = Number(m[1]); details[i] = details[i].replace(/\s*\(\d{1,3}\)\s*$/, ''); break; }
    }
  }

  const description = cleanText(main.join(' '), 2000);

  // Optional formula / note text printed in the manual (kept as display text only).
  let formula = ''; let notes = '';
  for (const t of [...main, ...details, ...descLines]) {
    const fm = t.match(/\b(?:formula|calculated as|computed as)\b\s*[:=]?\s*(.+)$/i);
    if (fm && !formula) formula = cleanText(fm[1], 500);
    const nm = t.match(/^\s*notes?\s*[:.-]\s*(.+)$/i);
    if (nm && !notes) notes = cleanText(nm[1], 500);
  }

  // bands
  const labels = bandCells.map((pcs) => joinBandPieces(pcs).replace(/\s+/g, ''));
  const categorical = labels.every((l) => /^[A-E]$/i.test(l));
  const hasAny = labels.some((l) => l !== '');
  const { unit, cues } = inferUnit(description, categorical);

  const row = {
    metricId,
    criterionNumber: ctx.criterionNumber,
    criterion: ctx.criterion,
    keyIndicator: ctx.keyIndicator,
    description,
    details: cleanText(details.join(' '), 2000),
    formula,
    notes,
    evidence: {
      pages: Array.from(block.pages || [ctx.page]).sort((x, y) => x - y),
      text: cleanText(lines.map((l) => l.text).join('\n'), 3000, true),
    },
    metricName: '',
    maxScore,
    unit,
    unitCues: cues,
    period: inferPeriod(description),
    scoringType: categorical ? 'categorical' : (hasAny ? 'numeric' : 'none'),
    direction: null,
    bands: [],
    options: categorical ? ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({ label: l, score: 4 - i, text: ((options.find((o) => o.label === l) || {}).text || '').replace(/\s*[-\u2013]?\s*\(?\s*opt(?:ion)? any one\s*\)?\s*$/i, '').trim() })) : [],
    page: ctx.page,
    source: 'pdf',
    reviewed: false,
    excluded: false,
    extraction: {
      spacingArtifacts: spacingArtifacts(description), optionCount: options.length,
      // a score column holding 3+ stacked fragments, or letters mixed with numbers, is unusual
      ambiguousBands: bandCells.some((c) => c.length >= 3) || bandCells.some((c) => c.some((x) => /^[A-E]$/i.test(x)) && c.some((x) => /\d/.test(x))),
    },
  };

  if (hasAny) {
    row.bands = labels.map((label, i) => {
      const p = parseBandLabel(label);
      return {
        score: 4 - i, label,
        min: p.min, max: p.max, minInclusive: p.minInclusive, maxInclusive: p.maxInclusive,
        status: (4 - i) >= 3 ? 'above' : (4 - i) === 2 ? 'meets' : 'below',
      };
    });
    row.direction = categorical ? null : inferDirection(row.bands);
  }
  row.metricName = row.metricName || makeName(description, metricId);
  return row;
}

/** Strip control characters and cap length. Imported text is untrusted input. */
function cleanText(value, max = 2000, keepNewlines = false) {
  const re = keepNewlines ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g;
  return String(value == null ? '' : value).replace(re, ' ').replace(keepNewlines ? /[ \t]+/g : /\s+/g, ' ').trim().slice(0, max);
}

function makeName(description, metricId) {
  const t = String(description || '').replace(/\s+/g, ' ').trim();
  if (!t) return `Metric ${metricId}`;
  return t.length > 90 ? `${t.slice(0, 87).trim()}...` : t;
}

// ── Page walker ──────────────────────────────────────────────────────────────

function createPageParser() {
  const rows = [];
  const criteria = [];
  const warnings = [];
  const scannedPages = [];

  let criterionNumber = null; let criterion = ''; let keyIndicator = '';
  let columns = null;
  let block = null;

  const flush = () => {
    if (!block) return;
    try { rows.push(blockToRow(block, block.ctx)); } catch (e) {
      warnings.push(`Could not read metric block near ${block.idLine.text.slice(0, 40)}: ${e.message}`);
    }
    block = null;
  };

  const feed = (pg) => {
    const textChars = pg.items.reduce((n, i) => n + (i.str || '').trim().length, 0);
    if (textChars < MIN_TEXT_CHARS_PER_PAGE) { scannedPages.push(pg.page); return; }
    const lines = buildLines(pg.items);
    for (const line of lines) {
      const hdr = findHeader(line);
      if (hdr) { flush(); columns = hdr; continue; }

      const cm = line.text.match(RE_CRITERION);
      if (cm) {
        flush();
        criterionNumber = ROMAN[cm[1]] || Number(cm[1]);
        const title = prettifyTitle(cm[2]).replace(/^[-\u2013\u2014\s]+/, '');
        criterion = `Criterion ${criterionNumber} \u2013 ${title}`;
        criteria.push({ number: criterionNumber, title, maxScore: Number(cm[3]) });
        continue;
      }
      const km = line.text.match(RE_KEY_INDICATOR);
      if (km) { flush(); keyIndicator = `${km[1]} ${prettifyTitle(km[2])}`.trim(); continue; }

      const lid = leadingId(line);
      if (lid && lid.items[0].x < 120) {
        flush();
        block = {
          idLine: line, idItems: lid.items, metricId: lid.id, lines: [line], columns, pages: new Set([pg.page]),
          ctx: { criterionNumber, criterion, keyIndicator, page: pg.page },
        };
        continue;
      }
      if (block) { block.lines.push(line); block.pages.add(pg.page); }
    }
    // A block may continue on the next page (e.g. the options list), so it is not flushed here.
  };

  const finish = () => {
    flush();
    if (rows.length === 0) warnings.push('No metric rows could be read from this document.');
    return { rows, criteria, warnings, scannedPages };
  };

  return { feed, finish };
}

/** All-in-memory wrapper kept for tests and small inputs. */
function parsePages(pages) {
  const pp = createPageParser();
  pages.forEach((pg) => pp.feed(pg));
  return pp.finish();
}

// ── Validation (extraction AND every later edit) ─────────────────────────────

/**
 * @param row   draft row
 * @param ctx   { existing: Map(metricId -> catalogue doc), seenIds: Map(metricId -> count among included rows),
 *                metricCatalog?: Map(metricId -> Metric doc) }
 */
function validateRow(row, ctx = {}) {
  const flags = [];
  const add = (code, severity, message) => flags.push({ code, severity, message });

  if (!/^\d\.\d+\.\d+$/.test(String(row.metricId || ''))) add('bad_metric_id', 'error', 'Metric ID must look like 3.4.4.');
  if (!String(row.description || '').trim()) add('no_description', 'error', 'Description is missing.');
  if (!row.criterionNumber || !row.criterion) add('no_criterion', 'error', 'Criterion is missing.');
  if (!row.keyIndicator) add('no_key_indicator', 'error', 'Key indicator is missing.');
  if (!UNITS.includes(row.unit)) add('bad_unit', 'error', 'Unit is not recognised.');
  if (row.maxScore === null || row.maxScore === undefined || Number.isNaN(Number(row.maxScore))) {
    add('max_score_missing', 'warning', 'Weighted score (the number in brackets) was not found.');
  }

  const type = row.scoringType;
  if (type === 'none' || !row.bands || row.bands.length === 0) {
    add('no_bands', 'error', 'No score bands were found. Enter them manually or exclude this metric.');
  } else {
    validateBands(row.bands).forEach((f) => flags.push(f));
    if (type === 'categorical' && !isCategorical(row.bands)) add('type_mismatch', 'error', 'Scoring type is categorical but the bands are numeric.');
    if (type === 'numeric' && isCategorical(row.bands)) add('type_mismatch', 'error', 'Scoring type is numeric but the bands are options.');
    if (type === 'categorical' && row.unit !== 'option') add('unit_for_options', 'warning', 'Categorical metrics normally use unit "option".');
    if (type === 'numeric' && row.unit === 'option') add('unit_for_numeric', 'error', 'Numeric bands cannot use unit "option".');
    if (type === 'numeric') {
      const ratioBands = row.bands.some((b) => /:1/.test(b.label || ''));
      if (ratioBands && row.unit !== 'ratio') add('ratio_unit', 'warning', 'Bands are ratios (x:1) but the unit is not "ratio".');
      if (row.unit === 'percentage' && row.bands.some((b) => Number(b.min) > 100 || Number(b.max) > 100)) {
        add('percentage_over_100', 'warning', 'A percentage band exceeds 100.');
      }
    }
  }
  if (type === 'categorical' && (row.options || []).some((o) => !String(o.text || '').trim())) {
    add('option_text_missing', 'warning', 'One or more option descriptions (A-E) were not found.');
  }

  if (row.unitCues && row.unitCues.length > 1 && row.source === 'pdf') {
    add('unit_ambiguous', 'warning', `Description mentions several units (${row.unitCues.join(', ')}); confirm the unit.`);
  }
  if (row.extraction && row.extraction.ambiguousBands) {
    add('ambiguous_row', 'warning', 'The score-band cells of this row were laid out unusually in the PDF. Compare the bands with the source evidence.');
  }
  if (row.formula) {
    add('formula_not_executable', 'info', 'A formula is printed in the manual. It is kept as text only; the value comes from the mapped analytics metric.');
  }
  if (!row.excluded && !row.computedField && row.scoringType !== 'none') {
    add('unmapped_metric', 'info', 'Not mapped to an analytics metric yet, so its current value will read "Insufficient data".');
  }
  if (row.extraction && row.extraction.spacingArtifacts) {
    add('description_spacing', 'warning', 'Description text contains broken spacing from the PDF; please proofread it.');
  }
  if (row.source === 'pdf' && !row.period && type === 'numeric') {
    add('period_missing', 'info', 'Applicable period was not stated in the description.');
  }

  if (ctx.seenIds && (ctx.seenIds.get(row.metricId) || 0) > 1 && !row.excluded) {
    add('duplicate_in_import', 'error', 'This metric ID appears more than once in the import. Exclude all but one.');
  }
  const ex = ctx.existing && ctx.existing.get(row.metricId);
  if (ex) {
    const diffs = [];
    const exLabels = (ex.bands || []).slice().sort((a, b) => b.score - a.score).map((b) => b.label).join('|');
    const newLabels = (row.bands || []).slice().sort((a, b) => b.score - a.score).map((b) => b.label).join('|');
    if (exLabels && newLabels && exLabels !== newLabels) diffs.push('score bands');
    if (ex.unit && ex.unit !== row.unit) diffs.push(`unit (${ex.unit} -> ${row.unit})`);
    if (diffs.length) add('conflicts_with_active', 'warning', `Differs from the current catalogue: ${diffs.join(', ')}.`);
  }
  if (ctx.metricCatalog && ex && ex.computedField) {
    const m = ctx.metricCatalog.get(ex.computedField);
    if (m && m.formulaType) {
      const pct = ['percentage', 'metricPercentage'].includes(m.formulaType);
      if (row.unit === 'percentage' && !pct) add('mapping_unit_mismatch', 'warning', `Mapped analytics metric "${ex.computedField}" is a ${m.formulaType} formula; confirm it yields a percentage.`);
    }
  }
  return flags;
}

/** Recompute flags for every row (duplicate detection needs the whole set). */
function revalidateAll(rows, ctx = {}) {
  const seen = new Map();
  rows.forEach((r) => { if (!r.excluded) seen.set(r.metricId, (seen.get(r.metricId) || 0) + 1); });
  return rows.map((r) => ({ ...r, flags: validateRow(r, { ...ctx, seenIds: seen }) }));
}

module.exports = { ExtractorError, checkExtractor, cleanText, createPageParser, extractPagesChunked, extractPages, parsePages, validateRow, revalidateAll, buildLines, UNITS };
