/**
 * csvExporter.js
 *
 * Converts a flat array of row objects into CSV text.
 * Uses the `papaparse` library already installed in the server.
 *
 * Input:  Array<Record<string, unknown>>
 * Output: string (UTF-8 CSV)
 */

'use strict';

const Papa = require('papaparse');

/**
 * @param {object[]} rows  - Flat array of plain objects (same shape as
 *                           reportService / drilldownService returns)
 * @returns {string}       - CSV string
 */
function exportToCsv(rows, payload = null) {
  if (payload && payload.institutionalReport) return exportInstitutionalReportCsv(payload);
  if (!rows || rows.length === 0) {
    return '';
  }
  return Papa.unparse(rows, { header: true });
}

/**
 * Combined CSV for the IQAC Institutional Report: every selected category's
 * register rows, concatenated with a leading "Category" column so a single
 * file stays consistent across differing per-category columns (Papa fills
 * missing keys as blank rather than erroring on ragged objects).
 */
function exportInstitutionalReportCsv(payload) {
  const combined = [];
  for (const key of payload.categories) {
    const s = payload.sections[key];
    for (const row of s.register) {
      combined.push({ Category: s.title, ...row });
    }
  }
  if (combined.length === 0) return 'Category\nNo records for this selection.';
  return Papa.unparse(combined, { header: true });
}

module.exports = { exportToCsv, exportInstitutionalReportCsv };
