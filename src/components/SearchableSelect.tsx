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
}

export default function SearchableSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "— Select —",
  maxOptions = 100,
  emptyMessage = "No departments found",
  inputRef
}: SearchableSelectProps & { inputRef?: React.Ref<HTMLDivElement> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionListRef = useRef<HTMLDivElement>(null);

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
  const hasExactMatch = options.some(opt => opt.toLowerCase() === trimmedSearch.toLowerCase());
  const showAddOption = trimmedSearch !== '' && !hasExactMatch;
  const showAddOtherOption = dropdownKey && trimmedSearch === '';

  const filteredOptions = options
    .filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, maxOptions);

  const hasExtraOption = showAddOption || showAddOtherOption;
  const totalItems = filteredOptions.length + (hasExtraOption ? 1 : 0);

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen && optionListRef.current) {
      const children = optionListRef.current.children;
      if (children[highlightedIndex]) {
        (children[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleRequestAdd = async (newValue: string) => {
    if (!newValue.trim()) return;
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
        setIsOpen(false);
      } catch (err) {
        toast.error('Failed to submit request');
      } finally {
        setSubmitting(false);
      }
    } else {
      onChange(newValue.trim());
      setIsOpen(false);
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
      setIsOpen(false);
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
        setIsOpen(false);
      } else if (highlightedIndex === filteredOptions.length && showAddOption) {
        handleRequestAdd(trimmedSearch);
      } else if (highlightedIndex === filteredOptions.length && showAddOtherOption) {
        searchInputRef.current?.focus();
      }
    }
  };

  return (
    <div 
      ref={wrapperRef} 
      onKeyDown={handleKeyDown}
      style={{ position: 'relative', width: '100%' }}
    >
      <div 
        ref={inputRef}
        tabIndex={0}
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
          <div ref={optionListRef} style={{ overflowY: 'auto', flex: 1, padding: '4px 0', backgroundColor: '#ffffff' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = value === opt;
                const isHighlighted = highlightedIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
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
            {showAddOtherOption && (
              <div
                onClick={() => {
                  searchInputRef.current?.focus();
                }}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#4f46e5',
                  fontWeight: 600,
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: highlightedIndex === filteredOptions.length ? '#f1f5f9' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                + Add Other...
              </div>
            )}
            {showAddOption && (
              <div
                onClick={() => handleRequestAdd(trimmedSearch)}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#4f46e5',
                  fontWeight: 600,
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: highlightedIndex === filteredOptions.length ? '#f1f5f9' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {submitting ? 'Sending Request...' : `+ Add "${trimmedSearch}" ${dropdownKey ? '(Request HOD Approval)' : ''}`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
