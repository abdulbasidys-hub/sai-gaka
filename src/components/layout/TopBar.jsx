// src/components/layout/TopBar.jsx
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Sun, Moon, Settings2, LogOut, User } from 'lucide-react';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isHome = location.pathname === '/';
  const title = PAGE_TITLES[location.pathname];
  const firstName = user?.displayName?.split(' ')[0] || 'Sadik';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Close menu on outside tap
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [menuOpen]);

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
      <div style={{ flex: 1, minWidth: 0 }}>
        {isHome ? (
          <div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{greeting},</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', letterSpacing: '-0.4px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstName} 👋</h1>
          </div>
        ) : (
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>{title}</h1>
        )}
      </div>

      {/* Right: avatar button that opens dropdown menu */}
      <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: menuOpen
              ? 'var(--accent-primary)'
              : 'linear-gradient(135deg, var(--accent-primary), #b06aff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '800', color: '#fff',
            boxShadow: '0 0 12px var(--accent-primary-dim)',
            border: menuOpen ? '2px solid var(--accent-primary)' : '2px solid transparent',
            touchAction: 'manipulation',
          }}
        >
          {firstName[0]?.toUpperCase()}
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                width: 210,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
                zIndex: 200,
              }}
            >
              {/* User info */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{user?.displayName || 'Sadik'}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => { toggleTheme(); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderBottom: '1px solid var(--border)', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? 'var(--accent-amber)' : 'var(--accent-primary)', flexShrink: 0 }}>
                  {isDark ? <Sun size={14} /> : <Moon size={14} />}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Currently {isDark ? 'dark' : 'light'}</p>
                </div>
                {/* Toggle pill */}
                <div style={{ width: 36, height: 20, borderRadius: '10px', background: isDark ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: '1px solid var(--border)', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '2px', left: isDark ? '18px' : '2px', width: 14, height: 14, borderRadius: '50%', background: isDark ? '#fff' : 'var(--text-muted)', transition: 'left 0.2s' }} />
                </div>
              </button>

              {/* Settings */}
              <button
                onClick={() => { navigate('/settings'); setMenuOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderBottom: '1px solid var(--border)', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  <Settings2 size={14} />
                </div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Settings</p>
              </button>

              {/* Sign out */}
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--accent-red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)', flexShrink: 0 }}>
                  <LogOut size={14} />
                </div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-red)', fontFamily: 'var(--font-display)' }}>Sign Out</p>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
