const fs = require('fs');
let code = fs.readFileSync('src/components/CustomCreatableSelect.jsx', 'utf8');
code = code.replace(/className=\{/g, "className={`");
code = code.replace(/\}\{disabled \? 'opacity-50 pointer-events-none' : ''\}`\}/g, "${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}");
// wait, it's easier to just write the file completely in node
const fullCode = `import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';

const CustomCreatableSelect = ({ value, onChange, options, className = '', style = {}, disabled = false, placeholder = 'Seleccione o escriba...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectRef = useRef(null);
  const inputRef = useRef(null);
  
  // Sync search with selected value on open/close
  useEffect(() => {
    if (!isOpen) {
      setSearch(value || '');
    } else {
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, value]);

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const exactMatch = options.find(o => o.label.toLowerCase() === search.toLowerCase());

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.custom-select-portal')) return;
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        // If they typed something but clicked away without selecting, save it as new value!
        if (search && search !== value) {
            onChange(search);
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, search, value, onChange]);

  return (
    <div ref={selectRef} style={{ position: 'relative', ...style }} className={\`\${className} \${disabled ? 'opacity-50 pointer-events-none' : ''}\`}>
      <div 
        className="input" 
        style={{ cursor: disabled ? 'not-allowed' : 'text', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '100%', padding: '0.8rem' }}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            onChange(e.target.value); // Optimistically update value as they type so form state has it
          }}
          placeholder={placeholder}
          disabled={disabled}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
        />
        <ChevronDown 
          size={16} 
          style={{ color: 'var(--text-secondary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, cursor: 'pointer' }} 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        />
      </div>
      
      {isOpen && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 100000 }} onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>
          <div 
            className="animate-fade-in custom-select-portal" 
            style={{ 
              position: 'fixed', 
              top: selectRef.current ? selectRef.current.getBoundingClientRect().bottom + 8 : 0, 
              left: selectRef.current ? selectRef.current.getBoundingClientRect().left : 0,
              width: selectRef.current ? selectRef.current.getBoundingClientRect().width : 'auto',
              minWidth: '150px',
              borderRadius: '0.75rem', 
              zIndex: 100001, 
              overflowY: 'auto',
              maxHeight: '300px',
              background: 'rgba(16, 24, 39, 0.6)',
              backdropFilter: 'blur(28px) saturate(150%)',
              WebkitBackdropFilter: 'blur(28px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div 
                key={opt.value}
                style={{ 
                  padding: '0.8rem 1rem', 
                  cursor: 'pointer', 
                  background: String(value) === String(opt.value) ? 'var(--primary-subtle)' : 'transparent', 
                  color: String(value) === String(opt.value) ? 'var(--primary-color)' : 'var(--text-primary)', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', 
                  transition: 'background 0.2s', 
                  fontWeight: String(value) === String(opt.value) ? 700 : 500 
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseOut={e => e.currentTarget.style.background = String(value) === String(opt.value) ? 'var(--primary-subtle)' : 'transparent'}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            )) : null}
            
            {!exactMatch && search.trim() && (
              <div 
                style={{ 
                  padding: '0.8rem 1rem', 
                  cursor: 'pointer', 
                  color: 'var(--primary-color)', 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(search.trim()); setIsOpen(false); }}
              >
                <Plus size={16} /> Crear "{search.trim()}"
              </div>
            )}
            {filteredOptions.length === 0 && !search.trim() && (
               <div style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                 Escriba para buscar o crear...
               </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default CustomCreatableSelect;
`;
fs.writeFileSync('src/components/CustomCreatableSelect.jsx', fullCode, 'utf8');
