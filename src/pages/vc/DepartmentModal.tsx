import React, { useEffect, useState, useMemo } from 'react';
import qaiLogo from '../../assets/qai-logo-transparent.png';
import api from '../../lib/api';
import { Users, BookOpen, Briefcase, GraduationCap, TrendingUp, X } from 'lucide-react';

export default function DepartmentModal({ name, onClose }: { name: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);

  // Active analytics card and content area
  const [activeCard, setActiveCard] = useState<'faculty'|'publications'|'projects'|'qualifications'|'analytics'|null>(null);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  // Faculty search term (for content area)
  const [facultySearch, setFacultySearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/departments/${encodeURIComponent(name)}/overview`);
        if (!mounted) return;
        setOverview(res.data);
      } catch (err) {
        console.error('Dept modal overview load', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [name]);

  const handleCardClick = async (type: typeof activeCard) => {
    if (activeCard === type) return; // already active
    setActiveCard(type);
    setContentItems([]);
    if (!type) return;
    setContentLoading(true);
    try {
      let res;
      if (type === 'faculty') res = await api.get(`/departments/${encodeURIComponent(name)}/faculty`);
      if (type === 'publications') res = await api.get(`/departments/${encodeURIComponent(name)}/publications`);
      if (type === 'projects') res = await api.get(`/departments/${encodeURIComponent(name)}/projects`);
      if (type === 'qualifications') res = await api.get(`/departments/${encodeURIComponent(name)}/qualifications`);
      if (type === 'analytics') res = await api.get(`/departments/${encodeURIComponent(name)}/publication-analytics`);
      setContentItems(res?.data || []);
    } catch (err) {
      console.error('Failed to load content for', type, err);
      setContentItems([]);
    } finally {
      setContentLoading(false);
    }
  };

  const filteredFaculty = useMemo(() => {
    if (!contentItems || facultySearch.trim() === '') return contentItems || [];
    const q = facultySearch.toLowerCase();
    return (contentItems || []).filter((f: any) => (f.profile?.personalInfo?.fullName || f.name || '').toLowerCase().includes(q) || (f.profile?.employmentDetails?.employeeId || '').toLowerCase().includes(q) || (f.email || '').toLowerCase().includes(q));
  }, [contentItems, facultySearch]);

  return (
    <div className="dept-modal-overlay" onClick={onClose}>
      <div className="dept-modal" onClick={e => e.stopPropagation()}>

        <div className="dept-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department Profile</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>{name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>HOD: {overview?.hod?.username || overview?.hodName || '—'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="dept-modal-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="dept-modal-body" style={{ paddingTop: 8 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
            </div>
          ) : (
            <>
              {/* Analytics cards only - default state */}
              <div className="dept-summary-grid" style={{ padding: '0 20px 12px 20px' }}>
                <div className={`card dept-summary-card ${activeCard === 'faculty' ? 'active' : ''}`} onClick={() => handleCardClick('faculty')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="summary-icon"><Users size={20} /></div>
                    <div>
                      <div className="summary-value">{overview?.stats?.facultyCount ?? '—'}</div>
                      <div className="summary-label">Faculty in Department</div>
                    </div>
                  </div>
                </div>

                <div className={`card dept-summary-card ${activeCard === 'publications' ? 'active' : ''}`} onClick={() => handleCardClick('publications')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="summary-icon"><BookOpen size={20} /></div>
                    <div>
                      <div className="summary-value">{overview?.publications?.total ?? 0}</div>
                      <div className="summary-label">Total Publications</div>
                    </div>
                  </div>
                </div>

                <div className={`card dept-summary-card ${activeCard === 'projects' ? 'active' : ''}`} onClick={() => handleCardClick('projects')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="summary-icon"><Briefcase size={20} /></div>
                    <div>
                      <div className="summary-value">{overview?.stats?.totalProjects ?? 0}</div>
                      <div className="summary-label">Research Projects</div>
                    </div>
                  </div>
                </div>

                <div className={`card dept-summary-card ${activeCard === 'qualifications' ? 'active' : ''}`} onClick={() => handleCardClick('qualifications')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="summary-icon"><img src={qaiLogo} alt="Logo" style={{ width: 20, height: 20, objectFit: 'contain' }} /></div>
                    <div>
                      <div className="summary-value">{overview?.stats?.totalQualifications ?? 0}</div>
                      <div className="summary-label">Qualifications</div>
                    </div>
                  </div>
                </div>

                <div className={`card dept-summary-card ${activeCard === 'analytics' ? 'active' : ''}`} onClick={() => handleCardClick('analytics')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="summary-icon"><TrendingUp size={20} /></div>
                    <div>
                      <div className="summary-value">{overview?.stats?.avgPublications ?? 0}</div>
                      <div className="summary-label">Avg Pubs / Faculty</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content area — appears only after a card click */}
              <div className="dept-content" style={{ padding: '0 20px 20px 20px' }}>
                {contentLoading ? (
                  <div style={{ padding: 28, textAlign: 'center' }}><div className="spinner" /></div>
                ) : activeCard === null ? (
                  <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>Click an analytics card above to view details.</div>
                ) : activeCard === 'faculty' ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 700 }}>Faculty Members</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input placeholder="Search faculty..." value={facultySearch} onChange={e => setFacultySearch(e.target.value)} className="form-input" style={{ width: 240, padding: '8px 10px' }} />
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '10px' }}>Employee ID</th>
                            <th style={{ textAlign: 'left', padding: '10px' }}>Designation</th>
                            <th style={{ textAlign: 'left', padding: '10px' }}>Email</th>
                            <th style={{ textAlign: 'right', padding: '10px' }}>Completion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFaculty.map((f: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px', fontWeight: 700 }}>{f.profile?.personalInfo?.fullName || f.name || '—'}</td>
                              <td style={{ padding: '10px' }}>{f.profile?.employmentDetails?.employeeId || '—'}</td>
                              <td style={{ padding: '10px' }}>{f.profile?.employmentDetails?.designation || '—'}</td>
                              <td style={{ padding: '10px' }}>{f.email || (f.profile?.personalInfo?.email) || '—'}</td>
                              <td style={{ padding: '10px', textAlign: 'right' }}>{f.profile?.completionPercentage ?? '—'}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : activeCard === 'publications' ? (
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Publications</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '10px' }}>Title</th>
                            <th style={{ textAlign: 'left', padding: '10px' }}>Authors</th>
                            <th style={{ textAlign: 'left', padding: '10px' }}>Journal</th>
                            <th style={{ textAlign: 'right', padding: '10px' }}>Year</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(contentItems || []).map((p: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px', fontWeight: 700 }}>{p.title}</td>
                              <td style={{ padding: '10px' }}>{p.authors || p.author || '—'}</td>
                              <td style={{ padding: '10px' }}>{p.journal || p.venue || '—'}</td>
                              <td style={{ padding: '10px', textAlign: 'right' }}>{p.year || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : activeCard === 'projects' ? (
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Research Projects</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(contentItems || []).map((pr: any, idx: number) => (
                        <div key={idx} className="card" style={{ padding: 12 }}>
                          <div style={{ fontWeight: 700 }}>{pr.title || pr.name}</div>
                          <div style={{ color: 'var(--text-muted)' }}>PI: {pr.principalInvestigator || pr.pi || '—'} • {pr.fundingAgency || pr.agency || '—'} • {pr.status || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activeCard === 'qualifications' ? (
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Qualifications</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(contentItems || []).map((q: any, idx: number) => (
                        <div key={idx} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{q.facultyName || q.name || '—'}</div>
                            <div style={{ color: 'var(--text-muted)' }}>{q.degree} • {q.specialization}</div>
                          </div>
                          <div style={{ color: 'var(--text-muted)' }}>{q.university || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activeCard === 'analytics' ? (
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Publication Analytics</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                      <div className="card" style={{ padding: 12 }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Average per Faculty</div>
                        <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{overview?.stats?.avgPublications ?? '-'}</div>
                      </div>
                      {((contentItems as any)?.perFaculty || contentItems)?.slice?.(0,6)?.map((f: any, idx: number) => (
                        <div className="card" key={idx} style={{ padding: 12 }}>
                          <div style={{ fontWeight: 700 }}>{f.name}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{f.count} publications</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
