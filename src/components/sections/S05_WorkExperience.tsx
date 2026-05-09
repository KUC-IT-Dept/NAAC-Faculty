import { CSSProperties } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';

import {
  dateInp,
  fg,
  inp,
  sel,
} from './sectionUtils';

type UploadedFile = {
  name: string;
  url?: string;
};

type WorkExp = {
  organization: string;
  designation: string;
  department?: string;
  from: string;
  to: string;
  nature: string;
  reasonForLeaving: string;
  files: UploadedFile[];
  isEditing?: boolean;
};

const EMPTY: WorkExp = {
  organization: '',
  designation: '',
  department: '',
  from: '',
  to: '',
  nature: '',
  reasonForLeaving: '',
  files: [],
  isEditing: true,
};

const DEFAULT_DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Researcher',
  'Industry Professional',
];

const DEFAULT_DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Commerce',
  'Management',
  'English',
];

const DEFAULT_NATURES = [
  'Teaching',
  'Research',
  'Industry / Corporate',
  'Administrative',
  'Contract',
  'Permanent',
];

const DEFAULT_REASONS = [
  'Career Growth',
  'Higher Studies',
  'Relocation',
  'Better Opportunity',
  'Contract Completed',
  'Personal Reasons',
];

export default function WorkExperience({
  data,
  onChange,
}: {
  data: WorkExp[];
  onChange: (d: WorkExp[]) => void;
}) {


  /* =====================================================
     UPDATE FIELD
  ===================================================== */

  const upd = (
    i: number,
    k: keyof WorkExp,
    v: any
  ) => {
    const arr = [...data];

    arr[i] = {
      ...arr[i],
      [k]: v,
    };

    onChange(arr);
  };

  /* =====================================================
     REMOVE CARD
  ===================================================== */

  const remove = (i: number) => {
    onChange(
      data.filter((_, idx) => idx !== i)
    );
  };

  /* =====================================================
     TOGGLE EDIT
  ===================================================== */

  const toggleEdit = (
    i: number,
    state: boolean
  ) => {
    const arr = [...data];

    arr[i].isEditing = state;

    onChange(arr);
  };

  /* =====================================================
     FILE UPLOAD
  ===================================================== */

  const handleFileUpload = (
    i: number,
    files: FileList | null
  ) => {
    if (!files) return;

    const uploadedFiles = Array.from(files).map((file: File) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    const arr = [...data];
    arr[i].files = [...(arr[i].files || []), ...uploadedFiles];
    onChange(arr);
  };



  /* =====================================================
     DURATION CALCULATION
  ===================================================== */

  const calculateDuration = (
    from: string,
    to: string
  ) => {
    if (!from || !to) return '-';

    const start = new Date(from);
    const end = new Date(to);

    let years =
      end.getFullYear() -
      start.getFullYear();

    let months =
      end.getMonth() -
      start.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} year${years !== 1 ? 's' : ''
      } ${months} month${months !== 1 ? 's' : ''
      }`;
  };

  /* =====================================================
     STYLES
  ===================================================== */

  const styles: Record<
    string,
    CSSProperties
  > = {
    section: {
      fontFamily:
        'Inter, sans-serif',
      margin: '1rem 0',
    },

    topButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 6,
      border: 'none',
      fontSize: 14,
      cursor: 'pointer',
      backgroundColor: '#4f46e5',
      color: 'white',
      marginBottom: 12,
    },

    card: {
      border:
        '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      backgroundColor: '#fff',
      boxShadow:
        '0 1px 3px rgba(0,0,0,0.05)',
    },

    cardHeader: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: 10,
    },

    cardActionsBtn: {
      marginLeft: 6,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 8px',
      borderRadius: 4,
      border: 'none',
      fontSize: 13,
      cursor: 'pointer',
    },

    save: {
      backgroundColor: '#10b981',
      color: 'white',
    },

    edit: {
      backgroundColor: '#2170ca',
      color: '#1f2937',
    },

    delete: {
      backgroundColor: '#ef4444',
      color: 'white',
    },

    formRow: {
      display: 'flex',
      gap: 12,
      marginBottom: 12,
      flexWrap: 'wrap',
    },

    durationText: {
      marginBottom: 12,
      fontSize: 14,
      fontWeight: 500,
      color: '#374151',
    },

    uploadedFiles: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },

    fileChip: {
      backgroundColor: '#f3f4f6',
      padding: '4px 8px',
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
    },

    removeFileBtn: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
    },

    previewCard: {
      padding: 6,
      backgroundColor: '#f9fafb',
      borderRadius: 6,
    },

    previewText: {
      margin: '4px 0',
      fontSize: 14,
    },
  };

  return (
    <div style={styles.section}>
      {/* ADD BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          style={styles.topButton}
          onClick={() =>
            onChange([
              { ...EMPTY },
              ...data,
            ])
          }
        >
          <Plus size={16} />
          Add Work Experience
        </button>
      </div>

      {data.map((e, i) => (
        <div
          key={i}
          style={styles.card}
        >
          {/* HEADER */}
          <div
            style={styles.cardHeader}
          >
            {e.isEditing ? (
              <button
                type="button"
                style={{
                  ...styles.cardActionsBtn,
                  ...styles.save,
                }}
                onClick={() =>
                  toggleEdit(
                    i,
                    false
                  )
                }
              >
                <Check size={16} />
                Save
              </button>
            ) : (
              <button
                type="button"
                style={{
                  ...styles.cardActionsBtn,
                  ...styles.edit,
                }}
                onClick={() =>
                  toggleEdit(
                    i,
                    true
                  )
                }
              >
                <Edit2 size={16} />
                Edit
              </button>
            )}

            <button
              type="button"
              style={{
                ...styles.cardActionsBtn,
                ...styles.delete,
              }}
              onClick={() =>
                remove(i)
              }
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>

          {/* EDIT MODE */}
          {e.isEditing ? (
            <>
              <div
                style={styles.formRow}
              >
                {fg(
                  'Institution Name *',
                  inp(
                    e.organization,
                    v =>
                      upd(
                        i,
                        'organization',
                        v
                      )
                  )
                )}

                {fg(
                  'Designation',
                  sel(
                    e.designation,
                    v => upd(i, 'designation', v),
                    DEFAULT_DESIGNATIONS
                  )
                )}

                {fg(
                  'Department',
                  sel(
                    e.department || '',
                    v => upd(i, 'department', v),
                    DEFAULT_DEPARTMENTS
                  )
                )}
              </div>

              <div
                style={styles.formRow}
              >
                {fg(
                  'From Date',
                  dateInp(
                    e.from,
                    v =>
                      upd(
                        i,
                        'from',
                        v
                      )
                  )
                )}

                {fg(
                  'To Date',
                  dateInp(
                    e.to,
                    v =>
                      upd(
                        i,
                        'to',
                        v
                      )
                  )
                )}

                {fg(
                  'Nature of Appointment',
                  sel(
                    e.nature,
                    v => upd(i, 'nature', v),
                    DEFAULT_NATURES
                  )
                )}
              </div>

              {/* DURATION */}
              <div
                style={
                  styles.durationText
                }
              >
                Total Duration:{' '}
                {calculateDuration(
                  e.from,
                  e.to
                )}
              </div>

              {fg(
                'Reason for Leaving',
                sel(
                  e.reasonForLeaving,
                  v => upd(i, 'reasonForLeaving', v),
                  DEFAULT_REASONS
                )
              )}

              {/* FILE UPLOAD */}
              <div
                className="form-group"
              >
                <label>
                  Documents /
                  Experience Proof
                </label>

                <input
                  type="file"
                  multiple
                  onChange={e =>
                    handleFileUpload(
                      i,
                      e.target.files
                    )
                  }
                />

                {e.files?.length >
                  0 && (
                    <div
                      style={
                        styles.uploadedFiles
                      }
                    >
                      {e.files.map(
                        (
                          f,
                          idx
                        ) => (
                          <div
                            key={idx}
                            style={
                              styles.fileChip
                            }
                          >
                            <a
                              href={
                                f.url
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              {
                                f.name
                              }
                            </a>

                            <button
                              type="button"
                              style={
                                styles.removeFileBtn
                              }
                              onClick={() => {
                                const arr =
                                  [
                                    ...data,
                                  ];

                                arr[
                                  i
                                ].files =
                                  arr[
                                    i
                                  ].files.filter(
                                    (
                                      _,
                                      x
                                    ) =>
                                      x !==
                                      idx
                                  );

                                onChange(
                                  arr
                                );
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
              </div>
            </>
          ) : (
            /* PREVIEW MODE */
            <div
              style={
                styles.previewCard
              }
            >
              <p
                style={
                  styles.previewText
                }
              >
                <strong>
                  Institution
                  Name:
                </strong>{' '}
                {e.organization ||
                  '-'}
              </p>

              <p
                style={
                  styles.previewText
                }
              >
                <strong>
                  Designation:
                </strong>{' '}
                {e.designation ||
                  '-'}
              </p>

              <p
                style={
                  styles.previewText
                }
              >
                <strong>
                  Department:
                </strong>{' '}
                {e.department ||
                  '-'}
              </p>

              <p
                style={
                  styles.previewText
                }
              >
                <strong>
                  From–To:
                </strong>{' '}
                {e.from
                  ? new Date(
                    e.from
                  ).toLocaleDateString()
                  : '-'}{' '}
                –{' '}
                {e.to
                  ? new Date(
                    e.to
                  ).toLocaleDateString()
                  : '-'}
              </p>

              <p
                style={
                  styles.previewText
                }
              >
                <strong>
                  Total
                  Duration:
                </strong>{' '}
                {calculateDuration(
                  e.from,
                  e.to
                )}
              </p>

              <p
                style={
                  styles.previewText
                }
              >
                <strong>
                  Nature of
                  Appointment:
                </strong>{' '}
                {e.nature || '-'}
              </p>

              <p
                style={
                  styles.previewText
                }
              >
                <strong>
                  Reason for
                  Leaving:
                </strong>{' '}
                {e.reasonForLeaving ||
                  '-'}
              </p>

              {e.files?.length >
                0 && (
                  <div
                    style={{
                      marginTop: 8,
                    }}
                  >
                    <strong>
                      Documents:
                    </strong>

                    <ul>
                      {e.files.map(
                        (
                          f,
                          idx
                        ) => (
                          <li
                            key={idx}
                          >
                            <a
                              href={
                                f.url
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              {
                                f.name
                              }
                            </a>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}