// src/components/layout/LoadingScreen.jsx
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      gap: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
      >
        <div style={{
          width: 56, height: 56,
          background: 'linear-gradient(135deg, var(--accent-primary), #b06aff)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', color: '#fff',
          boxShadow: '0 0 40px var(--accent-primary-dim)',
        }}>
          ₦
        </div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: '700',
          letterSpacing: '-0.5px',
          color: 'var(--text-primary)',
        }}>
          Sadik Finance
        </span>
      </motion.div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }}
          />
        ))}
      </div>
    </div>
  );
}
