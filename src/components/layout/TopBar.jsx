// src/components/layout/TopBar.jsx
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isHome = location.pathname === '/';
  const title = PAGE_TITLES[location.pathname];
  const firstName = user?.displayName?.split(' ')[0] || 'Sadik';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Close on outside tap
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, height: 'var(--nav-height)',
          // z-index must be above dropdown (500) so header bg renders, dropdown is 499
          zIndex: 300,
          padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--topbar-bg)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          // CRITICAL: overflow visible so dropdown isn't clipped
          overflow: 'visible',
        }}
      >
        {/* Left */}
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

        {/* Right: avatar */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary), #b06aff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '800', color: '#fff',
              boxShadow: menuOpen ? '0 0 0 3px var(--accent-primary-dim)' : '0 0 12px var(--accent-primary-dim)',
              border: 'none', touchAction: 'manipulation',
            }}
          >
            {firstName[0]?.toUpperCase()}
          </button>

          {/* Dropdown — positioned fixed so it escapes any clipping */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{ duration: 0.14 }}
                style={{
                  position: 'fixed',
                  top: 'calc(var(--nav-height) + 6px)',
                  right: '16px',
                  width: 220,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  // Above everything
                  zIndex: 500,
                  overflow: 'hidden',
                }}
              >
                {/* User info */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{user?.displayName || 'Sadik'}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                </div>

                {/* Theme */}
                <button onClick={toggleTheme} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderBottom: '1px solid var(--border)',
                  background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation',
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isDark ? '#fbbf24' : 'var(--accent-primary)' }}>
                    {isDark ? <Sun size={15} /> : <Moon size={15} />}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{isDark ? 'Light Mode' : 'Dark Mode'}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tap to switch</p>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: '10px', background: isDark ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: '1px solid var(--border)', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: '3px', left: isDark ? '17px' : '3px', width: 14, height: 14, borderRadius: '50%', background: isDark ? '#fff' : 'var(--text-muted)', transition: 'left 0.2s' }} />
                  </div>
                </button>

                {/* Settings */}
                <button onClick={() => { navigate('/settings'); setMenuOpen(false); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderBottom: '1px solid var(--border)',
                  background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation',
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-secondary)' }}>
                    <Settings2 size={15} />
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Settings</p>
                </button>

                {/* Sign out */}
                <button onClick={() => { logout(); setMenuOpen(false); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px',
                  background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation',
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '8px', background: 'var(--accent-red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent-red)' }}>
                    <LogOut size={15} />
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-red)', fontFamily: 'var(--font-display)' }}>Sign Out</p>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>
    </>
  );
}
