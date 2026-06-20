import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGemini } from '../hooks/useGemini.js';
import { LS, addMistakes } from '../utils/storage.js';
import { speakHumanGerman, speakBrowserFallback } from '../utils/tts.js';
import { SCENARIOS, SCENARIO_TOPICS, GEMINI_VOICES, LEVELS } from '../constants.js';
import { Loading, LevelPill, EmptyState, ProgressRing, ActivityRings } from './ui/Atoms.jsx';
import { QuickTranslator } from './QuickTranslator.jsx';
import { Icon } from './ui/Icon.jsx';
import { t } from '../i18n.js';
import { showToast } from '../utils/toast.js';
import { getTutorPrompt } from '../utils/prompts.js';

export function Tutor({ level, onLevelChange, onOpenApiKey, appLang, onLangChange, theme, onThemeChange, onTaskStart, onTaskEnd, isTaskActive }) {
  const { call, hasKey } = useGemini();
  const [scenario, setScenario] = useState(null);
  const [sessionTopic, setSessionTopic] = useState(null);

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState(() => {
    const s = LS.get('gt_interview_sessions', []);
    return s.map(session => session.scenarioId ? session : { ...session, scenarioId: 'interview' });
  });
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Setup modal state
  const [modalTopicId, setModalTopicId] = useState('agentic-ai');
  const [modalCustomLabel, setModalCustomLabel] = useState('');
  const [modalCustomDesc, setModalCustomDesc] = useState('');
  const [modalLevel, setModalLevel] = useState(level);

  const scenarioKey = scenario
    ? scenario.id !== 'free' && activeSessionId
      ? activeSessionId
      : scenario.id
    : 'free';

  const [convos, setConvos] = useState(() => LS.get('gt_convos', {}));
  const messages = convos[scenarioKey] || [];

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(() => LS.get('gt_voice_on', true));
  const [geminiVoice, setGeminiVoice] = useState(LS.get('gt_gemini_voice', 'Kore'));
  const [speechRate, setSpeechRate] = useState(LS.get('gt_speech_rate', 1.0));
  const [ttsBusyId, setTtsBusyId] = useState(null);
  const [, setVocabVersion] = useState(0);

  const [transcribing, setTranscribing] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [showTranslation, setShowTranslation] = useState(() => LS.get('gt_show_translation', true));

  const recRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Persist voice settings
  useEffect(() => { LS.set('gt_gemini_voice', geminiVoice); }, [geminiVoice]);
  useEffect(() => { LS.set('gt_speech_rate', speechRate); }, [speechRate]);
  useEffect(() => { LS.set('gt_show_translation', showTranslation); }, [showTranslation]);
  useEffect(() => { LS.set('gt_voice_on', voiceOn); }, [voiceOn]);

  // Persist conversations
  useEffect(() => { LS.set('gt_convos', convos); }, [convos]);

  // Persist interview sessions
  useEffect(() => { LS.set('gt_interview_sessions', sessions); }, [sessions]);

  // Cleanup active scenario values when chat is exited
  useEffect(() => {
    if (!isTaskActive) {
      setScenario(null);
      setSessionTopic(null);
      setActiveSessionId(null);
    }
  }, [isTaskActive]);

  const setMessages = useCallback((updater) => {
    setConvos((c) => {
      const cur = c[scenarioKey] || [];
      const next = typeof updater === 'function' ? updater(cur) : updater;
      return { ...c, [scenarioKey]: next };
    });
  }, [scenarioKey]);

  const sysPrompt = useMemo(() => getTutorPrompt(level, scenario, sessionTopic), [level, scenario, sessionTopic]);

  const buildContents = (history) =>
    history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.role === 'user' ? m.text : JSON.stringify({ reply: m.text, translation: m.translation || '', corrections: m.corrections || [], followUp: '' }) }],
    }));

  const speak = async (text, msgId, overrideRate, isAuto = false) => {
    if (isAuto && !voiceOn) return;
    const id = msgId !== undefined ? msgId : 'last';
    const rateToUse = overrideRate !== undefined ? overrideRate : speechRate;
    setTtsBusyId(id);
    try {
      await speakHumanGerman(text, geminiVoice, rateToUse);
    } catch (e) {
      speakBrowserFallback(text, rateToUse);
    } finally {
      setTtsBusyId(null);
    }
  };

  const send = async (textOverride) => {
    const text = (textOverride !== undefined ? textOverride : input).trim();
    if (!text || loading) return;
    const userMsg = { role: 'user', text };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setInput('');
    setLoading(true);
    try {
      const contents = buildContents(nextMsgs);
      const out = await call(sysPrompt, contents, true);
      const aiMsg = { role: 'model', text: out.reply, translation: out.translation, corrections: out.corrections || [] };
      setMessages((m) => [...m, aiMsg]);
      addMistakes((out.corrections || []).map((c) => ({ ...c, source: scenario ? `roleplay:${scenario.id}` : 'tutor' })));
      speak(out.reply, nextMsgs.length, undefined, true);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'model', text: '⚠️ ' + (e.message === 'NO_KEY' ? 'Please set your Gemini API key first.' : e.message), error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ---- Audio transcription ----------------------------------------
  const transcribeAudio = async (blob) => {
    const key = LS.get('gt_apikey', '');
    if (!key) throw new Error('NO_KEY');
    const arrayBuf = await blob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuf);
    let binary = '';
    uint8.forEach((b) => (binary += String.fromCharCode(b)));
    const base64 = btoa(binary);
    const mimeType = blob.type || 'audio/webm';
    const mdl = LS.get('gt_model', 'gemini-2.0-flash');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${key}`;
    const body = {
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          { text: 'Transcribe this German audio exactly as spoken. Return ONLY the transcribed text — no explanations, no punctuation fixes, no translation. If the audio is silent or unclear, return an empty string.' },
        ],
      }],
    };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const t = await res.text();
      throw new Error('Transcription error ' + res.status + ': ' + t.slice(0, 200));
    }
    const data = await res.json();
    return ((data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('')).trim();
  };

  const startListening = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone access is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      alert('Microphone permission denied.\n\n' + e.message);
      return;
    }

    const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    audioChunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(recTimerRef.current);
      setListening(false);
      const chunks = audioChunksRef.current;
      if (!chunks.length) return;
      const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
      setTranscribing(true);
      setInput('🎙 Transcribing…');
      try {
        const transcript = await transcribeAudio(blob);
        setInput(transcript);
      } catch (e) {
        setInput('');
        alert(e.message === 'NO_KEY' ? 'Set your Gemini API key first.' : '⚠️ ' + e.message);
      } finally {
        setTranscribing(false);
      }
    };

    recRef.current = mr;
    mr.start(250);
    setListening(true);
    setRecSeconds(0);
    recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
  };

  const stopListening = () => {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop();
  };

  const clearCurrent = () => {
    if (!confirm(t('confirm_clear', appLang))) return;
    setMessages([]);
  };

  const pathNodes = [
    { id: 'free', icon: 'MessageCircle', title: t('scen_free', appLang) },
    { id: 'interview', icon: 'Briefcase', title: t('scen_interview', appLang) },
    { id: 'meeting', icon: 'Users', title: t('scen_meeting', appLang) },
    { id: 'restaurant', icon: 'Utensils', title: t('scen_restaurant', appLang) },
    { id: 'apartment', icon: 'Home', title: t('scen_apartment', appLang) },
    { id: 'immigration', icon: 'Building2', title: t('scen_immigration', appLang) },
  ];

  const currentTopics = scenario ? SCENARIO_TOPICS[scenario.id] || [] : [];
  
  const setupModalElement = showSetupModal && (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <div
        className="neu-raised"
        style={{
          background: 'var(--card-bg)',
          width: '100%',
          maxWidth: 400,
          padding: 24,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', textAlign: 'center' }}>
          {appLang === 'de' ? 'Neues Szenario starten' : 'Start New Scenario'}
        </div>

        {/* Topic Select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
            {appLang === 'de' ? 'Thema auswählen' : 'Select Topic'}
          </label>
          <select
            className="neu-small"
            value={modalTopicId}
            onChange={(e) => setModalTopicId(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 13, color: 'var(--ink)', width: '100%' }}
          >
            {currentTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
            <option value="custom">{appLang === 'de' ? 'Anderes Thema...' : 'Custom Topic...'}</option>
          </select>
        </div>

        {/* Custom Inputs */}
        {modalTopicId === 'custom' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                {appLang === 'de' ? 'Position / Rolle' : 'Position / Role'}
              </label>
              <input
                type="text"
                className="neu-inset"
                placeholder={appLang === 'de' ? 'z.B. Marketing Manager' : 'e.g. Marketing Manager'}
                value={modalCustomLabel}
                onChange={(e) => setModalCustomLabel(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  color: 'var(--ink)',
                  border: 'none',
                  outline: 'none',
                  borderRadius: 8,
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                {appLang === 'de' ? 'Fokus / Beschreibung' : 'Focus / Description'}
              </label>
              <textarea
                className="neu-inset"
                placeholder={appLang === 'de' ? 'z.B. Social Media Marketing, SEO...' : 'e.g. Social Media Marketing, SEO...'}
                value={modalCustomDesc}
                onChange={(e) => setModalCustomDesc(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  color: 'var(--ink)',
                  border: 'none',
                  outline: 'none',
                  borderRadius: 8,
                  width: '100%',
                  height: 60,
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </>
        )}

        {/* Difficulty Level */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
            {appLang === 'de' ? 'Schwierigkeitsgrad' : 'Difficulty Level'}
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LEVELS.map((lvl) => {
              const isSel = modalLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setModalLevel(lvl)}
                  className={isSel ? "neu-tile-primary" : "neu-small"}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: isSel ? '#fff' : 'var(--ink)',
                    border: 'none',
                  }}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            type="button"
            className="neu-small"
            onClick={() => setShowSetupModal(false)}
            style={{ flex: 1, padding: '10px', fontWeight: 600, border: 'none', color: 'var(--ink)' }}
          >
            {appLang === 'de' ? 'Abbrechen' : 'Cancel'}
          </button>
          <button
            type="button"
            className="neu-btn"
            onClick={() => {
              let topicLabel = '';
              let topicDesc = '';
              if (modalTopicId === 'custom') {
                if (!modalCustomLabel.trim()) {
                  alert(appLang === 'de' ? 'Bitte gib ein Thema ein.' : 'Please enter a topic.');
                  return;
                }
                topicLabel = modalCustomLabel.trim();
                topicDesc = modalCustomDesc.trim();
              } else {
                const preset = currentTopics.find((t) => t.id === modalTopicId);
                topicLabel = preset.label;
                topicDesc = preset.desc;
              }

              const newSessionId = `${scenario.id}_${Date.now()}`;
              const newSession = {
                id: newSessionId,
                scenarioId: scenario.id,
                topicId: modalTopicId,
                topicLabel,
                topicDesc,
                level: modalLevel,
                timestamp: Date.now(),
              };

              setSessions((prev) => [newSession, ...prev]);
              setSessionTopic({ id: modalTopicId, label: topicLabel, desc: topicDesc });
              setActiveSessionId(newSessionId);
              onLevelChange && onLevelChange(modalLevel);
              setShowSetupModal(false);
              onTaskStart && onTaskStart();

              setModalCustomLabel('');
              setModalCustomDesc('');
            }}
            style={{ flex: 1, padding: '10px', fontWeight: 700 }}
          >
            {appLang === 'de' ? 'Starten' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isTaskActive) {
    return (
      <div className="scrollbar" style={{ paddingBottom: 0, background: 'transparent', flex: 1, overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/favicon.svg" alt="Logo" style={{ width: 44, height: 44 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Fraunces', serif", color: 'var(--ink)', lineHeight: 1.2 }}>{t('header_app', appLang)}</span>
              <span style={{ fontSize: 8, color: 'var(--ink-soft)', letterSpacing: '0.08em', fontWeight: 600, lineHeight: 1 }}>{t('header_subtitle', appLang)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="neu-small" onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')} style={{ padding: '6px', color: 'var(--ink)', display: 'flex', alignItems: 'center' }}>
              <Icon name={theme === 'light' ? 'Moon' : 'Sun'} size={18} color="var(--ink)" />
            </button>
            <button className="neu-small" onClick={() => onLangChange(appLang === 'de' ? 'en' : 'de')} style={{ padding: '6px 10px', color: 'var(--ink)', fontSize: 12, fontWeight: 700 }}>
              {appLang === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
            </button>
            <select className="neu-small" value={level} onChange={(e) => onLevelChange && onLevelChange(e.target.value)} style={{ color: 'var(--color-teal)', padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>
              {LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
            <button onClick={() => onOpenApiKey && onOpenApiKey()} className="neu-small" style={{ padding: '6px', color: 'var(--ink)', display: 'flex', alignItems: 'center' }}>
              <Icon name="Key" size={16} color="var(--ink)" />
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, marginTop: 10 }}>
          <div className="neu-raised" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: 'calc(100% - 32px)', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <ActivityRings rings={[80, 50, 30]} size={110} strokeWidth={10} gap={3} />
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{t('home_daily', appLang) || 'Tagesziel'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <ProgressRing progress={42} size={70} strokeWidth={8} />
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{level} {t('home_progress', appLang)}</div>
              </div>
            </div>
            <button className="neu-btn" style={{ padding: '14px 24px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: 14 }} onClick={() => { setScenario(null); onTaskStart && onTaskStart(); }}>
              <Icon name="MessageCircle" size={18} /> {t('home_chat_btn', appLang)}
            </button>
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--ink)' }}>{t('home_scenarios', appLang)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {pathNodes.filter(n => n.id !== 'free').map((node) => {
              const isSelected = scenario?.id === node.id;
              const hasMessages = convos[node.id] && convos[node.id].length > 0;
              return (
                <button key={node.id} onClick={() => { setScenario(SCENARIOS.find(s => s.id === node.id)); onTaskStart && onTaskStart(); }} className={isSelected ? "neu-inset" : "neu-raised"} style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: 'none', background: isSelected ? 'var(--card-bg)' : 'var(--app-bg)' }}>
                  <div className={isSelected ? "neu-tile-primary" : "neu-small"} style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Icon name={node.icon} size={24} color={isSelected ? '#fff' : 'var(--color-teal)'} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.2 }}>{hasMessages ? 'Weiter' : node.title}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (isTaskActive && scenario?.id !== 'free' && !activeSessionId) {
    const scenarioSessions = sessions.filter(s => s.scenarioId === scenario.id);
    return (
      <div className="scrollbar" style={{ paddingBottom: 0, background: 'transparent', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--app-bg)' }}>
          <button className="neu-small" onClick={() => { setScenario(null); onTaskEnd && onTaskEnd(); }} style={{ padding: '6px', color: 'var(--ink)' }}>
            <Icon name="ChevronLeft" size={20} />
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
            {appLang === 'de' ? scenario.de : scenario.title}
          </div>
        </header>

        <div style={{ padding: '16px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              {appLang === 'de' ? 'Deine Sitzungen' : 'Your Sessions'}
            </span>
            <button
              className="neu-btn"
              onClick={() => {
                setModalLevel(level);
                setShowSetupModal(true);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', fontSize: 13, fontWeight: 700,
                color: '#fff', border: 'none',
              }}
            >
              <Icon name="Plus" size={16} /> {appLang === 'de' ? 'Neu' : 'New'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scenarioSessions.length === 0 ? (
              <div className="neu-inset" style={{ padding: 32, textAlign: 'center', fontSize: 14, color: 'var(--ink-soft)', fontStyle: 'italic', borderRadius: 16 }}>
                {appLang === 'de' ? 'Noch keine Sitzungen gestartet. Klicke auf "Neu", um zu beginnen!' : 'No sessions started yet. Click "New" to begin!'}
              </div>
            ) : (
              scenarioSessions.map((s) => (
                <div key={s.id} className="neu-raised" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, borderRadius: 12 }}>
                  <div 
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} 
                    onClick={() => {
                      setSessionTopic({ id: s.topicId, label: s.topicLabel, desc: s.topicDesc });
                      setActiveSessionId(s.id);
                      onLevelChange && onLevelChange(s.level);
                    }}
                  >
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 2 }}>
                      {appLang === 'de' ? 'Thema:' : 'Topic:'} <strong style={{ color: 'var(--ink)' }}>{s.topicLabel}</strong>
                    </div>
                    {s.topicDesc && (
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {appLang === 'de' ? 'Fokus:' : 'Focus:'} {s.topicDesc}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      {appLang === 'de' ? 'Schwierigkeit:' : 'Difficulty:'} <span style={{ fontWeight: 700, color: 'var(--color-teal)' }}>{s.level}</span>
                      <span style={{ margin: '0 6px' }}>•</span>
                      {new Date(s.timestamp).toLocaleDateString(appLang === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="neu-small" onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(appLang === 'de' ? 'Diese Sitzung löschen?' : 'Delete this session?')) {
                        setSessions((prev) => prev.filter((item) => item.id !== s.id));
                        setConvos((c) => { const next = { ...c }; delete next[s.id]; return next; });
                      }
                    }} style={{ padding: '8px', color: 'var(--color-copper)', border: 'none' }}>
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {setupModalElement}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--app-bg)' }}>
        <button 
          className="neu-small" 
          onClick={() => {
            if (scenario?.id !== 'free') {
              setActiveSessionId(null);
            } else {
              onTaskEnd && onTaskEnd();
            }
          }} 
          style={{ padding: '6px', color: 'var(--ink)' }}
        >
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="neu-small" style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Icon name={scenario ? scenario.icon : 'MessageCircle'} size={20} color="var(--color-teal)" /></div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{scenario ? t(`scen_${scenario.id}`, appLang) : t('scen_free', appLang)}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              {scenario 
                ? (sessionTopic ? `${sessionTopic.label} • Level ${level}` : scenario.title) 
                : t('scen_free_desc', appLang)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="neu-small" value={level} onChange={(e) => onLevelChange && onLevelChange(e.target.value)} style={{ color: 'var(--color-teal)', padding: '6px 8px', fontSize: 11, fontWeight: 700 }}>
            {LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
          </select>
          <button onClick={() => onOpenApiKey && onOpenApiKey()} className="neu-small" style={{ padding: '6px', color: 'var(--ink)', display: 'flex', alignItems: 'center' }}><Icon name="Key" size={16} /></button>
        </div>
      </div>

      <div ref={scrollRef} className="scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && <EmptyState title={t('empty_hello', appLang)} body={t('empty_body', appLang)} />}
        {messages.map((m, i) => (
          <div key={i} className="fadein" style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={m.role === 'user' ? 'neu-bubble-user' : 'neu-bubble-tutor'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div onDoubleClick={() => { navigator.clipboard.writeText(m.text); showToast(t('copy', appLang) + '!'); }} style={{ cursor: 'pointer', flex: 1 }}>{m.text}</div>
                    {m.role === 'model' && !m.error && (
                      <button onClick={() => speak(m.text, i)} disabled={ttsBusyId === i} style={{ border: 'none', background: 'transparent', color: 'var(--ink-soft)', padding: 0, flexShrink: 0 }}><Icon name="Volume2" size={16} /></button>
                    )}
                  </div>
                  {m.role === 'model' && m.translation && showTranslation && (
                    <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic', borderTop: '1px solid var(--shadow-dark)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div onDoubleClick={() => { navigator.clipboard.writeText(m.translation); showToast(t('copy', appLang) + '!'); }} style={{ cursor: 'pointer', flex: 1 }}>{m.translation}</div>
                      <button onClick={() => speakBrowserFallback(m.translation, 1.0, 'en-US')} style={{ border: 'none', background: 'transparent', color: 'var(--ink-soft)', padding: 0, flexShrink: 0 }}><Icon name="Volume2" size={12} /></button>
                    </div>
                  )}
                </div>
                {m.corrections && m.corrections.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                    {m.corrections.map((c, ci) => (
                      <div key={ci} className="neu-bubble-correction">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <Icon name="PenTool" size={14} style={{ marginTop: 2, flexShrink: 0 }} /> 
                          <div>Besser: <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{c.original}</span> → <strong>{c.correction}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && <Loading label={t('tutor_typing', appLang)} />}
      </div>

      {/* Input row */}
      <div style={{ padding: '16px', background: 'var(--app-bg)', display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid var(--shadow-light)' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className={showTranslation ? 'neu-btn' : 'neu-small'}
            onClick={() => setShowTranslation(!showTranslation)}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center'
            }}
          >
            <Icon name="Globe" size={14} color={showTranslation ? '#fff' : 'var(--color-teal)'} /> {t('btn_translate', appLang)}
          </button>
          <button
            className={voiceOn ? 'neu-btn' : 'neu-small'}
            onClick={() => setVoiceOn(!voiceOn)}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center'
            }}
          >
            <Icon name={voiceOn ? "Volume2" : "VolumeX"} size={14} color={voiceOn ? '#fff' : 'var(--color-teal)'} /> {voiceOn ? t('btn_voice_on', appLang) : t('btn_voice_off', appLang)}
          </button>
          <button 
            className="neu-small" 
            onClick={clearCurrent} 
            style={{ 
              padding: '8px 16px', color: 'var(--color-copper)', fontSize: 12, 
              display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center', fontWeight: 600 
            }}>
            <Icon name="Trash2" size={14} /> {t('btn_clear_chat', appLang)}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={listening ? stopListening : startListening}
            disabled={transcribing}
            className={listening ? "neu-btn-copper" : "neu-small"}
            style={{
              width: 44, height: 44, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0
            }}
          >
            {listening ? <span className="pulse-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} /> : <Icon name="Mic" size={20} color="var(--color-copper)" />}
          </button>

          <input
            className="neu-inset"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !transcribing && send()}
            placeholder={t('input_placeholder', appLang)}
            disabled={transcribing}
            style={{
              flex: 1, padding: '12px 16px',
              opacity: transcribing ? 0.6 : 1, fontSize: 14, color: 'var(--ink)'
            }}
          />
          <button 
            onClick={() => send()} 
            disabled={loading || transcribing || !input.trim()} 
            className="neu-btn"
            style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
          >
            <Icon name="ArrowRight" size={20} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
