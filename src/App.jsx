import { useState, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { LS } from './utils/storage.js';
import { LEVELS, TABS } from './constants.js';
import { ApiKeyBar } from './components/ApiKeyBar.jsx';
import { Tutor } from './components/Tutor.jsx';
import { Vocabulary } from './components/Vocabulary.jsx';
import { MistakeMemory } from './components/MistakeMemory.jsx';
import { WritingCoach } from './components/WritingCoach.jsx';
import { DailyLesson } from './components/DailyLesson.jsx';
import { Onboarding } from './components/Onboarding.jsx';
import { Icon } from './components/ui/Icon.jsx';
import { t } from './i18n.js';

export default function App() {
  const [appLang, setAppLang] = useState(LS.get('gt_app_lang', 'de'));
  const [tab, setTab] = useState(LS.get('gt_tab', 'tutor'));
  const [level, setLevel] = useState(LS.get('gt_level', 'A2'));
  const [showApiKey, setShowApiKey] = useState(!LS.get('gt_apikey', ''));
  const [onboardingCompleted, setOnboardingCompleted] = useState(LS.get('gt_onboarding_completed', false));
  const [isTaskActive, setIsTaskActive] = useState(false);
  const [theme, setTheme] = useState(LS.get('gt_theme', 'light'));
  const [, force] = useState(0);

  useEffect(() => { 
    LS.set('gt_theme', theme); 
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => { LS.set('gt_app_lang', appLang); }, [appLang]);
  useEffect(() => { LS.set('gt_tab', tab); }, [tab]);
  useEffect(() => { LS.set('gt_level', level); }, [level]);

  // Hardware Back Button Handling via Capacitor
  useEffect(() => {
    let listener = null;
    
    const registerListener = async () => {
      listener = await CapApp.addListener('backButton', () => {
        if (isTaskActive) {
          setIsTaskActive(false);
        } else if (tab !== 'tutor') {
          setTab('tutor');
        } else {
          CapApp.exitApp();
        }
      });
    };
    
    registerListener();
    
    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [isTaskActive, tab]);

  const handleTaskStart = () => {
    setIsTaskActive(true);
  };

  const handleTaskEnd = () => {
    setIsTaskActive(false);
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setIsTaskActive(false);
  };

  if (!onboardingCompleted) {
    return (
      <div className="app-container">
        <Onboarding 
          appLang={appLang} 
          onLangChange={(l) => setAppLang(l)}
          onComplete={() => {
            setOnboardingCompleted(true);
            setLevel(LS.get('gt_level', 'A2'));
            setShowApiKey(!LS.get('gt_apikey', ''));
          }} 
        />
      </div>
    );
  }

  const getHeaderTitle = () => {
    switch(tab) {
      case 'vocab': return t('tab_vocab', appLang);
      case 'mistakes': return t('header_mistakes', appLang);
      case 'writing': return t('tab_writing', appLang);
      case 'lesson': return t('tab_lesson', appLang);
      default: return t('header_app', appLang);
    }
  };

  return (
    <div className="app-container">
      {/* ---- Global Header ---- */}
      {tab !== 'tutor' && !isTaskActive && (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px', background: 'transparent' }}>
          <button style={{ background: 'transparent', border: 'none', padding: '4px', borderRadius: 4, visibility: 'hidden' }}>
            <Icon name="ChevronLeft" size={24} color="var(--ink)" />
          </button>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{getHeaderTitle()}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button 
              className="neu-small"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
              style={{ padding: '6px', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Icon name={theme === 'light' ? 'Moon' : 'Sun'} size={18} color="var(--ink)" />
            </button>
            <button 
              className="neu-small"
              onClick={() => setAppLang(appLang === 'de' ? 'en' : 'de')} 
              style={{ padding: '6px 10px', color: 'var(--ink)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
            >
              {appLang === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
            </button>
            <button onClick={() => setShowApiKey(true)} className="neu-small" style={{ padding: '6px', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Icon name="Key" size={18} color="var(--ink)" />
            </button>
          </div>
        </header>
      )}

      <ApiKeyBar open={showApiKey} onClose={() => setShowApiKey(false)} appLang={appLang} onLangChange={setAppLang} />

      {/* ---- Tab content ---- */}
      <main style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: tab === 'tutor'    ? 'flex' : 'none', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}><Tutor level={level} onLevelChange={setLevel} onOpenApiKey={() => setShowApiKey(true)} appLang={appLang} onLangChange={setAppLang} theme={theme} onThemeChange={setTheme} onTaskStart={handleTaskStart} onTaskEnd={handleTaskEnd} isTaskActive={isTaskActive} /></div>
        <div style={{ display: tab === 'vocab'    ? 'block' : 'none', flex: 1, overflowY: 'auto' }}><Vocabulary level={level} appLang={appLang} /></div>
        <div style={{ display: tab === 'mistakes' ? 'block' : 'none', flex: 1, overflowY: 'auto' }}><MistakeMemory level={level} appLang={appLang} /></div>
        <div style={{ display: tab === 'writing'  ? 'flex' : 'none', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}><WritingCoach level={level} appLang={appLang} onTaskStart={handleTaskStart} onTaskEnd={handleTaskEnd} isTaskActive={isTaskActive} /></div>
        <div style={{ display: tab === 'lesson'   ? 'block' : 'none', flex: 1, overflowY: 'auto' }}><DailyLesson level={level} appLang={appLang} /></div>
      </main>

      {/* ---- Bottom Nav ---- */}
      {!isTaskActive && (
        <nav className="neu-nav-tray">
          {TABS.map((tItem) => (
            <button
              key={tItem.id}
              onClick={() => handleTabChange(tItem.id)}
              className={tab === tItem.id ? 'active' : ''}
            >
              <Icon name={tItem.icon} size={22} color={tab === tItem.id ? '#fff' : 'var(--ink-soft)'} />
              {t(`tab_${tItem.id === 'tutor' ? 'path' : tItem.id}`, appLang)}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
