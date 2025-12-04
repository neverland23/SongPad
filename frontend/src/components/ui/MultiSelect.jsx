import React, { useState, useRef, useEffect } from 'react';

function MultiSelect({ options, selectedValues, onChange, placeholder = 'Select options...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (value) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleRemove = (value, e) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== value));
  };

  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));
  const availableOptions = options.filter((opt) => !selectedValues.includes(opt.value));

  return (
    <div className="position-relative" ref={containerRef}>
      <div
        className="form-control d-flex flex-wrap align-items-center gap-2"
        style={{
          minHeight: '38px',
          cursor: 'pointer',
          padding: selectedValues.length > 0 ? '4px 8px' : '6px 12px',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedValues.length === 0 ? (
          <span className="text-muted">{placeholder}</span>
        ) : (
          selectedOptions.map((option) => (
            <span
              key={option.value}
              className="d-inline-flex align-items-center gap-1"
              style={{
                padding: '2px 10px',
                borderRadius: '16px',
                fontSize: '0.875rem',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: '1px solid #6c757d',
                whiteSpace: 'nowrap',
              }}
            >
              {option.label}
              <button
                type="button"
                className="border-0 bg-transparent text-white p-0"
                style={{
                  width: '16px',
                  height: '16px',
                  fontSize: '14px',
                  lineHeight: '1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '4px',
                  opacity: 0.8,
                }}
                onClick={(e) => handleRemove(option.value, e)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          ))
        )}
        <span className="ms-auto text-muted" style={{ fontSize: '0.75rem', pointerEvents: 'none' }}>
          ▼
        </span>
      </div>
      {isOpen && (
        <div
          className="position-absolute w-100 bg-slate-800 border border-slate-600 rounded"
          style={{
            top: '100%',
            left: 0,
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            marginTop: '4px',
          }}
        >
          {availableOptions.length === 0 ? (
            <div className="p-2 text-muted small text-center">All options selected</div>
          ) : (
            availableOptions.map((option) => (
              <div
                key={option.value}
                className="p-2 hover-bg-slate-700"
                style={{
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onClick={() => handleToggle(option.value)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default MultiSelect;

