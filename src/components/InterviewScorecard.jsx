import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './ui/Icon.jsx';
import { ProgressRing } from './ui/Atoms.jsx';
import { useExerciseStore } from '../store/useExerciseStore.js';
import { getScorecardPrompt } from '../utils/interviewPrompts.js';
import { useGemini } from '../hooks/useGemini.js';

export function InterviewScorecard({ onBack, appLang }) {
  const { interviewSession } = useExerciseStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const gemini = useGemini();

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        const historyText = interviewSession.messages.map(m => `${m.role}: ${m.text}`).join('\n');
        const prompt = getScorecardPrompt(interviewSession.topic, interviewSession.germanLevel, historyText);
        
        // Pass jsonSchema=true (the 3rd arg) to useGemini call
        const jsonRes = await gemini.call(prompt, [{ role: 'user', parts: [{ text: 'Generate scorecard.' }] }], true);
        setData(jsonRes);
      } catch (err) {
        console.error(err);
        setError('Konnte Auswertung nicht laden.');
      } finally {
        setLoading(false);
      }
    };
    if (interviewSession.messages.length > 0) {
      fetchScorecard();
    } else {
      setLoading(false);
      setError('Keine Interviewdaten gefunden.');
    }
  }, []);

  const getTopicTitle = (topic) => {
    const map = {
      system_design: 'System Design',
      backend: 'Backend Engineer',
      frontend: 'Frontend Engineer',
      agentic_ai: 'Agentic AI',
      behavioural: 'Behavioural'
    };
    return map[topic] || topic;
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <Icon name="Loader" className="spin" size={48} color="var(--color-teal)" />
        <div style={{ marginTop: 16, fontWeight: 700, color: 'var(--ink)' }}>Analysiere Interview...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--color-copper)', fontWeight: 700, marginBottom: 16 }}>{error}</div>
        <button className="neu-btn" onClick={onBack} style={{ padding: '12px 24px' }}>Zurück</button>
      </div>
    );
  }

  // Determine verdict color
  let verdictColor = 'var(--ink)';
  if (data.verdict.includes('Bereit')) verdictColor = 'var(--color-teal)';
  else if (data.verdict.includes('fast')) verdictColor = '#e6a822';
  else verdictColor = 'var(--color-copper)';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--app-bg)', borderBottom: '1px solid var(--shadow-light)' }}>
        <button className="neu-small" onClick={onBack} style={{ padding: '6px', color: 'var(--ink)' }}>
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
          Ergebnisse <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>{getTopicTitle(interviewSession.topic)}</span>
        </div>
      </header>

      <div className="scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Main Score */}
        <div className="neu-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-soft)' }}>Gesamtergebnis</div>
          <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ProgressRing progress={data.composite} size={120} strokeWidth={8} color={verdictColor} />
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{data.composite}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>von 100</span>
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: verdictColor, textAlign: 'center' }}>
            "{data.verdict}"
          </div>
        </div>

        {/* 2x2 Metric Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {Object.entries(data.scores).map(([key, metric]) => (
            <div key={key} className="neu-panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <ProgressRing progress={metric.score} size={64} strokeWidth={6} color="var(--color-teal)" />
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Strengths & Improvements */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="neu-panel" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-teal)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="CheckCircle" size={16} /> Stärken
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="neu-panel" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-copper)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="AlertCircle" size={16} /> Verbesserungen
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.improvements.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>

        {/* German Errors Diff */}
        {data.german_errors && data.german_errors.length > 0 && (
          <div className="neu-panel" style={{ padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>Deutsche Fehler im Interview</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.german_errors.map((err, i) => {
                const parts = err.split('->');
                if (parts.length === 2) {
                  return (
                    <div key={i} className="neu-bubble-correction">
                      <span style={{ textDecoration: 'line-through', opacity: 0.7, color: 'var(--color-copper)' }}>{parts[0].trim()}</span>
                      <br/>
                      <span style={{ fontWeight: 700, color: 'var(--color-teal)' }}>{parts[1].trim()}</span>
                    </div>
                  );
                }
                return <div key={i} className="neu-bubble-correction">{err}</div>;
              })}
            </div>
          </div>
        )}

        {/* Recommended Topics */}
        {data.recommended_topics && data.recommended_topics.length > 0 && (
          <div className="neu-panel" style={{ padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>Empfohlene Themen</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.recommended_topics.map((topic, i) => (
                <div key={i} className="neu-badge" style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                  {topic}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingBottom: 24 }}>
          <button className="neu-btn" onClick={onBack} style={{ flex: 1, padding: 16, fontWeight: 700 }}>
            Fertig
          </button>
        </div>

      </div>
    </div>
  );
}
