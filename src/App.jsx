import { useState, useEffect } from 'react';
import { LS } from './utils/storage.js';
import { LEVELS, TABS } from './constants.js';
import { ApiKeyBar } from './components/ApiKeyBar.jsx';
import { Tutor } from './components/Tutor.jsx';
import { Vocabulary } from './components/Vocabulary.jsx';
import { MistakeMemory } from './components/MistakeMemory.jsx';
import { WritingCoach } from './components/WritingCoach.jsx';
import { DailyLesson } from './components/DailyLesson.jsx';
import { Onboarding } from './components/Onboarding.jsx';

export default function App() {
  const [tab, setTab] = useState(LS.get('gt_tab', 'tutor'));
  const [level, setLevel] = useState(LS.get('gt_level', 'A2'));
  const [showApiKey, setShowApiKey] = useState(!LS.get('gt_apikey', ''));
  const [onboardingCompleted, setOnboardingCompleted] = useState(LS.get('gt_onboarding_completed', false));
  const [, force] = useState(0);

  useEffect(() => { LS.set('gt_tab', tab); }, [tab]);
  useEffect(() => { LS.set('gt_level', level); }, [level]);

  if (!onboardingCompleted) {
    return (
      <div className="app-container">
        <Onboarding onComplete={() => {
          setOnboardingCompleted(true);
          setLevel(LS.get('gt_level', 'A2'));
          setShowApiKey(!LS.get('gt_apikey', ''));
        }} />
      </div>
    );
  }

  const getHeaderTitle = () => {
    switch(tab) {
      case 'vocab': return 'Vokabeln';
      case 'mistakes': return 'Fehlergedächtnis';
      case 'writing': return 'Schreiben';
      case 'lesson': return 'Lektion';
      default: return 'Deutsch Werkstatt'; // Tutor handles its own header
    }
  };

  return (
    <div className="app-container">
      {/* ---- Global Header ---- */}
      {tab !== 'tutor' && (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px', borderBottom: '1px solid var(--line)' }}>
          <button style={{ background: 'transparent', border: 'none', padding: '4px', borderRadius: 4, color: 'var(--ink)', visibility: 'hidden' }}>
            <span style={{ fontSize: 20 }}>⬅️</span>
          </button>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{getHeaderTitle()}</div>
          <button onClick={() => setShowApiKey(true)} style={{ background: 'transparent', border: 'none', padding: '4px', borderRadius: 4, color: 'var(--ink)', cursor: 'pointer' }}>
            <span style={{ fontSize: 20 }}>🔑</span>
          </button>
        </header>
      )}

      <ApiKeyBar open={showApiKey} onClose={() => setShowApiKey(false)} />

      {/* ---- Tab content ---- */}
      <main>
        <div style={{ display: tab === 'tutor'    ? 'flex' : 'none', flexDirection: 'column', flex: 1, overflow: 'hidden' }}><Tutor level={level} onLevelChange={setLevel} onOpenApiKey={() => setShowApiKey(true)} /></div>
        <div style={{ display: tab === 'vocab'    ? 'block' : 'none', flex: 1, overflowY: 'auto' }}><Vocabulary level={level} /></div>
        <div style={{ display: tab === 'mistakes' ? 'block' : 'none', flex: 1, overflowY: 'auto' }}><MistakeMemory level={level} /></div>
        <div style={{ display: tab === 'writing'  ? 'block' : 'none', flex: 1, overflowY: 'auto' }}><WritingCoach level={level} /></div>
        <div style={{ display: tab === 'lesson'   ? 'block' : 'none', flex: 1, overflowY: 'auto' }}><DailyLesson level={level} /></div>
      </main>

      {/* ---- Bottom Nav ---- */}
      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? 'active' : ''}
          >
            <span className="icon" style={{ fontSize: 20 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
