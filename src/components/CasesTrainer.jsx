import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './ui/Icon.jsx';
import { VERB_CASE_DATA } from '../data/verbCaseData.js';
import { useExerciseStore } from '../store/useExerciseStore.js';
import { addMistakes } from '../utils/storage.js';
import { t } from '../i18n.js';
import { ProgressRing } from './ui/Atoms.jsx';
import { SessionComplete } from './SessionComplete.jsx';
import { ArticleTrainer } from './ArticleTrainer.jsx';

// Tier definitions
const TIERS = [
  { id: 1, name: 'Tier 1', desc: 'Identify the Case', icon: 'Tag', unlockScore: 0 },
  { id: 2, name: 'Tier 2', desc: 'Article Selection', icon: 'List', unlockScore: 7 }, // Need 7/10 in Tier 1 to unlock
  { id: 3, name: 'Tier 3', desc: 'Translate Sentence', icon: 'Edit3', unlockScore: 7 }  // Need 7/10 in Tier 2 to unlock
];

// Generates 4 article options dynamically based on correct case/gender.
// Simple hardcoded mapping for typical cases.
const getArticleDistractors = (correctArticle) => {
  const articles = ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'eines'];
  const distractors = articles.filter(a => a !== correctArticle).sort(() => 0.5 - Math.random()).slice(0, 3);
  return [correctArticle, ...distractors].sort(() => 0.5 - Math.random());
};

const extractArticleFromSentence = (sentenceDe) => {
  // A naive approach for Tier 2: find the first article in the sentence to blank out.
  // We'll blank out the first word that matches our known articles.
  const knownArticles = ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'eines', 'meiner', 'meinem', 'seinen', 'seiner', 'ihrem', 'ihren', 'dein', 'deinem', 'deinen'];
  const words = sentenceDe.split(' ');
  for (let i = 0; i < words.length; i++) {
    const cleanWord = words[i].replace(/[^a-zA-ZäöüßÄÖÜ]/g, '').toLowerCase();
    if (knownArticles.includes(cleanWord)) {
      // found an article
      const correct = words[i].replace(/[^a-zA-ZäöüßÄÖÜ]/g, ''); // keep original case for display
      const prefix = words[i].substring(0, words[i].indexOf(correct));
      const suffix = words[i].substring(words[i].indexOf(correct) + correct.length);
      const parts = [
        words.slice(0, i).join(' ') + (i > 0 ? ' ' : '') + prefix,
        suffix + (i < words.length - 1 ? ' ' : '') + words.slice(i + 1).join(' ')
      ];
      return { correct, parts };
    }
  }
  // fallback if no article found
  return null;
};

export function CasesTrainer({ onBack, appLang }) {
  const { casesHighestTierUnlocked, setCasesHighestTierUnlocked } = useExerciseStore();

  const [view, setView] = useState('main_menu'); // 'main_menu', 'menu', 'tier1', 'tier2', 'tier3', 'results'
  const [sessionQueue, setSessionQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [wrongVerbs, setWrongVerbs] = useState([]);

  // Interaction states for questions
  const [showResult, setShowResult] = useState(null); // null | 'correct' | 'wrong'
  const [selectedOption, setSelectedOption] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [tier2Data, setTier2Data] = useState(null);

  // Filter states
  const [selectedCasesFilter, setSelectedCasesFilter] = useState(['dativ', 'akkusativ', 'wechsel']);

  const toggleCaseFilter = (c) => {
    setSelectedCasesFilter(prev => {
      if (prev.includes(c)) return prev.filter(x => x !== c);
      return [...prev, c];
    });
  };

  const startSession = (tierId) => {
    if (selectedCasesFilter.length < 2) {
      alert("Please select at least 2 cases to practice.");
      return;
    }

    // Filter and Pick up to 10 random verbs
    let filtered = VERB_CASE_DATA.filter(v => selectedCasesFilter.includes(v.case));
    if (filtered.length === 0) filtered = VERB_CASE_DATA; // Fallback
    const shuffled = filtered.sort(() => 0.5 - Math.random()).slice(0, 10);

    setSessionQueue(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setWrongVerbs([]);
    setShowResult(null);
    setSelectedOption(null);
    setTextInput('');
    setView(`tier${tierId}`);

    if (tierId === 2) {
      setupTier2(shuffled[0]);
    }
  };

  const setupTier2 = (verbData) => {
    const extracted = extractArticleFromSentence(verbData.exampleDe);
    if (extracted) {
      setTier2Data({
        correct: extracted.correct,
        parts: extracted.parts,
        options: getArticleDistractors(extracted.correct.toLowerCase())
      });
    } else {
      // Fallback if no article could be extracted (e.g. proper nouns or pronouns only)
      setTier2Data({
        correct: 'fallback',
        parts: [verbData.exampleDe, ''],
        options: []
      });
    }
  };

  const handleAnswerTier1 = (selectedCase) => {
    if (showResult) return;
    setSelectedOption(selectedCase);
    const verbData = sessionQueue[currentIndex];
    const isCorrect = verbData.case === selectedCase;

    processAnswer(verbData, isCorrect);
  };

  const handleAnswerTier2 = (selectedArt) => {
    if (showResult) return;
    setSelectedOption(selectedArt);
    const verbData = sessionQueue[currentIndex];
    const isCorrect = tier2Data && tier2Data.correct.toLowerCase() === selectedArt.toLowerCase();

    processAnswer(verbData, isCorrect);
  };

  const handleSubmitTier3 = () => {
    if (showResult || !textInput.trim()) return;
    const verbData = sessionQueue[currentIndex];

    // Naive string compare
    const normalize = (str) => str.toLowerCase().replace(/[^a-zäöüß]/g, '');
    const isCorrect = normalize(textInput) === normalize(verbData.exampleDe);

    processAnswer(verbData, isCorrect);
  };

  const processAnswer = (verbData, isCorrect) => {
    if (isCorrect) {
      setScore(s => s + 1);
      setShowResult('correct');
    } else {
      setWrongVerbs(prev => {
        if (!prev.find(v => v.verb === verbData.verb)) return [...prev, verbData];
        return prev;
      });
      setShowResult('wrong');
    }

    // Removed auto advance timeout
  };

  const handleNext = () => {
    setShowResult(null);
    setSelectedOption(null);
    setTextInput('');

    if (currentIndex < sessionQueue.length - 1) {
      const nextVerb = sessionQueue[currentIndex + 1];
      if (view === 'tier2') setupTier2(nextVerb);
      setCurrentIndex(i => i + 1);
    } else {
      finishSession();
    }
  };

  const finishSession = () => {
    // Check unlocks
    const currentTier = parseInt(view.replace('tier', ''));
    if (score >= 7) {
      if (currentTier === 1 && casesHighestTierUnlocked < 2) setCasesHighestTierUnlocked(2);
      if (currentTier === 2 && casesHighestTierUnlocked < 3) setCasesHighestTierUnlocked(3);
    }

    // Push mistakes
    if (wrongVerbs.length > 0) {
      const mistakeEntries = wrongVerbs.map(v => ({
        category: 'Fälle (Verb Cases)',
        original: `Used wrong case for '${v.verb}' (${v.english})`,
        correction: v.exampleDe,
        explanation: `Das Verb '${v.verb}' verlangt den ${v.case}.`,
        source: 'cases_trainer'
      }));
      addMistakes(mistakeEntries);
    }

    setView('results');
  };

  // ------------------------------------------------------------------
  // RENDER: Main Menu
  // ------------------------------------------------------------------
  if (view === 'main_menu') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--app-bg)', overflow: 'hidden' }}>
        <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button whileTap={{ scale: 0.95 }} className="neu-small" onClick={onBack} style={{ padding: '6px', color: 'var(--ink)' }}>
            <Icon name="ChevronLeft" size={20} />
          </motion.button>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', flex: 1, textAlign: 'center' }}>
            Fälle üben
          </div>
          <div style={{ width: 32 }} />
        </header>

        <div style={{ padding: '24px 16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
          <motion.button whileTap={{ scale: 0.95 }}
            className="neu-panel"
            onClick={() => setView('menu')}
            style={{
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--paper)',
              textAlign: 'center'
            }}
          >
            <div className="neu-small" style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-teal)' }}>
              <Icon name="Tag" size={32} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>Practice Verb</div>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Identify the case governed by the verb and translate sentences.</div>
            </div>
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }}
            className="neu-panel"
            onClick={() => setView('practice_articles')}
            style={{
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--paper)',
              textAlign: 'center'
            }}
          >
            <div className="neu-small" style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-copper)' }}>
              <Icon name="List" size={32} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>Practice Articles</div>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Fill in the correct definite article for sentences according to the verb.</div>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // RENDER: Practice Articles (Artikel Trainer)
  // ------------------------------------------------------------------
  if (view === 'practice_articles') {
    return <ArticleTrainer onBack={() => setView('main_menu')} />;
  }

  // ------------------------------------------------------------------
  // RENDER: Menu
  // ------------------------------------------------------------------
  if (view === 'menu') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--app-bg)', overflow: 'hidden' }}>
        <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button whileTap={{ scale: 0.95 }} className="neu-small" onClick={() => setView('main_menu')} style={{ padding: '6px', color: 'var(--ink)' }}>
            <Icon name="ChevronLeft" size={20} />
          </motion.button>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
            Fälle üben
          </div>
        </header>

        <div style={{ padding: '24px 16px', flex: 1, overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="neu-inset" style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
              <Icon name="RefreshCw" size={32} color="var(--color-copper)" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Verb Case Trainer</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Master Dativ, Akkusativ, and Wechselverben through progressive tiers.</p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>Filter Cases (Min 2)</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {['dativ', 'akkusativ', 'wechsel'].map(c => {
                const isSelected = selectedCasesFilter.includes(c);
                return (
                  <motion.button whileTap={{ scale: 0.95 }}
                    key={c}
                    onClick={() => toggleCaseFilter(c)}
                    className={isSelected ? "neu-tile-primary" : "neu-small"}
                    style={{
                      padding: '8px 16px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: isSelected ? '#fff' : 'var(--ink)',
                      border: 'none',
                      textTransform: 'capitalize'
                    }}
                  >
                    {c === 'wechsel' ? 'Wechselverb' : c}
                  </motion.button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {TIERS.map(tier => {
              // Keeping all tiers unlocked for now based on user request
              const isUnlocked = true; // tier.id <= casesHighestTierUnlocked;
              return (
                <motion.button whileTap={{ scale: 0.95 }}
                  key={tier.id}
                  onClick={() => isUnlocked && startSession(tier.id)}
                  disabled={!isUnlocked}
                  className={isUnlocked ? "neu-raised" : "neu-inset"}
                  style={{
                    padding: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    border: 'none',
                    opacity: isUnlocked ? 1 : 0.6,
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    textAlign: 'left'
                  }}
                >
                  <div className={isUnlocked ? "neu-small" : ""} style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, background: !isUnlocked ? 'rgba(0,0,0,0.05)' : '' }}>
                    <Icon name={isUnlocked ? tier.icon : 'Lock'} size={24} color={isUnlocked ? 'var(--color-teal)' : 'var(--ink-soft)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{tier.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>{tier.desc}</div>
                  </div>
                  {isUnlocked && (
                    <Icon name="ChevronRight" size={20} color="var(--ink-soft)" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // RENDER: Results
  // ------------------------------------------------------------------
  if (view === 'results') {
    const currentTier = parseInt(view.replace('tier', '')); // Need to extract this correctly, wait, view is 'results' here.
    // actually we can just rely on state or pass it. Let's just show general results.
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--app-bg)', overflow: 'hidden' }}>
        <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', flex: 1, textAlign: 'center' }}>
            Ergebnisse
          </div>
        </header>

        <div style={{ padding: '24px 16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 24 }}>
            <ProgressRing progress={(score / 10) * 100} size={140} strokeWidth={12} color={score >= 7 ? "var(--color-teal)" : "var(--color-copper)"} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)' }}>{score}</span>
              <span style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 600 }}>/ 10</span>
            </div>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
            {score >= 7 ? 'Gut gemacht!' : 'Übung macht den Meister!'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center', marginBottom: 32 }}>
            {score >= 7 ? 'Du hast die nächste Stufe freigeschaltet (falls verfügbar).' : 'Du brauchst 7/10, um die nächste Stufe freizuschalten.'}
          </p>

          {wrongVerbs.length > 0 && (
            <div style={{ width: '100%', marginBottom: 32 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>Schwächste Verben</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {wrongVerbs.map(v => (
                  <div key={v.verb} className="neu-inset" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{v.verb}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-copper)', textTransform: 'uppercase' }}>{v.case}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{v.exampleDe}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, width: '100%' }}>
            <motion.button whileTap={{ scale: 0.95 }} className="neu-small" onClick={() => setView('menu')} style={{ flex: 1, padding: 16, fontWeight: 700, color: 'var(--ink)', border: 'none' }}>
              Beenden
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="neu-btn" onClick={() => setView('menu')} style={{ flex: 1, padding: 16, fontWeight: 700 }}>
              Weiter
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // RENDER: Active Session (Tier 1, 2, 3)
  // ------------------------------------------------------------------
  const currentVerb = sessionQueue[currentIndex];
  if (!currentVerb) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--app-bg)', overflow: 'hidden' }}>
      {/* Header & Progress */}
      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <motion.button whileTap={{ scale: 0.95 }} className="neu-small" onClick={() => setView('main_menu')} style={{ padding: '6px', color: 'var(--ink)' }}>
          <Icon name="X" size={20} />
        </motion.button>
        <div className="neu-inset" style={{ flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ width: `${(currentIndex / 10) * 100}%`, height: '100%', background: 'var(--color-teal)', transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-soft)' }}>
          {currentIndex + 1}/10
        </div>
      </header>

      <div style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Tier 1: Identify Case */}
        {view === 'tier1' && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Which case?</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink)', textAlign: 'center' }}>{currentVerb.verb}</div>
              <div style={{ fontSize: 16, color: 'var(--ink-soft)', marginTop: 8 }}>{currentVerb.english}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {['dativ', 'akkusativ', 'wechsel'].map(c => {
                const isSelected = selectedOption === c;
                let bgClass = "neu-small";
                let textColor = "var(--ink)";
                if (showResult && isSelected) {
                  if (showResult === 'correct') {
                    bgClass = "neu-tile-primary"; // Or a specific success class if we had one
                    textColor = "#fff";
                  } else {
                    bgClass = "neu-inset";
                    textColor = "var(--color-copper)";
                  }
                } else if (showResult && c === currentVerb.case) {
                  // Show correct answer if they got it wrong
                  bgClass = "neu-tile-primary";
                  textColor = "#fff";
                }

                return (
                  <motion.button whileTap={{ scale: 0.95 }}
                    key={c}
                    onClick={() => handleAnswerTier1(c)}
                    disabled={!!showResult}
                    className={bgClass}
                    style={{
                      padding: 20,
                      fontSize: 16,
                      fontWeight: 700,
                      border: 'none',
                      color: textColor,
                      textTransform: 'capitalize',
                      transition: 'all 0.2s',
                      background: (showResult && (isSelected || c === currentVerb.case)) ? (c === currentVerb.case ? 'var(--color-teal)' : 'var(--color-copper)') : undefined
                    }}
                  >
                    {c === 'wechsel' ? 'Wechselverb' : c}
                  </motion.button>
                )
              })}
            </div>
          </>
        )}

        {/* Tier 2: Article Selection */}
        {view === 'tier2' && tier2Data && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Select the article</div>

              {tier2Data.correct === 'fallback' ? (
                // Fallback rendering
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>
                  {currentVerb.exampleDe} (No article to guess)
                </div>
              ) : (
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.5 }}>
                  {tier2Data.parts[0]}
                  <span style={{
                    display: 'inline-block',
                    minWidth: 60,
                    borderBottom: `3px solid ${showResult ? (showResult === 'correct' ? 'var(--color-teal)' : 'var(--color-copper)') : 'var(--ink-soft)'}`,
                    margin: '0 8px',
                    padding: '0 4px',
                    color: showResult ? (showResult === 'correct' ? 'var(--color-teal)' : 'var(--color-copper)') : 'transparent'
                  }}>
                    {showResult ? tier2Data.correct : '___'}
                  </span>
                  {tier2Data.parts[1]}
                </div>
              )}
              <div style={{ fontSize: 16, color: 'var(--ink-soft)', marginTop: 16 }}>{currentVerb.exampleEn}</div>
            </div>

            {tier2Data.options.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {tier2Data.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  let bg = undefined;
                  let color = 'var(--ink)';
                  if (showResult) {
                    if (opt.toLowerCase() === tier2Data.correct.toLowerCase()) {
                      bg = 'var(--color-teal)';
                      color = '#fff';
                    } else if (isSelected && showResult === 'wrong') {
                      bg = 'var(--color-copper)';
                      color = '#fff';
                    }
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswerTier2(opt)}
                      disabled={!!showResult}
                      className="neu-small"
                      animate={{
                        backgroundColor: bg || 'var(--paper)',
                        color: color || 'var(--ink)',
                        x: bg === 'var(--color-copper)' ? [0, -6, 6, -4, 4, 0] : 0
                      }}
                      transition={{ x: { duration: 0.3 } }}
                      style={{
                        padding: 20,
                        fontSize: 16,
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: 16,
                        textTransform: 'lowercase'
                      }}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              // Fallback advance button
              <motion.button whileTap={{ scale: 0.95 }} className="neu-btn" onClick={() => handleAnswerTier2('fallback')} style={{ padding: 16, width: '100%' }}>
                Weiter
              </motion.button>
            )}
          </>
        )}

        {/* Tier 3: Translation */}
        {view === 'tier3' && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Translate</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.4 }}>
                {currentVerb.exampleEn}
              </div>
              <div style={{ fontSize: 14, color: 'var(--color-teal)', fontWeight: 700, marginTop: 16, background: 'rgba(57, 160, 152, 0.1)', padding: '6px 12px', borderRadius: 8 }}>
                Use: {currentVerb.verb}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <textarea
                className="neu-inset"
                placeholder="Type in German..."
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                disabled={!!showResult}
                style={{
                  padding: 16,
                  fontSize: 16,
                  border: 'none',
                  outline: 'none',
                  borderRadius: 16,
                  minHeight: 100,
                  resize: 'none',
                  color: 'var(--ink)'
                }}
              />
              <motion.button whileTap={{ scale: 0.95 }}
                className="neu-btn"
                onClick={handleSubmitTier3}
                disabled={!!showResult || !textInput.trim()}
                style={{ padding: 16, fontWeight: 700 }}
              >
                Prüfen
              </motion.button>
            </div>
          </>
        )}

        {/* Callout Result */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="neu-raised"
              style={{
                padding: 16,
                borderLeft: `6px solid ${showResult === 'correct' ? 'var(--color-teal)' : 'var(--color-copper)'}`,
                background: 'var(--card-bg)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name={showResult === 'correct' ? 'CheckCircle' : 'XCircle'} size={20} color={showResult === 'correct' ? 'var(--color-teal)' : 'var(--color-copper)'} />
                <span style={{ fontWeight: 700, fontSize: 16, color: showResult === 'correct' ? 'var(--color-teal)' : 'var(--color-copper)' }}>
                  {showResult === 'correct' ? 'Richtig!' : 'Falsch!'}
                </span>
              </div>
              <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600, marginBottom: 4 }}>
                {currentVerb.exampleDe}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
                {currentVerb.english} • <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{currentVerb.case}</span>
              </div>
              <motion.button whileTap={{ scale: 0.95 }}
                className="neu-btn"
                onClick={handleNext}
                style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 700 }}
              >
                Weiter
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
