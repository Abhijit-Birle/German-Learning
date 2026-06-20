import { useState } from 'react';
import { LS } from '../utils/storage.js';
import { t } from '../i18n.js';
import { Icon } from './ui/Icon.jsx';

export function ApiKeyBar({ open, onClose, onSaved, appLang, onLangChange }) {
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
      className="fadein"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(43,42,40,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ alignSelf: 'flex-end', marginRight: '4vw', marginBottom: 16 }}>
        <button 
          className="neu-small"
          onClick={() => onLangChange && onLangChange(appLang === 'de' ? 'en' : 'de')} 
          style={{ padding: '6px 10px', color: 'var(--ink)', fontSize: 12, fontWeight: 700, background: 'var(--app-bg)' }}
        >
          {appLang === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
        </button>
      </div>
      <div className="neu-raised" style={{ padding: 28, width: 'min(480px,92vw)' }}>
        <div className="display" style={{ fontSize: 24, marginBottom: 8, color: 'var(--ink)' }}>
          {t('api_title', appLang)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 24, lineHeight: 1.5 }}>
          {t('api_desc', appLang)}
        </div>

        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-teal)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {t('api_key_label', appLang)}
        </label>
        <input
          className="neu-inset"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIza..."
          style={{
            width: '100%', padding: '12px 14px', marginTop: 8, marginBottom: 20,
            color: 'var(--ink)', fontSize: 14
          }}
        />

        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-teal)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {t('api_model_label', appLang)}
        </label>
        <select
          className="neu-inset"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px', marginTop: 8, marginBottom: 28,
            color: 'var(--ink)', fontSize: 14
          }}
        >
          <option value="gemini-2.5-flash">gemini-2.5-flash (fast, recommended)</option>
          <option value="gemini-2.5-pro">gemini-2.5-pro (higher quality, slower)</option>
          <option value="gemini-2.0-flash">gemini-2.0-flash</option>
        </select>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          {LS.get('gt_apikey', '') && (
            <button className="neu-small" style={{ padding: '10px 16px', color: 'var(--ink)', fontWeight: 600 }} onClick={() => onClose && onClose()}>
              {t('api_cancel', appLang)}
            </button>
          )}
          <button className="neu-btn" style={{ padding: '10px 24px' }} disabled={!key.trim()} onClick={save}>
            {t('api_save', appLang)}
          </button>
        </div>
      </div>
    </div>
  );
}
