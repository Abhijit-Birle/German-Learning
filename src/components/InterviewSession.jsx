import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './ui/Icon.jsx';
import { useExerciseStore } from '../store/useExerciseStore.js';
import { INTERVIEW_SYSTEM_PROMPTS } from '../utils/interviewPrompts.js';
import { useGemini } from '../hooks/useGemini.js';

export function InterviewSession({ onBack, onComplete, appLang }) {
  const { 
    interviewSession, 
    startInterviewSession, 
    appendInterviewMessage,
    endInterviewSession
  } = useExerciseStore();
  
  const [config, setConfig] = useState({
    level: interviewSession.germanLevel || 'B1',
    difficulty: interviewSession.difficulty || 'Mid-Level',
    count: interviewSession.questionCount || 8
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  
  const gemini = useGemini();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [interviewSession.messages, loading]);

  // End condition checker
  const checkInterviewEnd = (aiMessage) => {
    const endPhrases = [
      "Das Interview ist jetzt beendet",
      "Vielen Dank. Das Interview ist",
      "Damit beenden wir das Interview"
    ];
    return endPhrases.some(phrase => aiMessage.includes(phrase));
  };

  const handleStart = async () => {
    startInterviewSession(interviewSession.topic, config.level, config.difficulty, config.count);
    
    // Trigger initial message from AI
    setLoading(true);
    try {
      const prompt = INTERVIEW_SYSTEM_PROMPTS[interviewSession.topic](config.level, config.difficulty, config.count);
      const responseText = await gemini.call(prompt, [{ role: 'user', parts: [{ text: 'Guten Tag. Ich bin bereit für das Interview.' }] }], false);
      appendInterviewMessage('model', responseText);
    } catch (e) {
      console.error(e);
      appendInterviewMessage('model', 'Fehler beim Starten des Interviews. Bitte überprüfen Sie den API-Key.');
    }
    setLoading(false);
  };

  const send = async () => {
    if (!input.trim() || loading || !gemini.hasKey) return;
    
    const userMsg = input.trim();
    setInput('');
    appendInterviewMessage('user', userMsg);
    setLoading(true);

    try {
      const prompt = INTERVIEW_SYSTEM_PROMPTS[interviewSession.topic](interviewSession.germanLevel, interviewSession.difficulty, interviewSession.questionCount);
      
      // Build history
      const history = interviewSession.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      history.push({ role: 'user', parts: [{ text: userMsg }] });

      const responseText = await gemini.call(prompt, history, false);
      appendInterviewMessage('model', responseText);

      if (checkInterviewEnd(responseText)) {
        endInterviewSession();
        setTimeout(() => {
          onComplete(); // Navigate to scorecard
        }, 2500);
      }
    } catch (e) {
      console.error(e);
      appendInterviewMessage('model', 'Fehler bei der Kommunikation mit dem Server.');
    }
    
    setLoading(false);
  };

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

  if (!interviewSession.startedAt) {
    // Config Screen
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <div className="neu-panel" style={{ width: '100%', maxWidth: 400, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>{getTopicTitle(interviewSession.topic)}</h2>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 4 }}>Interview Setup</div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Deutschniveau</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['A2', 'B1', 'B2', 'C1'].map(lvl => (
                <button 
                  key={lvl} 
                  onClick={() => setConfig(c => ({...c, level: lvl}))}
                  className={config.level === lvl ? 'neu-btn' : 'neu-btn-hollow'}
                  style={{ flex: 1, padding: 12, fontWeight: 700 }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Schwierigkeitsgrad</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Junior', 'Mid-Level', 'Senior'].map(lvl => (
                <button 
                  key={lvl} 
                  onClick={() => setConfig(c => ({...c, difficulty: lvl}))}
                  className={config.difficulty === lvl ? 'neu-btn' : 'neu-btn-hollow'}
                  style={{ flex: 1, padding: 12, fontWeight: 700, fontSize: 12 }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Anzahl Fragen</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[5, 8, 10].map(cnt => (
                <button 
                  key={cnt} 
                  onClick={() => setConfig(c => ({...c, count: cnt}))}
                  className={config.count === cnt ? 'neu-btn' : 'neu-btn-hollow'}
                  style={{ flex: 1, padding: 12, fontWeight: 700 }}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          <button className="neu-btn" onClick={handleStart} style={{ padding: 16, marginTop: 16, fontWeight: 700 }}>
            Interview starten
          </button>
          <button className="neu-btn-hollow" onClick={onBack} style={{ padding: 12, fontWeight: 700, color: 'var(--color-copper)' }}>
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--app-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="neu-small" onClick={onBack} style={{ padding: '6px', color: 'var(--ink)' }}>
            <Icon name="ChevronLeft" size={20} />
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{getTopicTitle(interviewSession.topic)}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              Level {interviewSession.germanLevel} • {interviewSession.difficulty}
            </div>
          </div>
        </div>
        
        <button 
          onClick={onBack}
          className="neu-small" 
          style={{ padding: '8px 16px', color: 'var(--color-copper)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="Flag" size={14} /> Beenden
        </button>
      </header>

      {interviewSession.topic === 'behavioural' && (
        <div style={{ padding: '8px 16px', display: 'flex', gap: 8, borderBottom: '1px solid var(--shadow-light)' }}>
          {['S: Situation', 'T: Task', 'A: Action', 'R: Result'].map((star, i) => (
            <div key={i} className={interviewSession.messages.length > (i+1) * 2 ? "neu-badge" : "neu-inset"} style={{ flex: 1, padding: '6px', textAlign: 'center', fontSize: 10, fontWeight: 700, background: interviewSession.messages.length > (i+1) * 2 ? 'var(--grad-teal)' : 'var(--card-bg)', color: interviewSession.messages.length > (i+1) * 2 ? '#fff' : 'var(--ink-soft)' }}>
              {star}
            </div>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {interviewSession.messages.map((m, i) => (
          <div key={i} className="fadein" style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div className={m.role === 'user' ? 'neu-bubble-user' : 'neu-bubble-tutor'}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '12px 16px', color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: 13 }}>
            Interviewer tippt...
          </div>
        )}
      </div>

      {!interviewSession.sessionComplete && (
        <div style={{ padding: '16px', display: 'flex', gap: 12, alignItems: 'center', background: 'var(--app-bg)' }}>
          <textarea
            className="neu-inset scrollbar"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!loading && input.trim()) send();
              }
            }}
            placeholder={appLang === 'de' ? 'Ihre Antwort...' : 'Your answer...'}
            disabled={loading}
            rows={1}
            style={{
              flex: 1, padding: '12px 16px',
              opacity: loading ? 0.6 : 1, fontSize: 14, color: 'var(--ink)',
              resize: 'vertical', minHeight: '48px', maxHeight: '200px', fontFamily: 'inherit',
              lineHeight: '1.4'
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="neu-btn"
            style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
          >
            <Icon name="ArrowRight" size={20} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}
