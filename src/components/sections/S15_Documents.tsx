import { FileText, CheckCircle2 } from 'lucide-react';
import { Note } from './sectionUtils';

const DOC_LIST = [
  { key: 'photo',          label: 'Passport-size Photograph',        required: true,  hint: 'Recent, clear. JPEG/PNG, max 200KB.' },
  { key: 'signature',      label: 'Signature',                        required: true,  hint: 'Scanned on white background.' },
  { key: 'aadhar',         label: 'Aadhaar Card',                     required: true,  hint: 'Both sides, self-attested.' },
  { key: 'pan',            label: 'PAN Card',                         required: false, hint: '' },
  { key: 'ssc',            label: 'SSC / 10th Marksheet',             required: true,  hint: '' },
  { key: 'hsc',            label: 'HSC / 12th Marksheet',             required: true,  hint: '' },
  { key: 'ug',             label: 'UG Degree & All Marksheets',        required: true,  hint: 'All semester/year marksheets.' },
  { key: 'pg',             label: 'PG Degree & All Marksheets',        required: false, hint: '' },
  { key: 'phd',            label: 'Ph.D. Degree Certificate',          required: false, hint: 'Provisional acceptable.' },
  { key: 'mphil',          label: 'M.Phil. Degree Certificate',        required: false, hint: '' },
  { key: 'net',            label: 'NET / SET / JRF Certificate',       required: false, hint: 'If applicable.' },
  { key: 'gate',           label: 'GATE Score Card',                   required: false, hint: 'If applicable.' },
  { key: 'apptLetter',     label: 'Appointment Letter',                required: true,  hint: 'Current institution.' },
  { key: 'experienceCert', label: 'Experience Certificates (Previous)',required: false, hint: 'All previous employers.' },
  { key: 'casteCert',      label: 'Caste / Category Certificate',      required: false, hint: 'OBC / SC / ST / EWS if applicable.' },
  { key: 'disabilityCert', label: 'Disability Certificate',            required: false, hint: 'If applicable.' },
  { key: 'publications',   label: 'Publications List (PDF)',            required: false, hint: 'With DOI / links.' },
  { key: 'noc',            label: 'No-Objection Certificate (NOC)',     required: false, hint: 'If applicable.' },
];

export default function Documents({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div>
      <Note>
        File upload is coming soon. For now, paste a <strong>Google Drive / OneDrive / Dropbox</strong> shared link for each document. Set sharing to <em>"Anyone with the link can view"</em>.
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
              {data[doc.key] && (
                <div style={{ marginTop: 3, fontSize: '0.72rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={11} /> Link saved
                </div>
              )}
            </div>
            <input
              className="form-input"
              placeholder="Paste Google Drive / OneDrive link..."
              value={data[doc.key] || ''}
              onChange={e => s(doc.key, e.target.value)}
              style={{ fontSize: '0.82rem' }}
            />
          </div>
        ))}
      </div>

      <p className="form-hint" style={{ marginTop: 14 }}>
        Fields marked <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span> are mandatory for profile verification.
      </p>
    </div>
  );
}
