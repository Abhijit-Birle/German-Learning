import { useEffect, useState } from 'react';
import { useGemini } from '../hooks/useGemini.js';
import { addMistakes, loadWritings, addWriting } from '../utils/storage.js';
import { Loading, EmptyState } from './ui/Atoms.jsx';
import { Icon } from './ui/Icon.jsx';
import { t } from '../i18n.js';
import { getWritingCoachPrompt } from '../utils/prompts.js';

export function WritingCoach({ level, appLang, onTaskStart, onTaskEnd, isTaskActive }) {
  const { call } = useGemini();
  const [type, setType] = useState('sentence');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [writings, setWritings] = useState([]);

  useEffect(() => {
    if (!isTaskActive) {
      setWritings(loadWritings());
    }
  }, [isTaskActive]);

  const submit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const sys = getWritingCoachPrompt(level, type);
      const out = await call(sys, [{ role: 'user', parts: [{ text }] }], true);
      setResult(out);
      addMistakes((out.mistakes || []).map((m) => ({ ...m, source: 'writing-coach' })));
      addWriting({ original: text, result: out });
    } catch (e) {
      alert(e.message === 'NO_KEY' ? 'Set your Gemini API key first.' : e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isTaskActive) {
    return (
      <div style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Task Overview */}
        <div className="neu-raised" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-copper)' }}>
            <div className="neu-small" style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="PenTool" size={20} color="var(--color-copper)" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('wr_task', appLang)}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{t('wr_task_desc', appLang)}</div>
            </div>
          </div>
          
          <button 
            className="neu-btn" 
            onClick={() => { setText(''); setResult(null); onTaskStart && onTaskStart(); }}
            style={{ width: '100%', padding: '14px', fontSize: 15, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            <Icon name="ArrowRight" size={18} /> {t('wr_btn_start', appLang) || 'Start Writing'}
          </button>
        </div>

        {/* History */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--ink)' }}>{t('wr_history', appLang)}</div>
          {writings.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13, padding: '24px 0' }}>{t('wr_history_empty', appLang)}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {writings.map((w, i) => (
                <div key={i} className="neu-raised" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{new Date(w.date).toLocaleDateString()}</div>
                  <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {w.original}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-copper)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="AlertTriangle" size={14} /> {(w.result?.mistakes || []).length} {t('wr_mistakes', appLang)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--app-bg)' }}>
        <button className="neu-small" onClick={() => onTaskEnd && onTaskEnd()} style={{ padding: '6px', color: 'var(--ink)' }}>
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          {t('wr_task', appLang)}
        </div>
        <div style={{ width: 32 }}></div> {/* Spacer for centering */}
      </div>

      <div className="scrollbar" style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="neu-raised" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{t('wr_task_desc', appLang)}</div>
        </div>

      {/* Input Area */}
      <div className="neu-inset" style={{ padding: 4, display: 'flex', flexDirection: 'column' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('wr_placeholder', appLang)}
          style={{ width: '100%', height: 160, padding: 12, resize: 'none', background: 'transparent', color: 'var(--ink)', outline: 'none' }}
        />
      </div>
        
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'var(--ink-soft)', padding: '0 8px', fontWeight: 600 }}>
        <div>{text.split(/\s+/).filter(w => w.length > 0).length}<br/>{t('wr_words', appLang)}</div>
        <div style={{ textAlign: 'right' }}>{t('wr_level', appLang)}:<br/>{level}</div>
      </div>

      <button 
        className="neu-btn"
        onClick={submit} 
        disabled={loading || !text.trim()}
        style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
      >
        {loading ? <span className="spin"><Icon name="Globe" size={18} /></span> : <Icon name="CheckCircle" size={18} />}
        {loading ? t('wr_btn_loading', appLang) : t('wr_btn_get', appLang)}
      </button>

      {/* Feedback panel */}
      {result && (
        <div className="fadein" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>{t('wr_corrected', appLang)}</div>
          
          <div className="neu-inset" style={{ padding: 16, fontSize: 15, lineHeight: 1.5, color: 'var(--ink)', marginBottom: 20 }}>
            {result.correctedText}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {(result.mistakes || []).map((m, i) => (
              <div key={i} className="neu-small" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--color-copper)', flexShrink: 0, marginTop: 2 }}>
                  <Icon name="AlertTriangle" size={16} />
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--color-copper)', textDecoration: 'line-through' }}>{m.original}</span> → <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>{m.correction}</span>: {m.explanation}
                </div>
              </div>
            ))}
            <div className="neu-small" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--color-teal)', flexShrink: 0, marginTop: 2 }}>
                <Icon name="Check" size={16} />
              </div>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                {result.levelFeedback || `Satzstellung und Wortschatz sind sehr gut für ${level} Niveau.`}
              </div>
            </div>
          </div>

            {/* Bottom Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="neu-inset" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-copper)' }}>{(result.mistakes || []).length}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, marginTop: 4 }}>{t('wr_mistakes', appLang)}</div>
              </div>
              <div className="neu-inset" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-teal)' }}>{level}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, marginTop: 4 }}>{t('wr_estimated', appLang)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
