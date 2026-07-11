/**
 * FacultyProfileAnalytics.tsx — Phase 12
 * Calls GET /analytics/faculty/:facultyId/profile-analytics
 * Renders grouped metrics + section completion list.
 * Back button navigates to DepartmentFacultyList.
 */
import { useEffect, useState } from 'react';
import { getFacultyProfileAnalytics } from '../../../lib/analyticsV3Api';
import RadarProfileChart from '../../../components/analytics/charts/RadarProfileChart';

interface MetricEntry { metricId: string; metricName: string; criterion: string; value: number; }
interface SectionEntry { section: string; filled: boolean; }

interface ProfileResult {
  facultyId: string;
  facultyName: string;
  username: string;
  department: string;
  designation: string;
  profileComplete: boolean;
  completionPercentage: number;
  sectionCompletion: SectionEntry[];
  metrics: Record<string, MetricEntry[]>;
}

interface Props {
  facultyId: string;
  onBack: () => void;
}

const GROUP_LABELS: Record<string, string> = {
  research:    'Research & Publications',
  development: 'Faculty Development',
  profile:     'Profile & Qualifications',
  extension:   'Administration & Extension',
  other:       'Other Activities',
};

export default function FacultyProfileAnalytics({ facultyId, onBack }: Props) {
  const [data,    setData]    = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!facultyId) return;
    setLoading(true);
    setError(null);
    getFacultyProfileAnalytics(facultyId)
      .then(d => setData(d as ProfileResult))
      .catch(e => {
        const status = e?.response?.status;
        if (status === 403) setError('Access denied: this faculty is outside your department scope.');
        else if (status === 404) setError('Faculty not found.');
        else setError('Failed to load faculty profile.');
      })
      .finally(() => setLoading(false));
  }, [facultyId]);

  if (loading) return <p style={{ color: '#94a3b8' }}>Loading faculty profile…</p>;
  if (error)   return <div style={{ color: '#b91c1c' }}>{error}</div>;
  if (!data)   return null;

  const sectionFilled   = data.sectionCompletion.filter(s => s.filled).length;
  const sectionTotal    = data.sectionCompletion.length;
  const radarData = Object.entries(data.metrics)
    .map(([group, metrics]) => ({
      axis: GROUP_LABELS[group] || group,
      value: metrics.reduce((sum, metric) => sum + metric.value, 0),
      fullMark: metrics.reduce((sum, metric) => sum + metric.value, 0),
    }))
    .filter(point => point.value > 0);

  return (
    <div>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <button type="button" onClick={onBack}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontSize: '0.85rem' }}>
          ← Back
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy,#1e3a5f)' }}>{data.facultyName}</div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{data.designation} — {data.department}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <span style={{ fontWeight: 700, fontSize: '1.4rem', color: data.completionPercentage >= 70 ? '#16a34a' : '#d97706' }}>
            {data.completionPercentage}%
          </span>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>profile complete</div>
        </div>
      </div>

      {/* Section completion */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
        <strong style={{ fontSize: '0.85rem', color: '#475569' }}>
          Sections filled: {sectionFilled}/{sectionTotal}
        </strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {data.sectionCompletion.map(s => (
            <span key={s.section} style={{
              fontSize: '0.75rem', padding: '3px 8px', borderRadius: 999,
              background: s.filled ? '#dcfce7' : '#fee2e2',
              color:      s.filled ? '#166534' : '#991b1b',
            }}>
              {s.section}
            </span>
          ))}
        </div>
      </div>

      {radarData.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy,#1e3a5f)', marginBottom: 12 }}>
            Faculty Activity Profile
          </h3>
          <RadarProfileChart data={radarData} height={320} />
        </div>
      )}

      {/* Metrics by group */}
      {Object.entries(data.metrics).map(([group, metrics]) => (
        metrics.length > 0 && (
          <div key={group} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy,#1e3a5f)', marginBottom: 10 }}>
              {GROUP_LABELS[group] || group}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {metrics.map(m => (
                <div key={m.metricId} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                  padding: '12px 16px', minWidth: 130, flex: '1 1 130px',
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary,#2563eb)' }}>{m.value}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>{m.metricName}</div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
