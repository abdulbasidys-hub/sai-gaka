// src/pages/AuthPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const { login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        if (!displayName.trim()) { toast.error('Please enter your name'); setLoading(false); return; }
        await register(email.trim(), password, displayName.trim());
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: '300px', height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent-primary-dim) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Theme toggle — top right */}
      <motion.button
        onClick={toggleTheme}
        whileTap={{ scale: 0.88 }}
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', zIndex: 10,
        }}
      >
        <motion.div
          key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -30, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </motion.div>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '380px', zIndex: 1 }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            style={{
              width: 64, height: 64,
              background: 'linear-gradient(135deg, var(--accent-primary), #b06aff)',
              borderRadius: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', color: '#fff',
              margin: '0 auto 16px',
              boxShadow: '0 0 48px var(--accent-primary-dim)',
            }}>
            ₦
          </motion.div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px', fontWeight: '800', letterSpacing: '-1px',
            marginBottom: '8px', color: 'var(--text-primary)',
          }}>
            Sadik Finance
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {mode === 'login' ? 'Welcome back. Sign in to continue.' : 'Create your account to get started.'}
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '4px',
          marginBottom: '24px',
        }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '10px',
                borderRadius: 'calc(var(--radius-lg) - 4px)',
                fontSize: '14px', fontWeight: '600',
                fontFamily: 'var(--font-display)',
                transition: 'all 0.2s',
                background: mode === m ? 'var(--accent-primary)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-secondary)',
                letterSpacing: '0.2px',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <AnimatePresence>
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <InputField
                  icon={<User size={16} />}
                  placeholder="Your name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  type="text"
                  autoComplete="name"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <InputField
            icon={<Mail size={16} />}
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
          />

          <div style={{ position: 'relative' }}>
            <InputField
              icon={<Lock size={16} />}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPass ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--accent-primary), #9c6aff)',
              color: loading ? 'var(--text-muted)' : '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '15px', fontWeight: '700',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.2px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginTop: '4px',
              boxShadow: loading ? 'none' : '0 4px 24px var(--accent-primary-dim)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Please wait...' : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Private app — access by invitation only
        </p>
      </motion.div>
    </div>
  );
}

function InputField({ icon, placeholder, value, onChange, type, autoComplete }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0 14px',
      }}
      onFocus={e => e.currentTarget.style.borderColor = 'var(--border-active)'}
      onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          color: 'var(--text-primary)',
          fontSize: '15px', padding: '14px 0',
          fontFamily: 'var(--font-body)',
        }}
      />
    </div>
  );
}
