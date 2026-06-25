// src/pages/SettingsPage.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { LogOut, ChevronLeft, ChevronRight, Calendar, User, Mail, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { currentMonth, setCurrentMonth, monthlyIncome, updateMonthlyIncome } = useFinance();
  const [income, setIncome] = useState(monthlyIncome || '');
  const [incomeEditing, setIncomeEditing] = useState(false);

  const monthDate = parseISO(currentMonth + '-01');

  const prevMonth = () => {
    setCurrentMonth(format(subMonths(monthDate, 1), 'yyyy-MM'));
  };
  const nextMonth = () => {
    const next = addMonths(monthDate, 1);
    if (next <= new Date()) setCurrentMonth(format(next, 'yyyy-MM'));
  };

  const handleSaveIncome = async () => {
    await updateMonthlyIncome(income);
    setIncomeEditing(false);
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c6aff, #b06aff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800',
          boxShadow: '0 0 20px rgba(124,106,255,0.3)',
          flexShrink: 0,
        }}>
          {user?.displayName?.[0]?.toUpperCase() || 'S'}
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', marginBottom: '2px' }}>
            {user?.displayName || 'Sadik'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.email}</p>
        </div>
      </motion.div>

      {/* Month Navigation */}
      <SectionLabel label="Viewing Period" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={prevMonth} style={{ color: 'var(--text-secondary)', display: 'flex', padding: '8px' }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <Calendar size={14} color="var(--accent-primary)" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700' }}>
                {format(monthDate, 'MMMM yyyy')}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              All data shown is for this month
            </p>
          </div>
          <button onClick={nextMonth} style={{ color: 'var(--text-secondary)', display: 'flex', padding: '8px' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>

      {/* Monthly income */}
      <SectionLabel label="Monthly Income" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px',
        }}
      >
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Set your income for {format(monthDate, 'MMMM yyyy')}. This is separate from logged income transactions.
        </p>
        {incomeEditing ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-elevated)', border: '1px solid var(--accent-primary)',
              borderRadius: 'var(--radius-md)', padding: '10px 12px',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-muted)' }}>£</span>
              <input
                type="number" autoFocus value={income} onChange={e => setIncome(e.target.value)}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)',
                }}
              />
            </div>
            <button onClick={handleSaveIncome} style={{
              background: 'var(--accent-green)', border: 'none', borderRadius: 'var(--radius-md)',
              padding: '10px 16px', color: '#0a0a0f', fontWeight: '700', fontSize: '13px',
              fontFamily: 'var(--font-display)',
            }}>Save</button>
            <button onClick={() => setIncomeEditing(false)} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '13px',
            }}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700', color: 'var(--accent-green)' }}>
              £{monthlyIncome?.toLocaleString() || '0'}
            </span>
            <button onClick={() => { setIncome(monthlyIncome); setIncomeEditing(true); }} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '8px 14px',
              color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-display)',
            }}>Edit</button>
          </div>
        )}
      </motion.div>

      {/* App info */}
      <SectionLabel label="App" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '16px',
        }}
      >
        <SettingRow icon={<Shield size={16} />} label="Data & Privacy" value="Secured with Firebase" />
        <SettingRow icon={<Bell size={16} />} label="Notifications" value="Browser push" last />
      </motion.div>

      {/* Sign out */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={logout}
        whileTap={{ scale: 0.97 }}
        style={{
          width: '100%', padding: '14px',
          background: 'var(--accent-red-dim)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--accent-red)', fontSize: '15px', fontWeight: '700',
          fontFamily: 'var(--font-display)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        <LogOut size={16} /> Sign Out
      </motion.button>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
        Sadik Finance v1.0 · Private App
      </p>
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <p style={{
      fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600',
      textTransform: 'uppercase', letterSpacing: '0.8px',
      marginBottom: '8px', paddingLeft: '2px',
    }}>
      {label}
    </p>
  );
}

function SettingRow({ icon, label, value, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', gap: '12px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{value}</span>
    </div>
  );
}
