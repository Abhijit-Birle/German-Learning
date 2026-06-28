import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Icon } from './ui/Icon.jsx';

export function SessionComplete({ score, total, onBack, title = "Übung beendet!" }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    // Count up animation
    const animation = animate(count, score, { duration: 1.5, type: "spring", bounce: 0.25 });
    
    // Confetti logic if score >= 80%
    if (total > 0 && score / total >= 0.8) {
      setTimeout(() => {
        const duration = 2500;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#4CAF50', '#81C784', '#A5D6A7']
          });
          confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#4CAF50', '#81C784', '#A5D6A7']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }, 500); // Wait for score to count up a bit
    }
    
    return animation.stop;
  }, [score, total, count]);

  const percent = total > 0 ? score / total : 0;
  const isPerfect = percent === 1;
  const isGood = percent >= 0.8 && !isPerfect;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '24px',
        gap: '32px'
      }}
    >
      <div className="neu-raised" style={{
        padding: '40px 32px',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        maxWidth: '360px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div className="neu-inset" style={{
          width: 80, height: 80, borderRadius: '50%',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          color: isPerfect ? 'var(--color-teal)' : isGood ? '#FFA726' : 'var(--color-copper)'
        }}>
          <Icon name={isPerfect ? 'Trophy' : isGood ? 'Star' : 'Target'} size={40} />
        </div>
        
        <h2 style={{ color: 'var(--ink)', margin: 0, fontSize: '24px' }}>{title}</h2>
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <motion.span style={{ fontSize: '64px', fontWeight: '900', color: 'var(--color-teal)' }}>
            {rounded}
          </motion.span>
          <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--ink-soft)' }}>
            / {total}
          </span>
        </div>
        
        <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: '16px' }}>
          {isPerfect ? "Perfekt! Makellos gemacht." : isGood ? "Sehr gut! Fast fehlerfrei." : "Gute Übung, weiter so!"}
        </p>
      </div>

      <motion.button 
        whileTap={{ scale: 0.95 }}
        className="neu-btn" 
        onClick={onBack}
        style={{
          padding: '16px 40px',
          background: 'var(--color-teal)',
          color: '#fff',
          fontSize: '18px',
          fontWeight: '700',
          width: '100%',
          maxWidth: '360px'
        }}
      >
        Weiter
      </motion.button>
    </motion.div>
  );
}
