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
};

/* ─── Constants ──────────────────────────────────────────────── */
const EMPTY: Publication = {
  type: 'journal', title: '', authors: '', authorRole: '', journal: '',
  year: '', volume: '', issue: '', issn: '', isbn: '', pages: '',
  impactFactor: '', indexedIn: '', peerReviewed: '', doi: '', level: '',
  presentationType: '', venue: '', conferenceDates: '', documentUrl: '',
};

const PUB_TYPES = ['journal', 'conference', 'book', 'bookChapter'];
const LEVELS = ['International', 'National', 'State', 'University'];
const AUTHOR_ROLES = ['Principal Author', 'Co-Author', 'Corresponding Author'];
const PEER_OPTS = ['Yes', 'No'];
const PRES_TYPES = ['Oral', 'Poster', 'Invited Talk', 'Keynote'];
const INDEX_OPTS = ['Scopus', 'Web of Science', 'UGC-CARE', 'PubMed', 'IEEE Xplore', 'Springer', 'Elsevier'];

const currentYear = new Date().getFullYear();
const YEAR_OPTS: string[] = [];
for (let y = currentYear; y >= 1980; y--) YEAR_OPTS.push(String(y));

// Volume 1–50
const VOLUME_OPTS: string[] = Array.from({ length: 50 }, (_, i) => String(i + 1));
// Issue 1–12
const ISSUE_OPTS: string[] = Array.from({ length: 12 }, (_, i) => String(i + 1));
// Common page-range patterns
const PAGES_OPTS: string[] = [
  '1–5', '1–8', '1–10', '1–12', '1–15', '1–20',
  '100–110', '200–215', '300–320', '400–420', '500–520',
];

const TYPE_LABEL: Record<string, string> = {
  journal: 'Journal Article', conference: 'Conference Paper',
  book: 'Book', bookChapter: 'Book Chapter',
};

function journalLabel(type: string) {
  if (type === 'conference') return 'Conference Name *';
  if (type === 'book') return 'Publisher *';
  if (type === 'bookChapter') return 'Book Title / Publisher *';
  return 'Journal Name *';
}

/* ─── Form ───────────────────────────────────────────────────── */
function PubForm({ item, onChange }: {
  item: Publication;
  onChange: (k: keyof Publication, v: string) => void;
}) {
  return (
    <>
      {/* Row 1 — Type / Level / Author Role */}
      <div className="form-row form-row-3">
        {fg('Type *', sel(item.type, v => onChange('type', v), PUB_TYPES))}
        {fg('Level', sel(item.level, v => onChange('level', v), LEVELS))}
        {fg('Author Role', sel(item.authorRole, v => onChange('authorRole', v), AUTHOR_ROLES))}
      </div>

      {/* Title */}
      {fg('Title *', inp(item.title, v => onChange('title', v), 'Full publication title'))}

      {/* Authors */}
      {fg('All Author(s)', inp(item.authors, v => onChange('authors', v), 'Sharma P., Kumar R., ...'))}

      {/* Journal / Conference / Publisher */}
      {fg(journalLabel(item.type), inp(item.journal, v => onChange('journal', v)))}

      {/* Row 2 — Year / Volume / Issue / Pages */}
      <div className="form-row form-row-4">
        {fg('Year *',
          <select className="form-select" value={item.year} onChange={e => onChange('year', e.target.value)}>
            <option value="">— Year —</option>
            {YEAR_OPTS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {fg('Volume',
          <DropdownWithCustom v={item.volume} fn={v => onChange('volume', v)}
            opts={VOLUME_OPTS} ph="Vol. no. or custom" />
        )}
        {fg('Issue',
          <DropdownWithCustom v={item.issue} fn={v => onChange('issue', v)}
            opts={ISSUE_OPTS} ph="Issue no. or custom" />
        )}
        {fg('Pages',
          <DropdownWithCustom v={item.pages} fn={v => onChange('pages', v)}
            opts={PAGES_OPTS} ph="e.g. 1–10" />
        )}
      </div>

      {/* Row 3 — ISSN/ISBN / Impact Factor / Indexed In */}
      <div className="form-row form-row-3">
        {fg('ISSN / ISBN', inp(item.issn, v => onChange('issn', v)))}
        {fg('Impact Factor', inp(item.impactFactor, v => onChange('impactFactor', v)))}
        {fg('Indexed In',
          <DropdownWithCustom v={item.indexedIn} fn={v => onChange('indexedIn', v)}
            opts={INDEX_OPTS} ph="Select or type index..." />
        )}
      </div>

      {/* Row 4 — Peer Reviewed / DOI */}
      <div className="form-row form-row-2">
        {fg('Peer Reviewed', sel(item.peerReviewed, v => onChange('peerReviewed', v), PEER_OPTS))}
        {fg('DOI / URL', inp(item.doi, v => onChange('doi', v), 'https://doi.org/...'))}
      </div>

      {/* Conference-only — Presentation Type / Venue / From Date / To Date */}
      {item.type === 'conference' && (
        <>
          <div className="form-row form-row-2">
            {fg('Presentation Type', sel(item.presentationType, v => onChange('presentationType', v), PRES_TYPES))}
            {fg('Venue (City, Country)', inp(item.venue, v => onChange('venue', v), 'e.g. Paris, France'))}
          </div>
          <div className="form-row form-row-2">
            {fg('Conference From Date',
              <input
                type="date"
                className="form-input"
                value={item.conferenceDates?.split('|')[0] ?? ''}
                onChange={e => {
                  const to = item.conferenceDates?.split('|')[1] ?? '';
                  onChange('conferenceDates', `${e.target.value}|${to}`);
                }}
              />
            )}
            {fg('Conference To Date',
              <input
                type="date"
                className="form-input"
                value={item.conferenceDates?.split('|')[1] ?? ''}
                onChange={e => {
                  const from = item.conferenceDates?.split('|')[0] ?? '';
                  onChange('conferenceDates', `${from}|${e.target.value}`);
                }}
              />
            )}
          </div>
        </>
      )}

      {/* File upload */}
      {fg('Certificate / Proof', <FileInp v={item.documentUrl} fn={v => onChange('documentUrl', v)} label="Upload PDF / Certificate" />)}
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
  const citationParts = [
    p.journal && `<em>${p.journal}</em>`,
    p.volume && `Vol. ${p.volume}`,
    p.issue && `No. ${p.issue}`,
    p.pages && `pp. ${p.pages}`,
  ].filter(Boolean).join(', ');

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
          <span className="badge badge-secondary" style={{ flexShrink: 0 }}>{TYPE_LABEL[p.type] ?? p.type}</span>
          {p.level && <span className="badge badge-secondary" style={{ flexShrink: 0 }}>{p.level}</span>}
        </div>

        {/* Structured rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <PreviewRow label="Title" value={p.title || 'Untitled'} />
          <PreviewRow label="Author(s)" value={p.authors} />
          <PreviewRow label="Author Role" value={p.authorRole} />
          <PreviewRow label="Journal / Venue" value={p.journal} />
          {citationParts && (
            <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
              <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>Citation</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)' }} dangerouslySetInnerHTML={{ __html: citationParts }} />
            </div>
          )}
          <PreviewRow label="ISSN / ISBN" value={p.issn} />
          <PreviewRow label="Impact Factor" value={p.impactFactor} />
          <PreviewRow label="Indexed In" value={p.indexedIn} />
          <PreviewRow label="Peer Reviewed" value={p.peerReviewed} />
          <PreviewRow label="DOI / URL" value={p.doi} />
          {p.type === 'conference' && (() => {
            const [fromDate, toDate] = (p.conferenceDates ?? '').split('|');
            const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
            const dateRange = [fmt(fromDate), fmt(toDate)].filter(Boolean).join(' → ');
            return (
              <>
                <PreviewRow label="Presentation" value={p.presentationType} />
                <PreviewRow label="Venue" value={p.venue} />
                {dateRange && <PreviewRow label="Conf. Dates" value={dateRange} />}
              </>
            );
          })()}
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
  const counts: Record<string, number> = { journal: 0, conference: 0, book: 0, bookChapter: 0 };
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
      {([['journal', 'Journal'], ['conference', 'Conference'], ['book', 'Book'], ['bookChapter', 'Book Chapter']] as [string, string][]).map(([key, label]) => (
        <div key={key} style={{
          fontSize: 12, padding: '3px 10px', borderRadius: 20,
          background: counts[key] > 0 ? 'var(--primary-light, #eff6ff)' : '#f1f5f9',
          color: counts[key] > 0 ? 'var(--primary, #2563eb)' : 'var(--text-muted)',
          fontWeight: 600,
        }}>
          {label}: {counts[key]}
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
      {/* ── Header row: total banner + Add button ── */}
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
