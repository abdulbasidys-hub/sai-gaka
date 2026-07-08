// src/components/layout/TopBar.jsx
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Settings2, LogOut, Menu } from 'lucide-react';

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
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [menuOpen]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, height: 'var(--nav-height)',
        zIndex: 300, padding: '0 14px',
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        overflow: 'visible',
      }}
    >
      {/* BURGER MENU — first element, always visible */}
      <div ref={menuRef} style={{ flexShrink: 0, position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
          style={{
            width: 40, height: 40, borderRadius: '10px',
            background: menuOpen ? 'var(--accent-primary)' : 'var(--bg-elevated)',
            border: `1px solid ${menuOpen ? 'var(--accent-primary)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: menuOpen ? '#fff' : 'var(--text-primary)',
            touchAction: 'manipulation', cursor: 'pointer',
          }}
        >
          <Menu size={20} />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -6 }}
              transition={{ duration: 0.13 }}
              style={{
                position: 'fixed',
                top: 'calc(var(--nav-height) + 8px)',
                left: '14px',
                width: 240,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
                zIndex: 9999,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{user?.displayName || 'Sadik'}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
              </div>

              <button onClick={toggleTheme} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 14px', borderBottom: '1px solid var(--border)', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#fbbf24' : 'var(--accent-primary)', flexShrink: 0 }}>
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </div>
                <p style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{isDark ? 'Light Mode' : 'Dark Mode'}</p>
                <div style={{ width: 38, height: 22, borderRadius: '11px', background: isDark ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: '1px solid var(--border)', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '3px', left: isDark ? '18px' : '3px', width: 14, height: 14, borderRadius: '50%', background: isDark ? '#fff' : 'var(--text-muted)', transition: 'left 0.2s' }} />
                </div>
              </button>

              <button onClick={() => { navigate('/settings'); setMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 14px', borderBottom: '1px solid var(--border)', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  <Settings2 size={16} />
                </div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Settings</p>
              </button>

              <button onClick={() => { logout(); setMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 14px', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--accent-red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)', flexShrink: 0 }}>
                  <LogOut size={16} />
                </div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-red)', fontFamily: 'var(--font-display)' }}>Sign Out</p>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Title / greeting on the right of the burger */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {isHome ? (
          <div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1.2 }}>{greeting},</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '800', letterSpacing: '-0.3px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{firstName} 👋</h1>
          </div>
        ) : (
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.4px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
        )}
      </div>
    </motion.header>
  );
}
