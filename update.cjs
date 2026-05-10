const fs = require('fs');

let content = fs.readFileSync('src/components/sections/S06_Publications.tsx', 'utf-8');

// Replace the imports
content = content.replace(
    "import { Plus, Trash2, Edit2, Check, ExternalLink, BookOpen } from 'lucide-react';",
    "import { Plus, Trash2, Edit2, Check, ExternalLink, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';"
);

const marker = "function PreviewRow(";
let startIdx = content.indexOf(marker);

if (startIdx === -1) {
    console.error('Could not find Structured Preview section');
    process.exit(1);
}

// Rewind to include the preceding comment if possible, but actually we can just drop the comment before it and replace from startIdx
// Actually let's just find the last block comment before it
let searchIdx = content.lastIndexOf("/*", startIdx);
if (searchIdx !== -1) {
    startIdx = searchIdx;
}

const newTail = `/* ─── Shared Button Styles ───────────────────────────────────── */
const btnStyles = {
  add: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#4f46e5', color: '#ffffff',
    padding: '8px 16px', borderRadius: '6px',
    fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer'
  },
  edit: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#f8fafc', color: '#334155',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer'
  },
  delete: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#fff1f2', color: '#be123c',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer'
  },
  save: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#10b981', color: '#ffffff',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer'
  },
  cancel: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#f1f5f9', color: '#475569',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer'
  }
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
    p.volume && \`Vol. \${p.volume}\`,
    p.issue && \`No. \${p.issue}\`,
    p.pages && \`pp. \${p.pages}\`,
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
            href={\`\${import.meta.env.VITE_API_URL || ''}\${p.documentUrl}\`}
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
  onEdit,
  onDelete,
  disabled
}: {
  p: Publication;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{
            minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8,
            background: 'var(--primary-light, #eff6ff)', flexShrink: 0,
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary, #2563eb)', lineHeight: 1 }}>{p.year || '—'}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
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
          <button type="button" style={btnStyles.edit} onClick={(e) => { e.stopPropagation(); onEdit(); }} disabled={disabled}>
            <Edit2 size={14} /> Edit
          </button>
          <button type="button" style={btnStyles.delete} onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={disabled}>
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
          style={btnStyles.add}
          onClick={() => setPendingItem({ ...EMPTY })}
          disabled={pendingItem !== null || editingIndex !== null}
        >
          <Plus size={16} /> Add Publication
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Publication</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button" style={btnStyles.save}
                  disabled={!isComplete(pendingItem)}
                  onClick={() => {
                    const updated = [pendingItem, ...data];
                    updated.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
                    onChange(updated);
                    setPendingItem(null);
                  }}
                >
                  <Check size={14} /> Save
                </button>
                <button
                  type="button" style={btnStyles.cancel}
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
            <div key={i} className={\`item-card \${isEdit ? 'is-editing' : 'is-preview'}\`}>
              {isEdit ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Publication</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button" style={btnStyles.save}
                        onClick={() => {
                          const updated = [...data];
                          updated.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
                          onChange(updated);
                          setEditingIndex(null);
                        }}
                      >
                        <Check size={14} /> Done
                      </button>
                      <button
                        type="button" style={btnStyles.delete}
                        onClick={() => { onChange(sorted.filter((_, j) => j !== i)); setEditingIndex(null); }}
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
                  onEdit={() => setEditingIndex(i)}
                  onDelete={() => onChange(sorted.filter((_, j) => j !== i))}
                  disabled={pendingItem !== null}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
`;

content = content.substring(0, startIdx) + newTail;
fs.writeFileSync('src/components/sections/S06_Publications.tsx', content, 'utf-8');
console.log('Success');
