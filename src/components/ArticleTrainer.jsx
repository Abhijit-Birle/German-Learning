import { useState, useEffect, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './ui/Icon.jsx';
import { useExerciseStore } from '../store/useExerciseStore.js';
import { addMistakes } from '../utils/storage.js';
import { ARTICLE_TABLE, NOUN_BANK, CASE_TO_ROW, SENTENCE_TEMPLATES, SENTENCE_TEMPLATES_EN } from '../data/articleTrainerData.js';
import { VERB_CASE_DATA } from '../data/verbCaseData.js';

// -----------------------------------------------------------------------------
// Result Card Component (Replaces ExplanationTip)
// -----------------------------------------------------------------------------
function ResultCard({ status, translation, explanation, onDismiss }) {
  if (!status) return null;
  const isCorrect = status === 'correct';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={
        isCorrect 
          ? { opacity: 1, y: 0, x: 0 } 
          : { opacity: 1, y: 0, x: [0, -8, 8, -6, 6, -3, 3, 0] }
      }
      transition={
        isCorrect 
          ? { duration: 0.3 }
          : { x: { duration: 0.5 }, opacity: { duration: 0.3 } }
      }
      exit={{ opacity: 0, y: 10 }}
      className="neu-inset"
      style={{
        width: '100%',
        maxWidth: 400,
        marginTop: 16,
        padding: '20px',
        borderRadius: '16px',
        background: isCorrect ? 'rgba(76, 175, 80, 0.05)' : 'rgba(233, 110, 80, 0.05)',
        border: `2px solid ${isCorrect ? 'var(--color-teal)' : 'var(--color-copper)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isCorrect ? 'var(--color-teal)' : 'var(--color-copper)', fontSize: 18, fontWeight: 800 }}>
        <Icon name={isCorrect ? 'CheckCircle' : 'AlertCircle'} size={24} />
        <span>{isCorrect ? 'Richtig!' : 'Falsch!'}</span>
      </div>
      {translation && (
        <div style={{ color: 'var(--ink)', fontSize: 15 }}>
          <strong style={{ color: 'var(--ink-soft)' }}>Bedeutung:</strong><br />
          {translation}
        </div>
      )}
      {explanation && (
        <div style={{ color: 'var(--ink)', fontSize: 15 }}>
          <strong style={{ color: 'var(--ink-soft)' }}>Erklärung:</strong><br />
          {explanation}
        </div>
      )}
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// Mode 1: Table Fill
// -----------------------------------------------------------------------------
function Mode1TableFill({ onBack }) {
  const { articleTrainer, updateArticleTrainerState } = useExerciseStore();
  const [phase, setPhase] = useState('review'); // 'review' | 'quiz' | 'done'
  const [timeLeft, setTimeLeft] = useState(10);
  
  // We'll focus on 'definite' for this drill based on the prompt.
  const allCells = [
    { case: 'nominativ', gender: 'm', ans: 'der' }, { case: 'nominativ', gender: 'f', ans: 'die' }, { case: 'nominativ', gender: 'n', ans: 'das' }, { case: 'nominativ', gender: 'pl', ans: 'die' },
    { case: 'akkusativ', gender: 'm', ans: 'den' }, { case: 'akkusativ', gender: 'f', ans: 'die' }, { case: 'akkusativ', gender: 'n', ans: 'das' }, { case: 'akkusativ', gender: 'pl', ans: 'die' },
    { case: 'dativ',     gender: 'm', ans: 'dem' }, { case: 'dativ',     gender: 'f', ans: 'der' }, { case: 'dativ',     gender: 'n', ans: 'dem' }, { case: 'dativ',     gender: 'pl', ans: 'den' },
    { case: 'genitiv',   gender: 'm', ans: 'des' }, { case: 'genitiv',   gender: 'f', ans: 'der' }, { case: 'genitiv',   gender: 'n', ans: 'des' }, { case: 'genitiv',   gender: 'pl', ans: 'der' }
  ];

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [showResult, setShowResult] = useState(null); // 'correct' | 'wrong'

  useEffect(() => {
    if (phase === 'review' && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(t);
    } else if (phase === 'review' && timeLeft === 0) {
      startQuiz();
    }
  }, [phase, timeLeft]);

  const startQuiz = () => {
    const shuffled = [...allCells].sort(() => 0.5 - Math.random());
    setQueue(shuffled);
    setCurrentIndex(0);
    setPhase('quiz');
    setupQuestion(shuffled[0]);
  };

  const setupQuestion = (cell) => {
    const allUnique = Array.from(new Set(allCells.map(c => c.ans)));
    const distractors = allUnique.filter(a => a !== cell.ans).sort(() => 0.5 - Math.random()).slice(0, 3);
    setOptions([cell.ans, ...distractors].sort(() => 0.5 - Math.random()));
    setShowResult(null);
  };

  const handleSelect = (opt) => {
    if (showResult) return;
    const current = queue[currentIndex];
    const isCorrect = opt === current.ans;
    
    setShowResult(isCorrect ? 'correct' : 'wrong');
    
    // Update progress logic if correct
    if (isCorrect) {
      const cellId = `${current.case}-${current.gender}`;
      if (!articleTrainer.tableProgress.definite.completed.includes(cellId)) {
        updateArticleTrainerState({
          tableProgress: {
            ...articleTrainer.tableProgress,
            definite: {
              ...articleTrainer.tableProgress.definite,
              completed: [...articleTrainer.tableProgress.definite.completed, cellId]
            }
          }
        });
      }
    }

    setTimeout(() => {
      if (currentIndex + 1 < queue.length) {
        setCurrentIndex(currentIndex + 1);
        setupQuestion(queue[currentIndex + 1]);
      } else {
        setPhase('done');
      }
    }, 1200);
  };

  const renderTable = (hiddenCells = []) => {
    const cases = ['nominativ', 'akkusativ', 'dativ', 'genitiv'];
    const genders = ['m', 'n', 'f', 'pl'];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr', gap: 8, marginTop: 16 }}>
        <div />
        {genders.map(g => <div key={g} style={{ fontWeight: 600, textAlign: 'center', fontSize: 12 }}>{g.toUpperCase()}</div>)}
        {cases.map(c => (
          <Fragment key={c}>
            <div style={{ fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center' }}>{c.substring(0,3).toUpperCase()}</div>
            {genders.map(g => {
              const isHidden = hiddenCells.some(hc => hc.case === c && hc.gender === g);
              return (
                <div key={`${c}-${g}`} className="neu-inset" style={{ padding: 12, textAlign: 'center', borderRadius: 8, background: isHidden ? 'var(--paper)' : 'transparent' }}>
                  {isHidden ? '?' : ARTICLE_TABLE.definite[c][g]}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="neu-small" onClick={onBack} style={{ padding: '6px', color: 'var(--ink)' }}>
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, flex: 1, textAlign: 'center' }}>Mode 1: Tabelle</div>
        <div style={{ width: 32 }} />
      </header>

      <div style={{ flex: 1, padding: '0 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {phase === 'review' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Review the Table</h2>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>Quiz starts in {timeLeft}s</p>
            {renderTable()}
            <button className="neu-btn" onClick={startQuiz} style={{ marginTop: 32, padding: '16px 32px' }}>Start Üben</button>
          </div>
        )}
        
        {phase === 'quiz' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24 }}>
            <div style={{ color: 'var(--ink-soft)', marginBottom: 16 }}>
              {queue[currentIndex].case.toUpperCase()} • {queue[currentIndex].gender.toUpperCase()}
            </div>
            
            <div style={{ width: '100%', maxWidth: 400, opacity: 0.5, pointerEvents: 'none', marginBottom: 32 }}>
              {renderTable([queue[currentIndex]])}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 400 }}>
              {options.map(opt => {
                const isSelected = showResult && opt === queue[currentIndex].ans; // highlight correct answer
                const bg = isSelected && showResult === 'correct' ? 'var(--color-teal)' : isSelected && showResult === 'wrong' ? 'var(--color-copper)' : 'var(--paper)';
                const color = isSelected ? '#fff' : 'var(--ink)';
                return (
                  <button key={opt} className="neu-btn" onClick={() => handleSelect(opt)} style={{ padding: '16px', background: bg, color }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="CheckCircle" size={48} color="var(--color-teal)" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Table Complete!</h2>
            <button className="neu-btn" onClick={onBack} style={{ marginTop: 24, padding: '12px 32px' }}>Back to Menu</button>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Mode 2: Sentence Drill
// -----------------------------------------------------------------------------
function Mode2SentenceDrill({ onBack }) {
  const { updateArticleTrainerState } = useExerciseStore();
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(null); // 'correct' | 'wrong'
  const [score, setScore] = useState(0);
  const [wrongItems, setWrongItems] = useState([]);

  useEffect(() => {
    // Generate 10 random questions
    const qList = [];
    for (let i = 0; i < 10; i++) {
      // Pick random non-wechsel verb
      const validVerbs = VERB_CASE_DATA.filter(v => v.case === 'dativ' || v.case === 'akkusativ');
      const verb = validVerbs[Math.floor(Math.random() * validVerbs.length)];
      const noun = NOUN_BANK[Math.floor(Math.random() * NOUN_BANK.length)];
      
      const vCase = verb.case;
      const correctForm = ARTICLE_TABLE.definite[vCase][noun.gender];
      const template = SENTENCE_TEMPLATES[verb.verb] || `Er benutzt {ART} {NOUN}.`; // fallback
      const sentence = template.replace("{ART}", "___").replace("{NOUN}", noun.noun);
      
      const genderLabel = { m: "masculine (der)", f: "feminine (die)", n: "neuter (das)", pl: "plural (die)" };
      const explanation = `"${verb.verb}" governs ${vCase.toUpperCase()}. "${noun.noun}" is ${genderLabel[noun.gender]}. ${vCase} ${genderLabel[noun.gender].split(' ')[0]} = ${correctForm}.`;

      // Distractors
      const sameCaseDiffGender = ARTICLE_TABLE.definite[vCase][noun.gender === 'm' ? 'f' : 'm'];
      const diffCaseSameGender = ARTICLE_TABLE.definite[vCase === 'dativ' ? 'akkusativ' : 'dativ'][noun.gender];
      const allDef = Array.from(new Set(Object.values(ARTICLE_TABLE.definite).flatMap(x => Object.values(x))));
      let other = allDef.find(a => a !== correctForm && a !== sameCaseDiffGender && a !== diffCaseSameGender);
      if (!other) other = 'das'; // fallback

      const opts = Array.from(new Set([correctForm, sameCaseDiffGender, diffCaseSameGender, other])).slice(0, 4);
      while(opts.length < 4) opts.push(allDef[Math.floor(Math.random() * allDef.length)]);
      
      const enTemplate = SENTENCE_TEMPLATES_EN[verb.verb] || `He uses the {NOUN}.`;
      const englishTranslation = enTemplate.replace("{NOUN}", noun.english);

      qList.push({ verb, noun, sentence, englishTranslation, correctForm, options: Array.from(new Set(opts)).sort(() => 0.5 - Math.random()), explanation, vCase });
    }
    setQueue(qList);
  }, []);

  const handleSelect = (opt) => {
    if (showResult) return;
    const current = queue[currentIndex];
    const isCorrect = opt === current.correctForm;
    
    setShowResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      setWrongItems(prev => [...prev, { ...current, userAnswer: opt }]);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < queue.length) {
      setShowResult(null);
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session End
      updateArticleTrainerState(prev => {
        const newBest = Math.max(prev.bestScores.mode2 || 0, score + (showResult === 'correct' ? 1 : 0));
        return {
          bestScores: { ...prev.bestScores, mode2: newBest },
          modeUnlocks: { ...prev.modeUnlocks, mode3: newBest >= 7 || prev.modeUnlocks.mode3, mode4: newBest >= 7 || prev.modeUnlocks.mode4 }
        };
      });

      // Save mistakes
      if (wrongItems.length > 0) {
        const mistakesToSave = wrongItems.map(item => ({
          category: 'article',
          original: `${item.verb.verb} + ${item.noun.noun} (${item.noun.gender})`,
          correction: item.correctForm,
          explanation: `Expected ${item.correctForm} (${item.vCase}, ${item.noun.gender}). Got ${item.userAnswer}.\n${item.explanation}`
        }));
        addMistakes(mistakesToSave);
      }
      
      onBack(); // just return to menu for now, could build a results screen
    }
  };

  if (queue.length === 0) return null;
  const current = queue[currentIndex];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="neu-small" onClick={onBack} style={{ padding: '6px', color: 'var(--ink)' }}>
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div className="neu-inset" style={{ flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--color-teal)', width: `${(currentIndex / 10) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ width: 32 }} />
      </header>

      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 48, textAlign: 'center' }}>
          {current.sentence.split('___').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span style={{ 
                  display: 'inline-block', 
                  minWidth: 60, 
                  borderBottom: `2px solid ${showResult === 'correct' ? 'var(--color-teal)' : showResult === 'wrong' ? 'var(--color-copper)' : 'var(--ink)'}`, 
                  color: showResult === 'correct' ? 'var(--color-teal)' : showResult === 'wrong' ? 'var(--color-copper)' : 'transparent',
                  margin: '0 8px',
                  textAlign: 'center'
                }}>
                  {showResult ? current.correctForm : '___'}
                </span>
              )}
            </span>
          ))}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 400 }}>
          {current.options.map(opt => (
            <button 
              key={opt} 
              className="neu-btn" 
              onClick={() => handleSelect(opt)}
              disabled={!!showResult}
              style={{ padding: '20px', fontSize: 18 }}
            >
              {opt}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showResult && (
            <ResultCard 
              status={showResult} 
              translation={current.englishTranslation} 
              explanation={current.explanation} 
            />
          )}
        </AnimatePresence>

        {showResult && (
          <button className="neu-btn" onClick={nextQuestion} style={{ marginTop: 'auto', width: '100%', maxWidth: 400, padding: 16, background: 'var(--color-teal)', color: '#fff' }}>
            Weiter
          </button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Mode 3: Wechselverb Double-Blank
// -----------------------------------------------------------------------------
function Mode3Wechselverb({ onBack }) {
  const { updateArticleTrainerState } = useExerciseStore();
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState(1); // 1 = picking dativ, 2 = picking akkusativ
  const [ans1, setAns1] = useState(null);
  const [ans2, setAns2] = useState(null);
  const [showResult, setShowResult] = useState(null);
  const [score, setScore] = useState(0);
  const [wrongItems, setWrongItems] = useState([]);

  useEffect(() => {
    const qList = [];
    for (let i = 0; i < 5; i++) {
      const wechselVerbs = VERB_CASE_DATA.filter(v => v.case === 'wechsel');
      const verb = wechselVerbs[Math.floor(Math.random() * wechselVerbs.length)];
      
      const personNouns = NOUN_BANK.filter(n => n.gender === 'm' || n.gender === 'f');
      const thingNouns = NOUN_BANK.filter(n => n.gender === 'n');
      const person = personNouns[Math.floor(Math.random() * personNouns.length)];
      const thing = thingNouns[Math.floor(Math.random() * thingNouns.length)];
      
      const dativAns = ARTICLE_TABLE.definite['dativ'][person.gender];
      const akkusativAns = ARTICLE_TABLE.definite['akkusativ'][thing.gender];
      
      const template = SENTENCE_TEMPLATES[verb.verb] || `Er gibt {ART} {NOUN} {ART2} {NOUN2}.`;
      const sentence = template.replace("{NOUN}", person.noun).replace("{NOUN2}", thing.noun);
      
      const enTemplate = SENTENCE_TEMPLATES_EN[verb.verb] || `She gives the {NOUN} to the {NOUN2}.`;
      const englishTranslation = enTemplate.replace("{NOUN}", person.english).replace("{NOUN2}", thing.english);
      
      const genderLabel = { m: "masculine (der)", f: "feminine (die)", n: "neuter (das)", pl: "plural (die)" };
      const explanation = `"${verb.verb}" is a Wechselverb. Person (${person.noun}, ${genderLabel[person.gender]}) → Dativ → ${dativAns}. Thing (${thing.noun}, ${genderLabel[thing.gender]}) → Akkusativ → ${akkusativAns}.`;

      // Distractors for blank 1 (Dativ)
      const allDef = Array.from(new Set(Object.values(ARTICLE_TABLE.definite).flatMap(x => Object.values(x))));
      const opts1 = Array.from(new Set([dativAns, ARTICLE_TABLE.definite['akkusativ'][person.gender], ARTICLE_TABLE.definite['dativ'][person.gender === 'm' ? 'f' : 'm']])).slice(0, 4);
      while(opts1.length < 4) opts1.push(allDef[Math.floor(Math.random() * allDef.length)]);
      
      // Distractors for blank 2 (Akkusativ)
      const opts2 = Array.from(new Set([akkusativAns, ARTICLE_TABLE.definite['dativ'][thing.gender], ARTICLE_TABLE.definite['akkusativ'][thing.gender === 'm' ? 'f' : 'm']])).slice(0, 4);
      while(opts2.length < 4) opts2.push(allDef[Math.floor(Math.random() * allDef.length)]);

      qList.push({ verb, person, thing, sentence, englishTranslation, dativAns, akkusativAns, opts1: Array.from(new Set(opts1)).sort(()=>0.5-Math.random()), opts2: Array.from(new Set(opts2)).sort(()=>0.5-Math.random()), explanation });
    }
    setQueue(qList);
  }, []);

  const handleSelect = (opt) => {
    if (showResult) return;
    if (step === 1) {
      setAns1(opt);
      setStep(2);
    } else {
      setAns2(opt);
      const current = queue[currentIndex];
      const isCorrect = ans1 === current.dativAns && opt === current.akkusativAns;
      setShowResult(isCorrect ? 'correct' : 'wrong');
      
      if (isCorrect) {
        setScore(s => s + 1);
      } else {
        setWrongItems(prev => [...prev, { ...current, userAns1: ans1, userAns2: opt }]);
      }
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < queue.length) {
      setShowResult(null);
      setStep(1);
      setAns1(null);
      setAns2(null);
      setCurrentIndex(currentIndex + 1);
    } else {
      updateArticleTrainerState(prev => ({
        bestScores: { ...prev.bestScores, mode3: Math.max(prev.bestScores.mode3 || 0, score + (showResult === 'correct' ? 1 : 0)) }
      }));
      
      if (wrongItems.length > 0) {
        const mistakes = wrongItems.map(item => ({
          category: 'article',
          original: `${item.verb.verb} + ${item.person.noun} + ${item.thing.noun}`,
          correction: `${item.dativAns} / ${item.akkusativAns}`,
          explanation: `Expected ${item.dativAns} (Dativ) and ${item.akkusativAns} (Akkusativ).\nGot ${item.userAns1} / ${item.userAns2}.\n${item.explanation}`
        }));
        addMistakes(mistakes);
      }
      onBack();
    }
  };

  if (queue.length === 0) return null;
  const current = queue[currentIndex];
  
  // Parse sentence to insert blanks correctly
  const parts = current.sentence.split('{ART2}');
  const firstHalf = parts[0].split('{ART}');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="neu-small" onClick={onBack} style={{ padding: '6px', color: 'var(--ink)' }}>
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div className="neu-inset" style={{ flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--color-teal)', width: `${(currentIndex / 5) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ width: 32 }} />
      </header>

      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 48, textAlign: 'center', lineHeight: 1.6 }}>
          {firstHalf[0]}
          <span style={{ display: 'inline-block', margin: '0 8px', borderBottom: `2px solid ${step === 1 ? 'var(--color-teal)' : 'var(--ink)'}`, minWidth: 60, textAlign: 'center', color: step > 1 ? 'var(--ink)' : 'transparent' }}>
            {ans1 || '___'}
          </span>
          <span style={{ fontSize: 12, verticalAlign: 'sub', marginLeft: -30, color: 'var(--ink-soft)' }}>1</span>
          
          {firstHalf[1]}
          
          <span style={{ display: 'inline-block', margin: '0 8px', borderBottom: `2px solid ${step === 2 && !showResult ? 'var(--color-teal)' : 'var(--ink)'}`, minWidth: 60, textAlign: 'center', color: showResult ? (showResult === 'correct' ? 'var(--color-teal)' : 'var(--color-copper)') : 'transparent' }}>
            {showResult ? (showResult === 'correct' ? ans2 : ans2) : '___'}
          </span>
          <span style={{ fontSize: 12, verticalAlign: 'sub', marginLeft: -30, color: 'var(--ink-soft)' }}>2</span>
          
          {parts[1]}
        </h2>

        <div style={{ marginBottom: 16, color: 'var(--ink-soft)', fontWeight: 600 }}>
          {step === 1 ? "Select article 1 (Person)" : "Select article 2 (Thing)"}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 400 }}>
          {(step === 1 ? current.opts1 : current.opts2).map(opt => (
            <button key={opt} className="neu-btn" onClick={() => handleSelect(opt)} disabled={!!showResult} style={{ padding: '20px', fontSize: 18 }}>
              {opt}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showResult && (
            <ResultCard 
              status={showResult} 
              translation={current.englishTranslation} 
              explanation={current.explanation} 
            />
          )}
        </AnimatePresence>

        {showResult && (
          <button className="neu-btn" onClick={nextQuestion} style={{ marginTop: 'auto', width: '100%', maxWidth: 400, padding: 16, background: 'var(--color-teal)', color: '#fff' }}>
            Weiter
          </button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Mode 4: Flashcard Reverse
// -----------------------------------------------------------------------------
function Mode4Flashcard({ onBack }) {
  const { updateArticleTrainerState } = useExerciseStore();
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [showResult, setShowResult] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const qList = [];
    const cases = ['nominativ', 'akkusativ', 'dativ', 'genitiv'];
    const genders = ['m', 'n', 'f', 'pl'];
    
    // Build a map of form -> descriptions
    const formMap = {};
    for (let c of cases) {
      for (let g of genders) {
        const form = ARTICLE_TABLE.definite[c][g];
        if (!formMap[form]) formMap[form] = [];
        formMap[form].push({ c, g });
      }
    }
    
    const uniqueForms = Object.keys(formMap);
    for (let i = 0; i < 5; i++) {
      const form = uniqueForms[Math.floor(Math.random() * uniqueForms.length)];
      const correctDescriptions = formMap[form].map(x => `${x.c}, ${x.g}, definite`);
      
      // Generate distractors
      const distractors = [];
      while (distractors.length < 4 - correctDescriptions.length) {
        const rc = cases[Math.floor(Math.random() * cases.length)];
        const rg = genders[Math.floor(Math.random() * genders.length)];
        const desc = `${rc}, ${rg}, definite`;
        if (!correctDescriptions.includes(desc) && !distractors.includes(desc)) {
          distractors.push(desc);
        }
      }
      
      const options = [...correctDescriptions, ...distractors].sort(() => 0.5 - Math.random());
      qList.push({ form, correctDescriptions, options });
    }
    
    setQueue(qList);
  }, []);

  const toggleSelect = (opt) => {
    if (showResult) return;
    setSelected(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
  };

  const checkAnswer = () => {
    const current = queue[currentIndex];
    const isCorrect = selected.length === current.correctDescriptions.length && selected.every(s => current.correctDescriptions.includes(s));
    setShowResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < queue.length) {
      setShowResult(null);
      setSelected([]);
      setCurrentIndex(currentIndex + 1);
    } else {
      updateArticleTrainerState(prev => ({
        bestScores: { ...prev.bestScores, mode4: Math.max(prev.bestScores.mode4 || 0, score + (showResult === 'correct' ? 1 : 0)) }
      }));
      onBack();
    }
  };

  if (queue.length === 0) return null;
  const current = queue[currentIndex];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="neu-small" onClick={onBack} style={{ padding: '6px', color: 'var(--ink)' }}>
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div className="neu-inset" style={{ flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--color-teal)', width: `${(currentIndex / 5) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ width: 32 }} />
      </header>

      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: 48, fontWeight: 800, marginBottom: 8, color: 'var(--ink)' }}>
          {current.form}
        </h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>Select ALL correct grammatical descriptions.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 400 }}>
          {current.options.map(opt => {
            const isSelected = selected.includes(opt);
            const isCorrect = current.correctDescriptions.includes(opt);
            
            let bg = 'var(--paper)';
            let color = 'var(--ink)';
            let border = 'none';
            let icon = null;
            
            if (showResult) {
              if (isCorrect && isSelected) { bg = 'var(--color-teal)'; color = '#fff'; icon = 'Check'; }
              if (isCorrect && !isSelected) { border = '2px dashed var(--color-teal)'; }
              if (!isCorrect && isSelected) { bg = 'var(--color-copper)'; color = '#fff'; icon = 'X'; }
            } else if (isSelected) {
              border = '2px solid var(--color-teal)';
            }
            
            return (
              <button 
                key={opt} 
                className="neu-btn" 
                onClick={() => toggleSelect(opt)}
                disabled={!!showResult}
                style={{ padding: '16px', background: bg, color, border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{opt}</span>
                {icon && <Icon name={icon} size={18} />}
              </button>
            );
          })}
        </div>

        {!showResult ? (
          <button className="neu-btn" onClick={checkAnswer} disabled={selected.length === 0} style={{ marginTop: 'auto', width: '100%', maxWidth: 400, padding: 16, background: selected.length > 0 ? 'var(--color-teal)' : 'var(--paper)', color: selected.length > 0 ? '#fff' : 'var(--ink-soft)' }}>
            Check
          </button>
        ) : (
          <button className="neu-btn" onClick={nextQuestion} style={{ marginTop: 'auto', width: '100%', maxWidth: 400, padding: 16, background: 'var(--color-teal)', color: '#fff' }}>
            Weiter
          </button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main ArticleTrainer Container
// -----------------------------------------------------------------------------
export function ArticleTrainer({ onBack }) {
  const { articleTrainer } = useExerciseStore();
  const [activeMode, setActiveMode] = useState(null);

  if (activeMode === 1) return <Mode1TableFill onBack={() => setActiveMode(null)} />;
  if (activeMode === 2) return <Mode2SentenceDrill onBack={() => setActiveMode(null)} />;
  if (activeMode === 3) return <Mode3Wechselverb onBack={() => setActiveMode(null)} />;
  if (activeMode === 4) return <Mode4Flashcard onBack={() => setActiveMode(null)} />;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--app-bg)', overflow: 'hidden' }}>
      <header style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="neu-small" onClick={onBack} style={{ padding: '6px', color: 'var(--ink)' }}>
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', flex: 1, textAlign: 'center' }}>
          Artikel Trainer
        </div>
        <div style={{ width: 32 }} />
      </header>

      <div style={{ padding: '24px 16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <p style={{ color: 'var(--ink-soft)', textAlign: 'center', marginBottom: 8 }}>Practice article forms by case</p>
        
        {/* Mode 1 */}
        <button className="neu-panel" onClick={() => setActiveMode(1)} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16, border: 'none', cursor: 'pointer', background: 'var(--paper)' }}>
          <div style={{ fontSize: 24 }}>📊</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Mode 1: Tabelle</div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Article table fill-in</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-teal)', fontWeight: 600 }}>{articleTrainer.tableProgress.definite.completed.length}/16 ✓</div>
        </button>

        {/* Mode 2 (PRIMARY) */}
        <button className="neu-panel" onClick={() => setActiveMode(2)} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16, border: 'none', cursor: 'pointer', background: 'var(--paper)', borderLeft: '4px solid var(--color-teal)' }}>
          <div style={{ fontSize: 24 }}>✏️</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Mode 2: Sätze</div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Sentence article drill</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>
            {articleTrainer.bestScores.mode2 !== null ? `Best: ${articleTrainer.bestScores.mode2}/10` : 'New'}
          </div>
        </button>

        {/* Mode 3 */}
        <button className="neu-panel" onClick={() => articleTrainer.modeUnlocks.mode3 && setActiveMode(3)} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16, border: 'none', cursor: articleTrainer.modeUnlocks.mode3 ? 'pointer' : 'not-allowed', background: 'var(--paper)', opacity: articleTrainer.modeUnlocks.mode3 ? 1 : 0.55 }}>
          <div style={{ fontSize: 24 }}>🔄</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Mode 3: Wechselverben</div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Double-blank sentences</div>
          </div>
          {!articleTrainer.modeUnlocks.mode3 && <Icon name="Lock" size={16} color="var(--ink-soft)" />}
        </button>

        {/* Mode 4 */}
        <button className="neu-panel" onClick={() => articleTrainer.modeUnlocks.mode4 && setActiveMode(4)} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16, border: 'none', cursor: articleTrainer.modeUnlocks.mode4 ? 'pointer' : 'not-allowed', background: 'var(--paper)', opacity: articleTrainer.modeUnlocks.mode4 ? 1 : 0.55 }}>
          <div style={{ fontSize: 24 }}>🃏</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Mode 4: Umgekehrt</div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Form → Case identification</div>
          </div>
          {!articleTrainer.modeUnlocks.mode4 && <Icon name="Lock" size={16} color="var(--ink-soft)" />}
        </button>

      </div>
    </div>
  );
}
