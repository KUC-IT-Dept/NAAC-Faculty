/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import api, { getFileUrl } from '../../lib/api';
import toast from 'react-hot-toast';
import { departmentOptions } from '../../shared/dropdownOptions';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface FacultyUser {
  _id: string; username: string; email: string; isActive: boolean;
  profile?: {
    personalInfo?: { fullName?: string; photoUrl?: string; mobilePersonal?: string; officialEmail?: string; orcidId?: string; googleScholarId?: string; linkedIn?: string; };
    employmentDetails?: { designation?: string; department?: string; dateOfAppointment?: string; totalExperienceYears?: string; };
    qualifications?: { degreeLevel?: string; degreeName?: string; specialization?: string; yearOfPassing?: string }[];
    publications?: any[]; projects?: any[]; awards?: any[];
    completionPercentage?: number;
  };
}
interface DeptInfo { name: string; color: string; gradient: string; hod: FacultyUser | null; faculty: FacultyUser[]; completionPercentage: number; }

const PALETTE = [
  { color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#818cf8)' },
  { color: '#0ea5e9', gradient: 'linear-gradient(135deg,#0ea5e9,#38bdf8)' },
  { color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#34d399)' },
  { color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
  { color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#a78bfa)' },
  { color: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#f472b6)' },
  { color: '#14b8a6', gradient: 'linear-gradient(135deg,#14b8a6,#2dd4bf)' },
  { color: '#f97316', gradient: 'linear-gradient(135deg,#f97316,#fb923c)' },
];

const HOD_DESIGNATIONS = ['HOD', 'Head of Department', 'Head of the Department'];

// ─── Connector helpers ───────────────────────────────────────────────────────────
const VLine = ({ height = 24, color = '#e2e8f0' }: { height?: number; color?: string }) => (
  <div style={{ width: 2, height, background: color, borderRadius: 2, flexShrink: 0 }} />
);

// ─── Avatar ──────────────────────────────────────────────────────────────────────
function Avatar({ photoUrl, name, size = 40, color }: { photoUrl?: string; name: string; size?: number; color: string }) {
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
function ProfileDrawer({ member, color, onClose }: { member: FacultyUser; color: string; onClose: () => void }) {
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

// ─── Tree Node (University / IQAC) ───────────────────────────────────────────────
function RootNode({ icon, title, subtitle, gradient, glow }: { icon: string; title: string; subtitle: string; gradient: string; glow: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      background: gradient, borderRadius: 16, padding: '12px 22px',
      boxShadow: `0 6px 24px ${glow}`, color: '#fff', userSelect: 'none',
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.2px' }}>{title}</div>
        <div style={{ fontSize: 10, opacity: 0.78, marginTop: 1 }}>{subtitle}</div>
      </div>
    </div>
  );
}

// ─── Person Node (VC / Super Admin) ──────────────────────────────────────────────
function PersonNode({ icon, role, name, email, gradient }: { icon: string; role: string; name?: string; email?: string; gradient: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div 
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        background: '#fff', borderRadius: 12, padding: '8px 14px',
        border: `2px solid ${hov ? '#6366f1' : '#e2e8f0'}`,
        boxShadow: hov ? '0 8px 20px rgba(99,102,241,0.1)' : '0 3px 8px rgba(0,0,0,0.03)',
        color: '#0f172a', userSelect: 'none',
        minWidth: 150, textAlign: 'left',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      <div style={{ 
        width: 32, height: 32, borderRadius: '50%', 
        background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, color: '#fff', flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 8, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{role}</div>
        {name && <div style={{ fontSize: 10.5, fontWeight: 800, color: '#1f2937', marginTop: 1, whiteSpace: 'nowrap' }}>{name}</div>}
        {email && <div style={{ fontSize: 8, color: '#6b7280', marginTop: 0.5 }}>{email}</div>}
      </div>
    </div>
  );
}

// ─── Completion Circle (Progress / Warning) ──────────────────────────────────────
function CompletionCircle({ percentage }: { percentage: number }) {
  const size = 26;
  const strokeWidth = 2.2;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const color = percentage === 100 ? '#10b981' : percentage >= 70 ? '#f59e0b' : '#ef4444';
  
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title={`Completion Status: ${percentage}%`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.35s' }}
        />
      </svg>
      <span style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 7,
        color: '#1e293b',
        fontWeight: 800
      }}>
        {percentage}%
      </span>
    </div>
  );
}

// ─── Dept branch (node + expandable HOD + faculty) ───────────────────────────────
function DeptBranch({ dept, onOpenDrawer }: { dept: DeptInfo; onOpenDrawer: (m: FacultyUser, c: string) => void }) {
  const [open, setOpen] = useState(false);
  const total = dept.faculty.length;
  const [hov, setHov] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 140, padding: '0 4px' }}>
      {/* Vertical drop from horizontal connector */}
      <VLine height={16} color={dept.color + '80'} />

      {/* Dept node */}
      <div
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: '#fff', border: `2px solid ${hov || open ? dept.color : dept.color + '40'}`,
          borderRadius: 12, padding: '8px 24px 8px 34px', cursor: 'pointer', width: '100%',
          boxShadow: open ? `0 6px 20px ${dept.color}22` : hov ? `0 4px 14px ${dept.color}18` : '0 1px 6px rgba(0,0,0,0.06)',
          transition: 'all 0.18s', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: dept.gradient }} />
        
        {/* Absolute positioned completion warning circle */}
        <div style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
          <CompletionCircle percentage={dept.completionPercentage} />
        </div>

        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: 1 }}>{dept.name}</div>
          <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>{total} members</div>
        </div>
        <div style={{
          position: 'absolute', right: 6, top: '50%', transform: `translateY(-50%) ${open ? 'rotate(180deg)' : 'rotate(0deg)'}`,
          width: 18, height: 18, borderRadius: 5, background: open ? dept.color : dept.color + '15',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: open ? '#fff' : dept.color,
          transition: 'all 0.18s'
        }}>
          ▾
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', animation: 'expandIn 0.18s ease' }}>
          {/* HOD display removed as requested */}

          {/* Faculty */}
          {dept.faculty.length > 0 && (
            <>
              <VLine height={14} color={dept.color + '60'} />
              <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 5 }}>
                {dept.faculty.map(f => (
                  <MemberBubble key={f._id} member={f} isHod={false} color={dept.color} onClick={() => onOpenDrawer(f, dept.color)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Member bubble (HOD or Faculty) ──────────────────────────────────────────────
function MemberBubble({ member, isHod, color, onClick }: { member: FacultyUser; isHod: boolean; color: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const name = member.profile?.personalInfo?.fullName || member.username;
  const shortName = name.split(' ').slice(0, 2).join(' ');

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      cursor: 'pointer', padding: '6px 5px', borderRadius: 10,
      background: hov ? color + '10' : 'transparent',
      border: `1.5px solid ${hov ? color + '40' : 'transparent'}`,
      transition: 'all 0.15s', width: isHod ? '100%' : 56, maxWidth: isHod ? 200 : 56,
    }}>
      <div style={{ position: 'relative' }}>
        <Avatar photoUrl={member.profile?.personalInfo?.photoUrl} name={name} size={isHod ? 44 : 36} color={color} />
        {isHod && (
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7 }}>⭐</div>
        )}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: isHod ? 10 : 9, fontWeight: 700, color: '#1e293b', lineHeight: 1.3, wordBreak: 'break-word' }}>{shortName}</div>
        {isHod ? (
          <div style={{ fontSize: 8, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>HOD</div>
        ) : (
          <div style={{ fontSize: 7.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 1 }}>Faculty</div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────────
export default function OrgHierarchy() {
  const [loading, setLoading] = useState(true);
  const [depts, setDepts]     = useState<DeptInfo[]>([]);
  const [drawer, setDrawer]   = useState<{ member: FacultyUser; color: string } | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'incomplete' | 'complete'>('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('iqac_user') || '{}');
      const role = user.role;
      const endpoint = role === 'vc' ? '/vc/faculty' : role === 'hod' ? '/hod/faculty' : '/admin/faculty';
      
      const reqs = [api.get(endpoint)];
      if (role === 'admin' || role === 'vc') {
        reqs.push(api.get('/departments'));
      }
      
      const res = await Promise.all(reqs);
      const facRes = res[0];
      const deptRes = res.length > 1 ? res[1] : null;

      let allDeptNames: string[] = [];
      if (deptRes && Array.isArray(deptRes.data)) {
        allDeptNames = deptRes.data.map((d: any) => d.name);
      } else {
        // Fallback for HOD: just extract from their own faculty list
        const depts = new Set<string>();
        facRes.data.forEach((f: any) => {
          if (f.profile?.employmentDetails?.department) depts.add(f.profile.employmentDetails.department);
        });
        allDeptNames = Array.from(depts);
      }

      setDepts(build(facRes.data, allDeptNames));
    } catch { toast.error('Failed to load hierarchy'); }
    finally { setLoading(false); }
  };

  const build = (faculties: FacultyUser[], allDeptNames: string[]): DeptInfo[] => {
    const map: Record<string, FacultyUser[]> = {};

    // Initialize all departments with empty array so they render even with 0 members
    allDeptNames.forEach(name => {
      map[name] = [];
    });

    faculties.forEach(f => {
      const designation = f.profile?.employmentDetails?.designation || '';
      if (designation === 'Vice Chancellor' || designation === 'Super Admin') return;

      const d = f.profile?.employmentDetails?.department;
      if (d && map[d] !== undefined) {
        map[d].push(f);
      } else if (d) {
        map[d] = [f];
      } else {
        const key = 'Other / Unassigned';
        if (!map[key]) map[key] = [];
        map[key].push(f);
      }
    });

    return Object.entries(map).map(([name, members], i) => {
      const pal = PALETTE[i % PALETTE.length];
      const hod = members.find(m => HOD_DESIGNATIONS.includes(m.profile?.employmentDetails?.designation || '')) ?? null;
      
      const totalPct = members.reduce((sum, m) => sum + (m.profile?.completionPercentage ?? 0), 0);
      const avgPct = members.length > 0 ? Math.round(totalPct / members.length) : 0;

      return { 
        name, 
        color: pal.color, 
        gradient: pal.gradient, 
        hod, 
        faculty: members.filter(m => m._id !== hod?._id),
        completionPercentage: avgPct
      };
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 380, gap: 14 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Building hierarchy…</span>
    </div>
  );

  const filteredDepts = depts.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(filterQuery.toLowerCase());
    
    let matchesCompletion = true;
    if (completionFilter === 'incomplete') {
      matchesCompletion = d.completionPercentage < 100;
    } else if (completionFilter === 'complete') {
      matchesCompletion = d.completionPercentage === 100;
    }
    
    return matchesSearch && matchesCompletion;
  });
  const NFiltered = filteredDepts.length;
  const totalMembers = depts.reduce((a, d) => a + d.faculty.length, 0);

  return (
    <div>
      <style>{`
        @keyframes expandIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Summary and Filter Bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Departments', val: depts.length, color: '#6366f1' },
            { label: 'Members', val: totalMembers, color: '#0ea5e9' },
            { label: 'HODs', val: depts.filter(d => d.hod).length, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: s.color + '0f', border: `1px solid ${s.color}20`, borderRadius: 10, padding: '5px 12px' }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filter input */}
        <div style={{ position: 'relative', minWidth: 200, flex: 1, maxWidth: 300 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8' }}>🔍</span>
          <input
            type="text"
            placeholder="Search department..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px 6px 28px',
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              outline: 'none',
              transition: 'all 0.15s',
              background: '#f8fafc',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.background = '#fff';
              e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#cbd5e1';
              e.target.style.background = '#f8fafc';
              e.target.style.boxShadow = 'none';
            }}
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Completion status filter dropdown */}
        <select
          value={completionFilter}
          onChange={(e) => setCompletionFilter(e.target.value as any)}
          style={{
            padding: '6px 10px',
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            background: '#f8fafc',
            outline: 'none',
            color: '#475569',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.15s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#6366f1';
            e.target.style.background = '#fff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#cbd5e1';
            e.target.style.background = '#f8fafc';
          }}
        >
          <option value="all">All Departments</option>
          <option value="incomplete">Incomplete Only</option>
          <option value="complete">Complete Only</option>
        </select>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
          Click any department to expand ▾
        </div>
      </div>

      {/* Scrollable tree canvas */}
      <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: 24 }}>
        <div style={{ minWidth: Math.max(600, NFiltered * 148), display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* L1 — University */}
          <RootNode icon="🏛️" title="Kannur University" subtitle="Established 1996" gradient="linear-gradient(135deg,#7c3aed,#9333ea)" glow="rgba(124,58,237,0.28)" />
          
          {/* Connector down to VC & Super Admin */}
          <VLine height={20} color="#7c3aed50" />
          
          <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Horizontal bar between VC and Super Admin */}
            <div style={{
              position: 'absolute', top: 0, height: 2, background: '#e2e8f0', borderRadius: 1,
              left: 'calc(50% - 130px)', right: 'calc(50% - 130px)',
            }} />
            
            <div style={{ display: 'flex', gap: 70, justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              {/* VC Column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <VLine height={12} color="#e2e8f0" />
                <PersonNode icon="👑" role="Vice Chancellor" gradient="linear-gradient(135deg,#f59e0b,#d97706)" />
                <VLine height={20} color="#e2e8f0" />
              </div>
              
              {/* Super Admin Column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <VLine height={12} color="#e2e8f0" />
                <PersonNode icon="🛡️" role="Super Admin" name="System Administrator" email="admin@iqac.edu.in" gradient="linear-gradient(135deg,#3b82f6,#2563eb)" />
                <VLine height={20} color="#e2e8f0" />
              </div>
            </div>

            {/* Horizontal bar back to center */}
            <div style={{
              position: 'absolute', bottom: 0, height: 2, background: '#e2e8f0', borderRadius: 1,
              left: 'calc(50% - 130px)', right: 'calc(50% - 130px)',
            }} />
          </div>

          <VLine height={12} color="#e2e8f0" />

          {/* L3 — IQAC */}
          <RootNode icon="🎯" title="IQAC" subtitle="Internal Quality Assurance Cell" gradient="linear-gradient(135deg,#0ea5e9,#38bdf8)" glow="rgba(14,165,233,0.25)" />
          <VLine height={24} color="#0ea5e950" />

          {/* Horizontal connector across all dept columns */}
          {NFiltered === 0 ? (
            <div style={{ padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>No departments match your search.</div>
          ) : (
            <div style={{ position: 'relative', width: '100%' }}>
              {/* Horizontal bar */}
              {NFiltered > 1 && (
                <div style={{
                  position: 'absolute', top: 0, height: 2, background: '#e2e8f0', borderRadius: 1,
                  left: `${50 / NFiltered}%`, right: `${50 / NFiltered}%`,
                }} />
              )}

              {/* Dept columns */}
              <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                {filteredDepts.map(d => (
                  <DeptBranch key={d.name} dept={d} onOpenDrawer={(m, c) => setDrawer({ member: m, color: c })} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {drawer && <ProfileDrawer member={drawer.member} color={drawer.color} onClose={() => setDrawer(null)} />}
    </div>
  );
}
