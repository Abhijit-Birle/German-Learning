// ============================================================
// Text-to-Speech utilities (Gemini TTS + browser fallback)
// ============================================================

import { LS } from './storage.js';

// ---- PCM (base64) → playable WAV blob URL -----------------------
export function pcmBase64ToWavUrl(base64, sampleRate, numChannels, bitsPerSample) {
  sampleRate = sampleRate || 24000;
  numChannels = numChannels || 1;
  bitsPerSample = bitsPerSample || 16;

  const binary = atob(base64);
  const len = binary.length;
  const samples = new Uint8Array(len);
  for (let i = 0; i < len; i++) samples[i] = binary.charCodeAt(i);

  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);
  const writeStr = (offset, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF'); view.setUint32(4, 36 + len, true); writeStr(8, 'WAVE');
  writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data'); view.setUint32(40, len, true);
  new Uint8Array(buffer, 44).set(samples);

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

// ---- Gemini TTS API call ----------------------------------------
export async function callGeminiTTS(text, voiceName) {
  const key = LS.get('gt_apikey', '');
  if (!key) throw new Error('NO_KEY');

  const model = 'gemini-2.5-flash-preview-tts';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' } } },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('TTS_ERROR ' + res.status + ': ' + t.slice(0, 200));
  }

  const data = await res.json();
  const parts =
    (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  const part = parts.find((p) => p.inlineData);
  if (!part) throw new Error('No audio returned by TTS model');

  const mime = part.inlineData.mimeType || '';
  const rateMatch = mime.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  return { base64: part.inlineData.data, sampleRate };
}

// ---- Cached TTS playback ----------------------------------------
const _ttsCache = {};

export async function speakHumanGerman(text, voiceName, rate) {
  const cacheKey = voiceName + '::' + text;
  let url = _ttsCache[cacheKey];
  if (!url) {
    const { base64, sampleRate } = await callGeminiTTS(text, voiceName);
    url = pcmBase64ToWavUrl(base64, sampleRate);
    _ttsCache[cacheKey] = url;
  }
  const audio = new Audio(url);
  audio.playbackRate = rate || 1.0;
  await audio.play();
  return audio;
}

// ---- Browser speech synthesis fallback --------------------------
export function speakBrowserFallback(text, rate) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = rate || 0.92;
  window.speechSynthesis.speak(u);
}
