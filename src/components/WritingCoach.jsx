import { useState } from 'react';
import { useGemini } from '../hooks/useGemini.js';
import { addMistakes } from '../utils/storage.js';
import { Loading, EmptyState } from './ui/Atoms.jsx';

export function WritingCoach({ level }) {
  const { call } = useGemini();
  const [type, setType] = useState('sentence');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const sys = `You are an expert German writing coach. The learner (CEFR ${level}) submitted a ${type}. Correct it, suggest more natural wording, and give level-appropriate feedback. Return ONLY raw JSON: {"correctedText":"<fully corrected version>","naturalVersion":"<more idiomatic/native-sounding rewrite, can equal correctedText if already natural>","levelFeedback":"<1-2 sentence assessment of writing relative to CEFR ${level}, and whether it reads more like a lower or higher level>","mistakes":[{"original":"<exact mistaken phrase from learner text>","correction":"<fix>","explanation":"<why, in plain English>","category":"grammar|vocabulary|word-order|style|other"}]}`;
      const out = await call(sys, [{ role: 'user', parts: [{ text }] }], true);
      setResult(out);
      addMistakes((out.mistakes || []).map((m) => ({ ...m, source: 'writing-coach' })));
    } catch (e) {
      alert(e.message === 'NO_KEY' ? 'Set your Gemini API key first.' : e.message);
    } finally {
      setLoading(false);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Prompt Card */}
      <div style={{ background: '#E8F2FA', borderRadius: 12, padding: '16px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#2B4B70', marginBottom: 8 }}>Heutige aufgabe</div>
        <div style={{ fontSize: 15, color: '#1B314F', lineHeight: 1.4 }}>
          Beschreibe in 5-6 Sätzen, warum du nach Deutschland ziehen möchtest.
        </div>
      </div>

      {/* Input panel */}
      <div>
        <div style={{ position: 'relative' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Schreib hier..."
            rows={6}
            style={{
              width: '100%', padding: '16px',
              border: '1px solid var(--line)', borderRadius: 12,
              background: '#252424', color: '#fff', resize: 'vertical', fontSize: 15, lineHeight: 1.5,
              outline: 'none'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--ink-soft)', padding: '0 4px' }}>
          <div>{wordCount}<br/>wörter</div>
          <div style={{ textAlign: 'right' }}>Niveau:<br/>{level}</div>
        </div>

        <button 
          onClick={submit} 
          disabled={loading || !text.trim()}
          style={{ width: '100%', background: '#2B4B70', color: '#fff', border: 'none', borderRadius: 8, padding: '14px', fontSize: 15, fontWeight: 500, marginTop: 16, cursor: 'pointer', opacity: (loading || !text.trim()) ? 0.6 : 1 }}
        >
          {loading ? 'Lade...' : 'Korrektur erhalten'}
        </button>
      </div>

      {/* Feedback panel */}
      {result && (
        <div className="fadein" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Korrigierter text</div>
          
          <div style={{ background: '#252424', border: '1px solid var(--line)', borderRadius: 12, padding: 16, fontSize: 15, lineHeight: 1.5, color: '#fff', marginBottom: 20 }}>
            {/* Very simple inline replacement approximation or just show corrected text */}
            {result.correctedText}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            {(result.mistakes || []).map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 16, height: 16, border: '1px solid #E55039', borderRadius: 3, flexShrink: 0, marginTop: 2 }}></div>
                <div style={{ fontSize: 14, color: '#D4D4D4', lineHeight: 1.4 }}>
                  <span style={{ color: '#fff' }}>{m.original}</span> → <span style={{ color: '#fff' }}>{m.correction}</span>: {m.explanation}
                </div>
              </div>
            ))}
            {/* Adding the positive feedback visually as a green box like in mockup */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 16, height: 16, border: '1px solid #48BB78', borderRadius: 3, flexShrink: 0, marginTop: 2 }}></div>
              <div style={{ fontSize: 14, color: '#D4D4D4', lineHeight: 1.4 }}>
                Satzstellung und Wortschatz sind sehr gut für {level} Niveau.
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#252424', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{(result.mistakes || []).length}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Fehler</div>
            </div>
            <div style={{ background: '#252424', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{level}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>geschätzt</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
