import { useState, useEffect, useMemo } from 'react';
import { useGemini } from '../hooks/useGemini.js';
import { LS, loadVocab, saveVocab } from '../utils/storage.js';
import { speakHumanGerman, speakBrowserFallback } from '../utils/tts.js';
import { showToast } from '../utils/toast.js';
import { EmptyState } from './ui/Atoms.jsx';
import { Icon } from './ui/Icon.jsx';
import { t } from '../i18n.js';
import { getVocabularyPrompt } from '../utils/prompts.js';

function leitnerInterval(box) {
  return [0, 1, 2, 4, 9, 18][box] || 1;
}

export function Vocabulary({ level, appLang }) {
  const { call } = useGemini();
  const [vocab, setVocab] = useState(loadVocab());
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('review'); // review | browse | add
  const [reviewIdx, setReviewIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [speakBusy, setSpeakBusy] = useState(false);

  useEffect(() => saveVocab(vocab), [vocab]);

  const dueCards = useMemo(() => {
    const now = Date.now();
    return vocab.filter((v) => new Date(v.nextReview).getTime() <= now);
  }, [vocab]);

  const generate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    try {
      const sys = getVocabularyPrompt(level);
      const out = await call(sys, [{ role: 'user', parts: [{ text: `Topic: ${topic}` }] }], true);
      const newCards = (out.words || []).map((w) => ({
        id: 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        word: w.word,
        translation: w.translation,
        example: w.example,
        exampleTranslation: w.exampleTranslation,
        topic,
        box: 1,
        nextReview: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }));
      setVocab((v) => [...newCards, ...v]);
      setTopic('');
      setMode('review');
    } catch (e) {
      alert(e.message === 'NO_KEY' ? 'Set your Gemini API key first.' : e.message);
    } finally {
      setLoading(false);
    }
  };

  const speak = async (text) => {
    setSpeakBusy(true);
    try {
      await speakHumanGerman(text, LS.get('gt_gemini_voice', 'Kore'));
    } catch (e) {
      speakBrowserFallback(text.replace(/^(der|die|das)\s/i, ''));
    } finally {
      setSpeakBusy(false);
    }
  };

  const grade = (cardId, quality) => {
    setVocab((v) =>
      v.map((c) => {
        if (c.id !== cardId) return c;
        let box = c.box;
        if (quality === 'again') box = 1;
        else if (quality === 'hard') box = Math.max(1, box);
        else if (quality === 'good') box = Math.min(5, box + 1);
        else box = Math.min(5, box + 2);
        const days = leitnerInterval(box);
        const next = new Date(Date.now() + days * 86400000);
        return { ...c, box, nextReview: next.toISOString() };
      })
    );
    setFlipped(false);
    setReviewIdx((i) => i + 1);
  };

  const now = Date.now();
  const mastered = vocab.filter((v) => v.box >= 4).length;
  const repeat = dueCards.length;
  const current = dueCards[reviewIdx];

  const topics = ['Alle', ...new Set(vocab.map(v => v.topic).filter(Boolean))];

  return (
    <div style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="neu-inset" style={{ padding: '16px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{vocab.length}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{t('voc_total', appLang)}</div>
        </div>
        <div className="neu-inset" style={{ padding: '16px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-teal)' }}>{mastered}</div>
          <div style={{ fontSize: 11, color: 'var(--color-teal)', opacity: 0.8 }}>{t('voc_mastered', appLang)}</div>
        </div>
        <div className="neu-inset" style={{ padding: '16px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-copper)' }}>{repeat}</div>
          <div style={{ fontSize: 11, color: 'var(--color-copper)', opacity: 0.8 }}>{t('voc_review', appLang)}</div>
        </div>
      </div>

      {/* Filters & Add Toggle */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, alignItems: 'center' }} className="scrollbar-hidden">
        <button 
          onClick={() => setMode(mode === 'add' ? 'review' : 'add')} 
          className={mode === 'add' ? 'neu-btn' : 'neu-small'}
          style={{ flexShrink: 0, padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="BookOpen" size={14} /> {t('voc_new', appLang)}
        </button>
        {topics.map(tOption => (
          <button 
            key={tOption} 
            onClick={() => {}} // TODO implement filter
            className={tOption === 'Alle' && mode !== 'add' ? 'neu-btn' : 'neu-small'}
            style={{ flexShrink: 0, padding: '8px 14px', fontSize: 13, color: tOption === 'Alle' && mode !== 'add' ? '#fff' : 'var(--ink)' }}
          >
            {tOption === 'Alle' ? t('voc_all', appLang) : tOption}
          </button>
        ))}
      </div>

      {mode === 'add' && (
        <div className="neu-raised fadein" style={{ padding: 20 }}>
          <div className="display" style={{ fontSize: 16, marginBottom: 12, color: 'var(--ink)' }}>{t('voc_gen_title', appLang)}</div>
          <input
            className="neu-inset"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('voc_gen_ph', appLang)}
            style={{ width: '100%', padding: '12px 14px', marginBottom: 16, color: 'var(--ink)' }}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
          />
          <button className="neu-btn" onClick={generate} disabled={loading || !topic.trim()} style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            {loading ? <span className="spin"><Icon name="Globe" size={16} /></span> : <Icon name="BookOpen" size={16} />}
            {loading ? t('voc_btn_generating', appLang) : t('voc_btn_gen', appLang)}
          </button>
        </div>
      )}

      {/* Flashcard Area */}
      {mode !== 'add' && current && (
        <div>
          <div className="neu-raised fadein" onClick={() => setFlipped(!flipped)} style={{ padding: '24px 20px', textAlign: 'center', position: 'relative', cursor: 'pointer', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="neu-small" style={{ position: 'absolute', top: 16, right: 16, color: 'var(--color-teal)', fontSize: 10, fontWeight: 700, padding: '4px 8px' }}>
              {current.word.match(/^(der|die|das)\s/i) ? t('voc_noun', appLang) : t('voc_word', appLang)}
            </div>
            
            <div style={{ color: 'var(--color-teal)', fontSize: 14, marginBottom: 8, fontWeight: 600 }}>{current.word}</div>
            
            {flipped ? (
              <>
                <div 
                  onDoubleClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(current.translation); showToast(t('copy', appLang) + '!'); }} 
                  style={{ color: 'var(--ink)', fontSize: 26, fontWeight: 700, marginBottom: 16, cursor: 'pointer', textAlign: 'center' }}
                  title={t('copy', appLang)}
                >
                  {current.translation}
                </div>
                <div 
                  onDoubleClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(current.example); showToast(t('copy', appLang) + '!'); }} 
                  style={{ color: 'var(--color-teal)', fontSize: 14, fontStyle: 'italic', marginBottom: 16, cursor: 'pointer', textAlign: 'center' }}
                  title={t('copy', appLang)}
                >
                  "{current.example}"
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <button onClick={(e) => { e.stopPropagation(); speak(current.word); }} disabled={speakBusy} className="neu-small" style={{ color: 'var(--color-teal)', fontSize: 13, fontWeight: 600, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="Volume2" size={14} /> {t('voc_word', appLang)}</button>
                  <button onClick={(e) => { e.stopPropagation(); speak(current.example); }} disabled={speakBusy} className="neu-small" style={{ color: 'var(--color-teal)', fontSize: 13, fontWeight: 600, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="Volume2" size={14} /> {t('voc_sentence', appLang)}</button>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--ink)', fontSize: 26, fontWeight: 700, marginBottom: 16, opacity: 0.1 }}>...</div>
            )}
          </div>
          
          {flipped && (
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }} className="fadein">
              <button onClick={() => grade(current.id, 'again')} className="neu-btn-copper" style={{ flex: 1, padding: '12px', fontSize: 14, fontWeight: 600 }}>
                {t('voc_again', appLang)}
              </button>
              <button onClick={() => grade(current.id, 'good')} className="neu-btn" style={{ flex: 1, padding: '12px', fontSize: 14, fontWeight: 600 }}>
                {t('voc_mastered_btn', appLang)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Word List */}
      <div style={{ paddingBottom: 24, marginTop: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>{t('voc_list', appLang)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vocab.map((c, i) => {
            const isMastered = c.box >= 4;
            return (
              <div key={c.id} className="neu-inset" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{c.word}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{c.translation}</div>
                </div>
                <div className="neu-small" style={{ color: isMastered ? 'var(--color-teal)' : 'var(--color-copper)', fontSize: 11, fontWeight: 700, padding: '4px 8px' }}>
                  {isMastered ? t('voc_mastered', appLang) : t('voc_review', appLang)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
