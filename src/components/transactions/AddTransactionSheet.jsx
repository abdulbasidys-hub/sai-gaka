// src/components/transactions/AddTransactionSheet.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useFinance, BUDGET_CATEGORIES, ALL_CATEGORIES } from '../../context/FinanceContext';

export default function AddTransactionSheet({ open, onClose }) {
  const { addTransaction } = useFinance();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES[0]);
  const [subItem, setSubItem] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const catMeta = BUDGET_CATEGORIES[category];

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount))) return;
    setLoading(true);
    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category,
        description: subItem || description || category,
        date: new Date(date),
      });
      setAmount(''); setDescription(''); setSubItem('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 200, backdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 480,
              background: 'var(--bg-card)',
              borderRadius: '24px 24px 0 0',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              zIndex: 201,
              padding: '20px',
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 20px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700' }}>Add Transaction</h3>
              <button onClick={onClose} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {/* Type toggle */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-elevated)',
              borderRadius: '10px',
              padding: '3px',
              marginBottom: '16px',
            }}>
              {['expense', 'income'].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    flex: 1, padding: '8px',
                    borderRadius: '8px',
                    fontSize: '13px', fontWeight: '600',
                    fontFamily: 'var(--font-display)',
                    transition: 'all 0.2s',
                    background: type === t
                      ? t === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)'
                      : 'transparent',
                    color: type === t ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {t === 'expense' ? '↓ Expense' : '↑ Income'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-muted)' }}>£</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Category
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ALL_CATEGORIES.map(cat => {
                  const meta = BUDGET_CATEGORIES[cat];
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setSubItem(''); }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: active ? '600' : '400',
                        border: `1px solid ${active ? meta.color : 'var(--border)'}`,
                        background: active ? `${meta.color}20` : 'var(--bg-elevated)',
                        color: active ? meta.color : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {meta.icon} {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-item */}
            {catMeta?.items?.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  Specific Item (optional)
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {catMeta.items.map(item => (
                    <button
                      key={item}
                      onClick={() => setSubItem(subItem === item ? '' : item)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        border: `1px solid ${subItem === item ? catMeta.color : 'var(--border)'}`,
                        background: subItem === item ? `${catMeta.color}15` : 'var(--bg-elevated)',
                        color: subItem === item ? catMeta.color : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Date */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>

            {/* Submit */}
            <motion.button
              onClick={handleSubmit}
              disabled={!amount || loading}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 'var(--radius-md)',
                background: !amount || loading
                  ? 'var(--bg-elevated)'
                  : type === 'expense'
                    ? 'linear-gradient(135deg, #f87171, #ff4444)'
                    : 'linear-gradient(135deg, #4ade80, #22c55e)',
                color: !amount || loading ? 'var(--text-muted)' : '#fff',
                fontSize: '15px',
                fontWeight: '700',
                fontFamily: 'var(--font-display)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Check size={16} /> Save Transaction
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
