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
function exportToCsv(rows) {
  if (!rows || rows.length === 0) {
    return '';
  }
  return Papa.unparse(rows, { header: true });
}

module.exports = { exportToCsv };
