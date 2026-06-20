import { Icon } from './Icon.jsx';

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
