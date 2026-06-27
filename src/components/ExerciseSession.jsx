import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from './ui/Icon.jsx';
import { useExerciseStore } from '../store/useExerciseStore.js';
import { speakBrowserFallback } from '../utils/tts.js';

export function ExerciseSession({ onBack, onComplete }) {
  const { exercises, currentIndex, submitAnswer, nextExercise, loading } = useExerciseStore();
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect' | null

  const currentEx = exercises[currentIndex];
  const isLast = currentIndex === exercises.length - 1;

  const shuffledWords = useMemo(() => {
    if (currentEx?.type === 'sentence_builder' && currentEx.options) {
      return [...currentEx.options].sort(() => 0.5 - Math.random());
    }
    return [];
  }, [currentEx]);

  // Reset local state when exercise changes
  useEffect(() => {
    setUserAnswer('');
    setFeedback(null);
  }, [currentIndex]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--ink)' }}>
           <Icon name="Loader" size={32} />
           <div style={{ marginTop: 12, fontWeight: 600 }}>Loading exercises...</div>
        </div>
      </div>
    );
  }

  if (!currentEx) {
    return (
      <div className="scrollbar" style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button className="neu-small" onClick={onBack} style={{ padding: 6, color: 'var(--ink)' }}>
            <Icon name="ChevronLeft" size={20} />
          </button>
        </header>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          <div style={{ fontSize: 48 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>No exercises found!</div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center', maxWidth: 250 }}>
            You either have no mistakes to review or there are no exercises available for this selection. Great job!
          </div>
          <button className="neu-btn" onClick={onBack} style={{ marginTop: 24, padding: '12px 24px', borderRadius: 12, fontWeight: 700 }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      nextExercise();
    }
  };

  const handleSubmit = () => {
    if (!userAnswer && currentEx.type !== 'sentence_builder') return;
    
    // Validate answer
    let isCorrect = false;
    
    if (currentEx.type === 'multiple_choice' || currentEx.type === 'translation' || currentEx.type === 'fill_blank') {
      isCorrect = userAnswer.trim().toLowerCase() === currentEx.correctAnswer.trim().toLowerCase();
    } else if (currentEx.type === 'sentence_builder') {
      isCorrect = userAnswer.trim() === currentEx.correctAnswer.trim();
    }

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    submitAnswer(currentEx.id, userAnswer, isCorrect);

    // Auto-advance if correct
    if (isCorrect) {
      setTimeout(() => {
        handleNext();
      }, 1000);
    }
  };

  // Renders specific UI based on exercise type
  const renderExerciseUI = () => {
    switch (currentEx.type) {
      case 'multiple_choice':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
            {currentEx.options?.map((opt, i) => {
              const isSelected = userAnswer === opt;
              let bg = isSelected ? 'var(--card-bg)' : 'transparent';
              
              if (feedback === 'correct' && isSelected) bg = 'rgba(76, 175, 80, 0.2)';
              if (feedback === 'incorrect' && isSelected) bg = 'rgba(244, 67, 54, 0.2)';
              if (feedback === 'incorrect' && opt === currentEx.correctAnswer) bg = 'rgba(76, 175, 80, 0.2)'; // show correct

              return (
                <button 
                  key={i}
                  className={isSelected ? "neu-inset" : "neu-raised"}
                  onClick={() => !feedback && setUserAnswer(opt)}
                  disabled={!!feedback}
                  style={{ 
                    padding: '16px 20px', 
                    textAlign: 'left', 
                    borderRadius: 12, 
                    fontWeight: 600, 
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: isSelected ? '5px solid var(--color-teal)' : '2px solid var(--ink-soft)' }} />
                  {opt}
                </button>
              );
            })}
          </div>
        );
        
      case 'fill_blank':
      case 'translation':
        return (
          <div style={{ marginTop: 24, width: '100%' }}>
            <input 
              type="text" 
              className="neu-inset"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={!!feedback}
              placeholder={currentEx.type === 'translation' ? "Type translation here..." : "Type answer here..."}
              style={{ width: '100%', padding: '16px', borderRadius: 12, fontSize: 16, border: 'none', background: 'var(--card-bg)', color: 'var(--ink)' }}
            />
            {feedback === 'incorrect' && (
              <div style={{ marginTop: 12, color: 'var(--color-teal)', fontWeight: 700, fontSize: 14 }}>
                Correct answer: {currentEx.correctAnswer}
              </div>
            )}
          </div>
        );

      case 'sentence_builder':
        const words = shuffledWords;
        const selectedWords = userAnswer ? userAnswer.split(' ') : [];
        const availableWords = words.filter((w, i) => !selectedWords.includes(w) || words.indexOf(w) !== i); // basic filtering, could be improved for duplicates
        
        return (
          <div style={{ marginTop: 24 }}>
            {/* Selected Zone */}
            <div className="neu-inset" style={{ minHeight: 60, padding: 12, borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {selectedWords.map((w, i) => (
                <button 
                  key={i} 
                  className="neu-raised" 
                  onClick={() => {
                    if (feedback) return;
                    const newArr = [...selectedWords];
                    newArr.splice(i, 1);
                    setUserAnswer(newArr.join(' '));
                  }}
                  style={{ padding: '8px 16px', borderRadius: 20, fontSize: 15, fontWeight: 600 }}
                >
                  {w}
                </button>
              ))}
            </div>
            
            {/* Available Words */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {words.map((w, i) => {
                const isUsed = selectedWords.includes(w); // simplistic check
                if (isUsed) return <div key={i} style={{ padding: '8px 16px', margin: 4, visibility: 'hidden' }}>{w}</div>;
                return (
                  <button 
                    key={i} 
                    className="neu-raised" 
                    onClick={() => {
                      if (feedback) return;
                      const newArr = [...selectedWords, w];
                      setUserAnswer(newArr.join(' ').trim());
                    }}
                    style={{ padding: '8px 16px', borderRadius: 20, fontSize: 15, fontWeight: 600 }}
                  >
                    {w}
                  </button>
                )
              })}
            </div>
            
            {feedback === 'incorrect' && (
              <div style={{ marginTop: 16, textAlign: 'center', color: 'var(--color-teal)', fontWeight: 700, fontSize: 14 }}>
                Correct: {currentEx.correctAnswer}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="scrollbar" style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button className="neu-small" onClick={onBack} style={{ padding: 6, color: 'var(--ink)' }}>
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
          {currentIndex + 1} / {exercises.length}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-teal)' }}>
          Score: {useExerciseStore.getState().score}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="neu-inset" style={{ height: 6, borderRadius: 3, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${((currentIndex) / exercises.length) * 100}%`, background: 'var(--color-teal)', transition: 'width 0.3s' }} />
      </div>

      {/* Scenario Tag */}
      {currentEx.scenario && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--card-bg)', borderRadius: 20, alignSelf: 'flex-start', marginBottom: 16, border: '1px solid rgba(0,0,0,0.05)' }}>
          <Icon name="MapPin" size={14} color="var(--color-copper)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>{currentEx.scenario}</span>
        </div>
      )}

      {/* Question Card */}
      <div className="neu-raised" style={{ padding: 24, borderRadius: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentEx.audioText && (
          <button 
            onClick={() => speakBrowserFallback(currentEx.audioText, 0.9, 'de-DE')}
            className="neu-btn" 
            style={{ padding: '12px', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 }}
          >
            <Icon name="Volume2" size={24} color="#fff" />
          </button>
        )}
        
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4, margin: 0, textAlign: currentEx.audioText ? 'center' : 'left' }}>
          {currentEx.question}
        </h2>

        {renderExerciseUI()}

        <div style={{ flex: 1 }} /> {/* Spacer */}

        {/* Footer Actions */}
        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          {!feedback ? (
            <button 
              className="neu-btn" 
              onClick={handleSubmit}
              disabled={!userAnswer && currentEx.type !== 'sentence_builder'}
              style={{ flex: 1, padding: '16px', borderRadius: 12, fontSize: 16, fontWeight: 700, opacity: (!userAnswer && currentEx.type !== 'sentence_builder') ? 0.5 : 1 }}
            >
              Submit Answer
            </button>
          ) : (
            <button 
              className="neu-raised" 
              onClick={handleNext}
              style={{ flex: 1, padding: '16px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: 'var(--color-teal)' }}
            >
              {isLast ? 'View Results' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
