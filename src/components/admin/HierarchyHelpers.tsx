/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { getFileUrl } from '../../lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────────
export interface FacultyUser {
  _id: string; username: string; email: string; isActive: boolean;
  profile?: {
    personalInfo?: { fullName?: string; photoUrl?: string; mobilePersonal?: string; officialEmail?: string; orcidId?: string; googleScholarId?: string; linkedIn?: string; };
    employmentDetails?: { designation?: string; department?: string; dateOfAppointment?: string; totalExperienceYears?: string; };
    qualifications?: { degreeLevel?: string; degreeName?: string; specialization?: string; yearOfPassing?: string }[];
    publications?: any[]; projects?: any[]; awards?: any[];
    completionPercentage?: number;
  };
}
export interface DeptInfo { name: string; color: string; gradient: string; hod: FacultyUser | null; faculty: FacultyUser[]; completionPercentage: number; }

export const PALETTE = [
  { color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#818cf8)' },
  { color: '#0ea5e9', gradient: 'linear-gradient(135deg,#0ea5e9,#38bdf8)' },
  { color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#34d399)' },
  { color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
  { color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#a78bfa)' },
  { color: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#f472b6)' },
  { color: '#14b8a6', gradient: 'linear-gradient(135deg,#14b8a6,#2dd4bf)' },
  { color: '#f97316', gradient: 'linear-gradient(135deg,#f97316,#fb923c)' },
];

export const HOD_DESIGNATIONS = ['HOD', 'Head of Department', 'Head of the Department'];

// ─── Avatar ──────────────────────────────────────────────────────────────────────
export function Avatar({ photoUrl, name, size = 40, color }: { photoUrl?: string; name: string; size?: number; color: string }) {
  const [err, setErr] = useState(false);
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const src = photoUrl ? getFileUrl(photoUrl) : '';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      border: `3px solid #fff`,
      boxShadow: `0 0 0 2.5px ${color}, 0 3px 10px ${color}44`,
      background: (!src || err) ? color : '#f1f5f9',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {src && !err
        ? <img src={src} alt={name} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ color: '#fff', fontWeight: 900, fontSize: size * 0.36 }}>{initials}</span>}
    </div>
  );
}

// ─── Profile Drawer ───────────────────────────────────────────────────────────────
export function ProfileDrawer({ member, color, onClose }: { member: FacultyUser; color: string; onClose: () => void }) {
  const p = member.profile, info = p?.personalInfo, emp = p?.employmentDetails;
  const name = info?.fullName || member.username;
  const isHod = HOD_DESIGNATIONS.includes(emp?.designation || '');
  const c = isHod ? '#ef4444' : color;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const InfoCell = ({ label, val }: { label: string; val: string }) => (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '9px 12px', border: '1px solid #f0f4f8' }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', wordBreak: 'break-all' }}>{val || '—'}</div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,23,0.45)', backdropFilter: 'blur(4px)', zIndex: 999 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, background: '#fff', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-16px 0 50px rgba(0,0,0,0.16)', animation: 'drawerIn 0.26s cubic-bezier(.22,1,.36,1)' }}>
        <style>{`@keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        <div style={{ background: `linear-gradient(150deg,${c}1a,${c}06)`, borderBottom: `4px solid ${c}`, padding: '24px 20px 18px', position: 'relative', flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 9, background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: c + '18', border: `1px solid ${c}28`, borderRadius: 20, padding: '3px 10px', marginBottom: 14 }}>
            <span style={{ fontSize: 10 }}>{isHod ? '⭐' : '👤'}</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: c, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{isHod ? 'Head of Department' : 'Faculty Member'}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Avatar photoUrl={info?.photoUrl} name={name} size={68} color={c} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', lineHeight: 1.2, marginBottom: 4 }}>{name}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: c, marginBottom: 2 }}>{emp?.designation || '—'}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{emp?.department || '—'}</div>
            </div>
          </div>
          {(p?.completionPercentage ?? 0) > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>Profile Completion</span>
                <span style={{ fontSize: 9, fontWeight: 900, color: c }}>{p!.completionPercentage}%</span>
              </div>
              <div style={{ height: 5, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p!.completionPercentage}%`, background: `linear-gradient(90deg,${c},${c}cc)`, borderRadius: 10 }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <InfoCell label="Email" val={info?.officialEmail || member.email} />
            <InfoCell label="Phone" val={info?.mobilePersonal || '—'} />
            <InfoCell label="Experience" val={emp?.totalExperienceYears ? `${emp.totalExperienceYears} yrs` : '—'} />
            <InfoCell label="Joined" val={emp?.dateOfAppointment ? new Date(emp.dateOfAppointment).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : '—'} />
          </div>

          {(info?.orcidId || info?.googleScholarId || info?.linkedIn) && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Research Identity</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {info.orcidId && <a href={`https://orcid.org/${info.orcidId}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, background: '#a6ce39', color: '#fff', textDecoration: 'none' }}>ORCID</a>}
                {info.googleScholarId && <a href={`https://scholar.google.com/citations?user=${info.googleScholarId}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, background: '#4285f4', color: '#fff', textDecoration: 'none' }}>Scholar</a>}
                {info.linkedIn && <a href={info.linkedIn} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, background: '#0a66c2', color: '#fff', textDecoration: 'none' }}>LinkedIn</a>}
              </div>
            </div>
          )}

          {(p?.qualifications?.length ?? 0) > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Highest Qualification</div>
              {p!.qualifications!.slice(-1).map((q, i) => (
                <div key={i} style={{ background: `${c}0c`, border: `1px solid ${c}20`, borderRadius: 10, padding: '9px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>🎓</span>
                  <div><div style={{ fontWeight: 800, fontSize: 12 }}>{q.degreeName}</div><div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{q.specialization} · {q.yearOfPassing}</div></div>
                </div>
              ))}
            </div>
          )}

          {(p?.publications?.length ?? 0) > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                Publications <span style={{ background: c + '18', color: c, fontSize: 9, fontWeight: 800, padding: '1px 7px', borderRadius: 10 }}>{p!.publications!.length}</span>
              </div>
              {p!.publications!.slice(0, 3).map((pub: any, i) => (
                <div key={i} style={{ background: '#f8fafc', border: '1px solid #f0f4f8', borderRadius: 9, padding: '8px 10px', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{pub.title}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{pub.journal} · {pub.year}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f4f8', flexShrink: 0 }}>
          <a href={`/profile/${member.username}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: c, color: '#fff', borderRadius: 11, fontSize: 12, fontWeight: 800, textDecoration: 'none', boxShadow: `0 4px 14px ${c}44` }}>
            View Full Profile →
          </a>
        </div>
      </div>
    </>
  );
}

// ─── Build helper ────────────────────────────────────────────────────────────────
export const buildDepts = (faculties: FacultyUser[], allDeptNames: string[]): DeptInfo[] => {
  const map: Record<string, FacultyUser[]> = {};
  allDeptNames.forEach(name => { map[name] = []; });

  faculties.forEach(f => {
    const designation = f.profile?.employmentDetails?.designation || '';
    if (designation === 'Vice Chancellor' || designation === 'Super Admin') return;
    const d = f.profile?.employmentDetails?.department;
    if (d && map[d] !== undefined) { map[d].push(f); }
    else if (d) { map[d] = [f]; }
    else { const key = 'Other / Unassigned'; if (!map[key]) map[key] = []; map[key].push(f); }
  });

  return Object.entries(map).map(([name, members], i) => {
    const pal = PALETTE[i % PALETTE.length];
    const hod = members.find(m => HOD_DESIGNATIONS.includes(m.profile?.employmentDetails?.designation || '')) ?? null;
    const totalPct = members.reduce((sum, m) => sum + (m.profile?.completionPercentage ?? 0), 0);
    const avgPct = members.length > 0 ? Math.round(totalPct / members.length) : 0;
    return { name, color: pal.color, gradient: pal.gradient, hod, faculty: members.filter(m => m._id !== hod?._id), completionPercentage: avgPct };
  });
};
