import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import api from '../../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Users, BookOpen, LayoutDashboard } from 'lucide-react';

export default function DepartmentDetails() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/departments/${encodeURIComponent(name)}/overview`);
        setData(res.data);
      } catch (err) {
        console.error('Dept details load error', err);
        toast.error('Failed to load department details');
      } finally {
        setLoading(false);
      }
    };
    if (name) fetch();
  }, [name]);

  return (
    <AppLayout title={name ? `Department: ${name}` : 'Department'}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>{data?.name || name}</h2>
            <div className="text-muted">HOD: {data?.hodName || '—'}</div>
          </div>
          <div>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}><div className="spinner" /></div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="card" style={{ padding: 12, flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(99,102,241,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{data?.stats?.facultyCount ?? 0}</div>
                    <div className="text-muted">Faculty in Department</div>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: 12, flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(15,76,117,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{data?.stats?.totalPublications ?? 0}</div>
                    <div className="text-muted">Publications</div>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: 12, flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(232,160,32,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LayoutDashboard size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{data?.stats?.totalProjects ?? 0}</div>
                    <div className="text-muted">Research Projects</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <h3 style={{ margin: '8px 0' }}>Faculty Members</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100% - 220px)', overflowY: 'auto' }}>
                {data?.facultyMembers?.length ? data.facultyMembers.map((f: any, idx: number) => (
                  <div key={idx} className="card" style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{f.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{f.designation}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700 }}>{f.completionPercentage ?? 0}%</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Completion</div>
                    </div>
                  </div>
                )) : <div className="text-muted">No faculty members found.</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
