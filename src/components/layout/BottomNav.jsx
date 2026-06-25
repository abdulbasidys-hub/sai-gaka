// src/components/layout/BottomNav.jsx
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ArrowLeftRight, PieChart, PiggyBank, Settings2 } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Spend' },
  { to: '/budget', icon: PieChart, label: 'Budget' },
  { to: '/savings', icon: PiggyBank, label: 'Save' },
  { to: '/settings', icon: Settings2, label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      height: 'var(--bottom-nav-height)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 8px 8px',
      background: 'var(--bottomnav-bg)',
      backdropFilter: 'blur(24px)',
      borderTop: '1px solid var(--border)',
    }}>
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}
        >
          {({ isActive }) => (
            <motion.div
              whileTap={{ scale: 0.88 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 4px',
                borderRadius: '12px',
                width: '100%',
                position: 'relative',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--accent-primary-dim)',
                    borderRadius: '12px',
                    border: '1px solid rgba(124,106,255,0.2)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'}
                strokeWidth={isActive ? 2.2 : 1.8}
                style={{ position: 'relative', zIndex: 1, transition: 'color 0.2s' }}
              />
              <span style={{
                fontSize: '10px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                position: 'relative', zIndex: 1,
                letterSpacing: '0.3px',
                transition: 'color 0.2s',
              }}>
                {label}
              </span>
            </motion.div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
