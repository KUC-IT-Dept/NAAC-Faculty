import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { GraduationCap, Briefcase, BookOpen, FlaskConical, Award, Users, Shield, Mail, Phone, Globe, Link2, ExternalLink } from 'lucide-react';

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/profile/${username}`)
      .then(r => setProfile(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="spinner" style={{ width: 48, height: 48, borderWidth: 3, borderColor: 'var(--navy)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (notFound || !profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16 }}>
      <div style={{ width: 72, height: 72, background: 'var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GraduationCap size={32} color="var(--text-muted)" />
      </div>
      <h2 style={{ color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}>Profile Not Found</h2>
      <p className="text-muted text-sm">This faculty profile is not available or has not been published yet.</p>
      <Link to="/" className="btn btn-outline btn-sm">Go to Portal</Link>
    </div>
  );

  const pi = profile.personalInfo || {};
  const employment = profile.employmentDetails || {};
  const rawName = pi.fullName || [pi.firstName, pi.middleName, pi.lastName].filter(Boolean).join(' ').trim() || username || 'Faculty';
  const fullName = rawName.replace(/^temp--/i, '').trim();
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const displayEmail = pi.officialEmail || pi.officialEmailId;
  const displayPhone = pi.mobilePersonal || pi.mobileNumber;
  const displayHeadline = pi.professionalHeadline;

  return (
    <div className="public-layout">
      {/* Hero */}
      <div className="public-hero">
        <div className="public-container">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap' }}>
            <div className="avatar avatar-xl" style={{ border: '4px solid rgba(201,162,39,0.6)', background: 'rgba(255,255,255,0.12)', fontSize: '2.5rem', flexShrink: 0 }}>
              {pi.photoUrl ? <img src={pi.photoUrl} alt={pi.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(201,162,39,0.9)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Faculty Profile
              </div>
              <h1 style={{ color: '#fff', marginBottom: 8 }}>{fullName}</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginBottom: 4 }}>
                {employment.designation}{employment.designation && employment.department ? ' · ' : ''}{employment.department}
              </p>
              {employment.institution && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>{employment.institution}</p>}
              {displayHeadline && <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem', marginTop: 6 }}>{displayHeadline}</p>}
              <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
                {displayEmail && <a href={`mailto:${displayEmail}`} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={13} />{displayEmail}</a>}
                {displayPhone && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={13} />{displayPhone}</span>}
                {pi.linkedIn && <a href={pi.linkedIn} target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}><Link2 size={13} />LinkedIn</a>}
                {pi.website && <a href={pi.website} target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}><Globe size={13} />Website</a>}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                {pi.orcidId && <a href={`https://orcid.org/${pi.orcidId}`} target="_blank" rel="noreferrer" style={{ color: 'rgba(201,162,39,0.9)', fontSize: '0.75rem' }}><ExternalLink size={11} style={{ display: 'inline', marginRight: 3 }} />ORCID</a>}
                {pi.googleScholarId && <a href={`https://scholar.google.com/citations?user=${pi.googleScholarId}`} target="_blank" rel="noreferrer" style={{ color: 'rgba(201,162,39,0.9)', fontSize: '0.75rem' }}><ExternalLink size={11} style={{ display: 'inline', marginRight: 3 }} />Google Scholar</a>}
                {pi.scopusId && <span style={{ color: 'rgba(201,162,39,0.9)', fontSize: '0.75rem' }}>Scopus: {pi.scopusId}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="public-container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {/* Qualifications */}
        {profile.qualifications?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><GraduationCap size={18} color="var(--navy)" /> Academic Qualifications</div>
            <div className="profile-section-body">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Degree</th><th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Specialization</th><th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>University</th><th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Year</th><th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Grade</th></tr></thead>
                <tbody>{profile.qualifications.map((q: any, i: number) => <tr key={i} style={{ borderTop: '1px solid var(--border)' }}><td style={{ padding: '10px 12px', fontWeight: 600, fontSize: '0.875rem' }}>{[q.degreeLevel, q.degreeName].filter(Boolean).join(' · ') || '—'}</td><td style={{ padding: '10px 12px', fontSize: '0.875rem' }}>{q.specialization || '—'}</td><td style={{ padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{q.university || q.boardUniversity || q.institution || '—'}</td><td style={{ padding: '10px 12px', fontSize: '0.875rem' }}>{q.yearOfPassing || '—'}</td><td style={{ padding: '10px 12px', fontSize: '0.875rem' }}>{q.percentageCGPA || q.division || '—'}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* Work Experience */}
        {profile.workExperience?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Briefcase size={18} color="var(--navy)" /> Work Experience</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profile.workExperience.map((e: any, i: number) => (
                <div key={i} style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid var(--gold)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div><div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{e.designation || '—'}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{e.organization || '—'}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.82rem', color: 'var(--navy)', fontWeight: 600 }}>{e.from || '—'} – {e.to || 'Present'}</div>{e.nature && <span className="badge badge-navy" style={{ marginTop: 4 }}>{e.nature}</span>}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Research Experience */}
        {profile.researchGuidance && (
          <div className="profile-section">
            <div className="profile-section-title"><FlaskConical size={18} color="var(--navy)" /> Research Experience</div>
            <div className="profile-section-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Ph.D Completed', value: profile.researchGuidance.phdCompleted || '—' },
                  { label: 'Ph.D Ongoing', value: profile.researchGuidance.phdInProgress || '—' },
                  { label: 'M.Phil Completed', value: profile.researchGuidance.mphilCompleted || '—' },
                  { label: 'M.Phil Ongoing', value: profile.researchGuidance.mphilInProgress || '—' },
                  { label: 'PG Projects', value: profile.researchGuidance.pgProjectsSupervised || '—' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Publications */}
        {profile.publications?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><BookOpen size={18} color="var(--navy)" /> Publications <span className="badge badge-navy" style={{ marginLeft: 8 }}>{profile.publications.length}</span></div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profile.publications.map((p: any, i: number) => (
                <div key={i} style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid var(--navy)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-navy" style={{ fontSize: '0.68rem' }}>{p.type}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.year}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', margin: '6px 0 4px' }}>{p.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.authors}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--navy)', marginTop: 4, fontStyle: 'italic' }}>
                    {p.journal}{p.volume ? `, Vol. ${p.volume}` : ''}{p.issue ? `(${p.issue})` : ''}{p.pages ? `, pp. ${p.pages}` : ''}
                    {p.impactFactor && <span style={{ marginLeft: 8, color: 'var(--gold)', fontStyle: 'normal', fontWeight: 600 }}>IF: {p.impactFactor}</span>}
                  </div>
                  {p.indexedIn && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Indexed: {p.indexedIn}</div>}
                  {p.doi && <a href={p.doi} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--info)', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}><ExternalLink size={11} />DOI</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {profile.projects?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><FlaskConical size={18} color="var(--navy)" /> Research Projects <span className="badge badge-navy" style={{ marginLeft: 8 }}>{profile.projects.length}</span></div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profile.projects.map((p: any, i: number) => (
                <div key={i} style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{p.title}</div>
                    <span className={`badge ${p.status === 'Completed' ? 'badge-active' : 'badge-pending'}`}>{p.status || 'N/A'}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {p.fundingAgency && <span>Agency: <strong>{p.fundingAgency}</strong></span>}
                    {p.amountSanctioned && <span>Amount: <strong>₹{p.amountSanctioned}</strong></span>}
                    {p.duration && <span>Duration: <strong>{p.duration}</strong></span>}
                    {p.role && <span>Role: <strong>{p.role}</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Awards */}
        {profile.awards?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Award size={18} color="var(--navy)" /> Awards & Recognition</div>
            <div className="profile-section-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {profile.awards.map((a: any, i: number) => (
                <div key={i} style={{ padding: '16px', background: 'var(--bg)', borderRadius: 8, borderTop: '3px solid var(--gold)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{a.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>{a.awardingAgency}</div>
                  {a.dateOfAward && <div style={{ fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 600 }}>{a.dateOfAward}</div>}
                  {a.level && <div style={{ fontSize: '0.82rem', marginTop: 6, color: 'var(--text)' }}>{a.level}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memberships */}
        {profile.memberships?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Users size={18} color="var(--navy)" /> Professional Memberships</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.memberships.map((m: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.professionalBody}</span>{m.membershipType && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 8 }}>({m.membershipType})</span>}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.membershipId && `ID: ${m.membershipId}`}{m.yearOfJoining && <span style={{ marginLeft: 8 }}>{m.yearOfJoining}</span>}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Roles */}
        {profile.adminResponsibilities?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Shield size={18} color="var(--navy)" /> Administrative Roles</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.adminResponsibilities.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.committeeName}</span><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>{r.role}</span></div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 600 }}>{r.from} – {r.to || 'Present'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Administrative & Non-Academic Responsibilities */}
        {profile.adminNonAcademicResponsibilities?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Shield size={18} color="var(--navy)" /> Administrative & Non-Academic Responsibilities</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.adminNonAcademicResponsibilities.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.administrativeCharge}</span>
                    {r.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>{r.description}</span>}
                  </div>
                  {(r.from || r.to) && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 600 }}>{r.from || '—'} – {r.to || 'Present'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Academic Administration */}
        {profile.academicAdministration?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Shield size={18} color="var(--navy)" /> Academic Administration</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.academicAdministration.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.administrativeCharge}</span>
                    {r.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>{r.description}</span>}
                  </div>
                  {(r.from || r.to) && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 600 }}>{r.from || '—'} – {r.to || 'Present'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Assurance */}
        {profile.qualityAssurance?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Shield size={18} color="var(--navy)" /> Quality Assurance</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.qualityAssurance.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.administrativeCharge}</span>
                    {r.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>{r.description}</span>}
                  </div>
                  {(r.from || r.to) && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 600 }}>{r.from || '—'} – {r.to || 'Present'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Research and Innovation */}
        {profile.researchAndInnovation?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Shield size={18} color="var(--navy)" /> Research and Innovation</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.researchAndInnovation.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.administrativeCharge}</span>
                    {r.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>{r.description}</span>}
                  </div>
                  {(r.from || r.to) && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 600 }}>{r.from || '—'} – {r.to || 'Present'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Examination and Evaluation */}
        {profile.examinationAndEvaluation?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Shield size={18} color="var(--navy)" /> Examination & Evaluation</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.examinationAndEvaluation.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.administrativeCharge}</span>
                    {r.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>{r.description}</span>}
                  </div>
                  {(r.from || r.to) && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 600 }}>{r.from || '—'} – {r.to || 'Present'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Administrative Support */}
        {profile.administrativeSupport?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Shield size={18} color="var(--navy)" /> Administrative Support</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.administrativeSupport.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.administrativeCharge}</span>
                    {r.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>{r.description}</span>}
                  </div>
                  {(r.from || r.to) && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 600 }}>{r.from || '—'} – {r.to || 'Present'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Departmental Charges */}
        {profile.departmentalCharges?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Shield size={18} color="var(--navy)" /> Departmental Charges</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.departmentalCharges.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.administrativeCharge}</span>
                    {r.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>{r.description}</span>}
                  </div>
                  {(r.from || r.to) && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 600 }}>{r.from || '—'} – {r.to || 'Present'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Assignments */}
        {profile.specialAssignments?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Shield size={18} color="var(--navy)" /> Special Assignments</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.specialAssignments.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.administrativeCharge}</span>
                    {r.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>{r.description}</span>}
                  </div>
                  {(r.from || r.to) && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 600 }}>{r.from || '—'} – {r.to || 'Present'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities – Extra Institutional */}
        {profile.extraInstitutionalActivities?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title"><Shield size={18} color="var(--navy)" /> Activities – Extra Institutional</div>
            <div className="profile-section-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.extraInstitutionalActivities.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.administrativeCharge}</span>
                    {r.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>{r.description}</span>}
                  </div>
                  {(r.from || r.to) && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 600 }}>{r.from || '—'} – {r.to || 'Present'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px 0 8px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          Profile managed via <strong style={{ color: 'var(--navy)' }}>IQAC Faculty Portal</strong>
        </div>
      </div>
    </div>
  );
}
