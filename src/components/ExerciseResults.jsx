import React from 'react';
import { Icon } from './ui/Icon.jsx';
import { useExerciseStore } from '../store/useExerciseStore.js';

export function ExerciseResults({ onBack, onRetryMistakes }) {
  const { exercises, score, mistakes } = useExerciseStore();
  
  const total = exercises.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  
  // Find full objects for mistakes
  const mistakeDetails = exercises.filter(ex => mistakes.includes(ex.id));

  return (
    <div className="scrollbar" style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>
        {score} / {total} Correct
      </div>
      
      <div className="neu-raised" style={{ padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-bg)', paddingBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-soft)' }}>Score</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-teal)' }}>{percentage}%</span>
        </div>
        
        {mistakeDetails.length > 0 ? (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-copper)', marginBottom: 12 }}>
              Mistakes to Review:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mistakeDetails.map((ex, i) => (
                <div key={i} className="neu-inset" style={{ padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600, marginBottom: 4 }}>{ex.question}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-teal)', fontWeight: 700 }}>
                    <Icon name="Check" size={12} style={{ marginRight: 4 }} /> 
                    {ex.correctAnswer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--ink-soft)', fontWeight: 600, padding: '10px 0' }}>
            Flawless victory! No mistakes.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 400 }}>
        {mistakes.length > 0 && (
          <button 
            className="neu-raised" 
            onClick={onRetryMistakes}
            style={{ flex: 1, padding: 16, borderRadius: 12, fontWeight: 700, color: 'var(--color-copper)' }}
          >
            Retry Mistakes
          </button>
        )}
        <button 
          className="neu-btn" 
          onClick={onBack}
          style={{ flex: 1, padding: 16, borderRadius: 12, fontWeight: 700 }}
        >
          Continue
        </button>
      </div>

    </div>
  );
}
