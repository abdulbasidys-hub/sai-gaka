// src/components/layout/TopBar.jsx
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Sun, Moon } from 'lucide-react';

const PAGE_TITLES = {
  '/': 'Overview',
  '/transactions': 'Transactions',
  '/budget': 'Budget',
  '/savings': 'Savings',
  '/settings': 'Settings',
};

export default function TopBar() {
  const location = useLocation();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const title = PAGE_TITLES[location.pathname] || 'Sadik Finance';
  const isHome = location.pathname === '/';

  const firstName = user?.displayName?.split(' ')[0] || 'Sadik';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        height: 'var(--nav-height)',
        zIndex: 100,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        {isHome ? (
          <div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {greeting},
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
              {firstName} 👋
            </h1>
          </div>
        ) : (
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            {title}
          </h1>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Date badge */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '4px 10px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontWeight: '500',
        }}>
          {format(new Date(), 'MMM yyyy')}
        </div>

        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          whileTap={{ scale: 0.88 }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 34, height: 34,
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}
        >
          <motion.div
            key={isDark ? 'moon' : 'sun'}
            initial={{ rotate: -30, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </motion.div>
        </motion.button>

        {/* Avatar */}
        <div style={{
          width: 34, height: 34,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), #b06aff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: '700',
          fontFamily: 'var(--font-display)',
          color: '#fff',
          boxShadow: '0 0 12px var(--accent-primary-dim)',
          flexShrink: 0,
        }}>
          {firstName[0]?.toUpperCase()}
        </div>
      </div>
    </motion.header>
  );
}
