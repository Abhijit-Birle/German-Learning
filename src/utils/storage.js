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

// ---- Writings -------------------------------------------------------
export function loadWritings() {
  return LS.get('gt_writings', []);
}

export function addWriting(writing) {
  if (!writing) return;
  const cur = loadWritings();
  const entry = {
    ...writing,
    id: 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    date: new Date().toISOString(),
  };
  LS.set('gt_writings', [entry, ...cur].slice(0, 100)); // Keep last 100 submissions
}

// ---- Dictionary -----------------------------------------------------
export function loadDictHistory() {
  return LS.get('gt_dict_history', []);
}

export function addDictHistory(wordData) {
  if (!wordData || !wordData.word) return;
  const cur = loadDictHistory();
  // Remove if exists to move to top
  const filtered = cur.filter(w => w.word.toLowerCase() !== wordData.word.toLowerCase());
  const entry = {
    ...wordData,
    date: new Date().toISOString(),
  };
  LS.set('gt_dict_history', [entry, ...filtered].slice(0, 200)); // Keep last 200 words
}

// ---- IndexedDB for Audio Caching ------------------------------------
const DB_NAME = 'DeutschWerkstattDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioCache';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export const AudioCache = {
  async get(key) {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IDB get error', e);
      return null;
    }
  },
  async set(key, value) {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IDB set error', e);
    }
  }
};

