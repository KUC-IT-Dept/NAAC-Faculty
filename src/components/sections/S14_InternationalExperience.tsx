import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { fg, inp, sel, FileInp, yearSel } from './sectionUtils';

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

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };

function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function PreviewCard({ item, onEdit, onDelete, disabled }: { item: any; onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{item.year || '—'}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {item.country ? `${item.country} - ${item.purpose}` : 'Untitled Experience'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {item.institution && <span className="badge badge-secondary">{item.institution}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
          <button type="button" style={btnEdit} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {expanded ? 'Hide' : 'View'}
          </button>
          <button type="button" style={btnEdit} onClick={(e) => { e.stopPropagation(); onEdit(); }} disabled={disabled}>
            <Edit2 size={14} /> Edit
          </button>
          <button type="button" style={btnDelete} onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={disabled}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <PreviewRow label="Country" value={item.country} />
          <PreviewRow label="Purpose" value={item.purpose} />
          <PreviewRow label="Institution" value={item.institution} />
          <PreviewRow label="Duration" value={item.duration} />
          <PreviewRow label="Year" value={item.year} />
          <PreviewRow label="Funding Source" value={item.fundingSource} />
        </div>
      )}
    </>
  );
}

export default function InternationalExperience({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [pendingNewItem, setPendingNewItem] = useState<any>(null);
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };

  const isItemComplete = (item: any) => item.country && item.purpose && item.year && item.institution;

  const handleAdd = () => {
    setPendingNewItem({ ...EMPTY });
  };

  const handleSavePending = (item: any) => {
    if (isItemComplete(item)) {
      const updated = [item, ...data];
      updated.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
      onChange(updated);
      setPendingNewItem(null);
    }
  };

  const sortedData = [...data].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  return (
    <>
      <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
        <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>International Experience</h5>
        <button
          type="button"
          onClick={handleAdd}
          disabled={pendingNewItem !== null || editingItemIndex !== null}
          style={{ ...btnAdd, flexShrink: 0 }}
        >
          <Plus size={16} /> Add Experience
        </button>
      </div>

      {sortedData.length === 0 && (
        <div className="empty-state">No international experience added yet. Click Add Experience to get started.</div>
      )}

      <div className="items-list">
        {pendingNewItem && (
          <div key="pending" className="list-item-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Experience</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleSavePending(pendingNewItem)}
                  disabled={!isItemComplete(pendingNewItem)}
                  style={isItemComplete(pendingNewItem) ? btnSave : { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' }}
                >
                  <Check size={14} /> Save
                </button>
                <button type="button" onClick={() => setPendingNewItem(null)} style={btnCancel}>
                  Cancel
                </button>
              </div>
            </div>
            <div className="form-row form-row-2">
              {fg('Country *', sel(pendingNewItem.country, v => setPendingNewItem({ ...pendingNewItem, country: v }), COUNTRIES))}
              {fg('Purpose *', sel(pendingNewItem.purpose, v => setPendingNewItem({ ...pendingNewItem, purpose: v }), PURPOSE_OPTS))}
            </div>
            {fg('Institution / University *', inp(pendingNewItem.institution, v => setPendingNewItem({ ...pendingNewItem, institution: v })))}
            <div className="form-row form-row-3">
              {fg('Duration', inp(pendingNewItem.duration, v => setPendingNewItem({ ...pendingNewItem, duration: v })))}
              {fg('Year *', yearSel(pendingNewItem.year, v => setPendingNewItem({ ...pendingNewItem, year: v })))}
              {fg('Funding Source', inp(pendingNewItem.fundingSource, v => setPendingNewItem({ ...pendingNewItem, fundingSource: v })))}
            </div>
          </div>
        )}

        {sortedData.map((item, i) => {
          const itemIsEditing = editingItemIndex === i;
          return (
            <div key={i} className="list-item-card">
              {itemIsEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Experience</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setEditingItemIndex(null)} style={btnSave}>
                        <Check size={14} /> Done
                      </button>
                      <button type="button" onClick={() => { onChange(sortedData.filter((_, j) => j !== i)); setEditingItemIndex(null); }} style={btnDelete}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Country *', sel(item.country, v => upd(i, 'country', v), COUNTRIES))}
                    {fg('Purpose *', sel(item.purpose, v => upd(i, 'purpose', v), PURPOSE_OPTS))}
                  </div>
                  {fg('Institution / University *', inp(item.institution, v => upd(i, 'institution', v)))}
                  <div className="form-row form-row-3">
                    {fg('Duration', inp(item.duration, v => upd(i, 'duration', v)))}
                    {fg('Year *', yearSel(item.year, v => upd(i, 'year', v)))}
                    {fg('Funding Source', inp(item.fundingSource, v => upd(i, 'fundingSource', v)))}
                  </div>
                </>
              ) : (
                <PreviewCard
                  item={item}
                  onEdit={() => setEditingItemIndex(i)}
                  onDelete={() => onChange(sortedData.filter((_, j) => j !== i))}
                  disabled={pendingNewItem !== null}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
