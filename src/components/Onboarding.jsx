import { useState } from 'react';
import { LS } from '../utils/storage.js';

export function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState('A2');
  const [goals, setGoals] = useState([]);
  const [apiKey, setApiKey] = useState(LS.get('gt_apikey', ''));

  const saveAndComplete = (skipKey = false) => {
    LS.set('gt_level', level);
    LS.set('gt_goals', goals);
    if (!skipKey && apiKey.trim()) {
      LS.set('gt_apikey', apiKey.trim());
      // Defaulting to gemini-2.5-flash since we removed model selector from UI
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
          style={{ 
            height: 4, 
            width: 32, 
            borderRadius: 2, 
            background: s === step ? '#4285F4' : '#3A3837' 
          }} 
        />
      ))}
    </div>
  );

  return (
    <div className="fadein" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <ProgressBar />

      {/* Step 1: Welcome */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: '#41328C', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <span style={{ color: '#fff', fontSize: 36, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>W</span>
              <div style={{ position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: '50%', background: '#34B889' }} />
            </div>
          </div>
          
          <div className="display" style={{ fontSize: 24, textAlign: 'center', marginBottom: 12, lineHeight: 1.2 }}>
            Willkommen bei Deutsch Werkstatt
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center', marginBottom: 32, lineHeight: 1.5 }}>
            Dein KI-Sprachstudio — lerne Deutsch durch echte Gespräche, nicht nur Vokabelkarten.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'auto' }}>
            <div style={{ background: '#E8F7F0', color: '#136B53', padding: '16px', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', fontWeight: 600, fontSize: 14 }}>
              <span style={{ fontSize: 20 }}>☑️</span> Rollenspiele für Job, Alltag, Behörden
            </div>
            <div style={{ background: '#FAEAE8', color: '#662232', padding: '16px', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', fontWeight: 600, fontSize: 14 }}>
              <span style={{ fontSize: 20 }}>☑️</span> KI merkt sich deine Fehler
            </div>
            <div style={{ background: '#E8F2FA', color: '#2B4B70', padding: '16px', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', fontWeight: 600, fontSize: 14 }}>
              <span style={{ fontSize: 20 }}>☑️</span> Interview-Prep für Tech-Jobs
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40 }}>
            <button 
              onClick={() => setStep(2)}
              style={{ background: '#2B4B70', color: '#fff', padding: '16px', borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 600 }}
            >
              Los geht's
            </button>
            <button 
              onClick={() => setStep(4)}
              style={{ background: 'transparent', color: 'var(--ink-soft)', padding: '8px', border: 'none', fontSize: 14 }}
            >
              Ich habe schon ein Konto
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Level Selection */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="display" style={{ fontSize: 24, marginBottom: 8, lineHeight: 1.2 }}>
            Wie ist dein Deutsch-Niveau?
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 32 }}>
            Wir passen die Gespräche an dein Niveau an.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'auto' }}>
            {[
              { id: 'A1', label: 'Anfänger', desc: 'Ich kenne nur ein paar Wörter' },
              { id: 'A2', label: 'Grundlegende Kenntnisse', desc: 'Ich kann einfache Sätze bilden' },
              { id: 'B1', label: 'Fortgeschritten', desc: 'Ich kann mich im Alltag verständigen' },
              { id: 'B2', label: 'Selbstständig', desc: 'Ich kann komplexe Themen diskutieren' }
            ].map((lvl) => (
              <button 
                key={lvl.id}
                onClick={() => setLevel(lvl.id)}
                style={{ 
                  background: 'transparent', 
                  border: level === lvl.id ? '2px solid #4285F4' : '1px solid var(--line)', 
                  borderRadius: 12, 
                  padding: '16px', 
                  display: 'flex', 
                  gap: 16, 
                  alignItems: 'center',
                  textAlign: 'left'
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: level === lvl.id ? '#2B4B70' : '#111', color: level === lvl.id ? '#fff' : 'var(--ink-soft)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {lvl.id}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{lvl.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{lvl.desc}</div>
                </div>
                {level === lvl.id && <div style={{ color: '#4285F4', fontSize: 20 }}>☑️</div>}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setStep(3)}
            style={{ background: '#2B4B70', color: '#fff', padding: '16px', borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 600, marginTop: 40 }}
          >
            Weiter
          </button>
        </div>
      )}

      {/* Step 3: Goals */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="display" style={{ fontSize: 24, marginBottom: 8, lineHeight: 1.2 }}>
            Was ist dein Ziel?
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 32 }}>
            Mehrfachauswahl möglich.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 'auto' }}>
            {[
              'Umzug nach Deutschland',
              'Vorstellungsgespräche',
              'Alltagsgespräche',
              'Prüfungsvorbereitung',
              'Behörden & Bürokratie',
              'Nur zum Spaß'
            ].map((goal) => {
              const isSelected = goals.includes(goal);
              return (
                <button 
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  style={{ 
                    background: isSelected ? '#2B4B70' : 'transparent', 
                    border: isSelected ? '1px solid #4285F4' : '1px solid var(--line)', 
                    borderRadius: 12, 
                    padding: '24px 12px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 12, 
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: 24 }}>{isSelected ? '☑️' : '◻️'}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#fff' : '#fff', lineHeight: 1.3 }}>{goal}</div>
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => setStep(4)}
            disabled={goals.length === 0}
            style={{ background: '#2B4B70', color: '#fff', padding: '16px', borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 600, marginTop: 40, opacity: goals.length === 0 ? 0.5 : 1 }}
          >
            Weiter
          </button>
        </div>
      )}

      {/* Step 4: API Key */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ background: '#FAEAE8', color: '#662232', width: 48, height: 48, borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 24, marginBottom: 24 }}>
            🔑
          </div>
          <div className="display" style={{ fontSize: 24, marginBottom: 8, lineHeight: 1.2 }}>
            API-Schlüssel verbinden
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 32, lineHeight: 1.5 }}>
            Deutsch Werkstatt nutzt deinen eigenen API-Schlüssel. Alle Daten bleiben lokal in deinem Browser.
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>Anbieter</label>
            <select 
              disabled
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--line)', background: '#222120', color: '#fff', fontSize: 14 }}
            >
              <option>Gemini (Google)</option>
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>API-Schlüssel</label>
            <input 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--line)', background: '#222120', color: '#fff', fontSize: 14, outline: 'none' }}
            />
          </div>

          <div style={{ background: '#222120', padding: '16px', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 'auto' }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
              Dein Schlüssel wird nur lokal gespeichert, nie an unsere Server gesendet.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40 }}>
            <button 
              onClick={() => saveAndComplete(false)}
              disabled={!apiKey.trim()}
              style={{ background: '#2B4B70', color: '#fff', padding: '16px', borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 600, opacity: !apiKey.trim() ? 0.5 : 1 }}
            >
              Verbinden & starten
            </button>
            <button 
              onClick={() => saveAndComplete(true)}
              style={{ background: 'transparent', color: 'var(--ink-soft)', padding: '8px', border: 'none', fontSize: 14 }}
            >
              Später einrichten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
