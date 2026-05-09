import { FileText, CheckCircle2 } from 'lucide-react';
import { Note } from './sectionUtils';

const DOC_LIST = [
  { key: 'photo',          label: 'Passport-size Photograph',        required: true,  hint: 'Recent, clear. JPEG/PNG/PDF, max 200KB.' },
  { key: 'signature',      label: 'Signature',                        required: true,  hint: 'Scanned on white background.' },
  { key: 'aadhar',         label: 'Aadhaar Card',                     required: true,  hint: 'Both sides, self-attested. PDF format.' },
  { key: 'pan',            label: 'PAN Card',                         required: false, hint: 'PDF format.' },
  { key: 'ssc',            label: 'SSC / 10th Marksheet',             required: true,  hint: 'PDF format.' },
  { key: 'hsc',            label: 'HSC / 12th Marksheet',             required: true,  hint: 'PDF format.' },
  { key: 'ug',             label: 'UG Degree & All Marksheets',        required: true,  hint: 'All semester/year marksheets. PDF format.' },
  { key: 'pg',             label: 'PG Degree & All Marksheets',        required: false, hint: 'PDF format.' },
  { key: 'phd',            label: 'Ph.D. Degree Certificate',          required: false, hint: 'Provisional acceptable. PDF format.' },
  { key: 'mphil',          label: 'M.Phil. Degree Certificate',        required: false, hint: 'PDF format.' },
  { key: 'net',            label: 'NET / SET / JRF Certificate',       required: false, hint: 'If applicable. PDF format.' },
  { key: 'gate',           label: 'GATE Score Card',                   required: false, hint: 'If applicable. PDF format.' },
  { key: 'apptLetter',     label: 'Appointment Letter',                required: true,  hint: 'Current institution. PDF format.' },
  { key: 'experienceCert', label: 'Experience Certificates (Previous)',required: false, hint: 'All previous employers. PDF format.' },
  { key: 'casteCert',      label: 'Caste / Category Certificate',      required: false, hint: 'OBC / SC / ST / EWS if applicable. PDF format.' },
  { key: 'disabilityCert', label: 'Disability Certificate',            required: false, hint: 'If applicable. PDF format.' },
  { key: 'publications',   label: 'Publications List (PDF)',            required: false, hint: 'With DOI / links. PDF format.' },
  { key: 'noc',            label: 'No-Objection Certificate (NOC)',     required: false, hint: 'If applicable. PDF format.' },
];

export default function Documents({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div>
      <Note>
        Please upload your documents below. All files should be in <strong>PDF format</strong> (except for your photograph and signature, which can be images). Ensure the file size is optimized before uploading.
      </Note>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DOC_LIST.map(doc => (
          <div key={doc.key} className="list-item-card" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, alignItems: 'center', padding: '12px 16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.855rem', fontWeight: 500 }}>
                <FileText size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                {doc.label}
                {doc.required && <span style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 700 }}>*</span>}
              </div>
              {doc.hint && <p className="form-hint" style={{ marginTop: 3 }}>{doc.hint}</p>}
            </div>
            
            <div>
              <input
                type="file"
                accept={doc.key === 'photo' || doc.key === 'signature' ? "image/*,.pdf" : ".pdf"}
                className="form-input"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) s(doc.key, file.name);
                }}
                style={{ fontSize: '0.82rem', padding: '6px' }}
              />
              {data[doc.key] && (
                <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> 
                  <span style={{ fontWeight: 500, color: 'var(--primary-dark)' }}>{data[doc.key]}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="form-hint" style={{ marginTop: 14 }}>
        Fields marked <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span> are mandatory for profile verification.
      </p>
    </div>
  );
}
