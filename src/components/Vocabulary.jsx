import { useState, useEffect, useMemo } from 'react';
import { useGemini } from '../hooks/useGemini.js';
import { LS, loadVocab, saveVocab } from '../utils/storage.js';
import { speakHumanGerman, speakBrowserFallback } from '../utils/tts.js';
import { EmptyState } from './ui/Atoms.jsx';

function leitnerInterval(box) {
  return [0, 1, 2, 4, 9, 18][box] || 1;
}

export function Vocabulary({ level }) {
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
      const sys = `You are a German vocabulary generator for a CEFR ${level} learner. Given a topic, produce 8 useful German words/phrases appropriate to that level. Return ONLY raw JSON: {"words":[{"word":"<German word with article if noun, e.g. 'die Wohnung'>","translation":"<English>","example":"<natural German example sentence using the word>","exampleTranslation":"<English translation of example>"}]}`;
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ background: '#252424', borderRadius: 8, padding: '16px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{vocab.length}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>gesamt</div>
        </div>
        <div style={{ background: '#1F4A23', borderRadius: 8, padding: '16px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#48BB78' }}>{mastered}</div>
          <div style={{ fontSize: 11, color: '#48BB78', opacity: 0.8 }}>gemeistert</div>
        </div>
        <div style={{ background: '#5C4314', borderRadius: 8, padding: '16px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#D69E2E' }}>{repeat}</div>
          <div style={{ fontSize: 11, color: '#D69E2E', opacity: 0.8 }}>zur wiederholung</div>
        </div>
      </div>

      {/* Filters & Add Toggle */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, alignItems: 'center' }} className="scrollbar-hidden">
        <button onClick={() => setMode(mode === 'add' ? 'review' : 'add')} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, background: mode === 'add' ? '#2B4B70' : 'transparent', border: '1px solid var(--line)', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
          + Neu
        </button>
        {topics.map(t => (
          <button key={t} style={{ flexShrink: 0, padding: '6px 16px', borderRadius: 20, background: t === 'Alle' && mode !== 'add' ? '#2B4B70' : 'transparent', border: '1px solid var(--line)', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {mode === 'add' && (
        <div className="card fadein" style={{ padding: 20, background: '#252424', borderRadius: 12 }}>
          <div className="display" style={{ fontSize: 16, marginBottom: 10, color: '#fff' }}>Generate vocabulary by topic</div>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Beruf, Alltag…"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 12, background: '#1A1A1A', color: '#fff', outline: 'none' }}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
          />
          <button className="btn" onClick={generate} disabled={loading || !topic.trim()} style={{ width: '100%', background: '#2B4B70', border: 'none', cursor: 'pointer', padding: '12px', borderRadius: 8, color: '#fff' }}>
            {loading ? 'Generating…' : `Generate 8 words`}
          </button>
        </div>
      )}

      {/* Flashcard Area */}
      {mode !== 'add' && current && (
        <div>
          <div className="card fadein" onClick={() => setFlipped(!flipped)} style={{ background: '#E8E5FA', padding: '24px 20px', borderRadius: 16, textAlign: 'center', position: 'relative', cursor: 'pointer', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, background: '#C4BEF2', color: '#41328C', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 12 }}>
              {current.word.match(/^(der|die|das)\s/i) ? 'Substantiv' : 'Wort'}
            </div>
            
            <div style={{ color: '#41328C', fontSize: 14, marginBottom: 8 }}>{current.word}</div>
            
            {flipped ? (
              <>
                <div style={{ color: '#1B1440', fontSize: 26, fontWeight: 700, marginBottom: 16 }}>{current.translation}</div>
                <div style={{ color: '#41328C', fontSize: 14, fontStyle: 'italic', marginBottom: 16 }}>"{current.example}"</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <button onClick={(e) => { e.stopPropagation(); speak(current.word); }} disabled={speakBusy} style={{ background: 'transparent', border: 'none', color: '#41328C', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 12px', border: '1px solid rgba(65,50,140,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>🔊 Wort</button>
                  <button onClick={(e) => { e.stopPropagation(); speak(current.example); }} disabled={speakBusy} style={{ background: 'transparent', border: 'none', color: '#41328C', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 12px', border: '1px solid rgba(65,50,140,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>🔊 Satz</button>
                </div>
              </>
            ) : (
              <div style={{ color: '#41328C', fontSize: 26, fontWeight: 700, marginBottom: 16, opacity: 0.1 }}>...</div>
            )}
          </div>
          
          {flipped && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }} className="fadein">
              <button onClick={() => grade(current.id, 'again')} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #E55039', borderRadius: 8, color: '#E55039', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                Nochmal üben
              </button>
              <button onClick={() => grade(current.id, 'good')} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #48BB78', borderRadius: 8, color: '#48BB78', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                Gemeistert
              </button>
            </div>
          )}
        </div>
      )}

      {/* Word List */}
      <div style={{ paddingBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Wortliste</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {vocab.map((c, i) => {
            const isMastered = c.box >= 4;
            return (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i < vocab.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{c.word}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{c.translation}</div>
                </div>
                <div style={{ background: isMastered ? '#1F4A23' : '#5C4314', color: isMastered ? '#48BB78' : '#D69E2E', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 4 }}>
                  {isMastered ? 'gemeistert' : 'wiederholen'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
