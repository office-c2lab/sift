import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function CustomDropdown({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value) || options[0];

  return (
    <div
      className={`sidebar-select${className ? ` ${className}` : ''}`}
      onKeyDown={event => {
        if (event.key === 'Escape') setOpen(false);
      }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        className={`sidebar-select-trigger${open ? ' is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(current => !current)}
      >
        <span>{selected?.label}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open && (
        <div className="sidebar-select-menu" role="listbox">
          {options.map(option => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              className={option.value === value ? 'selected' : ''}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
