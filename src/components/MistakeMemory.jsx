import { useState, useMemo } from 'react';
import { useGemini } from '../hooks/useGemini.js';
import { loadMistakes } from '../utils/storage.js';
import { EmptyState } from './ui/Atoms.jsx';
import { ExerciseRow } from './ExerciseRow.jsx';

export function MistakeMemory({ level }) {
  const { call } = useGemini();
  const [mistakes, setMistakes] = useState(loadMistakes());
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState(null);

  const refresh = () => setMistakes(loadMistakes());

  const byCategory = useMemo(() => {
    const map = {};
    mistakes.forEach((m) => { map[m.category] = (map[m.category] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [mistakes]);

  const trend = useMemo(() => {
    const days = {};
    mistakes.forEach((m) => {
      const d = new Date(m.date).toLocaleDateString();
      days[d] = (days[d] || 0) + 1;
    });
    return Object.entries(days).slice(-10);
  }, [mistakes]);

  const genExercises = async () => {
    if (loading) return;
    if (mistakes.length === 0) {
      alert('No mistakes recorded yet — chat with the tutor or use Writing Coach first.');
      return;
    }
    setLoading(true);
    try {
      const weak = byCategory.slice(0, 3).map((c) => c[0]).join(', ');
      const examples = mistakes
        .slice(0, 12)
        .map((m) => `- (${m.category}) wrote "${m.original}" should be "${m.correction}": ${m.explanation}`)
        .join('\n');
      const sys = `You are a German tutor creating targeted practice exercises for a CEFR ${level} learner based on their real mistakes. Their weakest areas are: ${weak}.
Recent mistakes:
${examples}
Create 5 short targeted exercises (fill-in-the-blank or correct-the-sentence) that directly address these weak patterns. Return ONLY raw JSON: {"exercises":[{"type":"fill-in-blank|correct-the-sentence","prompt":"<German sentence with ___ or with an error>","answer":"<correct answer>","hint":"<short English hint about the rule>"}]}`;
      const out = await call(sys, [{ role: 'user', parts: [{ text: 'Generate exercises now.' }] }], true);
      setExercises(out.exercises || []);
    } catch (e) {
      alert(e.message === 'NO_KEY' ? 'Set your Gemini API key first.' : e.message);
    } finally {
      setLoading(false);
    }
  };

  const maxTrend = Math.max(1, ...trend.map((t) => t[1]));

  const [filter, setFilter] = useState('Alle');
  const mostFrequent = byCategory.length > 0 ? byCategory[0] : null;

  const categories = ['Alle', ...new Set(mistakes.map(m => m.category).filter(Boolean))];

  const filteredMistakes = filter === 'Alle' ? mistakes : mistakes.filter(m => m.category === filter);

  return (
    <div style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Top Card: Häufigstes Muster */}
      <div style={{ background: '#FAEAE8', borderRadius: 12, padding: '16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #5C3232', borderRadius: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ display: 'block', width: 12, height: 12, border: '2px solid #5C3232' }}></span>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#5C3232' }}>Häufigstes Muster</div>
          <div style={{ fontSize: 13, color: '#A8402B' }}>
            {mostFrequent ? `${mostFrequent[0]} — ${mostFrequent[1]} mal` : 'Noch keine Muster'}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }} className="scrollbar-hidden">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                flexShrink: 0, padding: '6px 16px', borderRadius: 20,
                background: filter === c ? '#2B4B70' : 'transparent',
                border: '1px solid var(--line)', color: '#fff', fontSize: 13, cursor: 'pointer'
              }}
            >
              {c}
            </button>
          ))}
        </div>
        {/* Progress bar below filters */}
        <div style={{ height: 6, background: '#3B3A39', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
          <div style={{ width: '40%', height: '100%', background: '#5C5B5A', borderRadius: 3 }}></div>
        </div>
      </div>

      {/* Mistake List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredMistakes.length === 0 ? (
          <EmptyState title="Keine Fehler" body="Super! Du hast hier keine Fehler gemeldet." />
        ) : (
          filteredMistakes.map((m) => {
            const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(m.date).getTime()) / (1000 * 3600 * 24)));
            
            // Generate a color based on category name roughly
            let badgeBg = '#5C3232'; // Default red
            if (m.category.toLowerCase().includes('artikel')) badgeBg = '#5C4314'; // Yellow-brown
            if (m.category.toLowerCase().includes('wort')) badgeBg = '#2B4B70'; // Blue

            return (
              <div key={m.id} style={{ background: '#252424', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ background: badgeBg, color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 12 }}>
                    {m.category}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', textAlign: 'right', lineHeight: 1.2 }}>
                    vor {daysAgo}<br/>Tagen
                  </div>
                </div>
                
                <div style={{ fontSize: 14, color: 'var(--ink-soft)', textDecoration: 'line-through', marginBottom: 4 }}>
                  {m.original}
                </div>
                <div style={{ fontSize: 14, color: '#48BB78', fontWeight: 500, marginBottom: 8 }}>
                  {m.correction}
                </div>
                <div style={{ fontSize: 13, color: '#D4D4D4' }}>
                  {m.explanation}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Hidden functionalities for now but accessible via a button if needed */}
      <button onClick={genExercises} style={{ background: 'transparent', border: '1px dashed var(--line)', borderRadius: 8, padding: 12, color: 'var(--ink-soft)', fontSize: 13, marginTop: 8, cursor: 'pointer', textAlign: 'center' }}>
        {loading ? 'Generiere...' : 'Übungen generieren'}
      </button>

      {exercises && (
        <div className="card fadein" style={{ padding: 18, marginBottom: 20 }}>
          <div className="display" style={{ fontSize: 16, marginBottom: 10 }}>Targeted exercises</div>
          {exercises.map((ex, i) => <ExerciseRow key={i} ex={ex} />)}
        </div>
      )}

    </div>
  );
}
