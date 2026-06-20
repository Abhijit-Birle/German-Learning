import { useState } from 'react';
import { LS } from '../utils/storage.js';

export function QuickTranslator({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const translate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const key = LS.get('gt_apikey', '');
      if (!key) throw new Error('NO_KEY');
      const mdl = LS.get('gt_model', 'gemini-2.5-flash');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${key}`;

      const prompt = `Translate the following English text into German.
Return ONLY a raw JSON object (no markdown, no explanation) in exactly this shape:
{"german":"<exact German translation — keep articles for nouns, e.g. die Wohnung>","pronunciation":"<IPA or simple phonetic hint, e.g. [ˈvɔːnʊŋ]>","example":"<one natural German sentence using this translation>","exampleTranslation":"<English translation of the example sentence>"}

English text to translate: "${input.trim()}"`;

      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error('API ' + res.status + ': ' + t.slice(0, 200));
      }

      const data = await res.json();
      const raw = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
      const cleaned = raw.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      setResult(JSON.parse(cleaned));
    } catch (e) {
      setResult({ error: e.message === 'NO_KEY' ? 'Set your Gemini API key first.' : e.message });
    } finally {
      setLoading(false);
    }
  };

  const saveToVocab = () => {
    if (!result || result.error) return;
    const newCard = {
      id: 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      word: result.german,
      translation: input.trim(),
      example: result.example,
      exampleTranslation: result.exampleTranslation,
      topic: 'quick-translate',
      box: 1,
      nextReview: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const existing = LS.get('gt_vocab', []);
    LS.set('gt_vocab', [newCard, ...existing]);
    setSaved(true);
    onSaved && onSaved();
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        id="quick-translate-btn"
        className="btn-outline"
        onClick={() => { setOpen((o) => !o); setResult(null); setSaved(false); }}
        title="Quick Translate (English → German)"
        style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        🔤 Translate
      </button>

      {open && (
        <div
          className="card fadein"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 320,
            padding: 16,
            zIndex: 40,
            boxShadow: '0 8px 32px rgba(34,32,28,0.18)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span>🇬🇧→🇩🇪 Quick Translator</span>
            <button
              onClick={() => setOpen(false)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <input
              id="translator-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && translate()}
              placeholder="English word or phrase…"
              style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13 }}
              autoFocus
            />
            <button
              className="btn"
              onClick={translate}
              disabled={loading || !input.trim()}
              style={{ padding: '8px 14px', fontSize: 12 }}
            >
              {loading ? '⏳' : 'Go'}
            </button>
          </div>

          {result && !result.error && (
            <div className="fadein" style={{ background: '#fdf3e3', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{result.german}</div>
              {result.pronunciation && (
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 6 }}>{result.pronunciation}</div>
              )}
              <div style={{ fontSize: 12, fontStyle: 'italic', marginBottom: 4 }}>{result.example}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 10 }}>{result.exampleTranslation}</div>
              <button
                className="btn"
                onClick={saveToVocab}
                disabled={saved}
                style={{ fontSize: 11, padding: '6px 14px' }}
              >
                {saved ? '✓ Saved to vocab!' : '+ Save to Vocabulary'}
              </button>
            </div>
          )}

          {result && result.error && (
            <div style={{ color: 'var(--bad)', fontSize: 12 }}>{result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
