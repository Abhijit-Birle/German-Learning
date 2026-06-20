import { useState } from 'react';
import { LS } from '../utils/storage.js';
import { t } from '../i18n.js';
import { Icon } from './ui/Icon.jsx';

export function Onboarding({ onComplete, appLang, onLangChange }) {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState('A2');
  const [goals, setGoals] = useState([]);
  const [apiKey, setApiKey] = useState(LS.get('gt_apikey', ''));

  const saveAndComplete = (skipKey = false) => {
    LS.set('gt_level', level);
    LS.set('gt_goals', goals);
    if (!skipKey && apiKey.trim()) {
      LS.set('gt_apikey', apiKey.trim());
      LS.set('gt_model', 'gemini-2.5-flash'); 
    }
    LS.set('gt_onboarding_completed', true);
    onComplete();
  };

  const toggleGoal = (goal) => {
    setGoals((prev) => 
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const ProgressBar = () => (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
      {[1, 2, 3, 4].map((s) => (
        <div 
          key={s} 
          className={s <= step ? "neu-raised" : "neu-inset"}
          style={{ 
            height: 6, 
            width: 32, 
            borderRadius: 3,
            background: s <= step ? 'var(--grad-teal)' : 'var(--card-bg)'
          }} 
        />
      ))}
    </div>
  );

  return (
    <div className="fadein" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <ProgressBar />

      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <button 
          className="neu-small"
          onClick={() => onLangChange(appLang === 'de' ? 'en' : 'de')} 
          style={{ padding: '6px 10px', color: 'var(--ink)', fontSize: 12, fontWeight: 700, background: 'var(--app-bg)' }}
        >
          {appLang === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
        </button>
      </div>

      {/* Step 1: Welcome */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, marginTop: 12 }}>
            <div className="neu-raised" style={{ width: 80, height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <span style={{ color: 'var(--color-teal)', fontSize: 36, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>W</span>
              <div style={{ position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: '50%', background: 'var(--grad-teal)' }} />
            </div>
          </div>
          
          <div className="display" style={{ fontSize: 24, textAlign: 'center', marginBottom: 12, lineHeight: 1.2 }}>
            {t('ob_welcome', appLang)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center', marginBottom: 32, lineHeight: 1.5 }}>
            {t('ob_welcome_sub', appLang)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'auto' }}>
            <div className="neu-small" style={{ color: 'var(--ink)', padding: '16px', display: 'flex', gap: 12, alignItems: 'center', fontWeight: 600, fontSize: 14 }}>
              <Icon name="Check" size={20} color="var(--color-teal)" /> {t('ob_feat1', appLang)}
            </div>
            <div className="neu-small" style={{ color: 'var(--ink)', padding: '16px', display: 'flex', gap: 12, alignItems: 'center', fontWeight: 600, fontSize: 14 }}>
              <Icon name="Check" size={20} color="var(--color-copper)" /> {t('ob_feat2', appLang)}
            </div>
            <div className="neu-small" style={{ color: 'var(--ink)', padding: '16px', display: 'flex', gap: 12, alignItems: 'center', fontWeight: 600, fontSize: 14 }}>
              <Icon name="Check" size={20} color="var(--color-teal)" /> {t('ob_feat3', appLang)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40 }}>
            <button 
              className="neu-btn"
              onClick={() => setStep(2)}
              style={{ padding: '16px', fontSize: 16 }}
            >
              {t('ob_start', appLang)}
            </button>
            <button 
              onClick={() => setStep(4)}
              style={{ background: 'transparent', color: 'var(--ink-soft)', padding: '8px', border: 'none', fontSize: 14 }}
            >
              {t('ob_have_account', appLang)}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Level Selection */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="display" style={{ fontSize: 24, marginBottom: 8, lineHeight: 1.2 }}>
            {t('ob_level_title', appLang)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 32 }}>
            {t('ob_level_sub', appLang)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'auto' }}>
            {[
              { id: 'A1', label: t('ob_a1', appLang), desc: t('ob_a1_sub', appLang) },
              { id: 'A2', label: t('ob_a2', appLang), desc: t('ob_a2_sub', appLang) },
              { id: 'B1', label: t('ob_b1', appLang), desc: t('ob_b1_sub', appLang) },
              { id: 'B2', label: t('ob_b2', appLang), desc: t('ob_b2_sub', appLang) }
            ].map((lvl) => (
              <button 
                key={lvl.id}
                className={level === lvl.id ? 'neu-inset' : 'neu-raised'}
                onClick={() => setLevel(lvl.id)}
                style={{ 
                  padding: '16px', 
                  display: 'flex', 
                  gap: 16, 
                  alignItems: 'center',
                  textAlign: 'left'
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: level === lvl.id ? 'var(--grad-teal)' : 'var(--card-bg)', color: level === lvl.id ? '#fff' : 'var(--ink-soft)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0, boxShadow: level !== lvl.id ? 'inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)' : 'none' }}>
                  {lvl.id}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{lvl.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{lvl.desc}</div>
                </div>
                {level === lvl.id && <Icon name="Check" color="var(--color-teal)" />}
              </button>
            ))}
          </div>

          <button 
            className="neu-btn"
            onClick={() => setStep(3)}
            style={{ padding: '16px', fontSize: 16, marginTop: 40 }}
          >
            {t('ob_next', appLang)}
          </button>
        </div>
      )}

      {/* Step 3: Goals */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="display" style={{ fontSize: 24, marginBottom: 8, lineHeight: 1.2 }}>
            {t('ob_goal_title', appLang)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 32 }}>
            {t('ob_goal_sub', appLang)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 'auto' }}>
            {[
              t('ob_g1', appLang),
              t('ob_g2', appLang),
              t('ob_g3', appLang),
              t('ob_g4', appLang),
              t('ob_g5', appLang),
              t('ob_g6', appLang)
            ].map((goal) => {
              const isSelected = goals.includes(goal);
              return (
                <button 
                  key={goal}
                  className={isSelected ? 'neu-inset' : 'neu-raised'}
                  onClick={() => toggleGoal(goal)}
                  style={{ 
                    padding: '24px 12px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 12, 
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  <Icon name="Check" size={24} color={isSelected ? 'var(--color-teal)' : 'var(--shadow-dark)'} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? 'var(--color-teal)' : 'var(--ink)', lineHeight: 1.3 }}>{goal}</div>
                </button>
              );
            })}
          </div>

          <button 
            className="neu-btn"
            onClick={() => setStep(4)}
            disabled={goals.length === 0}
            style={{ padding: '16px', fontSize: 16, marginTop: 40 }}
          >
            {t('ob_next', appLang)}
          </button>
        </div>
      )}

      {/* Step 4: API Key */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="neu-small" style={{ color: 'var(--color-copper)', width: 48, height: 48, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <Icon name="Key" size={24} />
          </div>
          <div className="display" style={{ fontSize: 24, marginBottom: 8, lineHeight: 1.2 }}>
            {t('ob_api_title', appLang)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 32, lineHeight: 1.5 }}>
            {t('ob_api_sub', appLang)}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8, paddingLeft: 8 }}>{t('ob_api_provider', appLang)}</label>
            <select 
              disabled
              className="neu-inset"
              style={{ width: '100%', padding: '12px 16px', color: 'var(--ink)', fontSize: 14, opacity: 0.7 }}
            >
              <option>Gemini (Google)</option>
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8, paddingLeft: 8 }}>{t('ob_api_key', appLang)}</label>
            <input 
              className="neu-inset"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              style={{ width: '100%', padding: '12px 16px', color: 'var(--ink)', fontSize: 14 }}
            />
          </div>

          <div className="neu-small" style={{ padding: '16px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 'auto' }}>
            <Icon name="Settings" size={16} color="var(--ink-soft)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
              {t('ob_api_privacy', appLang)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40 }}>
            <button 
              className="neu-btn"
              onClick={() => saveAndComplete(false)}
              disabled={!apiKey.trim()}
              style={{ padding: '16px', fontSize: 16 }}
            >
              {t('ob_api_connect', appLang)}
            </button>
            <button 
              onClick={() => saveAndComplete(true)}
              style={{ background: 'transparent', color: 'var(--ink-soft)', padding: '8px', border: 'none', fontSize: 14 }}
            >
              {t('ob_api_later', appLang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
