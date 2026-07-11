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
function exportToPdf(rows, title = 'Report') {
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

module.exports = { exportToPdf };
