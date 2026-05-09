import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink } from 'lucide-react';
import { fg, inp, sel, ta, FileInp, DropdownWithCustom } from './sectionUtils';

const EMPTY = {
  title: '',
  fundingAgency: '',
  amountSanctioned: '',
  duration: '',
  status: '',
  role: '',
  description: '',
  documentUrl: ''
};

const FUNDING_AGENCIES = ['DST-SERB', 'ICMR', 'AICTE', 'UGC', 'CSIR', 'DBT', 'IYSC', 'IIT'];

const STATUSES = ['Ongoing', 'Completed', 'Submitted', 'Rejected'];

const ROLES = [
  'Principal Investigator (PI)',
  'Co-Principal Investigator (Co-PI)',
  'Co-Investigator'
];

export default function ResearchProjects({
  data,
  onChange
}: {
  data: any[];
  onChange: (d: any[]) => void;
}) {

  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const [pendingNewItem, setPendingNewItem] = useState<any>(null);

  const upd = (i: number, k: string, v: string) => {
    const a = [...data];
    a[i] = { ...a[i], [k]: v };
    onChange(a);
  };

  // Check if required fields are filled
  const isItemComplete = (item: any) =>
    item.title && item.fundingAgency;

  // Add new project
  const handleAddProject = () => {
    setPendingNewItem({ ...EMPTY });
  };

  // Save pending project
  const handleSavePending = (item: any) => {
    if (isItemComplete(item)) {

      const updated = [item, ...data];

      // Sort by end year in duration
      updated.sort((a, b) => {

        const getYear = (d: any) => {
          if (!d.duration) return 0;

          const match = d.duration.match(/\d{4}/g);

          if (!match) return 0;

          return parseInt(match[match.length - 1], 10);
        };

        return getYear(b) - getYear(a);
      });

      onChange(updated);

      setPendingNewItem(null);
    }
  };

  // Cancel pending item
  const handleCancelPending = () => {
    setPendingNewItem(null);
  };

  // Update pending item
  const updatePending = (k: string, v: string) => {
    setPendingNewItem({
      ...pendingNewItem,
      [k]: v
    });
  };

  // Always sort by end year descending
  const sortedData = [...data].sort((a, b) => {

    const getYear = (d: any) => {
      if (!d.duration) return 0;

      const match = d.duration.match(/\d{4}/g);

      if (!match) return 0;

      return parseInt(match[match.length - 1], 10);
    };

    return getYear(b) - getYear(a);
  });

  return (
    <>
      <div className="section-header-actions">

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleAddProject}
          disabled={
            pendingNewItem !== null ||
            editingItemIndex !== null
          }
        >
          <Plus size={14} /> Add Project
        </button>

      </div>

      {sortedData.length === 0 && (
        <div className="empty-state">
          No research projects added yet. Click Add Project to get started.
        </div>
      )}

      <div className="items-list">

        {/* Pending New Item */}
        {pendingNewItem && (

          <div key="pending" className="item-card is-editing">

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}
            >

              <span
                style={{
                  fontWeight: 'bold',
                  color: 'var(--primary)'
                }}
              >
                New Project
              </span>

              <div>

                <button
                  type="button"
                  className="btn btn-success btn-xs"
                  onClick={() => handleSavePending(pendingNewItem)}
                  disabled={!isItemComplete(pendingNewItem)}
                >
                  <Check size={12} /> Save
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={handleCancelPending}
                  style={{ marginLeft: 8 }}
                >
                  Cancel
                </button>

              </div>

            </div>

            <div className="form-row form-row-1">
              {fg(
                'Project Title *',
                inp(
                  pendingNewItem.title,
                  v => updatePending('title', v),
                  'AI in Healthcare...'
                )
              )}
            </div>

            <div className="form-row form-row-2">

              {fg(
                'Funding Agency *',
                <DropdownWithCustom
                  v={pendingNewItem.fundingAgency}
                  fn={v => updatePending('fundingAgency', v)}
                  opts={FUNDING_AGENCIES}
                />
              )}

              {fg(
                'Amount Sanctioned (₹)',
                inp(
                  pendingNewItem.amountSanctioned,
                  v => updatePending('amountSanctioned', v),
                  '5,00,000'
                )
              )}

            </div>

            <div className="form-row form-row-2">

              {fg(
                'Duration',
                inp(
                  pendingNewItem.duration,
                  v => updatePending('duration', v),
                  '3 years or 2021-2024'
                )
              )}

              {fg(
                'Status',
                sel(
                  pendingNewItem.status,
                  v => updatePending('status', v),
                  STATUSES
                )
              )}

            </div>

            <div className="form-row form-row-2">

              {fg(
                'Your Role',
                sel(
                  pendingNewItem.role,
                  v => updatePending('role', v),
                  ROLES
                )
              )}

              {fg(
                'Sanction Letter / Document',
                <FileInp
                  v={pendingNewItem.documentUrl}
                  fn={v => updatePending('documentUrl', v)}
                />
              )}

            </div>

            <div className="form-row form-row-1">

              {fg(
                'Project Description (optional)',
                ta(
                  pendingNewItem.description,
                  v => updatePending('description', v),
                  'Brief description...'
                )
              )}

            </div>

          </div>
        )}

        {/* Existing Items */}
        {sortedData.map((p, i) => {

          const itemIsEditing = editingItemIndex === i;

          return (

            <div
              key={i}
              className={`item-card ${itemIsEditing ? 'is-editing' : 'is-preview'}`}
            >

              {itemIsEditing ? (
                <>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12
                    }}
                  >

                    <span
                      style={{
                        fontWeight: 'bold',
                        color: 'var(--primary)'
                      }}
                    >
                      Editing Project
                    </span>

                    <div>

                      <button
                        type="button"
                        className="btn btn-success btn-xs"
                        onClick={() => setEditingItemIndex(null)}
                      >
                        <Check size={12} /> Done
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={() =>
                          onChange(
                            data.filter((_, j) => j !== i)
                          )
                        }
                        style={{ marginLeft: 8 }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>

                    </div>

                  </div>

                  <div className="form-row form-row-1">

                    {fg(
                      'Project Title *',
                      inp(
                        p.title,
                        v => upd(i, 'title', v),
                        'AI in Healthcare...'
                      )
                    )}

                  </div>

                  <div className="form-row form-row-2">

                    {fg(
                      'Funding Agency *',
                      <DropdownWithCustom
                        v={p.fundingAgency}
                        fn={v => upd(i, 'fundingAgency', v)}
                        opts={FUNDING_AGENCIES}
                      />
                    )}

                    {fg(
                      'Amount Sanctioned (₹)',
                      inp(
                        p.amountSanctioned,
                        v => upd(i, 'amountSanctioned', v),
                        '5,00,000'
                      )
                    )}

                  </div>

                  <div className="form-row form-row-2">

                    {fg(
                      'Duration',
                      inp(
                        p.duration,
                        v => upd(i, 'duration', v),
                        '3 years or 2021-2024'
                      )
                    )}

                    {fg(
                      'Status',
                      sel(
                        p.status,
                        v => upd(i, 'status', v),
                        STATUSES
                      )
                    )}

                  </div>

                  <div className="form-row form-row-2">

                    {fg(
                      'Your Role',
                      sel(
                        p.role,
                        v => upd(i, 'role', v),
                        ROLES
                      )
                    )}

                    {fg(
                      'Sanction Letter / Document',
                      <FileInp
                        v={p.documentUrl}
                        fn={v => upd(i, 'documentUrl', v)}
                      />
                    )}

                  </div>

                  <div className="form-row form-row-1">

                    {fg(
                      'Project Description (optional)',
                      ta(
                        p.description,
                        v => upd(i, 'description', v),
                        'Brief description...'
                      )
                    )}

                  </div>

                </>
              ) : (

                <div className="preview-layout">

                  <div className="preview-main">

                    <h4 className="preview-title">
                      {p.title}
                    </h4>

                    <p className="preview-subtitle">
                      {p.fundingAgency} •{' '}
                      <span className="badge badge-secondary">
                        {p.status}
                      </span>{' '}
                      •{' '}
                      <span className="badge badge-info">
                        {p.role}
                      </span>
                    </p>

                    {p.description && (
                      <p className="preview-desc">
                        {p.description}
                      </p>
                    )}

                    <p className="preview-meta">
                      Amount: ₹{p.amountSanctioned} • Duration: {p.duration}
                    </p>

                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center'
                    }}
                  >

                    {p.documentUrl && (
                      <a
                        href={`${import.meta.env.VITE_API_URL}${p.documentUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="preview-file-link"
                      >
                        <ExternalLink size={14} /> View Document
                      </a>
                    )}

                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => setEditingItemIndex(i)}
                    >
                      <Edit2 size={14} /> Edit
                    </button>

                  </div>

                </div>
              )}

            </div>
          );
        })}

      </div>
    </>
  );
}