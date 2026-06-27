import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon.jsx';

export function CustomSelect({ value, onChange, options, style }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <div 
        className="neu-inset" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: '8px 12px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          cursor: 'pointer',
          color: 'var(--ink)',
          fontSize: 13,
          fontWeight: 600,
          ...style 
        }}
      >
        <span style={{ flex: 1 }}>{selectedOption?.label}</span>
        <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={14} color="var(--ink-soft)" />
      </div>

      {isOpen && (
        <div 
          className="neu-raised"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            minWidth: '100%',
            zIndex: 1000,
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: opt.value === value ? 700 : 500,
                color: opt.value === value ? 'var(--color-teal)' : 'var(--ink)',
                background: opt.value === value ? 'var(--app-bg)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              {opt.label}
              {opt.value === value && <Icon name="Check" size={14} color="var(--color-teal)" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Loading({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--color-teal)', fontWeight: 600 }}>
      <span className="spin" style={{ display: 'inline-flex' }}>
        <Icon name="Globe" size={18} />
      </span>
      <span>{label || 'Thinking…'}</span>
    </div>
  );
}

export function LevelPill({ level }) {
  return (
    <span className="neu-small" style={{ color: 'var(--color-teal)', padding: '4px 8px', fontSize: 12, fontWeight: 700 }}>
      {level}
    </span>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="neu-raised" style={{ padding: 28, textAlign: 'center' }}>
      <div className="display" style={{ fontSize: 20, marginBottom: 8, color: 'var(--ink)' }}>
        {title}
      </div>
      <div style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

export function ToggleSwitch({ checked, onChange }) {
  return (
    <div 
      onClick={onChange}
      style={{ 
        width: 38, 
        height: 22, 
        borderRadius: 999, 
        background: checked ? 'var(--grad-teal)' : '#D3D1C7',
        boxShadow: 'inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
    >
      <div style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '1px 1px 3px var(--shadow-dark)',
        position: 'absolute',
        top: 3,
        left: checked ? 19 : 3,
        transition: 'left 0.2s ease-in-out'
      }} />
    </div>
  );
}

export function ProgressRing({ progress = 0, size = 120, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Track with inset shadow effect via SVG filter or just solid color */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--shadow-dark)"
          strokeWidth={strokeWidth}
          fill="transparent"
          opacity={0.3}
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#tealGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
        <defs>
          <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#11978C" />
            <stop offset="100%" stopColor="#0C6E66" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{Math.round(progress)}%</span>
        <span style={{ fontSize: size * 0.09, color: 'var(--ink-soft)', fontWeight: 600, marginTop: 4, letterSpacing: 0.5 }}>Fortschritt</span>
      </div>
    </div>
  );
}

export function ActivityRings({ rings = [], size = 120, strokeWidth = 10, gap = 2 }) {
  const center = size / 2;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id="ringGrad0" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#11978C" /><stop offset="100%" stopColor="#0C6E66" /></linearGradient>
          <linearGradient id="ringGrad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#C97B4A" /><stop offset="100%" stopColor="#A55E33" /></linearGradient>
          <linearGradient id="ringGrad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E2A65B" /><stop offset="100%" stopColor="#C78531" /></linearGradient>
        </defs>
        {rings.map((progress, idx) => {
          const radius = (size / 2) - (strokeWidth / 2) - (idx * (strokeWidth + gap));
          if (radius <= 0) return null;
          const circumference = radius * 2 * Math.PI;
          const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;
          return (
            <g key={idx}>
              <circle cx={center} cy={center} r={radius} stroke="var(--shadow-dark)" strokeWidth={strokeWidth} fill="transparent" opacity={0.3} />
              <circle cx={center} cy={center} r={radius} stroke={`url(#ringGrad${idx % 3})`} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
