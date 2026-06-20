import { useState } from 'react';

export function ExerciseRow({ ex }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
      <div style={{ fontSize: 14 }}>{ex.prompt}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
        <button
          className="btn-outline"
          style={{ padding: '5px 12px', fontSize: 11 }}
          onClick={() => setShow((s) => !s)}
        >
          {show ? 'Hide answer' : 'Show answer'}
        </button>
        {show && <span style={{ fontSize: 13, color: 'var(--good)', fontWeight: 600 }}>{ex.answer}</span>}
      </div>
      {show && ex.hint && (
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 3 }}>💡 {ex.hint}</div>
      )}
    </div>
  );
}
