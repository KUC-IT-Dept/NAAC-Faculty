import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useState } from 'react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { country: '', purpose: '', institution: '', duration: '', year: '', fundingSource: '' };

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe',
  'Other'
];

export default function InternationalExperience({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedPreview, setExpandedPreview] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };

  const handleAddNew = () => {
    onChange([{ ...EMPTY }, ...data]);
    setEditingIndex(0);
    setExpandedPreview(true);
    setErrorMsg(null);
  };

  const handleDelete = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
    setErrorMsg(null);
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  };

  const handleDone = (index: number) => {
    const item = data[index];
    if (!item.country?.trim() || !item.purpose?.trim()) {
      setErrorMsg("Please fill in the required fields: Country and Purpose.");
      return;
    }
    setErrorMsg(null);
    setEditingIndex(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
        <button 
          type="button" 
          className="btn btn-primary btn-sm" 
          onClick={handleAddNew}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={15} /> Add International Experience
        </button>
      </div>

      <div>
        {data.length === 0 ? (
          <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>No international experience added yet.</p>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <div 
              onClick={() => setExpandedPreview(!expandedPreview)}
              style={{
                padding: '12px 16px',
                background: 'rgba(28, 53, 87, 0.05)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(28, 53, 87, 0.1)',
                marginBottom: expandedPreview ? 16 : 0
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                  International Experience ({data.length})
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                  {data.filter(d => d.country).length} of {data.length} entries filled
                </p>
              </div>
              {expandedPreview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {expandedPreview && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.map((e, i) => (
                  <div key={i} style={{
                    padding: '12px 16px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    position: 'relative'
                  }}>
                    {editingIndex === i ? (
                      <div>
                        <div className="form-row form-row-2">
                          {fg('Country *', sel(e.country, v => upd(i, 'country', v), COUNTRIES))}
                          {fg('Purpose *', sel(e.purpose, v => upd(i, 'purpose', v), ['Research Visit', 'Post-Doctoral', 'Teaching', 'Conference', 'Collaborative Project', 'Industrial Visit', 'Other']))}
                        </div>
                        {fg('Institution / University / Organization', inp(e.institution, v => upd(i, 'institution', v)))}
                        <div className="form-row form-row-3">
                          {fg('Duration', inp(e.duration, v => upd(i, 'duration', v), '3 months / 1 week'))}
                          {fg('Year', sel(e.year, v => upd(i, 'year', v), Array.from({ length: 50 }, (_, idx) => (new Date().getFullYear() - idx).toString())))}
                          {fg('Funding Source', inp(e.fundingSource, v => upd(i, 'fundingSource', v), 'DST / DAAD / Self'))}
                        </div>

                        {errorMsg && editingIndex === i && (
                          <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 8, textAlign: 'right' }}>
                            {errorMsg}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                          <button 
                            type="button" 
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDelete(i)}
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleDone(i)}
                          >
                            <Save size={14} /> Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: 4 }}>
                            {e.purpose ? `${e.purpose} in ${e.country}` : (e.country || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Untitled Experience</span>)}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              type="button" 
                              onClick={() => {
                                setEditingIndex(i);
                                setErrorMsg(null);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: 0 }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDelete(i)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: 0 }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                          {e.institution && (
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: 'var(--text-light)', marginRight: 4 }}>Institution:</span>
                              <span style={{ fontWeight: 500 }}>{e.institution}</span>
                            </div>
                          )}
                          {e.year && (
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: 'var(--text-light)', marginRight: 4 }}>Year:</span>
                              <span style={{ fontWeight: 500 }}>{e.year}</span>
                            </div>
                          )}
                          {e.duration && (
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: 'var(--text-light)', marginRight: 4 }}>Duration:</span>
                              <span style={{ fontWeight: 500 }}>{e.duration}</span>
                            </div>
                          )}
                          {e.fundingSource && (
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: 'var(--text-light)', marginRight: 4 }}>Funding Source:</span>
                              <span style={{ fontWeight: 500 }}>{e.fundingSource}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
