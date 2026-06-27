import { useState } from 'react';
import { Icon } from './ui/Icon.jsx';
import { ToggleSwitch, LevelPill, CustomSelect } from './ui/Atoms.jsx';
import { t } from '../i18n.js';
import { useExerciseStore } from '../store/useExerciseStore.js';
import { LEVELS } from '../constants.js';

export function Profile({ level, onLevelChange, appLang, onLangChange, theme, onThemeChange, onOpenApiKey }) {
  const { streakFreezesAvailable } = useExerciseStore();
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const achievements = [
    { id: 'streak_3', icon: 'Flame', label: '3 Days', color: 'var(--grad-copper)', earned: true },
    { id: 'streak_7', icon: 'Flame', label: '7 Days', color: 'var(--grad-copper)', earned: false },
    { id: 'lesson_10', icon: 'Check', label: '10 Lessons', color: 'var(--grad-teal)', earned: true },
    { id: 'lesson_50', icon: 'Check', label: '50 Lessons', color: 'var(--grad-teal)', earned: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 16px 100px 16px', overflowY: 'auto' }}>
      
      {/* Identity Card */}
      <div className="neu-raised" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="neu-badge" style={{ width: 68, height: 68, background: 'linear-gradient(145deg, #7F77DD, #534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="User" size={32} color="#fff" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>Lernender</div>
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4, marginBottom: 12 }}>Learning since June 2026</div>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-teal)', color: '#fff', padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>
          {level} <Icon name="ArrowRight" size={14} color="#fff" /> B2 target
        </div>
      </div>

      {/* Stat Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        <div className="neu-small" onClick={() => setShowFreezeModal(true)} style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Icon name="Flame" size={24} color="var(--color-copper)" />
            {streakFreezesAvailable > 0 && (
              <div style={{ position: 'absolute', top: -4, right: -8, background: 'var(--app-bg)', borderRadius: '50%', padding: 2 }}>
                <Icon name="Shield" size={12} color="var(--color-teal)" />
              </div>
            )}
          </div>
          <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>3</div>
          <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4 }}>Day Streak</div>
        </div>
        <div className="neu-small" style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Icon name="CheckCircle" size={24} color="var(--color-teal)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>42</div>
          <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4 }}>Exercises</div>
        </div>
        <div className="neu-small" style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Icon name="Target" size={24} color="var(--color-teal)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>87%</div>
          <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4 }}>Accuracy</div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#5F5E5A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          Achievements
        </div>
        <div className="mobile-scroll-x" style={{ gap: 12, paddingBottom: 8 }}>
          {achievements.map((ach) => (
            <div key={ach.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80, flexShrink: 0, opacity: ach.earned ? 1 : 0.55 }}>
              <div className={ach.earned ? 'neu-badge' : 'neu-inset'} style={{ width: 48, height: 48, background: ach.earned ? ach.color : 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Icon name={ach.earned ? ach.icon : 'Lock'} size={24} color={ach.earned ? '#fff' : 'var(--ink-soft)'} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.2 }}>{ach.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings List */}
      <div className="neu-raised" style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
        
        <div onClick={onOpenApiKey} style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer' }}>
          <Icon name="Key" size={20} color="var(--ink-soft)" style={{ marginRight: 12 }} />
          <div style={{ flex: 1, fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>API Key</div>
          <div style={{ fontSize: 13, color: 'var(--color-teal)', marginRight: 8, fontWeight: 600 }}>Connected</div>
          <Icon name="ChevronRight" size={18} color="var(--ink-soft)" />
        </div>
        <div style={{ height: 1, background: '#E2DFD6', margin: '0 16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', padding: '16px' }}>
          <Icon name="Globe" size={20} color="var(--ink-soft)" style={{ marginRight: 12 }} />
          <div style={{ flex: 1, fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>App Language</div>
          <CustomSelect 
            value={appLang} 
            onChange={(val) => onLangChange(val)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'de', label: 'Deutsch' }
            ]}
          />
        </div>
        <div style={{ height: 1, background: '#E2DFD6', margin: '0 16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', padding: '16px' }}>
          <Icon name="BarChart" size={20} color="var(--ink-soft)" style={{ marginRight: 12 }} />
          <div style={{ flex: 1, fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>Target Level</div>
          <CustomSelect 
            value={level} 
            onChange={(val) => onLevelChange(val)}
            options={LEVELS.map(lvl => ({ value: lvl, label: lvl }))}
          />
        </div>
        <div style={{ height: 1, background: '#E2DFD6', margin: '0 16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', padding: '16px' }}>
          <Icon name={theme === 'dark' ? 'Moon' : 'Sun'} size={20} color="var(--ink-soft)" style={{ marginRight: 12 }} />
          <div style={{ flex: 1, fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>Dark Mode</div>
          <ToggleSwitch checked={theme === 'dark'} onChange={() => onThemeChange(theme === 'light' ? 'dark' : 'light')} />
        </div>
        <div style={{ height: 1, background: '#E2DFD6', margin: '0 16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer' }}>
          <Icon name="Download" size={20} color="var(--ink-soft)" style={{ marginRight: 12 }} />
          <div style={{ flex: 1, fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>Export Data</div>
          <Icon name="ChevronRight" size={18} color="var(--ink-soft)" />
        </div>

      </div>

      {/* Streak Freeze Modal */}
      {showFreezeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="neu-raised" style={{ width: '100%', maxWidth: 340, padding: 24, textAlign: 'center' }}>
            <div className="neu-inset" style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Icon name="Shield" size={32} color="var(--color-teal)" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{streakFreezesAvailable} Streak-Freeze verfügbar</div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24, lineHeight: 1.5 }}>
              Dein Streak ist geschützt! Wenn du einen Tag ausfällst, wird dein Streak-Freeze automatisch eingesetzt.
            </div>
            <button className="neu-btn" onClick={() => setShowFreezeModal(false)} style={{ width: '100%', padding: '12px' }}>
              Verstanden
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
