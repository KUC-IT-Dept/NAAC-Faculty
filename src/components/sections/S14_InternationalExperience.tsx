import { useState } from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, Globe, AlertCircle } from 'lucide-react';
import { fg, inp, sel, yearSel, pv } from './sectionUtils';

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

const PURPOSE_OPTS = ['Research Visit', 'Post-Doctoral', 'Teaching', 'Conference', 'Collaborative Project', 'Industrial Visit', 'Other'];

export default function InternationalExperience({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const s = (d: any[]) => onChange(d);
  const upd = (i: number, k: string, v: string) => {
    const a = [...data];
    a[i] = { ...a[i], [k]: v };
    s(a);
  };

  const toggleExpand = (idx: number) => {
    const newSet = new Set(expandedIndices);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setExpandedIndices(newSet);
  };

  const isComplete = (e: any) => !!(e.country && e.purpose && e.year && e.institution);

  const handleSavePending = () => {
    if (!pendingItem) return;
    if (isComplete(pendingItem)) {
      s([pendingItem, ...data]);
      setPendingItem(null);
      setErrorMsg(null);
    } else {
      setErrorMsg("Please enter Country, Purpose, Year, and Institution.");
    }
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const item = data[editingIndex];
    if (isComplete(item)) {
      setEditingIndex(null);
      setErrorMsg(null);
    } else {
      setErrorMsg("Required fields are missing.");
    }
  };

  return (
    <div className="section-container">
      <div className="section-header-actions" style={{ marginBottom: 16 }}>
        <h5 style={{ margin: 0 }}></h5>
        <button
          type="button"
          onClick={() => { setPendingItem({ ...EMPTY }); setErrorMsg(null); }}
          disabled={pendingItem !== null || editingIndex !== null}
          style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
        >
          <Plus size={16} /> Add Experience
        </button>
      </div>

      <div className="items-list">
        {pendingItem && (
          <div className="list-item-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={20} /> New Experience
              </h3>
              <div>
                <button
                  type="button"
                  onClick={() => { setPendingItem(null); setErrorMsg(null); }}
                  style={{ padding: '6px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', marginRight: '8px', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePending}
                  style={{ padding: '6px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500 }}
                >
                  Save Experience
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 16, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            <div className="form-row form-row-2">
              {fg('Country *', sel(pendingItem.country, v => setPendingItem({ ...pendingItem, country: v }), COUNTRIES))}
              {fg('Purpose *', sel(pendingItem.purpose, v => setPendingItem({ ...pendingItem, purpose: v }), PURPOSE_OPTS))}
            </div>
            {fg('Institution / University *', inp(pendingItem.institution, v => setPendingItem({ ...pendingItem, institution: v })))}
            <div className="form-row form-row-3">
              {fg('Duration', inp(pendingItem.duration, v => setPendingItem({ ...pendingItem, duration: v })))}
              {fg('Year *', yearSel(pendingItem.year, v => setPendingItem({ ...pendingItem, year: v })))}
              {fg('Funding Source', inp(pendingItem.fundingSource, v => setPendingItem({ ...pendingItem, fundingSource: v })))}
            </div>
          </div>
        )}

        {data.map((e, i) => {
          const isEdit = editingIndex === i;
          const isExpanded = expandedIndices.has(i);
          return (
            <div key={i} className="list-item-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {isEdit ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>Edit Experience</h3>
                    <div>
                      <button
                        type="button"
                        onClick={() => { setEditingIndex(null); setErrorMsg(null); }}
                        style={{ padding: '6px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', marginRight: '8px', fontWeight: 500 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        style={{ padding: '6px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500 }}
                      >
                        Save Experience
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 16, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                      <AlertCircle size={14} /> {errorMsg}
                    </div>
                  )}

                  <div className="form-row form-row-2">
                    {fg('Country *', sel(e.country, v => upd(i, 'country', v), COUNTRIES))}
                    {fg('Purpose *', sel(e.purpose, v => upd(i, 'purpose', v), PURPOSE_OPTS))}
                  </div>
                  {fg('Institution / University *', inp(e.institution, v => upd(i, 'institution', v)))}
                  <div className="form-row form-row-3">
                    {fg('Duration', inp(e.duration, v => upd(i, 'duration', v)))}
                    {fg('Year *', yearSel(e.year, v => upd(i, 'year', v)))}
                    {fg('Funding Source', inp(e.fundingSource, v => upd(i, 'fundingSource', v)))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleExpand(i)}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                        {e.country ? `${e.country} — ${e.purpose}` : `Experience ${i + 1}`}
                        {e.institution && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>— {e.institution}</span>}
                        {e.year && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>({e.year})</span>}
                      </h3>
                      {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => { setEditingIndex(i); setErrorMsg(null); }}
                        style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => s(data.filter((_, j) => j !== i))}
                        style={{ marginLeft: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                      <div style={{ marginBottom: '16px' }}>{pv('Institution', e.institution)}</div>
                      <div className="form-row form-row-3">
                        {pv('Duration', e.duration)}
                        {pv('Year', e.year)}
                        {pv('Funding', e.fundingSource)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
