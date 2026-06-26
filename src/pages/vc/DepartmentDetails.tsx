import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import api from '../../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Users, BookOpen, LayoutDashboard, GraduationCap } from 'lucide-react';

export default function DepartmentDetails() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/departments/${encodeURIComponent(name || '')}/overview`);
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

  useEffect(() => {
    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const backendBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/faculty\/?$/, '').replace(/\/$/, '');
        const token = localStorage.getItem('iqac_token');
        const rawRes = await fetch(`${backendBase}/api/student/by-department`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ department: name })
        });
        if (!rawRes.ok) throw new Error(`Server returned ${rawRes.status}`);
        const resData = await rawRes.json();
        const parsedStudents = Array.isArray(resData) ? resData : (resData.data || resData.students || resData.student || []);
        setStudents(parsedStudents);
      } catch (err) {
        console.error('Failed to load students', err);
        toast.error('Failed to load students');
      } finally {
        setStudentsLoading(false);
      }
    };
    if (name) fetchStudents();
  }, [name]);

  return (
    <AppLayout title={name ? `Department: ${name}` : 'Department'}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              {/* Faculty Count */}
              <div className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(99,102,241,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{data?.stats?.facultyCount ?? 0}</div>
                    <div className="text-muted">Faculty Members</div>
                  </div>
                </div>
              </div>
              
              {/* Student Count */}
              <div className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(236,72,153,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}><GraduationCap size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{data?.stats?.studentCount ?? 0}</div>
                    <div className="text-muted">Students</div>
                  </div>
                </div>
              </div>

              {/* Publications */}
              <div className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(15,76,117,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{data?.stats?.totalPublications ?? 0}</div>
                    <div className="text-muted">Publications</div>
                  </div>
                </div>
              </div>

              {/* Research Projects */}
              <div className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(232,160,32,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LayoutDashboard size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{data?.stats?.totalProjects ?? 0}</div>
                    <div className="text-muted">Research Projects</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Section: Faculty and Students lists side-by-side */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
              gap: '20px', 
              marginTop: '8px',
              flex: 1,
              minHeight: 0
            }}>
              {/* Faculty Members */}
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Faculty Members</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                  {data?.facultyMembers?.length ? data.facultyMembers.map((f: any, idx: number) => (
                    <div key={idx} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

              {/* Student Members */}
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Students List</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                  {studentsLoading ? (
                    <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner" /></div>
                  ) : students.length ? students.map((s: any, idx: number) => (
                    <div key={idx} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{s.personal_details?.fullName || s.name || s.username || '—'}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>{s.contact_details?.personalEmail || s.email || '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.contact_details?.personalMobile?.number || s.phone || '—'}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Tutor: {s.mentor_details?.tutorName || s.tutorName || '—'}</div>
                      </div>
                    </div>
                  )) : <div className="text-muted">No students found.</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
