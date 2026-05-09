import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink, BookOpen } from 'lucide-react';
import { fg, inp, sel, FileInp, DropdownWithCustom } from './sectionUtils';

/* ─── Types ──────────────────────────────────────────────────── */
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
};

const EMPTY: Publication = {
  type: 'Journal Articles', title: '', authors: '', authorRole: '', journal: '',
  year: '', volume: '', issue: '', issn: '', isbn: '', pages: '',
  impactFactor: '', indexedIn: '', peerReviewed: '', doi: '', level: '',
  presentationType: '', venue: '', conferenceDates: '', documentUrl: '',
  editors: '', bookType: '', organizedBy: '', publishedInProceedings: ''
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
const PAGES_OPTS: string[] = ['1–5', '1–8', '1–10', '1–12', '1–15', '1–20', '100–110'];

/* ─── Form ───────────────────────────────────────────────────── */
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
                <option value="">— Year —</option>
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
                <option value="">— Year —</option>
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
                <option value="">— Year —</option>
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

function PubPreview({ p }: { p: Publication }) {
  const t = p.type;

  const citationParts = [
    p.volume && `Vol. ${p.volume}`,
    p.issue && `No. ${p.issue}`,
    p.pages && `pp. ${p.pages}`,
  ].filter(Boolean).join(', ');

  const dateFmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const confDates = p.conferenceDates ? [dateFmt(p.conferenceDates.split('|')[0]), dateFmt(p.conferenceDates.split('|')[1])].filter(Boolean).join(' → ') : '';

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* Left: year badge */}
      <div style={{
        minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8,
        background: 'var(--primary-light, #eff6ff)', flexShrink: 0,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary, #2563eb)', lineHeight: 1 }}>{p.year || '—'}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
      </div>

      {/* Right: details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Type badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span className="badge badge-secondary" style={{ flexShrink: 0 }}>{p.type}</span>
          {t === 'Conference Papers' && p.level && <span className="badge badge-secondary" style={{ flexShrink: 0 }}>{p.level}</span>}
        </div>

        {/* Structured rows */}
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
        </div>

        {/* Proof link */}
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
    </div>
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
          background: counts[key] > 0 ? 'var(--primary-light, #eff6ff)' : '#f1f5f9',
          color: counts[key] > 0 ? 'var(--primary, #2563eb)' : 'var(--text-muted)',
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingItem, setPendingItem] = useState<Publication | null>(null);

  const upd = (i: number, k: keyof Publication, v: string) => {
    const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a);
  };

  const sorted = [...data].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  const isComplete = (p: Publication) => !!(p.title && p.type);

  return (
    <>
      <div style={{ marginBottom: 4 }}>
        {data.length > 0 && <SummaryBanner data={data} />}
      </div>

      <div className="section-header-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setPendingItem({ ...EMPTY })}
          disabled={pendingItem !== null || editingIndex !== null}
        >
          <Plus size={14} /> Add Publication
        </button>
      </div>

      {sorted.length === 0 && !pendingItem && (
        <div className="empty-state">
          No publications added yet. Click <strong>Add Publication</strong> to get started.
        </div>
      )}

      <div className="items-list">
        {/* ── Pending new item at top ── */}
        {pendingItem && (
          <div className="item-card is-editing">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Publication</span>
              <div>
                <button
                  type="button" className="btn btn-success btn-xs"
                  disabled={!isComplete(pendingItem)}
                  onClick={() => {
                    const updated = [pendingItem, ...data];
                    updated.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
                    onChange(updated);
                    setPendingItem(null);
                  }}
                >
                  <Check size={12} /> Save
                </button>
                <button
                  type="button" className="btn btn-ghost btn-xs"
                  style={{ marginLeft: 8 }}
                  onClick={() => setPendingItem(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
            <PubForm item={pendingItem} onChange={(k, v) => setPendingItem({ ...pendingItem, [k]: v })} />
          </div>
        )}

        {/* ── Saved items (year-sorted) ── */}
        {sorted.map((p, i) => {
          const isEdit = editingIndex === i;
          return (
            <div key={i} className={`item-card ${isEdit ? 'is-editing' : 'is-preview'}`}>
              {isEdit ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Publication</span>
                    <div>
                      <button
                        type="button" className="btn btn-success btn-xs"
                        onClick={() => {
                          const updated = [...data];
                          updated.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
                          onChange(updated);
                          setEditingIndex(null);
                        }}
                      >
                        <Check size={12} /> Done
                      </button>
                      <button
                        type="button" className="btn btn-danger btn-xs"
                        style={{ marginLeft: 8 }}
                        onClick={() => { onChange(sorted.filter((_, j) => j !== i)); setEditingIndex(null); }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                  <PubForm item={p} onChange={(k, v) => upd(i, k, v)} />
                </>
              ) : (
                <>
                  <PubPreview p={p} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                    <button
                      type="button" className="btn btn-ghost btn-xs"
                      onClick={() => setEditingIndex(i)}
                      disabled={pendingItem !== null}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      type="button" className="btn btn-danger btn-xs"
                      onClick={() => onChange(sorted.filter((_, j) => j !== i))}
                      disabled={pendingItem !== null}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
