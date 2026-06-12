import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  maxOptions?: number;
}

export default function SearchableSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "— Select —",
  maxOptions = 100 
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setSearchTerm(''); // reset search when opening to see all initial options
  };

  const filteredOptions = options
    .filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, maxOptions);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
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
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0', backgroundColor: '#ffffff' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    backgroundColor: value === opt ? '#ede9fe' : '#ffffff',
                    color: value === opt ? '#4f46e5' : '#1e293b',
                  }}
                  onMouseEnter={(e) => {
                    if (value !== opt) e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    if (value !== opt) e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  {opt}
                </div>
              ))
            )}
            {filteredOptions.length === maxOptions && (
              <div style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic', backgroundColor: '#ffffff' }}>
                Type to see more specific results...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
