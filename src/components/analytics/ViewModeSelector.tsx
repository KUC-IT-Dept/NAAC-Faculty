import React from 'react';

export type ViewMode = 'absolute' | 'perFaculty' | 'percentage' | 'perStudent';

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  /**
   * Phase 19: When true the selector is rendered in a visually inactive state
   * and all mode buttons are disabled. Pass a short reason string that is shown
   * as a label, e.g. "Not applicable on this tab".
   */
  inactive?: boolean;
  inactiveLabel?: string;
}

export default function ViewModeSelector({
  value,
  onChange,
  inactive = false,
  inactiveLabel = 'Not applicable on this tab',
}: ViewModeSelectorProps) {
  const modes: { id: ViewMode; label: string }[] = [
    { id: 'absolute',   label: 'Absolute'    },
    { id: 'perFaculty', label: 'Per Faculty' },
    { id: 'percentage', label: 'Percentage'  },
    { id: 'perStudent', label: 'Per Student' },
  ];

  return (
    <div
      title={inactive ? inactiveLabel : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: inactive ? '#f8fafc' : '#f1f5f9',
        padding: '4px',
        borderRadius: '8px',
        gap: '4px',
        marginBottom: '16px',
        opacity: inactive ? 0.55 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <span style={{
        fontSize: '0.85rem',
        color: inactive ? '#94a3b8' : '#64748b',
        margin: '0 8px',
        fontWeight: 600,
      }}>
        View Mode:
      </span>

      {inactive ? (
        /* ── Inactive state: single greyed label, no clickable buttons ── */
        <span style={{
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '0.82rem',
          fontWeight: 500,
          color: '#94a3b8',
          background: 'transparent',
          fontStyle: 'italic',
        }}>
          {inactiveLabel}
        </span>
      ) : (
        /* ── Active state: normal mode buttons ── */
        modes.map(mode => {
          const isActive = value === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange(mode.id)}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? 'var(--primary, #2563eb)' : '#475569',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {mode.label}
            </button>
          );
        })
      )}
    </div>
  );
}
