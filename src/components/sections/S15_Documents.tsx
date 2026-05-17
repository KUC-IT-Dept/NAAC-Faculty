import { FileText, CheckCircle2, Info } from 'lucide-react';
import { Note, FileInp } from './sectionUtils';
import { useAuth } from '../../context/AuthContext';

const DOC_GROUPS = [
  {
    title: 'Identity & Identification',
    docs: [
      { key: 'photo', label: 'Photograph', required: true, hint: 'Recent, clear JPEG/PNG.' },
      { key: 'signature', label: 'Signature', required: true, hint: 'Scanned on white background.' },
      { key: 'aadhar', label: 'Aadhaar Card', required: true, hint: 'Both sides, self-attested.' },
      { key: 'pan', label: 'PAN Card', required: false, hint: 'PDF format.' },
    ]
  },
  {
    title: 'Academic Certificates',
    docs: [
      { key: 'ssc', label: '10th Marksheet', required: true, hint: 'SSC or equivalent.' },
      { key: 'hsc', label: '12th Marksheet', required: true, hint: 'HSC or equivalent.' },
      { key: 'ug', label: 'UG Degree', required: true, hint: 'Degree & all marksheets.' },
      { key: 'pg', label: 'PG Degree', required: false, hint: 'Degree & all marksheets.' },
      { key: 'phd', label: 'Ph.D. Certificate', required: false, hint: 'Provisional acceptable.' },
      { key: 'mphil', label: 'M.Phil. Certificate', required: false, hint: 'If applicable.' },
      { key: 'net', label: 'NET / SET / JRF', required: false, hint: 'Eligibility certificate.' },
      { key: 'gate', label: 'GATE Score Card', required: false, hint: 'If applicable.' },
    ]
  },
  {
    title: 'Professional & Service Records',
    docs: [
      { key: 'apptLetter', label: 'Appointment Letter', required: true, hint: 'Current institution.' },
      { key: 'experienceCert', label: 'Experience Proofs', required: false, hint: 'Previous employers.' },
      { key: 'publications', label: 'Publications List', required: false, hint: 'PDF with links/DOI.' },
      { key: 'noc', label: 'NOC Certificate', required: false, hint: 'From current employer.' },
    ]
  },
  {
    title: 'Other Documents',
    docs: [
      { key: 'casteCert', label: 'Category Certificate', required: false, hint: 'OBC/SC/ST/EWS.' },
      { key: 'disabilityCert', label: 'Disability Certificate', required: false, hint: 'If applicable.' },
    ]
  }
];

export default function Documents({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const { user } = useAuth();
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });

  const displayGroups = DOC_GROUPS.map(group => {
    let docs = [...group.docs];

    if (user?.role === 'faculty') {
      if (group.title === 'Other Documents') {
        docs.push({ key: 'dobProof', label: 'Date of Birth Proof', required: false, hint: 'Birth certificate / SSLC / Government ID.' });
      } else if (group.title === 'Identity & Identification') {
        docs.push({ key: 'nationalId', label: 'National ID', required: false, hint: 'Voter ID / Passport / Driving License.' });
      }
    }

    return { ...group, docs };
  });

  return (
    <div className="section-container">
      <Note>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Info size={20} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            Please upload all relevant documents. Files must be in <strong>PDF format</strong> (except for your photograph and signature).
            Ensure documents are clear and self-attested where necessary.
          </div>
        </div>
      </Note>

      {displayGroups.map(group => (
        <div key={group.title} style={{ marginTop: '32px' }}>
          <h4 style={{ fontSize: '15px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ height: '1px', flex: 1, backgroundColor: '#e2e8f0' }}></span>
            {group.title}
            <span style={{ height: '1px', flex: 1, backgroundColor: '#e2e8f0' }}></span>
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {group.docs.map(doc => (
              <div key={doc.key} className="list-item-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', margin: 0 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                      <FileText size={16} color="#3b82f6" />
                      {doc.label}
                      {doc.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </div>
                    {data[doc.key] && <CheckCircle2 size={18} color="#10b981" />}
                  </div>
                  {doc.hint && <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '11px', lineHeight: '1.4' }}>{doc.hint}</p>}
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <FileInp
                    v={data[doc.key]}
                    fn={v => s(doc.key, v)}
                    accept={['photo', 'signature', 'dobProof', 'nationalId'].includes(doc.key) ? "image/*,.pdf" : ".pdf"}
                  />
                  {data[doc.key] && (
                    <div style={{ marginTop: 8, fontSize: '11px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> Uploaded
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: '40px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
        <strong>Note:</strong> Fields marked with <span style={{ color: '#ef4444' }}>*</span> are mandatory for verification by the administration.
      </div>
    </div>
  );
}
