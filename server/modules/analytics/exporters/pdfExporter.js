/**
 * pdfExporter.js
 *
 * Converts a flat array of row objects into a PDF buffer.
 * Uses `pdfkit` (installed in the server package).
 *
 * Input:  Array<Record<string, unknown>>, string (document title)
 * Output: Promise<Buffer> (.pdf binary)
 */

'use strict';

const PDFDocument = require('pdfkit');

/**
 * Generates a PDF report from a flat array of row objects.
 *
 * @param {object[]} rows   - Flat array of plain objects
 * @param {string}   title  - Document title
 * @returns {Promise<Buffer>}
 */
function exportToPdf(rows, title = 'Report', payload = null) {
  if (payload && payload.assessment) return exportAssessmentPdf(payload);
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc    = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    if (!rows || rows.length === 0) {
      doc.fontSize(12).text('No data available for the selected filters.', { align: 'center' });
      doc.end();
      return;
    }

    const columns = Object.keys(rows[0]);
    const colCount = columns.length;
    const pageWidth = doc.page.width - 80; // margin left + right
    const colWidth  = Math.min(120, Math.floor(pageWidth / colCount));

    // ── Title ──────────────────────────────────────────────────────────────
    doc
      .fontSize(16)
      .fillColor('#1e3a5f')
      .text(title, { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(9)
      .fillColor('#64748b')
      .text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, { align: 'center' })
      .moveDown(1);

    // ── Header row ─────────────────────────────────────────────────────────
    let x = 40;
    const headerY = doc.y;

    doc.rect(40, headerY, pageWidth, 18).fill('#1e3a5f');

    columns.forEach(col => {
      doc
        .fontSize(8)
        .fillColor('#ffffff')
        .text(String(col).toUpperCase(), x + 2, headerY + 4, { width: colWidth - 4, ellipsis: true });
      x += colWidth;
    });

    doc.moveDown(1.2);

    // ── Data rows ──────────────────────────────────────────────────────────
    const ROW_HEIGHT = 16;
    let rowNum = 0;

    for (const row of rows) {
      // Page break check
      if (doc.y + ROW_HEIGHT > doc.page.height - 50) {
        doc.addPage({ margin: 40, size: 'A4', layout: 'landscape' });
        rowNum = 0;
      }

      const rowY = doc.y;
      const bg   = rowNum % 2 === 0 ? '#f8fafc' : '#ffffff';

      doc.rect(40, rowY, pageWidth, ROW_HEIGHT).fill(bg);

      x = 40;
      columns.forEach(col => {
        doc
          .fontSize(7.5)
          .fillColor('#334155')
          .text(String(row[col] ?? ''), x + 2, rowY + 3, { width: colWidth - 4, ellipsis: true });
        x += colWidth;
      });

      doc.y = rowY + ROW_HEIGHT;
      rowNum++;
    }

    doc.end();
  });
}

// ── Institutional assessment (written + numerical) ──────────────────────────
const NAVY = '#1e3a5f'; const GREY = '#64748b'; const INK = '#1f2937';
const STATUS_COLOR = { above: '#15803d', meets: '#a16207', below: '#b91c1c', unknown: '#64748b' };

function exportAssessmentPdf(payload) {
  const a = payload.assessment;
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    const W = doc.page.width - 80;
    const bottom = () => doc.page.height - 60;
    const need = (h) => { if (doc.y + h > bottom()) doc.addPage(); };

    const h1 = (t) => { need(40); doc.moveDown(0.8).font('Helvetica-Bold').fontSize(13).fillColor(NAVY).text(t, 40, doc.y, { width: W }); doc.moveTo(40, doc.y + 2).lineTo(40 + W, doc.y + 2).strokeColor(NAVY).lineWidth(0.8).stroke(); doc.moveDown(0.5); };
    const para = (t, o = {}) => { need(30); doc.font('Helvetica').fontSize(o.size || 9.5).fillColor(o.color || INK).text(t, 40, doc.y, { width: W, align: 'left' }); doc.moveDown(0.4); };

    // table: cols = [{label, w (fraction), key|fn, color?}]
    function table(cols, rowsData, empty) {
      if (!rowsData.length) { para(empty || 'None.', { color: GREY }); return; }
      const widths = cols.map((c) => Math.floor(W * c.w));
      const head = () => {
        need(24); const y = doc.y; doc.rect(40, y, W, 16).fill(NAVY);
        let x = 40; cols.forEach((c, i) => { doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#fff').text(c.label, x + 3, y + 4, { width: widths[i] - 6, ellipsis: true, lineBreak: false }); x += widths[i]; });
        doc.y = y + 16;
      };
      head();
      rowsData.forEach((r, n) => {
        const cells = cols.map((c) => String(c.fn ? c.fn(r) : r[c.key] ?? ''));
        doc.font('Helvetica').fontSize(7.5);
        const h = Math.max(14, ...cells.map((t, i) => doc.heightOfString(t, { width: widths[i] - 6 }) + 6));
        if (doc.y + h > bottom()) { doc.addPage(); head(); }
        const y = doc.y; if (n % 2 === 0) doc.rect(40, y, W, h).fill('#f8fafc');
        let x = 40; cells.forEach((t, i) => { const col = cols[i].color ? cols[i].color(r) : INK; doc.font('Helvetica').fontSize(7.5).fillColor(col).text(t, x + 3, y + 3, { width: widths[i] - 6 }); x += widths[i]; });
        doc.y = y + h;
      });
      doc.moveDown(0.5);
    }

    // Title block
    doc.rect(0, 0, doc.page.width, 78).fill(NAVY);
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#fff').text(payload.title, 40, 24, { width: W });
    doc.font('Helvetica').fontSize(9).fillColor('#cbd5e1').text(`${a.scope}  |  Generated ${new Date(a.generatedAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 40, 52, { width: W });
    doc.y = 94;

    h1('1. Executive summary');
    a.executiveSummary.forEach((l) => para(l));

    h1('2. Coverage and key figures');
    const o = a.overall;
    table([{ label: 'Measure', w: 0.6, key: 'k' }, { label: 'Value', w: 0.4, key: 'v' }], [
      { k: 'Benchmark indicators', v: o.total }, { k: 'Assessed from records', v: o.assessed }, { k: 'Insufficient data', v: o.insufficient },
      { k: 'Above / meets / below benchmark', v: `${o.above} / ${o.meets} / ${o.below}` }, { k: 'Mean band score (0-4)', v: o.meanScore === null ? 'n/a' : o.meanScore },
      ...a.figures.map((f) => ({ k: f.label, v: f.value })),
    ]);

    h1('3. Criterion-wise results');
    table([
      { label: 'Criterion', w: 0.40, fn: (c) => (c.number ? `${c.number}. ${c.name}` : c.name) }, { label: 'Indicators', w: 0.10, key: 'total' }, { label: 'Assessed', w: 0.10, key: 'assessed' },
      { label: 'Above', w: 0.08, key: 'above' }, { label: 'Meets', w: 0.08, key: 'meets' }, { label: 'Below', w: 0.08, key: 'below' }, { label: 'Mean (0-4)', w: 0.16, fn: (c) => (c.meanScore === null ? 'n/a' : c.meanScore) },
    ], a.criteria);

    h1('4. Indicator results by criterion');
    a.criteria.filter((c) => c.metrics.length).forEach((c) => {
      need(60); doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(c.number ? `Criterion ${c.number}: ${c.name}` : c.name, 40, doc.y, { width: W }); doc.moveDown(0.3);
      table([
        { label: 'ID', w: 0.08, key: 'metricId' }, { label: 'Indicator', w: 0.32, key: 'metricName' },
        { label: 'Current', w: 0.14, fn: (m) => (m.assessed ? m.current : 'Insufficient data') }, { label: 'Benchmark', w: 0.13, key: 'benchmark' },
        { label: 'Gap', w: 0.08, fn: (m) => (m.gap === null ? '' : m.gap) }, { label: 'Score', w: 0.07, fn: (m) => (m.score === null ? '' : `${m.score}/4`) },
        { label: 'Status', w: 0.18, key: 'statusLabel', color: (m) => STATUS_COLOR[m.status] || INK },
      ], c.metrics);
    });

    h1('5. Gaps against benchmark');
    para('Assessed indicators scoring below benchmark, largest shortfall first.', { color: GREY, size: 8.5 });
    table([{ label: 'ID', w: 0.09, key: 'metricId' }, { label: 'Indicator', w: 0.39, key: 'metricName' }, { label: 'Current', w: 0.16, key: 'current' }, { label: 'Benchmark', w: 0.16, key: 'benchmark' }, { label: 'Achieved %', w: 0.2, fn: (m) => (m.achievementPercent === null ? '' : `${m.achievementPercent}%`) }], a.gaps, 'No assessed indicator is below benchmark.');

    h1('6. Missing data');
    para('These indicators were not scored. Each is listed with the reason and the step that would allow assessment. No value was estimated.', { color: GREY, size: 8.5 });
    table([{ label: 'ID', w: 0.08, key: 'metricId' }, { label: 'Indicator', w: 0.27, key: 'metricName' }, { label: 'Why no value', w: 0.32, key: 'reasonText' }, { label: 'What to do', w: 0.33, key: 'action' }], a.missing, 'Every indicator could be assessed.');

    h1('7. Recommendations');
    table([{ label: 'Priority', w: 0.09, key: 'priority' }, { label: 'ID', w: 0.08, key: 'metricId' }, { label: 'Indicator', w: 0.25, key: 'metric' }, { label: 'Recommended action', w: 0.58, key: 'text' }], a.recommendations, 'No recommendations.');

    h1('Notes');
    a.notes.forEach((n) => para(`- ${n}`, { size: 8.5, color: GREY }));

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.font('Helvetica').fontSize(7.5).fillColor(GREY).text(`${payload.title}  |  Page ${i + 1} of ${range.count}`, 40, doc.page.height - 36, { width: W, align: 'center', lineBreak: false });
    }
    doc.end();
  });
}

module.exports = { exportToPdf, exportAssessmentPdf };
