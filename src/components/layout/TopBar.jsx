// src/components/layout/TopBar.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Sun, Moon, Settings2 } from 'lucide-react';

const PAGE_TITLES = {
  '/': null, // handled specially
  '/transactions': 'Transactions',
  '/budget': 'Budget',
  '/savings': 'Savings',
  '/insights': 'Insights',
  '/settings': 'Settings',
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const isHome = location.pathname === '/';
  const title = PAGE_TITLES[location.pathname];

  const firstName = user?.displayName?.split(' ')[0] || 'Sadik';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, height: 'var(--nav-height)',
        zIndex: 100, padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: title or greeting */}
      <div>
        {isHome ? (
          <div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {greeting},
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>
              {firstName} 👋
            </h1>
          </div>
        ) : (
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            {title}
          </h1>
        )}
      </div>

      {/* Right: month badge + theme toggle + settings + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '7px', padding: '3px 9px',
          fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.2px',
        }}>
          {format(new Date(), 'MMM yyyy')}
        </div>

        {/* Theme toggle */}
        <motion.button onClick={toggleTheme} whileTap={{ scale: 0.88 }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}>
          <motion.div key={isDark ? 'moon' : 'sun'} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </motion.div>
        </motion.button>

        {/* Settings gear */}
        <motion.button onClick={() => navigate('/settings')} whileTap={{ scale: 0.88 }}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: location.pathname === '/settings' ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)',
            border: `1px solid ${location.pathname === '/settings' ? 'var(--accent-primary)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: location.pathname === '/settings' ? 'var(--accent-primary)' : 'var(--text-secondary)',
          }}>
          <Settings2 size={14} />
        </motion.button>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), #b06aff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fff',
          boxShadow: '0 0 10px var(--accent-primary-dim)', flexShrink: 0,
        }}>
          {firstName[0]?.toUpperCase()}
        </div>
      </div>
    </motion.header>
  );
}
