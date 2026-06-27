import { useState, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { AnimatePresence, motion } from 'framer-motion';
import { LS } from './utils/storage.js';
import { LEVELS, TABS } from './constants.js';
import { ApiKeyBar } from './components/ApiKeyBar.jsx';
import { Tutor } from './components/Tutor.jsx';
import { Vocabulary } from './components/Vocabulary.jsx';
import { MistakeMemory } from './components/MistakeMemory.jsx';
import { Dictionary } from './components/Dictionary.jsx';
import { DailyLesson } from './components/DailyLesson.jsx';
import { Onboarding } from './components/Onboarding.jsx';
import { InteractiveSetup } from './components/InteractiveSetup.jsx';
import { Profile } from './components/Profile.jsx';
import { Icon } from './components/ui/Icon.jsx';
import { t } from './i18n.js';

export default function App() {
  const [appLang, setAppLang] = useState(LS.get('gt_app_lang', 'en'));
  const [tab, setTab] = useState(LS.get('gt_tab', 'tutor'));
  const [level, setLevel] = useState(LS.get('gt_level', 'A2'));
  const [showApiKey, setShowApiKey] = useState(!LS.get('gt_apikey', ''));
  const [onboardingCompleted, setOnboardingCompleted] = useState(LS.get('gt_onboarding_completed', false));
  const [introCompleted, setIntroCompleted] = useState(LS.get('gt_intro_completed', false));
  const [theme, setTheme] = useState(LS.get('gt_theme', 'light'));
  const [navStack, setNavStack] = useState([]);
  const isTaskActive = navStack.length > 0;

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
        if (navStack.length > 0) {
          setNavStack(prev => prev.slice(0, -1));
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
  }, [navStack, tab]);

  const handleTaskStart = (taskId) => {
    setNavStack(prev => [...prev, taskId || 'task']);
  };

  const handleTaskEnd = () => {
    setNavStack(prev => prev.slice(0, -1));
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setNavStack([]);
  };

  const getHeaderTitle = () => {
    switch(tab) {
      case 'vocab': return t('tab_vocab', appLang);
      case 'mistakes': return t('header_mistakes', appLang);
      case 'dictionary': return t('tab_dictionary', appLang);
      case 'lesson': return t('tab_lesson', appLang);
      case 'profile': return t('tab_profile', appLang);
      default: return t('header_app', appLang);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!onboardingCompleted ? (
        <motion.div
          key="onboarding"
          exit={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ width: '100%', height: '100%' }}
        >
          <div className="app-container" style={{ height: '100%' }}>
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
        </motion.div>
      ) : !introCompleted ? (
        <motion.div 
          key="intro"
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ width: '100%', height: '100%' }}
        >
          <InteractiveSetup 
            appLang={appLang} 
            onComplete={() => {
              LS.set('gt_intro_completed', true);
              setIntroCompleted(true);
            }} 
          />
        </motion.div>
      ) : (
        <motion.div 
          key="main"
          initial={{ opacity: 0, scale: 0.9, borderRadius: '20%' }}
          animate={{ opacity: 1, scale: 1, borderRadius: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, mass: 1 }}
          className="app-container"
        >
          {/* ---- Global Header ---- */}
          {!isTaskActive && (
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px', background: 'transparent' }}>
              {tab !== 'tutor' ? (
                <button className="neu-small" onClick={() => setTab('tutor')} style={{ padding: '6px', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Icon name="ArrowLeft" size={20} color="var(--ink)" />
                </button>
              ) : (
                <div style={{ width: 32 }}></div>
              )}
              <div style={{ fontSize: 16, fontWeight: 600 }}>{getHeaderTitle()}</div>
              <div style={{ width: 32 }}></div>
            </header>
          )}

          <ApiKeyBar open={showApiKey} onClose={() => setShowApiKey(false)} appLang={appLang} onLangChange={setAppLang} />

          {/* ---- Tab content ---- */}
          <main style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
            <motion.div
              initial={false}
              animate={{ opacity: tab === 'tutor' ? 1 : 0, scale: tab === 'tutor' ? 1 : 0.95, pointerEvents: tab === 'tutor' ? 'auto' : 'none', zIndex: tab === 'tutor' ? 10 : 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <Tutor level={level} onLevelChange={setLevel} onOpenApiKey={() => setShowApiKey(true)} appLang={appLang} onLangChange={setAppLang} theme={theme} onThemeChange={setTheme} onTaskStart={handleTaskStart} onTaskEnd={handleTaskEnd} isTaskActive={isTaskActive} navStack={navStack} />
            </motion.div>
            <motion.div
              initial={false}
              animate={{ opacity: tab === 'vocab' ? 1 : 0, scale: tab === 'vocab' ? 1 : 0.95, pointerEvents: tab === 'vocab' ? 'auto' : 'none', zIndex: tab === 'vocab' ? 10 : 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <Vocabulary level={level} appLang={appLang} onTaskStart={handleTaskStart} onTaskEnd={handleTaskEnd} isTaskActive={isTaskActive} />
            </motion.div>
            <motion.div
              initial={false}
              animate={{ opacity: tab === 'mistakes' ? 1 : 0, scale: tab === 'mistakes' ? 1 : 0.95, pointerEvents: tab === 'mistakes' ? 'auto' : 'none', zIndex: tab === 'mistakes' ? 10 : 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <MistakeMemory level={level} appLang={appLang} onTaskStart={handleTaskStart} onTaskEnd={handleTaskEnd} isTaskActive={isTaskActive} />
            </motion.div>
            <motion.div
              initial={false}
              animate={{ opacity: tab === 'dictionary' ? 1 : 0, scale: tab === 'dictionary' ? 1 : 0.95, pointerEvents: tab === 'dictionary' ? 'auto' : 'none', zIndex: tab === 'dictionary' ? 10 : 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <Dictionary appLang={appLang} />
            </motion.div>
            <motion.div
              initial={false}
              animate={{ opacity: tab === 'profile' ? 1 : 0, scale: tab === 'profile' ? 1 : 0.95, pointerEvents: tab === 'profile' ? 'auto' : 'none', zIndex: tab === 'profile' ? 10 : 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <Profile level={level} onLevelChange={setLevel} appLang={appLang} onLangChange={setAppLang} theme={theme} onThemeChange={setTheme} onOpenApiKey={() => setShowApiKey(true)} />
            </motion.div>
          </main>

          {/* ---- Bottom Nav ---- */}
          {!isTaskActive && (
            <nav className="neu-nav-tray">
              {TABS.map((tItem) => (
                <button
                  key={tItem.id}
                  onClick={() => handleTabChange(tItem.id)}
                  className={tab === tItem.id ? 'active' : ''}
                  style={{
                    background: tab === tItem.id && tItem.id === 'profile' ? 'linear-gradient(145deg, #7F77DD, #534AB7)' : undefined
                  }}
                >
                  <Icon name={tItem.icon} size={22} color={tab === tItem.id ? '#fff' : 'var(--ink-soft)'} />
                  {tab === tItem.id && <span>{t(`tab_${tItem.id === 'tutor' ? 'path' : tItem.id}`, appLang)}</span>}
                </button>
              ))}
            </nav>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
