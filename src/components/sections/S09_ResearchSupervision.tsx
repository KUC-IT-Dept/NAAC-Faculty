import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink } from 'lucide-react';
import { fg, inp, sel, ta, FileInp, DropdownWithCustom, Sub } from './sectionUtils';

const EMPTY_SCHOLAR = { scholarName: '', gender: '', degree: '', topic: '', enrollmentYear: '', expectedCompletion: '', status: '', university: '', documentUrl: '' };
const EMPTY_PATENT = { title: '', patentNumber: '', dateOfFiling: '', status: '', description: '', documentUrl: '' };

const DEGREES = ['Ph.D', 'M.Phil', 'Post-Doctoral'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const SCHOLAR_STATUSES = ['Registered', 'Submitted', 'Awarded', 'Discontinued'];
const PATENT_STATUSES = ['Filed', 'Published', 'Granted', 'Abandoned'];

export default function ResearchSupervision({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const [sEditing, setSEditing] = useState(false);
  const [pEditing, setPEditing] = useState(false);
  const [pendingScholar, setPendingScholar] = useState<any>(null);
  const [pendingPatent, setPendingPatent] = useState<any>(null);

  const s = (k: string, v: any) => onChange({ ...data, [k]: v });

  const updS = (i: number, k: string, v: string) => {
    const a = [...(data.scholars || [])];
    a[i] = { ...a[i], [k]: v };
    s('scholars', a);
  };

  const updP = (i: number, k: string, v: string) => {
    const a = [...(data.patents || [])];
    a[i] = { ...a[i], [k]: v };
    s('patents', a);
  };

  const scholars = data.scholars || [];
  const patents = data.patents || [];

  const isScholarComplete = (item: any) => item.scholarName && item.degree;
  const isPatentComplete = (item: any) => item.title && item.patentNumber;

  const handleAddScholar = () => {
    setPendingScholar({ ...EMPTY_SCHOLAR });
  };

  const handleAddPatent = () => {
    setPendingPatent({ ...EMPTY_PATENT });
  };

  const handleSavePendingScholar = (item: any) => {
    if (isScholarComplete(item)) {
      s('scholars', [...scholars, item]);
      setPendingScholar(null);
    }
  };

  const handleSavePendingPatent = (item: any) => {
    if (isPatentComplete(item)) {
      s('patents', [...patents, item]);
      setPendingPatent(null);
    }
  };

  const handleCancelPendingScholar = () => {
    setPendingScholar(null);
  };

  const handleCancelPendingPatent = () => {
    setPendingPatent(null);
  };

  const updatePendingScholar = (k: string, v: string) => {
    setPendingScholar({ ...pendingScholar, [k]: v });
  };

  const updatePendingPatent = (k: string, v: string) => {
    setPendingPatent({ ...pendingPatent, [k]: v });
  };

  return (
    <div className="section-container">
      {/* Guidance Summary */}
      <Sub>Guidance Summary</Sub>

      <div className="form-row form-row-5" style={{ marginBottom: 16 }}>
        {fg('Ph.D — Awarded', inp(data.phdCompleted, v => s('phdCompleted', v), '0'))}
        {fg('Ph.D — Ongoing', inp(data.phdInProgress, v => s('phdInProgress', v), '0'))}
        {fg('M.Phil — Awarded', inp(data.mphilCompleted, v => s('mphilCompleted', v), '0'))}
        {fg('M.Phil — Ongoing', inp(data.mphilInProgress, v => s('mphilInProgress', v), '0'))}
        {fg('PG Dissertations', inp(data.pgProjectsSupervised, v => s('pgProjectsSupervised', v), '0'))}
      </div>

      {/* Two-column grid for Scholars and Patents */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          alignItems: 'start',
          marginBottom: 0,
        }}
      >
        {/* Scholars Section */}
        <div>
          <div className="section-header-actions" style={{ marginBottom: 16 }}>
            <h5 style={{ margin: 0 }}>Scholar Details</h5>

            <div>
              <button
                type="button"
                className={`btn btn-sm ${sEditing ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => setSEditing(!sEditing)}
              >
                {sEditing ? (
                  <>
                    <Check size={14} /> Done
                  </>
                ) : (
                  <>
                    <Edit2 size={14} /> Edit
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAddScholar}
                disabled={pendingScholar !== null}
                style={{ marginLeft: 8 }}
              >
                <Plus size={14} /> Add Scholar
              </button>
            </div>
          </div>

          {!sEditing && scholars.length === 0 && (
            <div className="empty-state">
              No scholars added yet. Click Edit to add one.
            </div>
          )}

          <div className="items-list">
            {scholars.map((sc: any, i: number) => {
              const itemIsEditing = sEditing || !isScholarComplete(sc);

              return (
                <div key={i} className={`item-card ${itemIsEditing ? 'is-editing' : 'is-preview'}`}> 
                  {itemIsEditing ? (
                    <>
                      <button
                        type="button"
                        className="item-remove-btn"
                        onClick={() => s('scholars', scholars.filter((_: any, j: number) => j !== i))}
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="form-row form-row-3">
                        {fg("Scholar's Name *", inp(sc.scholarName, v => updS(i, 'scholarName', v), 'Full name'))}
                        {fg('Gender', sel(sc.gender, v => updS(i, 'gender', v), GENDERS))}
                        {fg('Degree', sel(sc.degree, v => updS(i, 'degree', v), DEGREES))}
                      </div>

                      {fg('Research Topic / Thesis Title', ta(sc.topic, v => updS(i, 'topic', v), 'Research area or thesis title'))}

                      <div className="form-row form-row-2">
                        {fg('Enrolment Year', inp(sc.enrollmentYear, v => updS(i, 'enrollmentYear', v), '2020'))}
                        {fg('Expected Completion', inp(sc.expectedCompletion, v => updS(i, 'expectedCompletion', v), '2024'))}
                      </div>

                      <div className="form-row form-row-2">
                        {fg('Status', sel(sc.status, v => updS(i, 'status', v), SCHOLAR_STATUSES))}
                        {fg('University', inp(sc.university, v => updS(i, 'university', v), 'University name'))}
                      </div>

                      <div className="form-row form-row-1">
                        {fg('Thesis / Document', <FileInp v={sc.documentUrl} fn={v => updS(i, 'documentUrl', v)} />)}
                      </div>
                    </>
                  ) : (
                    <div className="preview-layout">
                      <div className="preview-main">
                        <h4 className="preview-title">{sc.scholarName}</h4>

                        <p className="preview-subtitle">
                          {sc.degree} • <span className="badge badge-secondary">{sc.status}</span>
                        </p>

                        {sc.topic && <p className="preview-desc">{sc.topic}</p>}

                        <p className="preview-meta">
                          {sc.university} • {sc.enrollmentYear}-{sc.expectedCompletion}
                        </p>
                      </div>

                      {sc.documentUrl && (
                        <a
                          href={`${import.meta.env.VITE_API_URL}${sc.documentUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="preview-file-link"
                        >
                          <ExternalLink size={14} /> View Thesis
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pending Scholar */}
            {pendingScholar && (
              <div key="pending-scholar" className="item-card is-editing">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Scholar</span>

                  <div>
                    <button
                      type="button"
                      className="btn btn-success btn-xs"
                      onClick={() => handleSavePendingScholar(pendingScholar)}
                      disabled={!isScholarComplete(pendingScholar)}
                    >
                      <Check size={12} /> Save
                    </button>

                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={handleCancelPendingScholar}
                      style={{ marginLeft: 8 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="form-row form-row-3">
                  {fg("Scholar's Name *", inp(pendingScholar.scholarName, v => updatePendingScholar('scholarName', v), 'Full name'))}
                  {fg('Gender', sel(pendingScholar.gender, v => updatePendingScholar('gender', v), GENDERS))}
                  {fg('Degree', sel(pendingScholar.degree, v => updatePendingScholar('degree', v), DEGREES))}
                </div>

                {fg('Research Topic / Thesis Title', ta(pendingScholar.topic, v => updatePendingScholar('topic', v), 'Research area or thesis title'))}

                <div className="form-row form-row-2">
                  {fg('Enrolment Year', inp(pendingScholar.enrollmentYear, v => updatePendingScholar('enrollmentYear', v), '2020'))}
                  {fg('Expected Completion', inp(pendingScholar.expectedCompletion, v => updatePendingScholar('expectedCompletion', v), '2024'))}
                </div>

                <div className="form-row form-row-2">
                  {fg('Status', sel(pendingScholar.status, v => updatePendingScholar('status', v), SCHOLAR_STATUSES))}
                  {fg('University', inp(pendingScholar.university, v => updatePendingScholar('university', v), 'University name'))}
                </div>

                <div className="form-row form-row-1">
                  {fg('Thesis / Document', <FileInp v={pendingScholar.documentUrl} fn={v => updatePendingScholar('documentUrl', v)} />)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Patents Section */}
        <div>
          <div className="section-header-actions" style={{ marginBottom: 16 }}>
            <h5 style={{ margin: 0 }}>Patents</h5>

            <div>
              <button
                type="button"
                className={`btn btn-sm ${pEditing ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => setPEditing(!pEditing)}
              >
                {pEditing ? (
                  <>
                    <Check size={14} /> Done
                  </>
                ) : (
                  <>
                    <Edit2 size={14} /> Edit
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAddPatent}
                disabled={pendingPatent !== null}
                style={{ marginLeft: 8 }}
              >
                <Plus size={14} /> Add Patent
              </button>
            </div>
          </div>

          {!pEditing && patents.length === 0 && (
            <div className="empty-state">
              No patents added yet. Click Edit to add one.
            </div>
          )}

          <div className="items-list">
            {patents.map((p: any, i: number) => {
              const itemIsEditing = pEditing || !isPatentComplete(p);

              return (
                <div key={i} className={`item-card ${itemIsEditing ? 'is-editing' : 'is-preview'}`}> 
                  {itemIsEditing ? (
                    <>
                      <button
                        type="button"
                        className="item-remove-btn"
                        onClick={() => s('patents', patents.filter((_: any, j: number) => j !== i))}
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="form-row form-row-1">
                        {fg('Patent Title *', inp(p.title, v => updP(i, 'title', v), 'Patent title'))}
                      </div>

                      <div className="form-row form-row-2">
                        {fg('Application / Patent No.', inp(p.patentNumber, v => updP(i, 'patentNumber', v), 'IN202021012345'))}

                        {fg(
                          'Date of Filing',
                          <input
                            type="date"
                            value={p.dateOfFiling}
                            onChange={e => updP(i, 'dateOfFiling', e.target.value)}
                            className="form-input"
                          />
                        )}
                      </div>

                      <div className="form-row form-row-2">
                        {fg('Status', sel(p.status, v => updP(i, 'status', v), PATENT_STATUSES))}
                        {fg('Patent Document', <FileInp v={p.documentUrl} fn={v => updP(i, 'documentUrl', v)} />)}
                      </div>

                      <div className="form-row form-row-1">
                        {fg('Description (optional)', ta(p.description, v => updP(i, 'description', v), 'Patent details...'))}
                      </div>
                    </>
                  ) : (
                    <div className="preview-layout">
                      <div className="preview-main">
                        <h4 className="preview-title">{p.title}</h4>

                        <p className="preview-subtitle">
                          {p.patentNumber} • <span className="badge badge-secondary">{p.status}</span>
                        </p>

                        {p.description && <p className="preview-desc">{p.description}</p>}

                        <p className="preview-meta">Filed: {p.dateOfFiling}</p>
                      </div>

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
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pending Patent */}
            {pendingPatent && (
              <div key="pending-patent" className="item-card is-editing">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Patent</span>

                  <div>
                    <button
                      type="button"
                      className="btn btn-success btn-xs"
                      onClick={() => handleSavePendingPatent(pendingPatent)}
                      disabled={!isPatentComplete(pendingPatent)}
                    >
                      <Check size={12} /> Save
                    </button>

                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={handleCancelPendingPatent}
                      style={{ marginLeft: 8 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="form-row form-row-2">
                  {fg('Patent Title *', inp(pendingPatent.title, v => updatePendingPatent('title', v), 'Title of the patent'))}
                  {fg('Patent Number *', inp(pendingPatent.patentNumber, v => updatePendingPatent('patentNumber', v), 'Patent application number'))}
                </div>

                <div className="form-row form-row-2">
                  {fg(
                    'Date of Filing',
                    <input
                      type="date"
                      value={pendingPatent.dateOfFiling}
                      onChange={e => updatePendingPatent('dateOfFiling', e.target.value)}
                      className="form-input"
                    />
                  )}

                  {fg('Status', sel(pendingPatent.status, v => updatePendingPatent('status', v), PATENT_STATUSES))}
                </div>

                <div className="form-row form-row-2">
                  {fg('Brief Description (optional)', ta(pendingPatent.description, v => updatePendingPatent('description', v), 'Description of the patent...'))}
                  {fg('Patent Document', <FileInp v={pendingPatent.documentUrl} fn={v => updatePendingPatent('documentUrl', v)} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}