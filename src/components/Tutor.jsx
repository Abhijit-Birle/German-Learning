import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGemini } from '../hooks/useGemini.js';
import { LS, addMistakes } from '../utils/storage.js';
import { speakHumanGerman, speakBrowserFallback } from '../utils/tts.js';
import { SCENARIOS, INTERVIEW_TOPICS, GEMINI_VOICES, LEVELS } from '../constants.js';
import { Loading, LevelPill, EmptyState } from './ui/Atoms.jsx';
import { QuickTranslator } from './QuickTranslator.jsx';

export function Tutor({ level, onLevelChange, onOpenApiKey }) {
  const { call } = useGemini();
  const [scenario, setScenario] = useState(null);
  const [interviewTopic, setInterviewTopic] = useState(null);
  const [activeView, setActiveView] = useState('path');

  const scenarioKey = scenario
    ? scenario.id === 'interview' && interviewTopic
      ? `interview_${interviewTopic.id}`
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

  const setMessages = useCallback((updater) => {
    setConvos((c) => {
      const cur = c[scenarioKey] || [];
      const next = typeof updater === 'function' ? updater(cur) : updater;
      return { ...c, [scenarioKey]: next };
    });
  }, [scenarioKey]);

  const sysPrompt = useMemo(() => {
    let scTxt;
    if (scenario) {
      let topicClause = '';
      if (scenario.id === 'interview' && interviewTopic) {
        topicClause = ` The interview is specifically focused on the topic: "${interviewTopic.label}" (${interviewTopic.desc}). Ask technical or situational questions relevant ONLY to this topic — do not deviate to other domains.`;
      }
      scTxt = `The roleplay scenario is: ${scenario.prompt}.${topicClause} Stay in character as the other person in this scenario (e.g. interviewer, waiter, doctor, official) — do not break character.`;
    } else {
      scTxt = 'This is an open, free-form conversation practice session about everyday topics.';
    }
    return `You are a friendly, expert German (Deutsch) tutor and conversation partner. The learner's CEFR level is ${level}. ${scTxt}
Speak primarily in German, calibrated to ${level} (vocabulary, sentence complexity, speed of idea progression). For A1/A2 keep sentences short and simple; for C1/C2 use natural, idiomatic, more complex German.
Always reply with ONLY raw JSON, no markdown fences, matching this shape:
{"reply": "<your German reply, in character, 1-4 sentences>", "translation": "<short English translation of your reply>", "corrections": [{"original": "<learner's exact mistaken phrase>", "correction": "<corrected German>", "explanation": "<short English explanation of the grammar/vocab rule>", "category": "grammar|vocabulary|word-order|pronunciation-note|other"}], "followUp": "<one short German follow-up question to keep the conversation going, can be same as reply if reply already ends in a question>"}
Only include entries in "corrections" if the learner's last message actually contained a German-language mistake. If the learner's message was correct, return an empty corrections array. If the learner wrote in English, gently correct them by giving the German version with category "other".`;
  }, [level, scenario, interviewTopic]);

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

  const speakUser = async (text, msgId) => {
    const id = 'u_' + msgId;
    setTtsBusyId(id);
    try {
      await speakHumanGerman(text, geminiVoice, speechRate);
    } catch (e) {
      speakBrowserFallback(text, speechRate);
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
    if (!confirm('Clear this conversation?')) return;
    setMessages([]);
  };

  const pathNodes = [
    { id: 'free', icon: '💬', title: 'Freies gespräch', color: 'var(--node-green)' },
    { id: 'interview', icon: '💼', title: 'Vorstellungs-gespräch', color: 'var(--node-purple)' },
    { id: 'meeting', icon: '🗂️', title: 'Büro-besprechung', color: 'var(--node-green)' },
    { id: 'restaurant', icon: '🍽️', title: 'Im Restaurant', color: 'var(--node-brown)' },
    { id: 'apartment', icon: '🏠', title: 'Wohnungs-besichtigung', color: 'var(--node-red)' },
    { id: 'immigration', icon: '🛂', title: 'Ausländer-behörde', color: 'var(--node-gray)' },
  ];

  const getTransform = (i) => {
    const mod = i % 4;
    if (mod === 0) return 'translateX(0)';
    if (mod === 1) return 'translateX(-40px)';
    if (mod === 2) return 'translateX(0)';
    if (mod === 3) return 'translateX(40px)';
  };

  const topicColors = ['var(--topic-purple)', 'var(--topic-blue)', 'var(--topic-orange)', 'var(--topic-yellow)'];

  if (activeView === 'path') {
    return (
      <div style={{ paddingBottom: 24 }}>
        {/* Front Page Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid var(--line)',
          marginBottom: 16,
          background: 'var(--nav-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <circle cx="18" cy="18" r="18" fill="#136B53"/>
              <path d="M9 13.5L13.5 24.5L17.5 17.5L21.5 24.5L26 13.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M25 11C26.5 12 27.5 13.5 27.5 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M28 8.5C30.2 10 31.5 12.2 31.5 15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Fraunces', serif", color: '#fff', lineHeight: 1.2 }}>Deutsch Werkstatt</span>
              <span style={{ fontSize: 8, color: 'var(--ink-soft)', letterSpacing: '0.08em', fontWeight: 600, lineHeight: 1 }}>DEIN KI-SPRACHSTUDIO</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              value={level}
              onChange={(e) => onLevelChange && onLevelChange(e.target.value)}
              style={{
                background: '#2B4B70',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {LEVELS.map(lvl => (
                <option key={lvl} value={lvl} style={{ background: '#1E1E1E', color: '#fff' }}>{lvl}</option>
              ))}
            </select>
            <button onClick={() => onOpenApiKey && onOpenApiKey()} style={{ background: 'transparent', border: 'none', padding: '4px', borderRadius: 4, color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>🔑</span>
            </button>
          </div>
        </header>

        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: 20, marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>Einheit 4</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>Im Beruf • Vorstellungsgespräch</div>
        </div>

        {/* Path Layout */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, padding: '20px 0' }}>
          <svg style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 140, height: '100%', zIndex: 0 }} viewBox="0 0 140 600" preserveAspectRatio="none">
             <path d="M 70 0 C 10 100, 130 200, 70 300 C 10 400, 130 500, 70 600" fill="none" stroke="var(--line)" strokeWidth="16" strokeLinecap="round" />
          </svg>

          {pathNodes.map((node, i) => {
             const isSelected = scenario?.id === node.id || (!scenario && node.id === 'free');
             return (
               <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: getTransform(i), position: 'relative', zIndex: 2 }}>
                  <button 
                     onClick={() => {
                        if (node.id === 'free') setScenario(null);
                        else setScenario(SCENARIOS.find(s => s.id === node.id));
                        setActiveView('chat');
                     }}
                     style={{
                       width: 64, height: 64, borderRadius: '50%', background: node.color, 
                       display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 24,
                       border: 'none', position: 'relative', cursor: 'pointer'
                     }}
                  >
                     {node.icon}
                     {isSelected && <div style={{ position: 'absolute', inset: -6, border: `3px solid ${node.color}`, borderRadius: '50%' }} />}
                  </button>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 12, textAlign: 'center', maxWidth: 100, lineHeight: 1.2 }}>{node.title}</div>
               </div>
             );
          })}
        </div>

        {/* Topics Grid */}
        <div style={{ marginTop: 20, padding: '0 10px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--ink)' }}>Interview prep themen</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {INTERVIEW_TOPICS.slice(0, 4).map((topic, i) => (
              <button
                 key={topic.id}
                 onClick={() => {
                   setScenario(SCENARIOS.find(s => s.id === 'interview'));
                   setInterviewTopic(topic);
                   setActiveView('chat');
                 }}
                 style={{
                   background: topicColors[i % topicColors.length],
                   color: '#111',
                   border: 'none', borderRadius: 12, padding: '16px 10px',
                   display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer'
                 }}
              >
                 <span style={{ fontSize: 20 }}>{topic.icon}</span>
                 <span style={{ fontSize: 12, fontWeight: 700 }}>{topic.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- CHAT VIEW ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1E1E1E' }}>
        <button onClick={() => setActiveView('path')} style={{ background: 'transparent', border: 'none', padding: '4px', borderRadius: 4, color: 'var(--ink)', cursor: 'pointer', fontSize: 20 }}>
          <span>⬅️</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3B3A39', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 20 }}>
            {scenario ? scenario.icon : '💬'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {scenario ? scenario.title : 'Freies gespräch'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              {scenario ? 'Job interview roleplay' : 'Free conversation'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={level}
            onChange={(e) => onLevelChange && onLevelChange(e.target.value)}
            style={{
              background: '#2B4B70',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {LEVELS.map(lvl => (
              <option key={lvl} value={lvl} style={{ background: '#1E1E1E', color: '#fff' }}>{lvl}</option>
            ))}
          </select>
          <button onClick={() => onOpenApiKey && onOpenApiKey()} style={{ background: 'transparent', border: 'none', padding: '4px', borderRadius: 4, color: 'var(--ink)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center' }}>
            <span>🔑</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <EmptyState title="Say hello! 👋" body="Type or use the mic to start speaking German. Corrections appear right under each of your messages." />
        )}
        {messages.map((m, i) => (
          <div key={i} className="fadein" style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              {m.role === 'model' && (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#41328C', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 16 }}>🤖</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  background: m.role === 'user' ? '#2B4B70' : '#2A2A2A',
                  color: '#fff',
                  borderRadius: 14,
                  padding: '12px 16px',
                  fontSize: 15,
                  lineHeight: 1.5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  {m.text}
                  {m.role === 'model' && m.translation && showTranslation && (
                    <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6 }}>
                      {m.translation}
                    </div>
                  )}
                  {m.role === 'model' && !m.error && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                      <button onClick={() => speak(m.text, i)} disabled={ttsBusyId === i} style={{ border: 'none', background: 'transparent', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 16, padding: 0 }}>🔊</button>
                      <button onClick={() => speak(m.text, i + '_slow', 0.65)} disabled={ttsBusyId === i + '_slow'} style={{ border: 'none', background: 'transparent', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 16, padding: 0 }}>🐌</button>
                    </div>
                  )}
                </div>
                {m.corrections && m.corrections.length > 0 && (
                  <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                    {m.corrections.map((c, ci) => (
                      <div key={ci} style={{ background: '#5C3232', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 13, border: '1px solid #7a4343' }}>
                        <div><span style={{ fontSize: 12, marginRight: 6 }}>💡</span> Besser: <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{c.original}</span> → <strong>{c.correction}</strong></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && <Loading label="Tutor is typing…" />}
      </div>

      {/* Input row */}
      <div style={{ padding: '16px', background: '#323130', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            style={{
              background: showTranslation ? '#2B4B70' : 'transparent',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '8px 16px',
              color: '#fff',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              flex: 1,
              justifyContent: 'center'
            }}
          >
            <span>🌐</span> Übersetzen
          </button>
          <button
            onClick={() => setVoiceOn(!voiceOn)}
            style={{
              background: voiceOn ? '#2B4B70' : 'transparent',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '8px 16px',
              color: '#fff',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              flex: 1,
              justifyContent: 'center'
            }}
          >
            <span>{voiceOn ? '🔊' : '🔈'}</span> {voiceOn ? 'Sprache An' : 'Sprache Aus'}
          </button>
          <button onClick={clearCurrent} style={{ background: 'transparent', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
            <span>🗑️</span> Chat leeren
          </button>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={listening ? stopListening : startListening}
            disabled={transcribing}
            style={{
              width: 44, height: 44, borderRadius: '50%', background: '#5C3232', color: '#fff', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 18, flexShrink: 0
            }}
          >
            {listening ? <span className="pulse-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#A8402B' }} /> : '🎙️'}
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !transcribing && send()}
            placeholder="Schreib auf Deutsch..."
            disabled={transcribing}
            style={{
              flex: 1, padding: '12px 16px', border: '1px solid var(--line)',
              borderRadius: 8, background: '#2A2A2A', color: '#fff', opacity: transcribing ? 0.6 : 1, outline: 'none', fontSize: 15
            }}
          />
          <button onClick={() => send()} disabled={loading || transcribing || !input.trim()} style={{ width: 44, height: 44, borderRadius: '50%', background: '#2B4B70', border: 'none', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 18, flexShrink: 0 }}>
            ➔
          </button>
        </div>
      </div>
    </div>
  );
}
