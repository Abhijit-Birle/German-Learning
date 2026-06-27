import React, { useState, useEffect } from 'react';
import { Icon } from './ui/Icon.jsx';
import { motion } from 'framer-motion';

const QUIZ_DATA = [
  {
    question: "How do you say 'I'?",
    options: ["Du", "Ich", "Er"],
    answer: "Ich"
  },
  {
    question: "How do you say 'am called / name'?",
    options: ["komme", "bin", "heiße"],
    answer: "heiße"
  },
  {
    question: "How do you say 'you'?",
    options: ["Ich", "Sie", "Du"],
    answer: "Du"
  }
];

export function MiniQuiz({ onComplete }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [celebration, setCelebration] = useState(false);

  useEffect(() => {
    if (celebration) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [celebration, onComplete]);

  const handleSelect = (opt) => {
    if (showResult || celebration) return;
    setSelected(opt);
    setShowResult(true);

    setTimeout(() => {
      if (currentQ < QUIZ_DATA.length - 1) {
        setCurrentQ(prev => prev + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        setCelebration(true);
      }
    }, 1500);
  };

  if (celebration) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="fadein" 
        style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px 0', alignItems: 'center', justifyContent: 'center', width: '100%' }}
      >
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          className="neu-raised" 
          style={{ padding: '40px', borderRadius: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%', maxWidth: 320 }}
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--grad-teal)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '2px 2px 5px var(--shadow-dark), -2px -2px 5px var(--shadow-light)' }}
          >
            <Icon name="Check" size={40} color="#fff" />
          </motion.div>
          <div className="display" style={{ fontSize: 32, color: 'var(--ink)' }}>
            Great!
          </div>
          <div style={{ fontSize: 16, color: 'var(--ink-soft)' }}>
            You've completed the intro.
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const q = QUIZ_DATA[currentQ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px 0', alignItems: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', width: '100%', maxWidth: 400 }}>
        
        <div style={{ textAlign: 'center', marginBottom: 8, color: 'var(--ink-soft)', fontSize: 14, fontWeight: 600 }}>
          Mini Quiz ({currentQ + 1} / {QUIZ_DATA.length})
        </div>
        
        <div className="display" style={{ fontSize: 24, textAlign: 'center', marginBottom: 32, lineHeight: 1.2 }}>
          {q.question}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {q.options.map(opt => {
            let bg = 'var(--card-bg)';
            let color = 'var(--ink)';
            let icon = null;
            let className = 'neu-raised';

            if (showResult) {
              if (opt === q.answer) {
                bg = 'var(--app-bg)';
                color = 'var(--color-teal)';
                className = 'neu-inset';
                icon = <Icon name="Check" size={20} color="var(--color-teal)" />;
              } else if (opt === selected) {
                bg = 'var(--app-bg)';
                color = 'var(--color-copper)';
                className = 'neu-inset';
                icon = <Icon name="X" size={20} color="var(--color-copper)" />;
              } else {
                className = 'neu-raised';
              }
            } else if (selected === opt) {
              className = 'neu-inset';
            }

            return (
              <button
                key={opt}
                className={className}
                onClick={() => handleSelect(opt)}
                style={{
                  padding: '16px',
                  fontSize: 16,
                  fontWeight: 600,
                  color,
                  background: bg,
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: 12,
                  cursor: showResult ? 'default' : 'pointer'
                }}
              >
                {opt}
                {icon}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
