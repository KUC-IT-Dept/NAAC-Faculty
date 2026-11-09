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
function exportToExcel(rows, title = 'Report', payload = null) {
  if (payload && payload.assessment) return exportAssessmentWorkbook(payload);
  if (payload && payload.institutionalReport) return exportInstitutionalReportWorkbook(payload);
  if (!rows || rows.length === 0) {
    rows = [{ '(No Data)': 'No records matched the selected filters.' }];
  }

  const sheetName = String(title).slice(0, 31); // Excel sheet name limit
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook  = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function sheet(aoa, widths) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = widths.map((w) => ({ wch: w }));
  return ws;
}

/** Multi-sheet workbook: Summary, Criterion Summary, Metrics, Gaps, Missing Data, Recommendations. */
function exportAssessmentWorkbook(payload) {
  const a = payload.assessment;
  const wb = XLSX.utils.book_new();
  const o = a.overall;

  const summary = [[payload.title], ['Generated', a.generatedAt], ['Scope', a.scope], [], ['Executive summary'], ...a.executiveSummary.map((l) => [l]), [],
    ['Coverage'], ['Indicators', o.total], ['Assessed', o.assessed], ['Insufficient data', o.insufficient], ['Above benchmark', o.above], ['Meets benchmark', o.meets], ['Below benchmark', o.below], ['Mean band score (0-4)', o.meanScore === null ? 'n/a' : o.meanScore], [],
    ['Institutional figures'], ...a.figures.map((f) => [f.label, f.value]), [], ['Notes'], ...a.notes.map((n) => [n])];
  XLSX.utils.book_append_sheet(wb, sheet(summary, [44, 60]), 'Summary');

  const crit = [['Criterion', 'Name', 'Indicators', 'Assessed', 'Insufficient', 'Above', 'Meets', 'Below', 'Mean score (0-4)']]
    .concat(a.criteria.map((c) => [c.number ? `Criterion ${c.number}` : 'Unclassified', c.name, c.total, c.assessed, c.insufficient, c.above, c.meets, c.below, c.meanScore === null ? 'n/a' : c.meanScore]));
  XLSX.utils.book_append_sheet(wb, sheet(crit, [14, 42, 11, 10, 12, 8, 8, 8, 16]), 'Criterion Summary');

  const rows = payload.rows.length ? payload.rows : [{ 'No indicators': 'No active benchmark indicators.' }];
  const metrics = XLSX.utils.json_to_sheet(rows);
  metrics['!cols'] = Object.keys(rows[0]).map((k) => ({ wch: Math.min(48, Math.max(12, k.length + 2)) }));
  XLSX.utils.book_append_sheet(wb, metrics, 'Metrics');

  const gaps = [['Criterion', 'Metric ID', 'Metric', 'Current', 'Benchmark', 'Gap', 'Achievement (%)', 'Score']]
    .concat(a.gaps.map((g) => [g.criterionLabel, g.metricId, g.metricName, g.current, g.benchmark, g.gap, g.achievementPercent, g.score]));
  XLSX.utils.book_append_sheet(wb, sheet(gaps, [14, 11, 44, 14, 14, 10, 16, 8]), 'Gaps');

  const miss = [['Criterion', 'Metric ID', 'Metric', 'Why no value', 'What to do']]
    .concat(a.missing.map((m) => [m.criterionLabel, m.metricId, m.metricName, m.reasonText, m.action]));
  XLSX.utils.book_append_sheet(wb, sheet(miss, [14, 11, 44, 60, 70]), 'Missing Data');

  const rec = [['Priority', 'Type', 'Criterion', 'Metric ID', 'Metric', 'Recommendation']]
    .concat(a.recommendations.map((r) => [r.priority, r.type === 'data' ? 'Data' : 'Improvement', r.criterion, r.metricId, r.metric, r.text]));
  XLSX.utils.book_append_sheet(wb, sheet(rec, [10, 12, 14, 11, 40, 90]), 'Recommendations');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Multi-sheet workbook for the IQAC Institutional Report: one "Executive
 * Summary" sheet, one "Year-wise Comparison" + "Faculty Contribution" +
 * "Department Comparison" sheet when more than one category is selected,
 * and one sheet per selected category (name truncated to Excel's 31-char
 * sheet-name limit, de-duplicated if a truncation collides).
 */
function exportInstitutionalReportWorkbook(payload) {
  const wb = XLSX.utils.book_new();

  const summary = [
    [payload.title], ['Scope', payload.scope],
    ['Period', `${payload.period.label}${payload.period.convention ? ` (${payload.period.convention} year)` : ''}`],
    ['Generated', payload.generatedAt], ['Categories', payload.categories.join(', ')], [],
    ['Executive summary'],
    ['Total research outputs', payload.executiveSummary.totalOutputs],
    ['Contributing faculty', payload.executiveSummary.contributingFaculty],
    ['Departments covered', payload.executiveSummary.departmentsCovered],
  ];
  XLSX.utils.book_append_sheet(wb, sheet(summary, [36, 50]), 'Executive Summary');

  if (payload.categories.length > 1) {
    const yearSheet = [['Category', 'Year', 'Count']];
    for (const key of payload.categories) {
      const s = payload.sections[key];
      for (const [year, count] of Object.entries(s.yearWise)) yearSheet.push([s.title, year, count]);
    }
    XLSX.utils.book_append_sheet(wb, sheet(yearSheet, [28, 10, 10]), 'Year-wise Comparison');

    const facSheet = [['Faculty', 'Total Outputs']].concat(
      Object.entries(payload.totalsByFaculty).sort((a, b) => b[1] - a[1])
    );
    XLSX.utils.book_append_sheet(wb, sheet(facSheet, [36, 14]), 'Faculty Contribution');

    const deptSheet = [['Department', 'Total Outputs']].concat(
      Object.entries(payload.totalsByDepartment).sort((a, b) => b[1] - a[1])
    );
    XLSX.utils.book_append_sheet(wb, sheet(deptSheet, [28, 14]), 'Department Comparison');
  }

  const usedNames = new Set(wb.SheetNames);
  for (const key of payload.categories) {
    const s = payload.sections[key];
    let name = String(s.title).slice(0, 31);
    let n = 2;
    while (usedNames.has(name)) { name = `${s.title.slice(0, 28)} ${n}`.slice(0, 31); n++; }
    usedNames.add(name);

    const rows = s.register.length ? s.register : [{ '(No Data)': 'No records for this selection.' }];
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0]).map((k) => ({ wch: Math.min(40, Math.max(12, k.length + 2)) }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { exportToExcel };
