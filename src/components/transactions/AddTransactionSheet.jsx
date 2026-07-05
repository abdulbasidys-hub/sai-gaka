// src/components/transactions/AddTransactionSheet.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, RefreshCw, StickyNote, ChevronDown, ArrowLeftRight } from 'lucide-react';
import { useFinance, INCOME_SOURCES } from '../../context/FinanceContext';
import { useCurrency } from '../../context/CurrencyContext';
import TransferSheet from '../transfer/TransferSheet';

export default function AddTransactionSheet({ open, onClose }) {
  const { addTransaction, BUDGET_CATEGORIES, ALL_CATEGORIES, balanceGBP, balanceNGN } = useFinance();
  const { exchangeRate } = useCurrency();

  const [type, setType] = useState('expense');
  const [account, setAccount] = useState('GBP');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  const [subItem, setSubItem] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const y = useMotionValue(0);
  const bgOpacity = useTransform(y, [0, 300], [1, 0]);

  useEffect(() => {
    if (!open) {
      setAmount(''); setDescription(''); setSubItem('');
      setNotes(''); setRecurring(false); setShowNotes(false);
      setType('expense'); setIncomeSource('');
      setDate(new Date().toISOString().split('T')[0]);
      y.set(0);
    }
  }, [open]);

  // Auto-set account based on category default
  useEffect(() => {
    if (category && BUDGET_CATEGORIES[category]) {
      setAccount(BUDGET_CATEGORIES[category].defaultCurrency || 'GBP');
    }
    setSubItem('');
  }, [category]);

  // Set default category when type switches
  useEffect(() => {
    if (type === 'expense' && !category) setCategory(ALL_CATEGORIES[0]);
    if (type === 'income') setCategory('');
  }, [type]);

  const catMeta = BUDGET_CATEGORIES[category];
  const storedSubItems = category ? (useFinance().budgets[category]?.subItems || []) : [];
  const subItemOptions = storedSubItems.length > 0
    ? storedSubItems.map(si => si.name)
    : (catMeta?.suggestions || []);

  const currentBalance = account === 'GBP' ? balanceGBP : balanceNGN;
  const symbol = account === 'GBP' ? '£' : '₦';
  const wouldOverdraw = type === 'expense' && amount && parseFloat(amount) > currentBalance;

  const selectedSource = INCOME_SOURCES.find(s => s.id === incomeSource);

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    if (type === 'expense' && !category) return;
    if (type === 'income' && !incomeSource) return;
    setLoading(true);
    try {
      const isBorrowed = incomeSource === 'borrowed';
      const result = await addTransaction({
        type: 'income' === type ? 'income' : 'expense',
        account,
        amount: parseFloat(amount),
        category: type === 'income' ? (selectedSource?.label || incomeSource) : category,
        incomeSource: type === 'income' ? incomeSource : undefined,
        subItem,
        description: description || subItem || (type === 'income' ? selectedSource?.label : category) || '',
        notes, date: new Date(date), recurring,
        isBorrowed,
      });
      if (result !== false) onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose();
    else y.set(0);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ opacity: bgOpacity }} onClick={onClose} />
            <motion.div className="sheet-panel" style={{ y }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 0.8 }}
              drag="y" dragConstraints={{ top: 0 }} dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={handleDragEnd}
            >
              {/* Handle */}
              <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', cursor: 'grab' }} />
              </div>

              <div style={{ padding: '12px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    Add Transaction
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { onClose(); setTimeout(() => setShowTransfer(true), 100); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--accent-primary)', background: 'var(--accent-primary-dim)', border: '1px solid var(--accent-primary)', borderRadius: '8px', padding: '5px 10px' }}>
                      <ArrowLeftRight size={12} /> Transfer
                    </button>
                    <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                      <ChevronDown size={18} />
                    </button>
                  </div>
                </div>

                {/* Type toggle */}
                <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', marginBottom: '14px' }}>
                  {['expense', 'income'].map(t => (
                    <button key={t} onClick={() => setType(t)} style={{
                      flex: 1, padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                      fontFamily: 'var(--font-display)',
                      background: type === t ? (t === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)') : 'transparent',
                      color: type === t ? '#fff' : 'var(--text-secondary)',
                    }}>
                      {t === 'expense' ? '↓ Spending' : '↑ Income'}
                    </button>
                  ))}
                </div>

                {/* Account selector */}
                <FieldLabel>From Account</FieldLabel>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  {['GBP', 'NGN'].map(acct => (
                    <button key={acct} onClick={() => setAccount(acct)} style={{
                      flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                      border: `1px solid ${account === acct ? (acct === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)') : 'var(--border)'}`,
                      background: account === acct ? (acct === 'NGN' ? 'var(--accent-naira-dim)' : 'var(--accent-primary-dim)') : 'var(--bg-elevated)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    }}>
                      <span style={{ fontSize: '16px' }}>{acct === 'GBP' ? '🇬🇧' : '🇳🇬'}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '700', color: account === acct ? (acct === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)') : 'var(--text-secondary)' }}>
                        {acct}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Bal: {acct === 'GBP' ? `£${balanceGBP.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `₦${balanceNGN.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div style={{
                  background: wouldOverdraw ? 'var(--accent-red-dim)' : 'var(--bg-elevated)',
                  border: `1px solid ${wouldOverdraw ? 'var(--accent-red)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: wouldOverdraw ? '4px' : '14px',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: wouldOverdraw ? 'var(--accent-red)' : 'var(--text-muted)' }}>{symbol}</span>
                  <input type="number" inputMode="decimal" placeholder="0.00"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800', color: wouldOverdraw ? 'var(--accent-red)' : 'var(--text-primary)' }}
                  />
                  {amount && exchangeRate && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {account === 'NGN' ? `≈ £${(parseFloat(amount) / exchangeRate).toFixed(0)}` : `≈ ₦${Math.round(parseFloat(amount) * exchangeRate).toLocaleString()}`}
                    </span>
                  )}
                </div>

                {/* Overdraft warning */}
                {wouldOverdraw && (
                  <p style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: '700', marginBottom: '12px', paddingLeft: '2px' }}>
                    🚫 Exceeds {account} balance ({symbol}{currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </p>
                )}

                {/* ── EXPENSE: category ── */}
                {type === 'expense' && (
                  <>
                    <FieldLabel>Category</FieldLabel>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {ALL_CATEGORIES.map(cat => {
                        const meta = BUDGET_CATEGORIES[cat];
                        const active = category === cat;
                        return (
                          <button key={cat} onClick={() => setCategory(cat)} style={{
                            padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
                            fontWeight: active ? '700' : '400',
                            border: `1px solid ${active ? meta.color : 'var(--border)'}`,
                            background: active ? `${meta.color}18` : 'var(--bg-elevated)',
                            color: active ? meta.color : 'var(--text-secondary)',
                          }}>
                            {meta.icon} {cat}
                          </button>
                        );
                      })}
                    </div>
                    {/* Sub-items */}
                    {subItemOptions.length > 0 && (
                      <>
                        <FieldLabel>Specific item (optional)</FieldLabel>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {subItemOptions.map(item => (
                            <button key={item} onClick={() => setSubItem(subItem === item ? '' : item)} style={{
                              padding: '5px 10px', borderRadius: '6px', fontSize: '12px',
                              border: `1px solid ${subItem === item ? catMeta?.color : 'var(--border)'}`,
                              background: subItem === item ? `${catMeta?.color}15` : 'var(--bg-elevated)',
                              color: subItem === item ? catMeta?.color : 'var(--text-secondary)',
                            }}>
                              {item}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* ── INCOME: source ── */}
                {type === 'income' && (
                  <>
                    <FieldLabel>Income Source</FieldLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      {INCOME_SOURCES.map(src => {
                        const active = incomeSource === src.id;
                        return (
                          <button key={src.id} onClick={() => setIncomeSource(src.id)} style={{
                            padding: '10px 6px', borderRadius: 'var(--radius-md)',
                            border: `1px solid ${active ? src.color : 'var(--border)'}`,
                            background: active ? `${src.color}18` : 'var(--bg-elevated)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                          }}>
                            <span style={{ fontSize: '20px' }}>{src.icon}</span>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: active ? src.color : 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>
                              {src.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {incomeSource === 'borrowed' && (
                      <div style={{ background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: '12px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: '600' }}>
                          🤝 This will be tracked as borrowed money. You'll be able to mark it as repaid later in the Transactions page.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Description */}
                <input type="text" placeholder={type === 'income' ? "Who from / what for" : "Description (optional)"}
                  value={description} onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '10px' }}
                />

                {/* Date */}
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', colorScheme: 'light dark', marginBottom: '10px' }}
                />

                {/* Options row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: showNotes ? '10px' : '14px' }}>
                  <button onClick={() => setRecurring(r => !r)} style={{
                    flex: 1, padding: '9px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600', fontFamily: 'var(--font-display)',
                    border: `1px solid ${recurring ? 'var(--accent-primary)' : 'var(--border)'}`,
                    background: recurring ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)',
                    color: recurring ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  }}>
                    <RefreshCw size={12} /> Recurring
                  </button>
                  <button onClick={() => setShowNotes(s => !s)} style={{
                    flex: 1, padding: '9px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600', fontFamily: 'var(--font-display)',
                    border: `1px solid ${showNotes ? 'var(--accent-amber)' : 'var(--border)'}`,
                    background: showNotes ? 'var(--accent-amber-dim)' : 'var(--bg-elevated)',
                    color: showNotes ? 'var(--accent-amber)' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  }}>
                    <StickyNote size={12} /> Note
                  </button>
                </div>

                <AnimatePresence>
                  {showNotes && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', marginBottom: '12px' }}>
                      <textarea placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                        style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'none', lineHeight: 1.5 }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button onClick={handleSubmit}
                  disabled={!amount || loading || wouldOverdraw || (type === 'income' && !incomeSource) || (type === 'expense' && !category)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', padding: '15px', borderRadius: 'var(--radius-md)',
                    background: (wouldOverdraw || !amount || loading || (type === 'income' && !incomeSource) || (type === 'expense' && !category))
                      ? 'var(--bg-elevated)'
                      : type === 'expense'
                        ? account === 'NGN' ? 'linear-gradient(135deg, var(--accent-naira), #16a34a)' : 'linear-gradient(135deg, var(--accent-red), #ff4444)'
                        : 'linear-gradient(135deg, var(--accent-green), #22c55e)',
                    color: (wouldOverdraw || !amount || (type === 'income' && !incomeSource) || (type === 'expense' && !category)) ? 'var(--text-muted)' : '#fff',
                    fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}>
                  <Check size={16} />
                  {loading ? 'Saving…' : wouldOverdraw ? 'Insufficient balance' : `Save ${account} ${type === 'expense' ? 'Expense' : 'Income'}`}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <TransferSheet open={showTransfer} onClose={() => setShowTransfer(false)} />
    </>
  );
}

function FieldLabel({ children }) {
  return <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{children}</p>;
}
