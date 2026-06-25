// src/components/dashboard/IncomeModal.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export default function IncomeModal({ open, onClose }) {
  const { monthlyIncome, updateMonthlyIncome } = useFinance();
  const [value, setValue] = useState(monthlyIncome || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateMonthlyIncome(value);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 48px)', maxWidth: 360,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              zIndex: 301,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700' }}>Set Monthly Income</h3>
              <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Set your total income for this month (salary, freelance, etc.)
            </p>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '20px',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-muted)' }}>£</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={value}
                onChange={e => setValue(e.target.value)}
                autoFocus
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={{
                flex: 1, padding: '12px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
                fontSize: '14px', fontWeight: '600', fontFamily: 'var(--font-display)',
              }}>
                Cancel
              </button>
              <motion.button
                onClick={handleSave}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, padding: '12px',
                  background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  color: '#fff', fontSize: '14px', fontWeight: '700',
                  fontFamily: 'var(--font-display)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <Check size={16} /> Save
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
