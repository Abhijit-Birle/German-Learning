// ============================================================
// LocalStorage helpers + shared mistake / vocab persistence
// ============================================================

export const LS = {
  get(k, fallback) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      // quota exceeded — silently ignore
    }
  },
};

// ---- Mistakes -------------------------------------------------------
export function loadMistakes() {
  return LS.get('gt_mistakes', []);
}

export function addMistakes(newOnes) {
  if (!newOnes || !newOnes.length) return;
  const cur = loadMistakes();
  const stamped = newOnes.map((m) => ({
    id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    date: new Date().toISOString(),
    category: m.category || 'grammar',
    original: m.original || m.mistake || '',
    correction: m.correction || '',
    explanation: m.explanation || '',
    source: m.source || 'tutor',
  }));
  LS.set('gt_mistakes', [...stamped, ...cur].slice(0, 500));
}

// ---- Vocabulary -----------------------------------------------------
export function loadVocab() {
  return LS.get('gt_vocab', []);
}

export function saveVocab(v) {
  LS.set('gt_vocab', v);
}
