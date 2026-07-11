/**
 * excelExporter.js
 *
 * Converts a flat array of row objects into an .xlsx buffer.
 * Uses the `xlsx` library already installed in the server.
 *
 * Input:  Array<Record<string, unknown>>, string (sheet title)
 * Output: Buffer (.xlsx binary)
 */

'use strict';

const XLSX = require('xlsx');

/**
 * @param {object[]} rows   - Flat array of plain objects
 * @param {string}   title  - Sheet name (max 31 chars for Excel compliance)
 * @returns {Buffer}        - .xlsx binary buffer
 */
function exportToExcel(rows, title = 'Report') {
  if (!rows || rows.length === 0) {
    rows = [{ '(No Data)': 'No records matched the selected filters.' }];
  }

  const sheetName = String(title).slice(0, 31); // Excel sheet name limit
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook  = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { exportToExcel };
