import React, { useState } from 'react';
import { InteractiveIntro } from './InteractiveIntro.jsx';
import { MiniQuiz } from './MiniQuiz.jsx';

export function InteractiveSetup({ appLang, onComplete }) {
  const [phase, setPhase] = useState('intro'); // 'intro', 'quiz'

  return (
    <div className="app-container fadein" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {phase === 'intro' && (
        <InteractiveIntro appLang={appLang} onNext={() => setPhase('quiz')} />
      )}
      {phase === 'quiz' && (
        <MiniQuiz onComplete={onComplete} />
      )}
    </div>
  );
}
