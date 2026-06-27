import { useState, useMemo } from 'react';
import { useGemini } from '../hooks/useGemini.js';
import { loadMistakes } from '../utils/storage.js';
import { EmptyState } from './ui/Atoms.jsx';
import { ExerciseRow } from './ExerciseRow.jsx';
import { Icon } from './ui/Icon.jsx';
import { t } from '../i18n.js';
import { getMistakeMemoryPrompt } from '../utils/prompts.js';

export function MistakeMemory({ level, appLang }) {
  const { call } = useGemini();
  const [mistakes, setMistakes] = useState(loadMistakes());
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState(null);

  const refresh = () => setMistakes(loadMistakes());

  const byCategory = useMemo(() => {
    const counts = {};
    mistakes.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
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
      const sys = getMistakeMemoryPrompt(level, weak, examples);
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
      <div className="neu-inset" style={{ padding: '16px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <div className="neu-small" style={{ width: 40, height: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          <Icon name="AlertTriangle" size={20} color="var(--color-copper)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{t('mis_pattern', appLang)}</div>
          <div style={{ fontSize: 13, color: 'var(--color-copper)', fontWeight: 600, marginTop: 4 }}>
            {mostFrequent ? `${mostFrequent[0]} — ${mostFrequent[1]} ${t('mis_times', appLang)}` : t('mis_no_pattern', appLang)}
          </div>
        </div>
        {mostFrequent && (
          <button 
            onClick={genExercises} 
            disabled={loading}
            className="neu-btn" 
            style={{ padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            {loading ? <span className="pulse-dot" style={{ width: 6, height: 6, background: '#fff' }} /> : <Icon name="Target" size={14} color="#fff" />} Üben
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }} className="scrollbar-hidden">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={filter === c ? 'neu-btn' : 'neu-small'}
              style={{
                flexShrink: 0, padding: '8px 16px', fontSize: 13, color: filter === c ? '#fff' : 'var(--ink)'
              }}
            >
              {c === 'Alle' ? t('voc_all', appLang) : c}
            </button>
          ))}
        </div>
      </div>

      {/* Mistake List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredMistakes.length === 0 ? (
          <EmptyState title={t('mis_empty', appLang)} body={t('mis_empty_body', appLang)} />
        ) : (
          filteredMistakes.map((m) => {
            const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(m.date).getTime()) / (1000 * 3600 * 24)));
            
            return (
              <div key={m.id} className="neu-raised" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div className="neu-small" style={{ color: 'var(--color-copper)', fontSize: 11, fontWeight: 700, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="PenTool" size={12} /> {m.category}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600, textAlign: 'right', lineHeight: 1.2 }}>
                    {t('mis_days_ago', appLang).replace('{x}', daysAgo)}
                  </div>
                </div>
                
                <div style={{ fontSize: 14, color: 'var(--ink-soft)', textDecoration: 'line-through', marginBottom: 6 }}>
                  {m.original}
                </div>
                <div style={{ fontSize: 15, color: 'var(--color-teal)', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <Icon name="ArrowRight" size={16} style={{ marginTop: 2 }} /> {m.correction}
                </div>
                <div className="neu-inset" style={{ fontSize: 13, color: 'var(--ink)', padding: '10px 12px', marginTop: 12 }}>
                  {m.explanation}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button onClick={genExercises} className="neu-small" style={{ padding: 16, color: 'var(--ink)', fontSize: 14, marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontWeight: 600 }}>
        <Icon name="Layers" size={18} /> {loading ? t('mis_btn_generating', appLang) : (appLang === 'de' ? 'Übungen generieren' : 'Generate Exercises')}
      </button>

      {exercises && (
        <div className="neu-raised fadein" style={{ padding: 18, marginBottom: 20 }}>
          <div className="display" style={{ fontSize: 16, marginBottom: 12 }}>{t('mis_targeted', appLang)}</div>
          {exercises.map((ex, i) => <ExerciseRow key={i} ex={ex} />)}
        </div>
      )}

    </div>
  );
}
