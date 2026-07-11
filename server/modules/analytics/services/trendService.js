/**
 * trendService.js
 *
 * Computes period-over-period and entity-vs-entity comparisons.
 *
 * Supported trend types:
 *   yearOverYear      — compares metric values across multiple academic years
 *   deptVsDept        — compares all departments side-by-side for one metric
 *   facultyVsFaculty  — compares individual faculty publication counts
 *   fiveYear          — 5-year trend for all benchmarked metrics
 *
 * This service:
 *   - Reads Faculty directly (for sub-document year-based aggregation)
 *   - Uses filterService for scope + user filter construction
 *   - Never modifies analyticsService.js or its logic
 */

'use strict';

const Faculty = require('../../faculty/models/Faculty');
const Metric  = require('../models/Metric');
const { buildFacultyFilter, mergeFilters } = require('./filterService');
const { computeForFaculty } = require('./facultyProfileAnalyticsService');

function scopeFilter(scope) {
  if (scope && scope.level === 'department' && scope.department) {
    return { 'employmentDetails.department': scope.department };
  }
  return {};
}

// ── Utility: parse a list of years ───────────────────────────────────────────

function getRecentYears(n = 5) {
  const current = new Date().getFullYear();
  return Array.from({ length: n }, (_, i) => String(current - (n - 1 - i)));
}

// ── yearOverYear ──────────────────────────────────────────────────────────────

async function yearOverYearTrend(scope, query) {
  const base     = scopeFilter(scope);
  const user     = buildFacultyFilter(query);
  const combined = mergeFilters(base, user);

  const years   = query.years ? query.years.split(',') : getRecentYears(5);
  const faculty = await Faculty.find(combined).lean();

  if (query.metricId) {
    // Dynamic single-metric mode
    const metric = await Metric.findOne({ metricId: query.metricId }).lean();
    if (!metric) throw new Error(`Metric not found: ${query.metricId}`);

    // Map the standard metric field paths to their date fields for in-memory filtering
    const dateFieldMap = {
      'publications': 'year',
      'projects': 'startDate',
      'patents': 'dateOfFiling',
      'awards': 'date',
      'fdpWorkshops': 'startDate',
      'researchGuidance': 'yearOfRegistration', // Fallback, could be awardDate
    };
    const dateField = dateFieldMap[metric.fieldPath];

    const valByYear = Object.fromEntries(years.map(y => [y, 0]));

    for (const f of faculty) {
      if (dateField && Array.isArray(f[metric.fieldPath])) {
        // Clone faculty to filter array items by year
        for (const y of years) {
          const clonedF = { ...f };
          clonedF[metric.fieldPath] = f[metric.fieldPath].filter(item => {
            const d = item[dateField];
            return d && d.toString().startsWith(y);
          });
          valByYear[y] += computeForFaculty(clonedF, metric);
        }
      } else {
        // Metric is not array-based or lacks a standard date field; accumulate value normally?
        // Actually, if it's not time-series capable, YoY might just return the static value or 0.
        // For simplicity, just compute once and apply to the current year if it's static?
        // A robust V3 implementation would know if it's static. Let's just put it in the most recent year.
        const currentYear = years[0];
        valByYear[currentYear] += computeForFaculty(f, metric);
      }
    }

    return {
      type: 'yearOverYear',
      periods: years,
      series: [
        { label: metric.metricName || query.metricId, data: years.map(y => valByYear[y]) },
      ],
    };
  }

  // Default mode: 3 hardcoded series
  const pubByYear     = Object.fromEntries(years.map(y => [y, 0]));
  const projectByYear = Object.fromEntries(years.map(y => [y, 0]));
  const patentByYear  = Object.fromEntries(years.map(y => [y, 0]));

  for (const f of faculty) {
    (f.publications || []).forEach(p => { if (years.includes(p.year)) pubByYear[p.year]++;     });
    (f.projects     || []).forEach(p => { if (years.includes(p.startDate?.slice(0, 4))) projectByYear[p.startDate.slice(0, 4)]++; });
    (f.patents      || []).forEach(p => { if (years.includes(p.dateOfFiling?.slice(0, 4))) patentByYear[p.dateOfFiling.slice(0, 4)]++; });
  }

  return {
    type: 'yearOverYear',
    periods: years,
    series: [
      { label: 'Publications', data: years.map(y => pubByYear[y]     || 0) },
      { label: 'Projects',     data: years.map(y => projectByYear[y] || 0) },
      { label: 'Patents',      data: years.map(y => patentByYear[y]  || 0) },
    ],
  };
}

// ── deptVsDept ────────────────────────────────────────────────────────────────

async function deptVsDeptTrend(scope, query) {
  // For dept-vs-dept, always use institution-wide scope (ignore dept filter).
  const faculty   = await Faculty.find({}).select('employmentDetails publications projects patents').lean();
  const deptMap   = {};

  for (const f of faculty) {
    const dept = f.employmentDetails?.department || 'Unknown';
    if (!deptMap[dept]) deptMap[dept] = { publications: 0, projects: 0, patents: 0 };
    deptMap[dept].publications += (f.publications || []).length;
    deptMap[dept].projects     += (f.projects     || []).length;
    deptMap[dept].patents      += (f.patents       || []).length;
  }

  const departments = Object.keys(deptMap).sort();
  return {
    type:    'deptVsDept',
    periods: departments,
    series: [
      { label: 'Publications', data: departments.map(d => deptMap[d].publications) },
      { label: 'Projects',     data: departments.map(d => deptMap[d].projects)     },
      { label: 'Patents',      data: departments.map(d => deptMap[d].patents)      },
    ],
  };
}

// ── facultyVsFaculty ──────────────────────────────────────────────────────────

async function facultyVsFacultyTrend(scope, query) {
  const base     = scopeFilter(scope);
  const user     = buildFacultyFilter(query);
  const combined = mergeFilters(base, user);

  const limit   = Math.min(20, parseInt(query.topN || '10', 10));
  const faculty = await Faculty.find(combined).lean();

  let metricName = 'Publications';
  let computeValue = (f) => (f.publications || []).length;

  if (query.metricId) {
    const metric = await Metric.findOne({ metricId: query.metricId }).lean();
    if (metric) {
      metricName = metric.metricName || query.metricId;
      computeValue = (f) => computeForFaculty(f, metric);
    }
  }

  const rows = faculty
    .map(f => ({
      name:  f.personalInfo?.fullName || f.username,
      value: computeValue(f),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  return {
    type:    'facultyVsFaculty',
    periods: rows.map(r => r.name),
    series:  [{ label: metricName, data: rows.map(r => r.value) }],
  };
}

// ── fiveYear ──────────────────────────────────────────────────────────────────

async function fiveYearTrend(scope, query) {
  // Reuses yearOverYear with a fixed 5-year window.
  return yearOverYearTrend(scope, { ...query, years: getRecentYears(5).join(',') });
}

// ── currentVsPrevious ─────────────────────────────────────────────────────────

async function currentVsPreviousTrend(scope, query) {
  // Phase 11: Reuse yearOverYearTrend to get the series data, then extract the last 2 data points.
  const yoy = await yearOverYearTrend(scope, query);
  
  const seriesData = yoy.series[0];
  if (!seriesData || !seriesData.data || seriesData.data.length === 0) {
    return {
      type: 'currentVsPrevious',
      metricId: query.metricId || 'publications',
      metricName: query.metricId || 'publications',
      currentYear: '',
      previousYear: '',
      currentValue: 0,
      previousValue: 0,
      delta: 0,
      deltaPercent: 0,
    };
  }

  const len = seriesData.data.length;
  const currentVal = seriesData.data[len - 1] || 0;
  const previousVal = len >= 2 ? (seriesData.data[len - 2] || 0) : 0;
  const delta = currentVal - previousVal;
  
  let deltaPercent = 0;
  if (previousVal !== 0) {
    deltaPercent = Number(((delta / previousVal) * 100).toFixed(2));
  } else if (currentVal > 0) {
    deltaPercent = 100;
  }

  const periods = yoy.periods;
  const currentYear = periods[len - 1] || '';
  const previousYear = len >= 2 ? (periods[len - 2] || '') : '';

  return {
    type: 'currentVsPrevious',
    metricId: query.metricId || 'publications',
    metricName: seriesData.label,
    currentYear,
    previousYear,
    currentValue: currentVal,
    previousValue: previousVal,
    delta,
    deltaPercent,
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * @param {object} scope  - req.analyticsScope
 * @param {object} query  - req.query  (must include `type`)
 * @returns {object}
 */
async function getTrend(scope, query = {}) {
  const type = query.type || 'yearOverYear';

  switch (type) {
    case 'yearOverYear':     return yearOverYearTrend(scope, query);
    case 'deptVsDept':       return deptVsDeptTrend(scope, query);
    case 'facultyVsFaculty': return facultyVsFacultyTrend(scope, query);
    case 'fiveYear':         return fiveYearTrend(scope, query);
    case 'currentVsPrevious': return currentVsPreviousTrend(scope, query);
    default:
      throw new Error(`Unknown trend type: "${type}". Supported: yearOverYear, deptVsDept, facultyVsFaculty, fiveYear`);
  }
}

module.exports = { getTrend };
