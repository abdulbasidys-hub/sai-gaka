// src/components/transactions/AddTransactionSheet.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, RefreshCw, StickyNote, ChevronDown } from 'lucide-react';
import { useFinance, BUDGET_CATEGORIES, ALL_CATEGORIES } from '../../context/FinanceContext';
import { useCurrency } from '../../context/CurrencyContext';

export default function AddTransactionSheet({ open, onClose }) {
  const { addTransaction, budgets } = useFinance();
  const { exchangeRate } = useCurrency();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [category, setCategory] = useState(ALL_CATEGORIES[0]);
  const [subItem, setSubItem] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);

  // Swipe-to-close drag
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setAmount(''); setDescription(''); setSubItem('');
      setNotes(''); setRecurring(false); setShowNotes(false);
      setType('expense'); setCategory(ALL_CATEGORIES[0]);
      setDate(new Date().toISOString().split('T')[0]);
      setCurrency('GBP');
      y.set(0);
    }
  }, [open]);

  // Auto-set currency based on category default
  useEffect(() => {
    const def = BUDGET_CATEGORIES[category]?.defaultCurrency || 'GBP';
    setCurrency(def);
    setSubItem('');
  }, [category]);

  const catMeta = BUDGET_CATEGORIES[category];
  const storedSubItems = budgets[category]?.subItems || [];
  const subItemOptions = storedSubItems.length > 0
    ? storedSubItems.map(si => si.name)
    : catMeta?.suggestions || [];

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setLoading(true);
    try {
      await addTransaction({
        type, amount: parseFloat(amount), currency,
        category, subItem,
        description: description || subItem || category,
        notes, date: new Date(date), recurring,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onClose();
    } else {
      y.set(0);
    }
  };

  const currencySymbol = currency === 'NGN' ? '₦' : '£';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ opacity }}
          />

          {/* Sheet — full-width, full-screen bottom sheet */}
          <motion.div
            ref={sheetRef}
            className="sheet-panel"
            style={{ y }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle — tap or swipe down to close */}
            <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 40, height: 4, borderRadius: 2, background: 'var(--border)',
                cursor: 'grab',
              }} />
            </div>

            <div style={{ padding: '14px 16px 0' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Add Transaction
                </h3>
                <button onClick={onClose} style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600',
                }}>
                  <ChevronDown size={18} /> Close
                </button>
              </div>

              {/* Type toggle */}
              <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', marginBottom: '14px' }}>
                {['expense', 'income'].map(t => (
                  <button key={t} onClick={() => setType(t)} style={{
                    flex: 1, padding: '9px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)',
                    background: type === t ? (t === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)') : 'transparent',
                    color: type === t ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.18s',
                  }}>
                    {t === 'expense' ? '↓ Expense' : '↑ Income'}
                  </button>
                ))}
              </div>

              {/* Amount + Currency toggle */}
              <div style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px',
              }}>
                {/* Currency pill toggle */}
                <button
                  onClick={() => setCurrency(c => c === 'GBP' ? 'NGN' : 'GBP')}
                  style={{
                    background: currency === 'NGN' ? 'var(--accent-naira-dim)' : 'var(--accent-primary-dim)',
                    border: `1px solid ${currency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)'}`,
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px', fontWeight: '800',
                    color: currency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)',
                    flexShrink: 0, minWidth: '44px', textAlign: 'center',
                  }}
                >
                  {currencySymbol}
                </button>
                <input
                  type="number" inputMode="decimal" placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800',
                    color: 'var(--text-primary)',
                  }}
                />
                {amount && currency === 'NGN' && exchangeRate && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    ≈ £{(parseFloat(amount) / exchangeRate).toFixed(2)}
                  </span>
                )}
                {amount && currency === 'GBP' && exchangeRate && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    ≈ ₦{Math.round(parseFloat(amount) * exchangeRate).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Category */}
              <FieldLabel>Category</FieldLabel>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {ALL_CATEGORIES.map(cat => {
                  const meta = BUDGET_CATEGORIES[cat];
                  const active = category === cat;
                  return (
                    <button key={cat} onClick={() => setCategory(cat)} style={{
                      padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: active ? '700' : '400',
                      border: `1px solid ${active ? meta.color : 'var(--border)'}`,
                      background: active ? `${meta.color}18` : 'var(--bg-elevated)',
                      color: active ? meta.color : 'var(--text-secondary)',
                    }}>
                      {meta.icon} {cat}
                    </button>
                  );
                })}
              </div>

              {/* Sub-item */}
              {subItemOptions.length > 0 && (
                <>
                  <FieldLabel>{storedSubItems.length > 0 ? 'Sub-item' : 'Quick pick (optional)'}</FieldLabel>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {subItemOptions.map(item => (
                      <button key={item} onClick={() => setSubItem(subItem === item ? '' : item)} style={{
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
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '10px',
                }}
              />

              {/* Date */}
              <input
                type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{
                  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '11px 14px',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                  colorScheme: 'light dark', marginBottom: '12px',
                }}
              />

              {/* Options */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: showNotes ? '10px' : '16px' }}>
                <button onClick={() => setRecurring(r => !r)} style={{
                  flex: 1, padding: '9px 10px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600',
                  fontFamily: 'var(--font-display)',
                  border: `1px solid ${recurring ? 'var(--accent-primary)' : 'var(--border)'}`,
                  background: recurring ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)',
                  color: recurring ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                }}>
                  <RefreshCw size={13} /> Recurring
                </button>
                <button onClick={() => setShowNotes(s => !s)} style={{
                  flex: 1, padding: '9px 10px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600',
                  fontFamily: 'var(--font-display)',
                  border: `1px solid ${showNotes ? 'var(--accent-amber)' : 'var(--border)'}`,
                  background: showNotes ? 'var(--accent-amber-dim)' : 'var(--bg-elevated)',
                  color: showNotes ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                }}>
                  <StickyNote size={13} /> Note
                </button>
              </div>

              <AnimatePresence>
                {showNotes && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '12px' }}>
                    <textarea
                      placeholder="Add a note..."
                      value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      style={{
                        width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: '11px 14px',
                        color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'none', lineHeight: 1.5,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                onClick={handleSubmit} disabled={!amount || loading} whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '15px', borderRadius: 'var(--radius-md)', marginBottom: '8px',
                  background: !amount || loading
                    ? 'var(--bg-elevated)'
                    : type === 'expense'
                      ? currency === 'NGN'
                        ? 'linear-gradient(135deg, var(--accent-naira), #16a34a)'
                        : 'linear-gradient(135deg, var(--accent-red), #ff4444)'
                      : 'linear-gradient(135deg, var(--accent-green), #22c55e)',
                  color: !amount || loading ? 'var(--text-muted)' : '#fff',
                  fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <Check size={16} />
                {loading ? 'Saving…' : `Save ${currency} ${type === 'expense' ? 'Expense' : 'Income'}`}
              </motion.button>
              {/* Safe area spacer */}
              <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
            </div>
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
