// ============================================================
// useGemini — hook that wraps Gemini generateContent API
// ============================================================

import { useCallback } from 'react';
import { LS } from '../utils/storage.js';

export function useGemini() {
  const apiKey = LS.get('gt_apikey', '');

  const call = useCallback(async (systemInstruction, contents, jsonSchema) => {
    const key = LS.get('gt_apikey', '');
    const mdl = LS.get('gt_model', 'gemini-2.5-flash');
    if (!key) throw new Error('NO_KEY');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${key}`;
    const body = {
      contents,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: jsonSchema ? { responseMimeType: 'application/json' } : {},
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error('API_ERROR: ' + res.status + ' ' + t.slice(0, 200));
    }

    const data = await res.json();
    const cand = data.candidates && data.candidates[0];
    if (!cand) throw new Error('No response from model');

    const text = (cand.content.parts || []).map((p) => p.text || '').join('');

    if (jsonSchema) {
      try {
        const cleaned = text.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        throw new Error('Could not parse model JSON: ' + text.slice(0, 200));
      }
    }
    return text;
  }, []);

  return { call, hasKey: !!apiKey };
}
