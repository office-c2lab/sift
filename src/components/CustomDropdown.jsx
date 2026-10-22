import { useState } from 'react';

export default function CustomDropdown({ value, onChange, options, disabled = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <div
      className={`sidebar-select${className ? ` ${className}` : ''}`}
      onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    >
      <button
        type="button"
        className={`sidebar-select-trigger${open ? ' is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg>
      </button>
      {open && <div className="sidebar-select-menu" role="listbox">{options.map((option) => (
        <button
          type="button"
          role="option"
          aria-selected={option.value === value}
          key={option.value}
          className={option.value === value ? 'selected' : ''}
          onClick={() => { onChange(option.value); setOpen(false); }}
        >
          <span>{option.label}</span>
          {option.value === value && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>}
        </button>
      ))}</div>}
    </div>
  );
}
