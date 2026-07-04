// src/components/transactions/AddTransactionSheet.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RefreshCw, StickyNote } from 'lucide-react';
import { useFinance, BUDGET_CATEGORIES, ALL_CATEGORIES } from '../../context/FinanceContext';

export default function AddTransactionSheet({ open, onClose }) {
  const { addTransaction, budgets } = useFinance();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES[0]);
  const [subItem, setSubItem] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setAmount(''); setDescription(''); setSubItem('');
      setNotes(''); setRecurring(false); setShowNotes(false);
      setType('expense'); setCategory(ALL_CATEGORIES[0]);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [open]);

  const catMeta = BUDGET_CATEGORIES[category];
  // Sub-items: prefer Firestore-stored ones, fall back to suggestions
  const storedSubItems = budgets[category]?.subItems || [];
  const subItemOptions = storedSubItems.length > 0
    ? storedSubItems.map(si => si.name)
    : catMeta?.suggestions || [];

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return;
    }
    setLoading(true);
    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category,
        subItem,
        description: description || subItem || category,
        notes,
        date: new Date(date),
        recurring,
      });
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
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{
              position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: 480,
              background: 'var(--bg-card)', borderRadius: '24px 24px 0 0',
              border: '1px solid var(--border)', borderBottom: 'none',
              zIndex: 201, padding: '20px',
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
              maxHeight: '92dvh', overflowY: 'auto',
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 18px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Add Transaction
              </h3>
              <button onClick={onClose} style={{ color: 'var(--text-muted)', display: 'flex' }}><X size={20} /></button>
            </div>

            {/* Type toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', marginBottom: '16px' }}>
              {['expense', 'income'].map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  flex: 1, padding: '9px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-display)',
                  background: type === t ? (t === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)') : 'transparent',
                  color: type === t ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}>
                  {t === 'expense' ? '↓ Expense' : '↑ Income'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-muted)' }}>£</span>
              <input
                type="number" inputMode="decimal" placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '700',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Category */}
            <FieldLabel>Category</FieldLabel>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {ALL_CATEGORIES.map(cat => {
                const meta = BUDGET_CATEGORIES[cat];
                const active = category === cat;
                return (
                  <button key={cat} onClick={() => { setCategory(cat); setSubItem(''); }}
                    style={{
                      padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
                      fontWeight: active ? '600' : '400',
                      border: `1px solid ${active ? meta.color : 'var(--border)'}`,
                      background: active ? `${meta.color}18` : 'var(--bg-elevated)',
                      color: active ? meta.color : 'var(--text-secondary)',
                    }}>
                    {meta.icon} {cat}
                  </button>
                );
              })}
            </div>

            {/* Sub-item — from stored sub-items first, else suggestions */}
            {subItemOptions.length > 0 && (
              <>
                <FieldLabel>
                  {storedSubItems.length > 0 ? 'Sub-item' : 'Quick select (optional)'}
                </FieldLabel>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {subItemOptions.map(item => (
                    <button key={item} onClick={() => setSubItem(subItem === item ? '' : item)}
                      style={{
                        padding: '5px 10px', borderRadius: '6px', fontSize: '12px',
                        border: `1px solid ${subItem === item ? catMeta.color : 'var(--border)'}`,
                        background: subItem === item ? `${catMeta.color}15` : 'var(--bg-elevated)',
                        color: subItem === item ? catMeta.color : 'var(--text-secondary)',
                      }}>
                      {item}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Description */}
            <input
              type="text" placeholder="Description (optional)"
              value={description} onChange={e => setDescription(e.target.value)}
              style={{
                width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '11px 14px',
                color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-body)',
                outline: 'none', marginBottom: '10px',
              }}
            />

            {/* Date */}
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{
                width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '11px 14px',
                color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-body)',
                outline: 'none', colorScheme: 'dark', marginBottom: '12px',
              }}
            />

            {/* Options row: recurring + notes toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: showNotes ? '10px' : '16px' }}>
              <button onClick={() => setRecurring(r => !r)}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${recurring ? 'var(--accent-primary)' : 'var(--border)'}`,
                  background: recurring ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)',
                  color: recurring ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '12px', fontWeight: '600', fontFamily: 'var(--font-display)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                }}>
                <RefreshCw size={13} /> Recurring
              </button>
              <button onClick={() => setShowNotes(s => !s)}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${showNotes ? 'var(--accent-amber)' : 'var(--border)'}`,
                  background: showNotes ? 'var(--accent-amber-dim)' : 'var(--bg-elevated)',
                  color: showNotes ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  fontSize: '12px', fontWeight: '600', fontFamily: 'var(--font-display)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                }}>
                <StickyNote size={13} /> Add Note
              </button>
            </div>

            {/* Notes */}
            <AnimatePresence>
              {showNotes && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '12px' }}
                >
                  <textarea
                    placeholder="Add a note about this transaction..."
                    value={notes} onChange={e => setNotes(e.target.value)}
                    rows={2}
                    style={{
                      width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', padding: '11px 14px',
                      color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-body)',
                      outline: 'none', resize: 'none', lineHeight: '1.5',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recurring info */}
            <AnimatePresence>
              {recurring && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontSize: '11px', color: 'var(--accent-primary)', marginBottom: '12px', paddingLeft: '2px' }}
                >
                  ♻️ This will be marked as recurring. You can log it again next month from the recurring section.
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              onClick={handleSubmit} disabled={!amount || loading} whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', padding: '15px', borderRadius: 'var(--radius-md)',
                background: !amount || loading
                  ? 'var(--bg-elevated)'
                  : type === 'expense'
                    ? 'linear-gradient(135deg, var(--accent-red), #ff4444)'
                    : 'linear-gradient(135deg, var(--accent-green), #22c55e)',
                color: !amount || loading ? 'var(--text-muted)' : '#fff',
                fontSize: '15px', fontWeight: '700', fontFamily: 'var(--font-display)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <Check size={16} />
              {loading ? 'Saving...' : 'Save Transaction'}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FieldLabel({ children }) {
  return (
    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
      {children}
    </p>
  );
}
