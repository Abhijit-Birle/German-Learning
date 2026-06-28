import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InterviewSession } from './InterviewSession.jsx';
import { InterviewScorecard } from './InterviewScorecard.jsx';
import { useGemini } from '../hooks/useGemini.js';
import { LS, addMistakes } from '../utils/storage.js';
import { speakHumanGerman, speakBrowserFallback } from '../utils/tts.js';
import { SCENARIOS, SCENARIO_TOPICS, GEMINI_VOICES, LEVELS } from '../constants.js';
import { Loading, LevelPill, EmptyState, ProgressRing, ActivityRings, CustomSelect } from './ui/Atoms.jsx';
import { QuickTranslator } from './QuickTranslator.jsx';
import { Icon } from './ui/Icon.jsx';
import { t } from '../i18n.js';
import { showToast } from '../utils/toast.js';
import { getTutorPrompt } from '../utils/prompts.js';
import { useExerciseStore } from '../store/useExerciseStore.js';
import { ExerciseList } from './ExerciseList.jsx';
import { ExerciseSession } from './ExerciseSession.jsx';
import { ExerciseResults } from './ExerciseResults.jsx';
import { DailyLesson } from './DailyLesson.jsx';
import { CasesTrainer } from './CasesTrainer.jsx';
import { ArticleTrainer } from './ArticleTrainer.jsx';
import { MOCK_EXERCISES } from '../data/mockExercises.js';
import { useLessons } from '../hooks/useLessons.js';

export function Tutor({ level, onLevelChange, onOpenApiKey, appLang, onLangChange, theme, onThemeChange, onTaskStart, onTaskEnd, isTaskActive }) {
  const { lessonsData } = useLessons();
  const { call, hasKey } = useGemini();
  const [scenario, setScenario] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionTopic, setSessionTopic] = useState(null); // { id, label, desc }
  const [showScorecard, setShowScorecard] = useState(false);
  const [scorecardData, setScorecardData] = useState(null);

  const [appView, setAppView] = useState('home'); // 'home' | 'exercise_list' | 'exercise_session' | 'exercise_results'
  const { fetchExercises } = useExerciseStore();

  const [sessions, setSessions] = useState(() => {
    const s = LS.get('gt_interview_sessions', []);
    return s.map(session => session.scenarioId ? session : { ...session, scenarioId: 'interview' });
  });

  const [completedSublessons, setCompletedSublessons] = useState(() => LS.get('gt_completed_sublessons', []));

  const handleLessonComplete = (sublessonId) => {
    if (!completedSublessons.includes(sublessonId)) {
      const newCompleted = [...completedSublessons, sublessonId];
      setCompletedSublessons(newCompleted);
      LS.set('gt_completed_sublessons', newCompleted);
    }
  };

  const activeLessonBlock = useMemo(() => {
    if (!lessonsData || lessonsData.length === 0) return null;

    // Find the first main lesson that is not fully completed
    let currentLesson = lessonsData.find(lesson => {
      const sublessons = lesson.items?.filter(i => i.type === 'sublesson' || i.type === 'revision') || [];
      const allCompleted = sublessons.length > 0 && sublessons.every(sub => completedSublessons.includes(sub.id));
      return !allCompleted;
    });

    if (!currentLesson) currentLesson = lessonsData[lessonsData.length - 1]; // if all done, show the last one
    if (!currentLesson) return null;

    const sublessons = currentLesson.items?.filter(i => i.type === 'sublesson' || i.type === 'revision') || [];
    const completedCount = sublessons.filter(sub => completedSublessons.includes(sub.id)).length;

    return {
      id: currentLesson.id,
      name: currentLesson.title,
      total: sublessons.length,
      completed: completedCount
    };
  }, [level, lessonsData, completedSublessons]);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Setup modal state
  const [modalTopicId, setModalTopicId] = useState('agentic-ai');
  const [modalCustomLabel, setModalCustomLabel] = useState('');
  const [modalCustomDesc, setModalCustomDesc] = useState('');
  const [modalLevel, setModalLevel] = useState(level);
  const [modalDifficulty, setModalDifficulty] = useState(2); // 1=Easy, 2=Medium, 3=Hard
  const [modalTone, setModalTone] = useState('Professional');

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
      setAppView('home');
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

        {/* Language Level */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
            {appLang === 'de' ? 'Sprachniveau' : 'Language Level'}
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

        {/* Interview Difficulty (Slider) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
              {appLang === 'de' ? 'Schwierigkeitsgrad' : 'Interview Difficulty'}
            </label>
            <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
              {modalDifficulty === 1 ? 'Leicht' : modalDifficulty === 2 ? 'Mittel' : 'Schwer'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="1"
            value={modalDifficulty}
            onChange={(e) => setModalDifficulty(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-copper)' }}
          />
        </div>

        {/* Interviewer Tone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
            {appLang === 'de' ? 'Tonfall des Interviewers' : 'Interviewer Tone'}
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Friendly', 'Professional', 'Strict'].map((tone) => {
              const isSel = modalTone === tone;
              const displayTone = appLang === 'de' ? (tone === 'Friendly' ? 'Freundlich' : tone === 'Professional' ? 'Professionell' : 'Streng') : tone;
              return (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setModalTone(tone)}
                  className={isSel ? "neu-tile-primary" : "neu-small"}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: isSel ? '#fff' : 'var(--ink)',
                    border: 'none',
                  }}
                >
                  {displayTone}
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
                difficulty: modalDifficulty,
                tone: modalTone,
                timestamp: Date.now(),
              };

              setSessions((prev) => [newSession, ...prev]);
              setSessionTopic({ id: modalTopicId, label: topicLabel, desc: topicDesc, difficulty: modalDifficulty, tone: modalTone });
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

  let content = null;

  if (appView === 'daily_lesson') {
    content = (
      <motion.div key="daily_lesson" initial={{ opacity: 0, scale: 0.8, borderRadius: '50px' }} animate={{ opacity: 1, scale: 1, borderRadius: '0px' }} exit={{ opacity: 0, scale: 0.8, borderRadius: '50px' }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} style={{ flex: 1, overflowY: 'auto' }}>
        <DailyLesson
          level={level}
          appLang={appLang}
          onBack={() => { setAppView('home'); onTaskEnd && onTaskEnd(); }}
          onComplete={handleLessonComplete}
          completedSublessons={completedSublessons}
        />
      </motion.div>
    );
  } else if (appView === 'cases_trainer') {
    content = (
      <motion.div key="cases_trainer" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <CasesTrainer onBack={() => { setAppView('home'); onTaskEnd && onTaskEnd(); }} appLang={appLang} />
      </motion.div>
    );
  } else if (appView === 'article_trainer') {
    content = (
      <motion.div key="article_trainer" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <ArticleTrainer onBack={() => { setAppView('home'); onTaskEnd && onTaskEnd(); }} appLang={appLang} />
      </motion.div>
    );
  } else if (appView === 'exercise_list') {
    content = (
      <motion.div key="ex_list" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} style={{ flex: 1, display: 'flex' }}>
        <ExerciseList onBack={() => { setAppView('home'); onTaskEnd && onTaskEnd(); }} onSelectLesson={(id) => { fetchExercises('lesson', id); setAppView('exercise_session'); }} appLang={appLang} />
      </motion.div>
    );
  } else if (appView === 'exercise_session') {
    content = (
      <motion.div key="ex_session" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} style={{ flex: 1, display: 'flex' }}>
        <ExerciseSession onBack={() => { setAppView('home'); onTaskEnd && onTaskEnd(); }} onComplete={() => setAppView('exercise_results')} />
      </motion.div>
    );
  } else if (appView === 'exercise_results') {
    content = (
      <motion.div key="ex_results" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ flex: 1, display: 'flex' }}>
        <ExerciseResults onBack={() => { setAppView('home'); onTaskEnd && onTaskEnd(); }} onRetryMistakes={() => { fetchExercises('mistakes'); setAppView('exercise_session'); }} />
      </motion.div>
    );
  } else if (appView === 'interview_session') {
    content = (
      <motion.div key="int_session" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} style={{ flex: 1, display: 'flex' }}>
        <InterviewSession onBack={() => { setAppView('home'); onTaskEnd && onTaskEnd(); }} onComplete={() => setAppView('interview_scorecard')} appLang={appLang} />
      </motion.div>
    );
  } else if (appView === 'interview_scorecard') {
    content = (
      <motion.div key="int_scorecard" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ flex: 1, display: 'flex' }}>
        <InterviewScorecard onBack={() => { setAppView('home'); onTaskEnd && onTaskEnd(); }} appLang={appLang} />
      </motion.div>
    );
  } else if (!isTaskActive) {
    content = (
      <motion.div key="home" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="scrollbar" style={{ paddingBottom: 0, background: 'transparent', flex: 1, overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/favicon.svg" alt="Logo" style={{ width: 44, height: 44 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Fraunces', serif", color: 'var(--ink)', lineHeight: 1.2 }}>{t('header_app', appLang)}</span>
              <span style={{ fontSize: 8, color: 'var(--ink-soft)', letterSpacing: '0.08em', fontWeight: 600, lineHeight: 1 }}>{t('header_subtitle', appLang)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CustomSelect
              value={appLang}
              onChange={(val) => onLangChange && onLangChange(val)}
              options={[
                { value: 'en', label: '🇺🇸 EN' },
                { value: 'de', label: '🇩🇪 DE' }
              ]}
              style={{ padding: '6px 12px' }}
            />
            <CustomSelect
              value={level}
              onChange={(val) => onLevelChange && onLevelChange(val)}
              options={LEVELS.map(lvl => ({ value: lvl, label: lvl }))}
              style={{ padding: '6px 12px' }}
            />
          </div>
        </header>

        {/* Top Stat Row */}
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <div className="neu-small" style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Icon name="Flame" size={24} color="var(--color-copper)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>3</div>
              <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4 }}>{appLang === 'de' ? 'Tage in Folge' : 'Day Streak'}</div>
            </div>
            <div className="neu-small" style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Icon name="Target" size={24} color="var(--color-teal)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>42%</div>
              <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4 }}>{appLang === 'de' ? 'Wochenziel' : 'Weekly Goal'}</div>
            </div>
            <div className="neu-small" style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Icon name="Bulb" size={24} color="var(--color-copper)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>12</div>
              <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4 }}>{appLang === 'de' ? 'Zu üben' : 'To Practice'}</div>
            </div>
          </div>
        </div>

        {/* Continue Lesson Card */}
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          <div className="neu-raised" style={{ background: '#2B2A28', color: '#FFF', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#8A8678', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{appLang === 'de' ? 'Aktuelle Lektion' : 'Current Lesson'}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{activeLessonBlock ? `Lesson: ${activeLessonBlock.name}` : 'No lessons yet'}</div>
              <button
                className="neu-btn"
                onClick={() => { if (activeLessonBlock) { setAppView('daily_lesson'); onTaskStart && onTaskStart(); } }}
                style={{ padding: '10px 20px', fontSize: 14 }}
                disabled={!activeLessonBlock}
              >
                {appLang === 'de' ? 'Fortsetzen' : 'Continue'}
              </button>
            </div>
            <div style={{ marginLeft: 16 }}>
              <ProgressRing progress={activeLessonBlock ? (activeLessonBlock.completed / activeLessonBlock.total) * 100 : 0} size={80} strokeWidth={8} />
            </div>
          </div>
        </div>

        {/* Quick Drill */}
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--ink)' }}>Quick Drill</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <motion.button whileTap={{ scale: 0.95 }} className="neu-small" onClick={() => { fetchExercises('random', '', level); setAppView('exercise_session'); onTaskStart && onTaskStart(); }} style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="neu-inset" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎲</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Random</div>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="neu-small" onClick={() => { fetchExercises('mistakes', '', level); setAppView('exercise_session'); onTaskStart && onTaskStart(); }} style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="neu-inset" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔁</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Mistakes</div>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="neu-small" onClick={() => { setAppView('article_trainer'); onTaskStart && onTaskStart(); }} style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="neu-inset" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📚</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{appLang === 'de' ? 'Artikel' : 'Articles'}</div>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="neu-small" onClick={() => { setAppView('cases_trainer'); onTaskStart && onTaskStart(); }} style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="neu-inset" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="ArrowsRightLeft" size={20} color="var(--ink)" />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Fälle</div>
            </motion.button>
          </div>
        </div>

        {/* Weekly Activity Chart (Mock) */}
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--ink)' }}>{appLang === 'de' ? 'Aktivität' : 'Activity'}</div>
          <div className="neu-raised" style={{ padding: '20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 140 }}>
            {[30, 80, 50, 100, 40, 0, 0].map((val, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                <div className="neu-inset" style={{ width: 12, height: 80, display: 'flex', alignItems: 'flex-end', padding: 2 }}>
                  <div style={{ width: '100%', height: `${val}%`, background: val > 0 ? 'var(--grad-teal)' : 'transparent', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-soft)', fontWeight: 600 }}>{appLang === 'de' ? ['M', 'D', 'M', 'D', 'F', 'S', 'S'][i] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Goal Widget */}
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          <div className="neu-raised" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="neu-inset" style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="Flag" size={24} color="var(--color-copper)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>B2 bis April 2027</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Du bist gut im Plan!</div>
            </div>
          </div>
        </div>

        {/* Scenarios (Horizontal Scroll) */}
        <div style={{ padding: '0 0 24px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--ink)', padding: '0 16px' }}>{t('home_scenarios', appLang)}</div>
          <div className="mobile-scroll-x" style={{ gap: 16, padding: '4px 16px 16px 16px' }}>
            {pathNodes.filter(n => n.id !== 'free').map((node) => {
              const hasMessages = convos[node.id] && convos[node.id].length > 0;
              return (
                <motion.button whileTap={{ scale: 0.97 }} key={node.id} onClick={() => { setScenario(SCENARIOS.find(s => s.id === node.id)); onTaskStart && onTaskStart(); }} className="neu-small" style={{ width: 140, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: 'none', flexShrink: 0 }}>
                  <div className="neu-inset" style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Icon name={node.icon} size={24} color={'var(--color-teal)'} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.2 }}>{node.title}</div>
                  {hasMessages && <div style={{ fontSize: 10, color: 'var(--color-copper)', fontWeight: 700, marginTop: -4 }}>Weiter</div>}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Interview Prep (Horizontal Scroll) */}
        <div style={{ padding: '0 0 24px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--ink)', padding: '0 16px' }}>Interview-Prep</div>
          <div className="mobile-scroll-x" style={{ gap: 16, padding: '4px 16px 16px 16px' }}>
            {[
              { id: 'agentic_ai', title: 'Agentic AI', icon: 'Cpu' },
              { id: 'backend', title: 'Backend', icon: 'Database' },
              { id: 'frontend', title: 'Frontend', icon: 'Layout' },
              { id: 'system_design', title: 'System Design', icon: 'Server' },
              { id: 'behavioural', title: 'Behavioural', icon: 'Users' }
            ].map(topic => (
              <motion.button whileTap={{ scale: 0.97 }} key={topic.id} onClick={() => { useExerciseStore.getState().resetInterviewSession(); useExerciseStore.getState().setInterviewTopic(topic.id); setAppView('interview_session'); onTaskStart && onTaskStart(); }} className="neu-small" style={{ width: 140, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: 'none', flexShrink: 0 }}>
                <div className="neu-inset" style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={topic.icon} size={24} color={'var(--color-copper)'} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.2 }}>{topic.title}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Today's Focus Horizontal Scroll */}
        <div style={{ padding: '0 0 32px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--ink)', padding: '0 16px' }}>{appLang === 'de' ? 'Fokus von Heute' : "Today's Focus"}</div>
          <div className="mobile-scroll-x" style={{ gap: 16, padding: '4px 16px 16px 16px' }}>
            <div className="neu-small" style={{ minWidth: 200, padding: 16, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--color-teal)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Wort des Tages</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>ausgezeichnet</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>excellent, outstanding</div>
            </div>
            <div className="neu-small" style={{ minWidth: 200, padding: 16, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--color-copper)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Letzter Fehler</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>dem Mann</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Dativ case review</div>
            </div>
          </div>
        </div>

      </motion.div>
    );
  } else if (isTaskActive && scenario?.id !== 'free' && !activeSessionId) {
    const scenarioSessions = sessions.filter(s => s.scenarioId === scenario.id);
    content = (
      <motion.div key="sessions" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="scrollbar" style={{ paddingBottom: 0, background: 'transparent', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--app-bg)' }}>
          <button className="neu-small" onClick={() => { setActiveSessionId(null); setScenario(null); onTaskEnd && onTaskEnd(); }} style={{ padding: '6px', color: 'var(--ink)' }}>
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
                if (currentTopics.length > 0) {
                  setModalTopicId(currentTopics[0].id);
                } else {
                  setModalTopicId('custom');
                }
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

      </motion.div>
    );
  } else {
    content = (
      <motion.div key="chat" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--app-bg)' }}>
          <button
            className="neu-small"
            onClick={() => {
              setActiveSessionId(null);
              if (scenario?.id === 'free') {
                setScenario(null);
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
            <CustomSelect
              value={level}
              onChange={(val) => onLevelChange && onLevelChange(val)}
              options={LEVELS.map(lvl => ({ value: lvl, label: lvl }))}
              style={{ padding: '6px 8px' }}
            />
            <button onClick={() => onOpenApiKey && onOpenApiKey()} className="neu-small" style={{ padding: '6px', color: 'var(--ink)', display: 'flex', alignItems: 'center' }}><Icon name="Key" size={16} /></button>
          </div>
        </div>


        {/* STAR Scaffolding for Behavioural Interview */}
        {sessionTopic?.id === 'behavioural' && (
          <div style={{ padding: '8px 16px', display: 'flex', gap: 8, borderBottom: '1px solid var(--shadow-light)' }}>
            {['S: Situation', 'T: Task', 'A: Action', 'R: Result'].map((star, i) => (
              <div key={i} className={messages.length > i * 2 ? "neu-badge" : "neu-inset"} style={{ flex: 1, padding: '6px', textAlign: 'center', fontSize: 10, fontWeight: 700, background: messages.length > i * 2 ? 'var(--grad-teal)' : 'var(--card-bg)', color: messages.length > i * 2 ? '#fff' : 'var(--ink-soft)' }}>
                {star}
              </div>
            ))}
          </div>
        )}

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
                      {m.role === 'user' && (
                        <button onClick={() => speakBrowserFallback(m.text, 1.0, messages[i + 1]?.corrections?.some(c => c.category === 'other') ? 'en-US' : 'de-DE')} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.8)', padding: 0, flexShrink: 0 }}><Icon name="Volume2" size={16} /></button>
                      )}
                    </div>
                    {m.role === 'model' && m.translation && showTranslation && (
                      <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic', borderTop: '1px solid var(--shadow-dark)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div onDoubleClick={() => { navigator.clipboard.writeText(m.translation); showToast(t('copy', appLang) + '!'); }} style={{ cursor: 'pointer', flex: 1 }}>{m.translation}</div>
                        <button onClick={() => speakBrowserFallback(m.translation, 1.0, 'en-US')} style={{ border: 'none', background: 'transparent', color: 'var(--ink-soft)', padding: 0, flexShrink: 0 }}><Icon name="Volume2" size={12} /></button>
                      </div>
                    )}
                    {m.role === 'user' && messages[i + 1] && messages[i + 1].role === 'model' && messages[i + 1].corrections && messages[i + 1].corrections.some(c => c.category === 'other') && (
                      <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div onDoubleClick={() => { navigator.clipboard.writeText(messages[i + 1].corrections.find(c => c.category === 'other').correction); showToast(t('copy', appLang) + '!'); }} style={{ cursor: 'pointer', flex: 1 }}>
                          {messages[i + 1].corrections.find(c => c.category === 'other').correction}
                        </div>
                        <button onClick={() => speak(messages[i + 1].corrections.find(c => c.category === 'other').correction, i + '_trans')} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.8)', padding: 0, flexShrink: 0 }}><Icon name="Volume2" size={12} /></button>
                      </div>
                    )}
                  </div>
                  {m.role === 'user' && messages[i + 1] && messages[i + 1].role === 'model' && messages[i + 1].corrections && messages[i + 1].corrections.filter(c => c.category !== 'other').length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                      {messages[i + 1].corrections.filter(c => c.category !== 'other').map((c, ci) => (
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
            {scenario?.id === 'interview' && (
              <button
                className="neu-small"
                onClick={() => {
                  // Mock ending interview and loading scorecard
                  setScorecardData({
                    clarity: 85, grammar: 78, vocabulary: 92, confidence: 80,
                    strengths: ["Guter Fachwortschatz", "Flüssiges Sprechen"],
                    improvements: ["Satzbau bei Nebensätzen", "Weniger 'ähm' sagen"]
                  });
                  setShowScorecard(true);
                }}
                style={{
                  padding: '8px 16px', color: 'var(--color-teal)', fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center', fontWeight: 700
                }}>
                <Icon name="Flag" size={14} /> {appLang === 'de' ? 'Beenden' : 'End Interview'}
              </button>
            )}
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

            <textarea
              className="neu-inset scrollbar"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!transcribing && !loading && input.trim()) send();
                }
              }}
              placeholder={t('input_placeholder', appLang)}
              disabled={transcribing}
              rows={1}
              style={{
                flex: 1, padding: '12px 16px',
                opacity: transcribing ? 0.6 : 1, fontSize: 14, color: 'var(--ink)',
                resize: 'vertical', minHeight: '48px', maxHeight: '200px', fontFamily: 'inherit',
                lineHeight: '1.4'
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

        {/* Mock Interview Scorecard Modal */}
        {showScorecard && scorecardData && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div className="neu-raised" style={{ width: '100%', maxWidth: 400, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Interview Feedback</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <ProgressRing progress={scorecardData.clarity} size={64} strokeWidth={6} color="#11978C" />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Klarheit</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <ProgressRing progress={scorecardData.grammar} size={64} strokeWidth={6} color="#C97B4A" />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Grammatik</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <ProgressRing progress={scorecardData.vocabulary} size={64} strokeWidth={6} color="#11978C" />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Wortschatz</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <ProgressRing progress={scorecardData.confidence} size={64} strokeWidth={6} color="#11978C" />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Sicherheit</div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-teal)', marginBottom: 8 }}>Stärken</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--ink)' }}>
                  {scorecardData.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-copper)', marginBottom: 8 }}>Verbesserungspotenzial</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--ink)' }}>
                  {scorecardData.improvements.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <button className="neu-btn" onClick={() => { setShowScorecard(false); setActiveSessionId(null); }} style={{ marginTop: 16, padding: '12px' }}>
                Schließen
              </button>
            </div>
          </div>
        )}
      </motion.div>
    );
  }
  return (
    <>
      <AnimatePresence mode="wait">{content}</AnimatePresence>
      {setupModalElement}
    </>
  );
}
