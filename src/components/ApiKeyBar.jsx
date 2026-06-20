import { useState } from 'react';
import { LS } from '../utils/storage.js';

export function ApiKeyBar({ open, onClose, onSaved }) {
  const [key, setKey] = useState(LS.get('gt_apikey', ''));
  const [model, setModel] = useState(LS.get('gt_model', 'gemini-2.5-flash'));

  const save = () => {
    LS.set('gt_apikey', key.trim());
    LS.set('gt_model', model.trim() || 'gemini-2.5-flash');
    onClose && onClose();
    onSaved && onSaved();
  };

  if (!open) return null;

  return (
    <div
      className="card fadein"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(34,32,28,0.55)',
        borderRadius: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="card" style={{ padding: 28, width: 'min(480px,92vw)', background: 'var(--card)' }}>
        <div className="display" style={{ fontSize: 24, marginBottom: 4 }}>
          Connect your Gemini key
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 18, lineHeight: 1.5 }}>
          Get a free key at <span className="mono">aistudio.google.com/apikey</span>. It's stored only in your
          browser's local storage — never sent anywhere except Google's API.
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          API Key
        </label>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIza..."
          style={{
            width: '100%', padding: '10px 12px', marginTop: 6, marginBottom: 14,
            border: '1px solid var(--line)', borderRadius: 8, background: '#fff',
          }}
        />

        <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          Model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', marginTop: 6, marginBottom: 18,
            border: '1px solid var(--line)', borderRadius: 8, background: '#fff',
          }}
        >
          <option value="gemini-2.5-flash">gemini-2.5-flash (fast, recommended)</option>
          <option value="gemini-2.5-pro">gemini-2.5-pro (higher quality, slower)</option>
          <option value="gemini-2.0-flash">gemini-2.0-flash</option>
        </select>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {LS.get('gt_apikey', '') && (
            <button className="btn-outline" onClick={() => onClose && onClose()}>
              Cancel
            </button>
          )}
          <button className="btn" disabled={!key.trim()} onClick={save}>
            Save &amp; continue
          </button>
        </div>
      </div>
    </div>
  );
}
