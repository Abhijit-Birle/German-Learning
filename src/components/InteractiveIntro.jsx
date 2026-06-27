import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './ui/Icon.jsx';
import { speakBrowserFallback, speakHumanGerman } from '../utils/tts.js';

export function InteractiveIntro({ appLang, onNext }) {
  const [phase, setPhase] = useState(0); // 0: init, 1: wait hallo, 2: wait name, 3: done
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const audioChunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const [botMessage, setBotMessage] = useState('Hallo!');
  
  const speak = async (text) => {
    try {
      await speakHumanGerman(text, 'Male 1', 1.0); // using a default voice since it's the bot's intro
    } catch (e) {
      speakBrowserFallback(text, 1.0);
    }
  };

  useEffect(() => {
    if (phase === 0) {
      speak('Hallo!');
      setPhase(1);
    }
  }, [phase]);

  const transcribeAudio = async (blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    await new Promise((r) => (reader.onloadend = r));
    const base64Data = reader.result.split(',')[1];

    const apiKey = localStorage.getItem('gt_apikey');
    if (!apiKey) throw new Error('NO_KEY');

    const payload = {
      contents: [{
        parts: [
          { inline_data: { mime_type: blob.type, data: base64Data } },
          { text: "Transcribe this German audio accurately. Only output the transcription, nothing else." }
        ]
      }],
      generationConfig: { temperature: 0.1 }
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error('Transcription error');
    }
    const data = await res.json();
    return ((data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('')).trim();
  };

  const startListening = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      alert('Microphone permission denied.');
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
        // We'll let the user manually click send so they can see the transcription, or auto send.
        // Let's auto send to make it fast like the Tutor.
        handleSend(transcript);
      } catch (e) {
        setInput('');
        alert('STT Error: ' + e.message + '. Please try typing.');
      } finally {
        setTranscribing(false);
      }
    };
    mr.start(200);
    setListening(true);
    recTimerRef.current = setTimeout(() => {
      if (mr.state === 'recording') mr.stop();
    }, 10000);
  };

  const handleSend = (text) => {
    const val = (text || input).trim();
    if (!val) return;

    if (phase === 1) {
      // User said Hallo
      const nextMsg = 'Ich heiße Aibot, wie heißt du?';
      setBotMessage(nextMsg);
      speak(nextMsg);
      setInput('');
      setPhase(2);
    } else if (phase === 2) {
      // User gave name
      const nameMatch = val.match(/(?:ich heiße |mein name ist |ich bin )?(\w+)/i);
      const name = nameMatch ? nameMatch[1] : val;
      const nextMsg = `Nice to meet you ${name}. Let's get started.`;
      setBotMessage(nextMsg);
      speak(nextMsg);
      setInput('');
      setPhase(3);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px 0', alignItems: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: 400 }}>
        
        {/* Bot Message Bubble */}
        <div className="neu-raised" style={{ padding: '24px', borderRadius: 20, marginBottom: 40, width: '100%', textAlign: 'center' }}>
          <Icon name="MessageCircle" size={32} color="var(--color-teal)" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>{botMessage}</div>
        </div>

        {/* User Input Area */}
        {phase < 3 ? (
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <input 
              className="neu-inset"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={phase === 1 ? "Type 'Hallo'..." : "Type your name..."}
              disabled={transcribing}
              style={{ flex: 1, padding: '16px', fontSize: 16, border: 'none', outline: 'none' }}
            />
            <button 
              className={listening ? "neu-inset" : "neu-raised"}
              onClick={listening ? () => {} : startListening}
              style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: listening ? 'var(--color-copper)' : 'var(--color-teal)' }}
            >
              <Icon name="Mic" size={24} />
            </button>
            <button 
              className="neu-btn"
              onClick={() => handleSend()}
              disabled={transcribing || !input.trim()}
              style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="Send" size={20} />
            </button>
          </div>
        ) : (
          <button 
            className="neu-btn"
            onClick={onNext}
            style={{ padding: '16px 32px', fontSize: 18 }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
