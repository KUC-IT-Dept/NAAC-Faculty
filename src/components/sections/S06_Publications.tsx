import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { fg, inp, sel, FileInp, DropdownWithCustom } from './sectionUtils';

/* â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
type Publication = {
  type: string;
  title: string;
  authors: string;
  authorRole: string;
  journal: string;
  year: string;
  volume: string;
  issue: string;
  issn: string;
  isbn: string;
  pages: string;
  impactFactor: string;
  indexedIn: string;
  peerReviewed: string;
  doi: string;
  level: string;
  presentationType: string;
  venue: string;
  conferenceDates: string;
  documentUrl: string;
  editors: string;
  bookType: string;
  organizedBy: string;
  publishedInProceedings: string;
  isEditing?: boolean;
};

const EMPTY: Publication = {
  type: 'Journal Articles', title: '', authors: '', authorRole: '', journal: '',
  year: '', volume: '', issue: '', issn: '', isbn: '', pages: '',
  impactFactor: '', indexedIn: '', peerReviewed: '', doi: '', level: '',
  presentationType: '', venue: '', conferenceDates: '', documentUrl: '',
  editors: '', bookType: '', organizedBy: '', publishedInProceedings: '',
  isEditing: true
};

const PUB_TYPES = ['Journal Articles', 'Book Chapters', 'Books Authored / Edited', 'Conference Papers'];
const INDEX_OPTS = ['SCI', 'Scopus', 'UGC-CARE', 'Web of Science', 'Others'];
const BOOK_TYPES = ['Authored', 'Edited', 'Co-authored'];
const LEVELS = ['National', 'International'];
const YES_NO = ['Yes', 'No'];

const currentYear = new Date().getFullYear();
const YEAR_OPTS: string[] = [];
for (let y = currentYear; y >= 1970; y--) YEAR_OPTS.push(String(y));

const VOLUME_OPTS: string[] = Array.from({ length: 50 }, (_, i) => String(i + 1));
const ISSUE_OPTS: string[] = Array.from({ length: 12 }, (_, i) => String(i + 1));
const PAGES_OPTS: string[] = ['1â€“5', '1â€“8', '1â€“10', '1â€“12', '1â€“15', '1â€“20', '100â€“110'];

/* â”€â”€â”€ Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function PubForm({ item, onChange }: {
  item: Publication;
  onChange: (k: keyof Publication, v: string) => void;
}) {
  const t = item.type;

  return (
    <>
      <div className="form-row form-row-3">
        {fg('Publication Type *', sel(item.type, v => onChange('type', v), PUB_TYPES))}
      </div>

      {t === 'Journal Articles' && (
        <>
          <div className="form-row form-row-2">
            {fg('Title of Paper *', inp(item.title, v => onChange('title', v)))}
            {fg('Journal Name *', inp(item.journal, v => onChange('journal', v)))}
          </div>
          <div className="form-row form-row-3">
            {fg('ISSN Number', inp(item.issn, v => onChange('issn', v)))}
            {fg('Year of Publication *',
              <select className="form-select" value={item.year} onChange={e => onChange('year', e.target.value)}>
                <option value="">â€” Year â€”</option>
                {YEAR_OPTS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            {fg('Indexed In',
              <DropdownWithCustom v={item.indexedIn} fn={v => onChange('indexedIn', v)} opts={INDEX_OPTS} ph="Select..." />
            )}
          </div>
          <div className="form-row form-row-4">
            {fg('Volume', <DropdownWithCustom v={item.volume} fn={v => onChange('volume', v)} opts={VOLUME_OPTS} ph="Vol" />)}
            {fg('Issue', <DropdownWithCustom v={item.issue} fn={v => onChange('issue', v)} opts={ISSUE_OPTS} ph="Issue" />)}
            {fg('Pages', <DropdownWithCustom v={item.pages} fn={v => onChange('pages', v)} opts={PAGES_OPTS} ph="Pages" />)}
            {fg('Impact Factor', inp(item.impactFactor, v => onChange('impactFactor', v)))}
          </div>
          <div className="form-row form-row-2">
            {fg('Co-authors', inp(item.authors, v => onChange('authors', v)))}
            {fg('DOI / Link', inp(item.doi, v => onChange('doi', v)))}
          </div>
        </>
      )}

      {t === 'Book Chapters' && (
        <>
          <div className="form-row form-row-2">
            {fg('Chapter Title *', inp(item.title, v => onChange('title', v)))}
            {fg('Book Title *', inp(item.journal, v => onChange('journal', v)))}
          </div>
          <div className="form-row form-row-3">
            {fg('Publisher', inp(item.organizedBy, v => onChange('organizedBy', v)))}
            {fg('ISBN', inp(item.isbn, v => onChange('isbn', v)))}
            {fg('Year *',
              <select className="form-select" value={item.year} onChange={e => onChange('year', e.target.value)}>
                <option value="">â€” Year â€”</option>
                {YEAR_OPTS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>
          {fg('Editors', inp(item.editors, v => onChange('editors', v)))}
        </>
      )}

      {t === 'Books Authored / Edited' && (
        <>
          <div className="form-row form-row-2">
            {fg('Book Title *', inp(item.title, v => onChange('title', v)))}
            {fg('Publisher *', inp(item.organizedBy, v => onChange('organizedBy', v)))}
          </div>
          <div className="form-row form-row-3">
            {fg('ISBN', inp(item.isbn, v => onChange('isbn', v)))}
            {fg('Year *',
              <select className="form-select" value={item.year} onChange={e => onChange('year', e.target.value)}>
                <option value="">â€” Year â€”</option>
                {YEAR_OPTS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            {fg('Type', sel(item.bookType, v => onChange('bookType', v), BOOK_TYPES))}
          </div>
        </>
      )}

      {t === 'Conference Papers' && (
        <>
          <div className="form-row form-row-2">
            {fg('Paper Title *', inp(item.title, v => onChange('title', v)))}
            {fg('Conference Name *', inp(item.journal, v => onChange('journal', v)))}
          </div>
          <div className="form-row form-row-3">
            {fg('National / International', sel(item.level, v => onChange('level', v), LEVELS))}
            {fg('Organized by', inp(item.organizedBy, v => onChange('organizedBy', v)))}
            {fg('Published in Proceedings', sel(item.publishedInProceedings, v => onChange('publishedInProceedings', v), YES_NO))}
          </div>
          <div className="form-row form-row-2">
            {fg('Venue (City, Country)', inp(item.venue, v => onChange('venue', v)))}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                {fg('From Date',
                  <input type="date" className="form-input" value={item.conferenceDates?.split('|')[0] ?? ''}
                    onChange={e => onChange('conferenceDates', `${e.target.value}|${item.conferenceDates?.split('|')[1] ?? ''}`)} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                {fg('To Date',
                  <input type="date" className="form-input" value={item.conferenceDates?.split('|')[1] ?? ''}
                    onChange={e => onChange('conferenceDates', `${item.conferenceDates?.split('|')[0] ?? ''}|${e.target.value}`)} />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* File upload */}
      <div style={{ marginTop: 10 }}>
        {fg('Certificate / Proof / Link', <FileInp v={item.documentUrl} fn={v => onChange('documentUrl', v)} label="Upload Document" />)}
      </div>
    </>
  );
}

/* ─── Shared Button Styles ───────────────────────────────────── */
const btnStyles = {
  add: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#4f46e5', color: '#ffffff',
    padding: '8px 16px', borderRadius: '6px',
    fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer'
  } as React.CSSProperties,
  edit: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#f8fafc', color: '#334155',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer'
  } as React.CSSProperties,
  delete: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#fff1f2', color: '#be123c',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer'
  } as React.CSSProperties,
  save: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#10b981', color: '#ffffff',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer'
  } as React.CSSProperties,
  saveDisabled: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#d1fae5', color: '#6ee7b7',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'not-allowed'
  } as React.CSSProperties,
  cancel: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#f1f5f9', color: '#475569',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer'
  } as React.CSSProperties,
};

/* ─── Structured Preview ─────────────────────────────────────── */
function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  );
}

function PreviewDetails({ p }: { p: Publication }) {
  const t = p.type;

  const citationParts = [
    p.volume && `Vol. ${p.volume}`,
    p.issue && `No. ${p.issue}`,
    p.pages && `pp. ${p.pages}`,
  ].filter(Boolean).join(', ');

  const dateFmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const confDates = p.conferenceDates ? [dateFmt(p.conferenceDates.split('|')[0]), dateFmt(p.conferenceDates.split('|')[1])].filter(Boolean).join(' → ') : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {t === 'Journal Articles' && (
        <>
          <PreviewRow label="Title of Paper" value={p.title} />
          <PreviewRow label="Journal Name" value={p.journal} />
          <PreviewRow label="ISSN Number" value={p.issn} />
          <PreviewRow label="Vol, Issue, Pages" value={citationParts} />
          <PreviewRow label="Indexed In" value={p.indexedIn} />
          <PreviewRow label="Impact Factor" value={p.impactFactor} />
          <PreviewRow label="Co-authors" value={p.authors} />
          <PreviewRow label="DOI / Link" value={p.doi} />
        </>
      )}

      {t === 'Book Chapters' && (
        <>
          <PreviewRow label="Chapter Title" value={p.title} />
          <PreviewRow label="Book Title" value={p.journal} />
          <PreviewRow label="Publisher" value={p.organizedBy} />
          <PreviewRow label="ISBN" value={p.isbn} />
          <PreviewRow label="Editors" value={p.editors} />
        </>
      )}

      {t === 'Books Authored / Edited' && (
        <>
          <PreviewRow label="Book Title" value={p.title} />
          <PreviewRow label="Publisher" value={p.organizedBy} />
          <PreviewRow label="ISBN" value={p.isbn} />
          <PreviewRow label="Type" value={p.bookType} />
        </>
      )}

      {t === 'Conference Papers' && (
        <>
          <PreviewRow label="Paper Title" value={p.title} />
          <PreviewRow label="Conference Name" value={p.journal} />
          <PreviewRow label="Venue & Date" value={[p.venue, confDates].filter(Boolean).join(' | ')} />
          <PreviewRow label="Organized by" value={p.organizedBy} />
          <PreviewRow label="In Proceedings" value={p.publishedInProceedings} />
        </>
      )}

      {p.documentUrl && (
        <div style={{ marginTop: 8 }}>
          <a
            href={`${import.meta.env.VITE_API_URL || ''}${p.documentUrl}`}
            target="_blank" rel="noreferrer"
            className="preview-file-link"
          >
            <ExternalLink size={13} /> View Proof
          </a>
        </div>
      )}
    </div>
  );
}

function PreviewCard({
  p,
  i,
  data,
  onChange,
  toggleEdit,
}: {
  p: Publication;
  i: number;
  data: Publication[];
  onChange: (d: Publication[]) => void;
  toggleEdit: (i: number, state: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{
            minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8,
            background: 'var(--primary, #2563eb)', flexShrink: 0,
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{p.year || '—'}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {p.title || 'Untitled Publication'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-secondary">{p.type}</span>
              {p.type === 'Conference Papers' && p.level && <span className="badge badge-secondary">{p.level}</span>}
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.journal || p.organizedBy}</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
          <button type="button" style={btnStyles.edit} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide' : 'View'}
          </button>
          <button type="button" style={btnStyles.edit} onClick={(e) => { e.stopPropagation(); toggleEdit(i, true); }}>
            <Edit2 size={14} /> Edit
          </button>
          <button type="button" style={btnStyles.delete} onClick={(e) => { e.stopPropagation(); onChange(data.filter((_, idx) => idx !== i)); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <PreviewDetails p={p} />
        </div>
      )}
    </>
  );
}

/* ─── Summary Banner ─────────────────────────────────────────── */
function SummaryBanner({ data }: { data: Publication[] }) {
  const counts: Record<string, number> = {
    'Journal Articles': 0, 'Conference Papers': 0, 'Books Authored / Edited': 0, 'Book Chapters': 0
  };
  data.forEach(p => { if (counts[p.type] !== undefined) counts[p.type]++; });

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16,
      padding: '10px 14px', borderRadius: 10,
      background: 'var(--surface-alt, #f8fafc)', border: '1px solid var(--border, #e2e8f0)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
        <BookOpen size={15} style={{ color: 'var(--primary, #2563eb)' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
          Total: {data.length}
        </span>
      </div>
      {([
        ['Journal Articles', 'Journals'],
        ['Conference Papers', 'Conferences'],
        ['Books Authored / Edited', 'Books'],
        ['Book Chapters', 'Chapters']
      ] as [string, string][]).map(([key, label]) => (
        <div key={key} style={{
          fontSize: 12, padding: '3px 10px', borderRadius: 20,
          background: counts[key] > 0 ? 'var(--primary, #2563eb)' : '#f1f5f9',
          color: counts[key] > 0 ? '#ffffff' : 'var(--text-muted)',
          fontWeight: 600,
        }}>
          {label}: {counts[key] || 0}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function Publications({
  data,
  onChange,
}: {
  data: Publication[];
  onChange: (d: Publication[]) => void;
}) {

  const upd = (i: number, k: keyof Publication, v: string) => {
    const arr = [...data];
    arr[i] = { ...arr[i], [k]: v };
    onChange(arr);
  };

  const toggleEdit = (i: number, state: boolean) => {
    const arr = [...data];
    arr[i] = { ...arr[i], isEditing: state };
    if (!state) {
      arr.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
    }
    onChange(arr);
  };

  const isComplete = (p: Publication) => !!(p.title && p.type);

  return (
    <>
      <div style={{ marginBottom: 4 }}>
        {data.length > 0 && <SummaryBanner data={data} />}
      </div>

      <div className="section-header-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          style={btnStyles.add}
          onClick={() => onChange([{ ...EMPTY }, ...data])}
        >
          <Plus size={16} /> Add Publication
        </button>
      </div>

      {data.length === 0 && (
        <div className="empty-state">
          No publications added yet. Click <strong>Add Publication</strong> to get started.
        </div>
      )}

      <div className="items-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.map((p, i) => (
          <div key={i} className={`item-card ${p.isEditing ? 'is-editing' : 'is-preview'}`}>
            {p.isEditing ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                    {!p.title ? 'New Publication' : 'Editing Publication'}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      style={isComplete(p) ? btnStyles.save : btnStyles.saveDisabled}
                      disabled={!isComplete(p)}
                      title={!isComplete(p) ? 'Please fill in required fields' : 'Save entry'}
                      onClick={() => toggleEdit(i, false)}
                    >
                      <Check size={14} /> Save
                    </button>
                    <button
                      type="button" style={btnStyles.delete}
                      onClick={() => onChange(data.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
                <PubForm item={p} onChange={(k, v) => upd(i, k, v)} />
              </>
            ) : (
              <PreviewCard
                p={p}
                i={i}
                data={data}
                onChange={onChange}
                toggleEdit={toggleEdit}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
