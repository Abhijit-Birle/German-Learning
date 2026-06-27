import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLessons } from '../hooks/useLessons.js';
import { Icon } from './ui/Icon.jsx';

const NoteCard = ({ note }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="neu-inset" style={{ padding: '12px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: expanded ? 8 : 0 }}>
      <button 
        style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Icon name="FileText" size={16} color="var(--color-copper)" />
        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{note.title}</div>
        <Icon name={expanded ? "ChevronDown" : "ChevronRight"} size={16} color="var(--ink-soft)" />
      </button>
      {expanded && (
        <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, marginTop: 8, paddingLeft: 28 }}>
          {note.content}
        </div>
      )}
    </div>
  );
};

export function DailyLesson({ level, appLang, onBack, onComplete, completedSublessons = [] }) {
  const { lessonsData, loading, error } = useLessons();
  const [activeLesson, setActiveLesson] = useState(null);
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  
  // Flashcard State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Flatten the active lesson into an array of steps
  const steps = useMemo(() => {
    if (!activeLesson) return [];
    const arr = [];
    
    if (activeLesson.vocabulary && activeLesson.vocabulary.length > 0) {
      arr.push({ type: 'vocabulary', data: activeLesson.vocabulary, title: 'Vocabulary' });
    }
    if (activeLesson.grammar) {
      arr.push({ type: 'grammar', data: activeLesson.grammar, title: 'Grammar' });
    }
    if (activeLesson.practice && activeLesson.practice.length > 0) {
      activeLesson.practice.forEach((p, i) => {
        arr.push({ type: 'practice', data: p, index: i, total: activeLesson.practice.length, title: 'Practice' });
      });
    }
    if (activeLesson.listening && activeLesson.listening.length > 0) {
      activeLesson.listening.forEach((l, i) => {
        arr.push({ type: 'listening', data: l, index: i, total: activeLesson.listening.length, title: 'Listening' });
      });
    }
    if (activeLesson.speaking && activeLesson.speaking.length > 0) {
      activeLesson.speaking.forEach((s, i) => {
        arr.push({ type: 'speaking', data: s, index: i, total: activeLesson.speaking.length, title: 'Speaking' });
      });
    }
    if (activeLesson.roleplay) {
      arr.push({ type: 'roleplay', data: activeLesson.roleplay, title: 'Roleplay' });
    }
    if (activeLesson.review) {
      arr.push({ type: 'review', data: activeLesson.review, title: 'Review & Summary' });
    }
    
    // Always add a finish step at the end so the user can complete the lesson
    arr.push({ type: 'finish', title: 'Lesson Complete' });
    
    return arr;
  }, [activeLesson]);

  if (!activeLesson) {
    return (
      <div className="fadein" style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {onBack && (
          <button 
            className="neu-small" 
            onClick={onBack} 
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content', padding: '8px 12px', fontSize: 13, color: 'var(--ink)' }}
          >
            <Icon name="ArrowLeft" size={16} /> Back to Home
          </button>
        )}
        <div style={{ padding: '0 8px' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: 20, color: 'var(--ink)' }}>A1 Curriculum</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>Choose a structured lesson to start.</p>
        </div>
        
        {loading && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--ink-soft)' }}>Loading lessons...</div>}
        {error && <div style={{ padding: '16px', textAlign: 'center', color: 'red' }}>Error loading lessons: {error}</div>}

        {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lessonsData.map(lesson => {
            const isExpanded = expandedLessonId === lesson.id;
            return (
              <div key={lesson.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button 
                  className="neu-inset" 
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--card-bg)', boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <Icon name="BookOpen" size={20} color="var(--color-teal)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-copper)' }}>{lesson.id}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{lesson.title}</div>
                  </div>
                  <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={20} color="var(--ink-soft)" />
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div 
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 24, paddingTop: 8, paddingBottom: 8 }}>
                        {lesson.items && lesson.items.map((item, i) => {
                          if (item.type === 'sublesson') {
                            return (
                              <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={i}
                                className="neu-small"
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', textAlign: 'left', cursor: 'pointer' }}
                                onClick={() => {
                                  setActiveLesson(item);
                                  setCurrentStepIndex(0);
                                  setQuizAnswers({});
                                  setQuizSubmitted(false);
                                  setCorrectCount(0);
                                }}
                              >
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ocean)' }}>Lvl {item.difficulty}</div>
                                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{item.title}</div>
                                {completedSublessons.includes(item.id) ? (
                                  <Icon name="CheckCircle" size={16} color="var(--color-teal)" />
                                ) : (
                                  <Icon name="Play" size={16} color="var(--color-teal)" />
                                )}
                              </motion.button>
                            );
                          } else if (item.type === 'note') {
                            return (
                              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={i}>
                                <NoteCard note={item} />
                              </motion.div>
                            );
                          } else if (item.type === 'revision') {
                            return (
                              <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={i}
                                className="neu-small"
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', textAlign: 'left', cursor: 'pointer', background: 'var(--grad-coral)', color: '#fff' }}
                                onClick={() => {
                                  setActiveLesson(item);
                                  setCurrentStepIndex(0);
                                  setQuizAnswers({});
                                  setQuizSubmitted(false);
                                  setCorrectCount(0);
                                }}
                              >
                                <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{item.title}</div>
                                {completedSublessons.includes(item.id) ? (
                                  <Icon name="CheckCircle" size={16} color="#fff" />
                                ) : (
                                  <Icon name="Repeat" size={16} color="#fff" />
                                )}
                              </motion.button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        )}
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  if (!currentStep) return null;

  const handleNext = () => {
    setQuizSubmitted(false);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(i => i + 1);
    }
  };

  const handleCheckAnswer = (isCorrect) => {
    setQuizSubmitted(true);
    if (isCorrect) {
      setCorrectCount(c => c + 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'vocabulary':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentStep.data.map((v, i) => (
              <div key={i} className="neu-inset" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{v.word}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{v.translation}</div>
              </div>
            ))}
          </div>
        );
      
      case 'grammar':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{currentStep.data.title}</div>
            <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{currentStep.data.explanation}</div>
          </div>
        );

      case 'practice':
      case 'listening': {
        const q = currentStep.data;
        // For listening, display audio text for now
        const isListening = currentStep.type === 'listening';
        const isWrongAnswerSelected = quizSubmitted && quizAnswers[currentStepIndex] !== q.answer;
        
        return (
            <motion.div 
              style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, borderRadius: 16 }}
              animate={isWrongAnswerSelected ? { x: [-10, 10, -10, 10, 0], backgroundColor: ['transparent', 'rgba(255, 59, 48, 0.15)', 'transparent'] } : { backgroundColor: 'transparent' }}
              transition={{ duration: 0.5 }}
            >
            {isListening && (
              <div className="neu-inset" style={{ padding: 16, borderRadius: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-ocean)' }}>
                  <Icon name="Headphones" size={16} /> <span style={{ fontSize: 13, fontWeight: 700 }}>Audio Placeholder</span>
                </div>
                <div style={{ fontStyle: 'italic', color: 'var(--ink)' }}>"{q.audioText}"</div>
              </div>
            )}
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', margin: '8px 0' }}>
              {q.question}
              {quizSubmitted && q.translation && (
                <div style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-soft)', marginTop: 8, fontStyle: 'italic' }}>
                  Translation: {q.translation}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {q.options.map(opt => {
                const isSelected = quizAnswers[currentStepIndex] === opt;
                const isCorrect = isSelected && opt === q.answer;
                const isWrong = isSelected && opt !== q.answer;
                
                let bg = 'var(--card-bg)';
                let color = 'var(--ink)';
                let className = 'neu-small';

                if (quizSubmitted) {
                  if (opt === q.answer) {
                    bg = 'var(--grad-teal)';
                    color = '#fff';
                    className = '';
                  } else if (isWrong) {
                    bg = '#ff4444';
                    color = '#fff';
                    className = '';
                  } else if (isSelected) {
                    className = 'neu-inset';
                  }
                } else {
                  if (isSelected) {
                    className = 'neu-inset';
                    color = 'var(--color-teal)';
                  }
                }

                return (
                  <button 
                    key={opt}
                    onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [currentStepIndex]: opt }))}
                    className={className}
                    style={{ padding: '14px 16px', borderRadius: 12, fontSize: 15, background: bg, color: color, flex: 1, border: 'none', cursor: quizSubmitted ? 'default' : 'pointer', fontWeight: isSelected ? 700 : 500, transition: 'all 0.2s ease' }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 24 }}>
              {!quizSubmitted ? (
                <button 
                  className="neu-btn" 
                  onClick={() => handleCheckAnswer(quizAnswers[currentStepIndex] === q.answer)}
                  style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600 }}
                  disabled={!quizAnswers[currentStepIndex]}
                >
                  Check Answer
                </button>
              ) : (
                <button 
                  className="neu-btn" 
                  onClick={handleNext}
                  style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600 }}
                >
                  Continue
                </button>
              )}
            </div>
          </motion.div>
        );
      }

      case 'speaking':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="neu-inset" style={{ padding: 20, borderRadius: 12, textAlign: 'center' }}>
              <Icon name="Mic" size={32} color="var(--color-copper)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{currentStep.data.task}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Prompt: {currentStep.data.prompt}</div>
            </div>
            <button 
              className="neu-btn" 
              onClick={handleNext}
              style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600, marginTop: 24 }}
            >
              Continue (API Later)
            </button>
          </div>
        );

      case 'roleplay':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="neu-inset" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <Icon name="Users" size={32} color="var(--color-gold)" />
              </div>
              <div style={{ fontSize: 15, color: 'var(--ink)', marginBottom: 12, textAlign: 'center' }}>
                <strong>Scenario:</strong> {currentStep.data.scenario}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
                <div><strong>You:</strong> {currentStep.data.userRole}</div>
                <div><strong>Bot:</strong> {currentStep.data.botRole}</div>
              </div>
              <div className="neu-raised" style={{ padding: 16, borderRadius: 12, borderLeft: '4px solid var(--color-teal)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-teal)', marginBottom: 4, textTransform: 'uppercase' }}>Bot says:</div>
                <div style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--ink)' }}>"{currentStep.data.startingLine}"</div>
              </div>
            </div>
            <button 
              className="neu-btn" 
              onClick={handleNext}
              style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600, marginTop: 24 }}
            >
              Continue (API Later)
            </button>
          </div>
        );

      case 'review':
      case 'summary':
      case 'finish':
        return (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: '24px 0' }}
          >
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
              style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--grad-teal)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}
            >
              <Icon name="CheckCircle" size={40} color="#fff" />
            </motion.div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>Great!</div>
            <div style={{ fontSize: 16, color: 'var(--ink-soft)' }}>
              You got {correctCount} out of {steps.filter(s => ['practice', 'listening', 'speaking'].includes(s.type)).length} right.
            </div>

            <button 
              className="neu-btn" 
              onClick={() => {
                if (onComplete && activeLesson) {
                  onComplete(activeLesson.id);
                }
                setActiveLesson(null);
                setCurrentStepIndex(0);
                if (onBack) onBack();
              }}
              style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600, marginTop: 24 }}
            >
              Finish & Return Home
            </button>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  // Only non-interactive cards need a generic continue button (vocab, grammar)
  const needsGenericContinue = ['vocabulary', 'grammar'].includes(currentStep.type);

  return (
    <div className="fadein" style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header / Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '2px solid var(--app-bg)' }}>
        <button 
          className="neu-small" 
          onClick={() => {
            setActiveLesson(null);
            setCurrentStepIndex(0);
          }} 
          style={{ width: 36, height: 36, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0 }}
        >
          <Icon name="X" size={16} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Step {currentStepIndex + 1} of {steps.length}
          </div>
        </div>
        <div style={{ width: 36 }} /> {/* Spacer */}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Step Title Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div className="neu-raised" style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: 'var(--color-teal)' }}>
            {currentStep.title} {currentStep.total ? `(${currentStep.index + 1}/${currentStep.total})` : ''}
          </div>
        </div>

        {/* Dynamic Card Content */}
        {renderStepContent()}

        {/* Generic Continue Button for static cards */}
        {needsGenericContinue && (
          <div style={{ marginTop: 32 }}>
            <button 
              className="neu-btn" 
              onClick={handleNext}
              style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600 }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
