import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  maxOptions?: number;
  emptyMessage?: string;
  /**
   * Show the persistent "+ Add Other" action (and typed "+ Add \"value\"" action).
   * Defaults to true. Pass false for fields that must only accept values from `options`
   * (filters, fixed department / tutor pickers).
   */
  allowAddOther?: boolean;
}

const norm = (s: string) => (s || '').trim().toLowerCase();

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "— Select —",
  maxOptions = 100,
  emptyMessage = "No departments found",
  allowAddOther = true,
  inputRef
}: SearchableSelectProps & { inputRef?: React.Ref<HTMLDivElement> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState('');

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionListRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const setTriggerRef = (node: HTMLDivElement | null) => {
    triggerRef.current = node;
    if (typeof inputRef === 'function') inputRef(node);
    else if (inputRef) (inputRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  // Close the list and hand focus back to the trigger so keyboard users keep their place.
  const closeAndRefocus = () => {
    setIsOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dropdownKey = (options as any)?.dropdownKey;
  const trimmedSearch = searchTerm.trim();
  const query = norm(searchTerm);
  // Duplicate = same text as an existing option (or the currently saved value), ignoring case/whitespace.
  const hasExactMatch = query !== '' && (options.some(opt => norm(opt) === query) || norm(value) === query);
  // Specific action only for a non-empty, non-duplicate query; otherwise the generic "+ Add Other" row.
  const showSpecificAdd = allowAddOther && trimmedSearch !== '' && !hasExactMatch;

  const filteredOptions = options
    .filter(opt => norm(opt).includes(query))
    .sort((a, b) => Number(norm(b) === query) - Number(norm(a) === query)) // exact match first (stable)
    .slice(0, maxOptions);

  const addIndex = filteredOptions.length;
  const totalItems = filteredOptions.length + (allowAddOther ? 1 : 0);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
    setHint('');
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen && optionListRef.current) {
      const children = optionListRef.current.children;
      if (highlightedIndex < filteredOptions.length && children[highlightedIndex]) {
        (children[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen, filteredOptions.length]);

  // Activating the generic "+ Add Other" row: nothing to add yet, so guide the user to the search box.
  const handleGenericAdd = () => {
    if (!allowAddOther) return;
    if (hasExactMatch) {
      setHint(`"${trimmedSearch}" already exists — select it from the list.`);
    } else {
      setHint('Type the new value in the search box, then press Enter to add it.');
    }
    searchInputRef.current?.focus();
  };

  const handleRequestAdd = async (newValue: string) => {
    if (!allowAddOther || submitting) return;
    newValue = newValue.trim();
    if (!newValue) { handleGenericAdd(); return; }
    if (norm(newValue) && options.some(opt => norm(opt) === norm(newValue))) { handleGenericAdd(); return; }
    if (dropdownKey) {
      setSubmitting(true);
      try {
        await api.post('/me/requests', {
          dropdownKey,
          requestedValue: newValue.trim(),
          previousValue: value || ''
        });
        toast.success('Request sent for approval. You can continue saving.');
        onChange(newValue.trim());
        closeAndRefocus();
      } catch (err) {
        toast.error('Failed to submit request');
      } finally {
        setSubmitting(false);
      }
    } else {
      onChange(newValue.trim());
      closeAndRefocus();
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      closeAndRefocus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (totalItems > 0 ? (prev + 1) % totalItems : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (totalItems > 0 ? (prev - 1 + totalItems) % totalItems : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        onChange(filteredOptions[highlightedIndex]);
        closeAndRefocus();
      } else if (allowAddOther && highlightedIndex === addIndex) {
        if (showSpecificAdd) handleRequestAdd(trimmedSearch);
        else handleGenericAdd();
      }
    }
  };

  return (
    <div
      ref={wrapperRef}
      onKeyDown={handleKeyDown}
      onBlur={(e) => {
        // Tabbing to another control closes the list. relatedTarget is null when the
        // pointer clicks a non-focusable option, so that case is left to the click handlers.
        const next = e.relatedTarget as Node | null;
        if (next && wrapperRef.current && !wrapperRef.current.contains(next)) setIsOpen(false);
      }}
      style={{ position: 'relative', width: '100%' }}
    >
      <div
        ref={setTriggerRef}
        tabIndex={0}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={handleOpen}
        className="form-input"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: '#ffffff',
          backgroundColor: '#ffffff',
          minHeight: '38px',
          color: value ? '#1e293b' : '#94a3b8',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '8px 12px',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} color="#94a3b8" />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: '#ffffff',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 9999,
          maxHeight: '300px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', position: 'relative', backgroundColor: '#ffffff' }}>
            <Search size={14} style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} />
            <input
              ref={searchInputRef}
              autoFocus
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 28px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.9rem',
                outline: 'none',
                backgroundColor: '#f8fafc',
                color: '#1e293b',
              }}
            />
          </div>
          <div ref={optionListRef} role="listbox" style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, padding: '4px 0', backgroundColor: '#ffffff' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = !!value && value.trim().toLowerCase() === opt.toLowerCase();
                const isHighlighted = highlightedIndex === idx;
                return (
                  <div
                    key={idx}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt);
                      closeAndRefocus();
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      backgroundColor: isSelected ? '#ede9fe' : isHighlighted ? '#f1f5f9' : '#ffffff',
                      color: isSelected ? '#4f46e5' : '#1e293b',
                      fontWeight: isSelected ? 600 : 400
                    }}
                  >
                    {opt}
                  </div>
                );
              })
            )}
            {filteredOptions.length === maxOptions && (
              <div style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic', backgroundColor: '#ffffff' }}>
                Type to see more specific results...
              </div>
            )}
          </div>
          {allowAddOther && (
            // Footer is a sibling of the scrolling list (not inside it) so it is always visible and never clipped.
            <div style={{ flex: '0 0 auto', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '0 0 8px 8px' }}>
              <div
                role="button"
                data-testid="add-other-action"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (showSpecificAdd ? handleRequestAdd(trimmedSearch) : handleGenericAdd())}
                onMouseEnter={() => setHighlightedIndex(addIndex)}
                style={{
                  padding: '10px 16px',
                  cursor: submitting ? 'wait' : 'pointer',
                  fontSize: '0.9rem',
                  color: '#4f46e5',
                  fontWeight: 600,
                  backgroundColor: highlightedIndex === addIndex ? '#f1f5f9' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {showSpecificAdd
                  ? (submitting ? 'Sending Request...' : `+ Add "${trimmedSearch}"${dropdownKey ? ' (Request HOD Approval)' : ''}`)
                  : '+ Add Other...'}
              </div>
              <div role="status" aria-live="polite" style={{ padding: hint ? '0 16px 8px' : 0, fontSize: '0.78rem', color: '#64748b' }}>
                {hint}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
