export function Loading({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
      <span
        className="spin"
        style={{
          display: 'inline-block',
          width: 14,
          height: 14,
          border: '2px solid var(--line)',
          borderTopColor: 'var(--rust)',
          borderRadius: '50%',
        }}
      />
      <span>{label || 'Thinking…'}</span>
    </div>
  );
}

export function LevelPill({ level }) {
  return (
    <span className="tag" style={{ borderColor: 'var(--teal)', color: 'var(--teal)' }}>
      {level}
    </span>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="card" style={{ padding: 28, textAlign: 'center' }}>
      <div className="display" style={{ fontSize: 20, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{body}</div>
    </div>
  );
}
