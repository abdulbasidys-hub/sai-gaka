// src/components/layout/TopBar.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Sun, Moon, Settings2, LogOut } from 'lucide-react';

const PAGE_TITLES = {
  '/': null,
  '/transactions': 'Transactions',
  '/budget': 'Budget',
  '/budget-settings': 'Budget Settings',
  '/savings': 'Savings',
  '/insights': 'Insights',
  '/settings': 'Settings',
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
      {/* Left */}
      <div>
        {isHome ? (
          <div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{greeting},</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>{firstName} 👋</h1>
          </div>
        ) : (
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>{title}</h1>
        )}
      </div>

      {/* Right — theme, settings, logout all visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

        {/* Theme toggle — clearly labeled */}
        <motion.button onClick={toggleTheme} whileTap={{ scale: 0.88 }}
          title={isDark ? 'Light mode' : 'Dark mode'}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '5px 9px', borderRadius: '20px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '600',
          }}>
          <motion.span key={isDark ? 'sun' : 'moon'} initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </motion.span>
          <span>{isDark ? 'Light' : 'Dark'}</span>
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

        {/* Quick logout */}
        <motion.button onClick={logout} whileTap={{ scale: 0.88 }}
          title="Sign out"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-red)',
          }}>
          <LogOut size={13} />
        </motion.button>
      </div>
    </motion.header>
  );
}
