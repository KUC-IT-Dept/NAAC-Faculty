/**
 * ComparisonPanel.tsx
 *
 * Renders the Data Comparisons tab, including:
 * - Current vs Previous Trend
 * - Faculty vs Faculty (Top N)
 * - Year Over Year
 * - Faculty vs Department Average
 * - Department vs University Average
 */

import { useEffect, useState } from 'react';
import {
  getMetricsCatalogue,
  getTrendV3,
  getFacultyVsDepartmentAverage,
  getDepartmentVsAverage,
  type CatalogueEntry,
} from '../../../lib/analyticsV3Api';
import type { AnalyticsFilters } from '../../../lib/analyticsV2Api';
import TrendLineChart from '../../../components/analytics/charts/TrendLineChart';
import DepartmentBarChart from '../../../components/analytics/charts/DepartmentBarChart';
import GaugeChart from '../../../components/analytics/charts/GaugeChart';

interface ComparisonPanelProps {
  filters?: AnalyticsFilters;
}

export default function ComparisonPanel({ filters }: ComparisonPanelProps) {
  const [metrics, setMetrics] = useState<CatalogueEntry[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('publications');
  
  // States for different comparisons
  const [yoyData, setYoyData] = useState<any>(null);
  const [fVfData, setFVfData] = useState<any>(null);
  const [cvpData, setCvpData] = useState<any>(null);
  
  const [facultyId, setFacultyId] = useState('');
  const [fVdData, setFVdData] = useState<any>(null);

  const [deptName, setDeptName] = useState('');
  const [dVgData, setDVgData] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  // Load Catalogue
  useEffect(() => {
    getMetricsCatalogue().then(res => {
      // res is CatalogueResponse which has { metrics } if from API, or just array if mocked.
      // Depending on API response shape:
      const arr = Array.isArray(res) ? res : (res as any).metrics;
      if (arr) setMetrics(arr);
    }).catch(console.error);
  }, []);

  // Load Trends
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTrendV3('yearOverYear', selectedMetric, filters).catch(() => null),
      getTrendV3('facultyVsFaculty', selectedMetric, filters).catch(() => null),
      getTrendV3('currentVsPrevious', selectedMetric, filters).catch(() => null),
    ]).then(([yoy, fvf, cvp]) => {
      setYoyData(yoy);
      setFVfData(fvf);
      setCvpData(cvp);
      setLoading(false);
    });
  }, [selectedMetric, filters]);

  // Load Faculty vs Dept
  const loadFacultyVsDept = () => {
    if (!facultyId) return;
    getFacultyVsDepartmentAverage(facultyId, selectedMetric, filters)
      .then(setFVdData)
      .catch(() => setFVdData({ error: 'Faculty not found or access denied.' }));
  };

  // Load Dept vs Uni
  const loadDeptVsUni = () => {
    if (!deptName) return;
    getDepartmentVsAverage(deptName, selectedMetric, filters)
      .then(setDVgData)
      .catch(() => setDVgData({ error: 'Department not found.' }));
  };

  return (
    <div>
      {/* Metric Selector */}
      <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <label style={{ fontWeight: 600, color: '#334155', marginRight: 12 }}>Compare Metric:</label>
        <select
          value={selectedMetric}
          onChange={e => setSelectedMetric(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', minWidth: 250 }}
        >
          <option value="publications">Publications (Default)</option>
          {metrics.map(m => (
            <option key={m.metricId} value={m.metricId}>{m.metricName} ({m.criterion})</option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: '#94a3b8' }}>Loading trends...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
        
        {/* Current vs Previous */}
        {cvpData && (
          <div style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: '#1e293b' }}>Current vs Previous Year</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: '0 0 4px', color: '#64748b' }}>{cvpData.currentYear}: <strong style={{ color: '#0f172a' }}>{cvpData.currentValue}</strong></p>
                <p style={{ margin: 0, color: '#64748b' }}>{cvpData.previousYear}: <strong style={{ color: '#0f172a' }}>{cvpData.previousValue}</strong></p>
                <p style={{ marginTop: 12, fontWeight: 600, color: cvpData.delta >= 0 ? '#16a34a' : '#dc2626' }}>
                  {cvpData.delta >= 0 ? '+' : ''}{cvpData.delta} ({cvpData.deltaPercent}%)
                </p>
              </div>
              <div style={{ width: 150 }}>
                {/* Visual indicator (Gauge shows achievement against previous year if > 0) */}
                <GaugeChart 
                  value={cvpData.previousValue ? (cvpData.currentValue / cvpData.previousValue) * 100 : 100} 
                  label="% of Previous" 
                  height={120} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Year over Year */}
        {yoyData && yoyData.series && (
          <div style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: '#1e293b' }}>Year Over Year Trend</h3>
            <TrendLineChart 
              periods={yoyData.periods} 
              series={yoyData.series} 
              height={200} 
            />
          </div>
        )}

        {/* Faculty vs Faculty */}
        {fVfData && fVfData.series && (
          <div style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: '#1e293b' }}>Top Faculty</h3>
            <DepartmentBarChart 
              data={fVfData.periods.map((p: string, i: number) => ({ department: p, value: fVfData.series[0].data[i] }))} 
              valueLabel={fVfData.series[0].label} 
              height={200} 
            />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        
        {/* Faculty vs Dept Average */}
        <div style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: '#1e293b' }}>Faculty vs Dept Average</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input 
              type="text" 
              placeholder="Enter Faculty ID or Username" 
              value={facultyId} 
              onChange={e => setFacultyId(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
            />
            <button 
              onClick={loadFacultyVsDept}
              style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Compare
            </button>
          </div>
          {fVdData && !fVdData.error && (
            <div>
              <p>Faculty Value: <strong>{fVdData.facultyValue}</strong></p>
              <p>Dept Average: <strong>{fVdData.departmentAvg}</strong></p>
              <p style={{ color: fVdData.delta >= 0 ? '#16a34a' : '#dc2626' }}>
                Delta: {fVdData.delta >= 0 ? '+' : ''}{fVdData.delta}
              </p>
            </div>
          )}
          {fVdData?.error && <p style={{ color: '#dc2626' }}>{fVdData.error}</p>}
        </div>

        {/* Dept vs Uni Average */}
        <div style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: '#1e293b' }}>Department vs University Avg</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input 
              type="text" 
              placeholder="Enter Department Name" 
              value={deptName} 
              onChange={e => setDeptName(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
            />
            <button 
              onClick={loadDeptVsUni}
              style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Compare
            </button>
          </div>
          {dVgData && !dVgData.error && (
            <div>
              <p>Department Value: <strong>{dVgData.departmentValue}</strong></p>
              <p>University Average: <strong>{dVgData.universityAvg}</strong></p>
              <p style={{ color: dVgData.delta >= 0 ? '#16a34a' : '#dc2626' }}>
                Delta: {dVgData.delta >= 0 ? '+' : ''}{dVgData.delta}
              </p>
            </div>
          )}
          {dVgData?.error && <p style={{ color: '#dc2626' }}>{dVgData.error}</p>}
        </div>

      </div>
    </div>
  );
}
