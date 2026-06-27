import React, { useMemo } from 'react';
import { Icon } from './ui/Icon.jsx';
import { MOCK_EXERCISES } from '../data/mockExercises.js';
import { LS } from '../utils/storage.js';

export function ExerciseList({ onBack, onSelectLesson, appLang }) {
  // Group exercises by Level and Lesson
  const grouped = useMemo(() => {
    const groups = {};
    MOCK_EXERCISES.forEach(ex => {
      if (!groups[ex.level]) groups[ex.level] = {};
      if (!groups[ex.level][ex.lessonId]) {
        groups[ex.level][ex.lessonId] = {
          lessonName: ex.lessonName,
          total: 0,
          completed: 0
        };
      }
      
      groups[ex.level][ex.lessonId].total += 1;
      const progress = LS.get(`gt_progress_${ex.id}`);
      if (progress && progress.completed) {
        groups[ex.level][ex.lessonId].completed += 1;
      }
    });
    return groups;
  }, []);

  return (
    <div className="scrollbar" style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="neu-small" onClick={onBack} style={{ padding: 6, color: 'var(--ink)' }}>
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>{appLang === 'de' ? 'Übungen' : 'Exercises'}</div>
      </header>

      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([level, lessons]) => (
        <div key={level} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-teal)', marginBottom: 12, paddingLeft: 8 }}>
            {level} - {level === 'A1' ? 'Basics' : level === 'A2' ? 'Intermediate' : 'Upper Intermediate'}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(lessons).map(([lessonId, stats]) => {
              const progressPct = Math.round((stats.completed / stats.total) * 100);
              const isComplete = stats.completed === stats.total;
              
              return (
                <div 
                  key={lessonId}
                  className="neu-raised"
                  style={{ padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
                  onClick={() => onSelectLesson(lessonId)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                      {stats.lessonName}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isComplete ? 'var(--color-teal)' : 'var(--ink-soft)' }}>
                      {stats.completed}/{stats.total}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="neu-inset" style={{ height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${progressPct}%`, 
                        background: isComplete ? 'var(--color-teal)' : 'var(--color-orange)',
                        borderRadius: 4,
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
