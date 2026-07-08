// src/components/transactions/AddTransactionSheet.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, RefreshCw, StickyNote, ChevronDown, ArrowLeftRight } from 'lucide-react';
import { useFinance, INCOME_SOURCES } from '../../context/FinanceContext';
import { useCurrency } from '../../context/CurrencyContext';
import TransferSheet from '../transfer/TransferSheet';

export default function AddTransactionSheet({ open, onClose, prefill }) {
  const {
    addTransaction, BUDGET_CATEGORIES, ALL_CATEGORIES,
    balanceGBP, balanceNGN, budgets,
    totalIncomeGBP, totalIncomeNGN, salarySettings,
  } = useFinance();
  const { exchangeRate } = useCurrency();

  const [type, setType] = useState('expense');
  const [account, setAccount] = useState('GBP');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState(false);
  const [incomeSource, setIncomeSource] = useState('');
  const [subItem, setSubItem] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const sheetRef = useRef(null);
  const scrollAreaRef = useRef(null);
  // Only for the drag handle
  const handleDragStart = useRef(null);

  useEffect(() => {
    if (open) {
      if (prefill) {
        setType('expense');
        setCategory(prefill.category || (ALL_CATEGORIES[0] || ''));
        setAccount(prefill.account || 'GBP');
        setAmount(prefill.amount ? String(prefill.amount) : '');
        setSubItem(prefill.subItem || '');
        setDescription(prefill.description || '');
      } else {
        setType('expense');
        setCategory(ALL_CATEGORIES[0] || '');
        setAccount('GBP');
        setAmount('');
        setDescription('');
        setSubItem('');
      }
      setCustomCategory(false);
      setIncomeSource('');
      setNotes('');
      setRecurring(false);
      setShowNotes(false);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [open, prefill]);

  useEffect(() => {
    if (category && BUDGET_CATEGORIES[category] && !prefill?.account) {
      setAccount(BUDGET_CATEGORIES[category].defaultCurrency || 'GBP');
    }
    if (!prefill?.subItem) setSubItem('');
  }, [category]);

  useEffect(() => {
    if (type === 'expense' && !category && !customCategory) setCategory(ALL_CATEGORIES[0] || '');
    if (type === 'income') { setCategory(''); setIncomeSource(''); setCustomCategory(false); }
  }, [type]);

  // ── Drag handle ONLY ────────────────────────────────────────────────────
  // Touch events ONLY on the handle bar — never on the content area
  // This completely avoids interfering with button taps on mobile
  const onHandleTouchStart = (e) => {
    handleDragStart.current = e.touches[0].clientY;
  };
  const onHandleTouchMove = (e) => {
    if (handleDragStart.current === null) return;
    const delta = e.touches[0].clientY - handleDragStart.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${Math.max(0, delta)}px)`;
    }
  };
  const onHandleTouchEnd = (e) => {
    if (handleDragStart.current === null) return;
    const delta = e.changedTouches[0].clientY - handleDragStart.current;
    if (sheetRef.current) sheetRef.current.style.transform = '';
    if (delta > 80) onClose();
    handleDragStart.current = null;
  };

  const catMeta = BUDGET_CATEGORIES[category];
  const storedSubItems = category ? (budgets[category]?.subItems || []) : [];
  const subItemOptions = storedSubItems.length > 0
    ? storedSubItems.map(si => si.name)
    : (catMeta?.suggestions || []);

  const symbol = account === 'GBP' ? '£' : '₦';
  const selectedSource = INCOME_SOURCES.find(s => s.id === incomeSource);

  const isReady = !!amount && !isNaN(Number(amount)) && Number(amount) > 0
    && !loading
    && (type === 'expense' ? (!!category || customCategory) : !!incomeSource);

  const handleSubmit = async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      await addTransaction({
        type: type === 'income' ? 'income' : 'expense',
        account,
        amount: parseFloat(amount),
        category: type === 'income'
          ? (selectedSource?.label || incomeSource)
          : (customCategory ? 'Other' : category),
        incomeSource: type === 'income' ? incomeSource : null,
        subItem: subItem || null,
        description: description || subItem || (type === 'income' ? selectedSource?.label : (customCategory ? 'Other' : category)) || '',
        notes: notes || null,
        date: new Date(date),
        recurring,
        isBorrowed: incomeSource === 'borrowed',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="sheet-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              ref={sheetRef}
              className="sheet-panel"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 0.8 }}
            >
              {/* ── Drag handle — ONLY touch area for dismiss ── */}
              <div
                style={{
                  flexShrink: 0, padding: '12px 16px 4px',
                  display: 'flex', justifyContent: 'center',
                  cursor: 'grab', userSelect: 'none',
                  touchAction: 'none', // disable browser scroll here so drag works
                }}
                onTouchStart={onHandleTouchStart}
                onTouchMove={onHandleTouchMove}
                onTouchEnd={onHandleTouchEnd}
              >
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              </div>

              {/* ── Content — NO touch handlers here, buttons work normally ── */}
              <div
                ref={scrollAreaRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  padding: '4px 16px 0',
                  // touchAction: pan-y here allows normal scrolling without intercepting taps
                  touchAction: 'pan-y',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {prefill ? 'Quick Pay' : 'Add Transaction'}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { onClose(); setTimeout(() => setShowTransfer(true), 100); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', background: 'var(--accent-primary-dim)', border: '1px solid var(--accent-primary)', borderRadius: '8px', padding: '5px 9px', touchAction: 'manipulation' }}>
                      <ArrowLeftRight size={11} /> Transfer
                    </button>
                    <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', touchAction: 'manipulation' }}>
                      <ChevronDown size={20} />
                    </button>
                  </div>
                </div>

                {/* Type toggle */}
                {!prefill && (
                  <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', marginBottom: '14px' }}>
                    {['expense', 'income'].map(t => (
                      <button key={t} onClick={() => setType(t)} style={{
                        flex: 1, padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                        fontFamily: 'var(--font-display)', touchAction: 'manipulation',
                        background: type === t ? (t === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)') : 'transparent',
                        color: type === t ? '#fff' : 'var(--text-secondary)',
                      }}>
                        {t === 'expense' ? '↑ Spending' : '↓ Income'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Account */}
                <FL>Account</FL>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  {['GBP', 'NGN'].map(acct => (
                    <button key={acct} onClick={() => setAccount(acct)} style={{
                      flex: 1, padding: '9px 8px', borderRadius: 'var(--radius-md)', touchAction: 'manipulation',
                      border: `1px solid ${account === acct ? (acct === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)') : 'var(--border)'}`,
                      background: account === acct ? (acct === 'NGN' ? 'var(--accent-naira-dim)' : 'var(--accent-primary-dim)') : 'var(--bg-elevated)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    }}>
                      <span style={{ fontSize: '15px' }}>{acct === 'GBP' ? '🇬🇧' : '🇳🇬'}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: '700', color: account === acct ? (acct === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)') : 'var(--text-secondary)' }}>{acct}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {acct === 'GBP' ? `£${Math.max(0, balanceGBP).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `₦${Math.max(0, balanceNGN).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: 'var(--text-muted)' }}>{symbol}</span>
                  <input type="number" inputMode="decimal" placeholder="0.00"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}
                  />
                  {amount && exchangeRate > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {account === 'NGN' ? `≈ £${(parseFloat(amount) / exchangeRate).toFixed(0)}` : `≈ ₦${Math.round(parseFloat(amount) * exchangeRate).toLocaleString()}`}
                    </span>
                  )}
                </div>

                {/* EXPENSE */}
                {type === 'expense' && (
                  <>
                    <FL>Category</FL>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {ALL_CATEGORIES.map(cat => {
                        const meta = BUDGET_CATEGORIES[cat];
                        const active = !customCategory && category === cat;
                        return (
                          <button key={cat} onClick={() => { setCategory(cat); setCustomCategory(false); }} style={{
                            padding: '6px 10px', borderRadius: '8px', fontSize: '12px', touchAction: 'manipulation',
                            fontWeight: active ? '700' : '400',
                            border: `1px solid ${active ? meta.color : 'var(--border)'}`,
                            background: active ? `${meta.color}18` : 'var(--bg-elevated)',
                            color: active ? meta.color : 'var(--text-secondary)',
                          }}>
                            {meta.icon} {cat}
                          </button>
                        );
                      })}
                      <button onClick={() => { setCustomCategory(true); setCategory(''); setSubItem(''); }} style={{
                        padding: '6px 10px', borderRadius: '8px', fontSize: '12px', touchAction: 'manipulation',
                        fontWeight: customCategory ? '700' : '400',
                        border: `1px solid ${customCategory ? 'var(--text-secondary)' : 'var(--border)'}`,
                        background: 'var(--bg-elevated)',
                        color: customCategory ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}>
                        ➕ Other
                      </button>
                    </div>
                    {!customCategory && subItemOptions.length > 0 && (
                      <>
                        <FL>Specific item (optional)</FL>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {subItemOptions.map(item => (
                            <button key={item} onClick={() => setSubItem(subItem === item ? '' : item)} style={{
                              padding: '5px 10px', borderRadius: '6px', fontSize: '12px', touchAction: 'manipulation',
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

                {/* INCOME */}
                {type === 'income' && (
                  <>
                    <FL>Income Source</FL>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      {INCOME_SOURCES.map(src => {
                        const active = incomeSource === src.id;
                        return (
                          <button key={src.id} onClick={() => setIncomeSource(src.id)} style={{
                            padding: '10px 6px', borderRadius: 'var(--radius-md)', touchAction: 'manipulation',
                            border: `1px solid ${active ? src.color : 'var(--border)'}`,
                            background: active ? `${src.color}18` : 'var(--bg-elevated)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                          }}>
                            <span style={{ fontSize: '20px' }}>{src.icon}</span>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: active ? src.color : 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>{src.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {incomeSource === 'borrowed' && (
                      <div style={{ background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: '12px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: '600' }}>🤝 Tracked as borrowed. Mark as repaid later in Transactions.</p>
                      </div>
                    )}
                  </>
                )}

                <input type="text"
                  placeholder={type === 'income' ? 'Who from / what for' : customCategory ? 'What did you spend on?' : 'Description (optional)'}
                  value={description} onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: `1px solid ${customCategory && !description ? 'var(--accent-amber)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '10px' }}
                />

                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', colorScheme: 'light dark', marginBottom: '10px' }}
                />

                <div style={{ display: 'flex', gap: '8px', marginBottom: showNotes ? '10px' : '14px' }}>
                  <button onClick={() => setRecurring(r => !r)} style={{
                    flex: 1, padding: '9px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600',
                    fontFamily: 'var(--font-display)', touchAction: 'manipulation',
                    border: `1px solid ${recurring ? 'var(--accent-primary)' : 'var(--border)'}`,
                    background: recurring ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)',
                    color: recurring ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  }}>
                    <RefreshCw size={12} /> Recurring
                  </button>
                  <button onClick={() => setShowNotes(s => !s)} style={{
                    flex: 1, padding: '9px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600',
                    fontFamily: 'var(--font-display)', touchAction: 'manipulation',
                    border: `1px solid ${showNotes ? 'var(--accent-amber)' : 'var(--border)'}`,
                    background: showNotes ? 'var(--accent-amber-dim)' : 'var(--bg-elevated)',
                    color: showNotes ? 'var(--accent-amber)' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  }}>
                    <StickyNote size={12} /> Note
                  </button>
                </div>

                {showNotes && (
                  <textarea placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'none', lineHeight: 1.5, marginBottom: '12px' }}
                  />
                )}

                {/* Save — plain button, touchAction manipulation, no motion wrapper */}
                <button
                  onClick={handleSubmit}
                  disabled={!isReady}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '8px',
                    background: !isReady
                      ? 'var(--bg-elevated)'
                      : type === 'expense'
                        ? account === 'NGN' ? 'linear-gradient(135deg, var(--accent-naira), #16a34a)' : 'linear-gradient(135deg, #e53e3e, var(--accent-red))'
                        : 'linear-gradient(135deg, #22c55e, var(--accent-green))',
                    color: !isReady ? 'var(--text-muted)' : '#fff',
                    fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    cursor: isReady ? 'pointer' : 'not-allowed',
                    border: 'none', WebkitAppearance: 'none',
                    touchAction: 'manipulation',
                    // Ensure nothing above intercepts this tap
                    position: 'relative', zIndex: 1,
                  }}
                >
                  <Check size={16} />
                  {loading ? 'Saving…' : `Save ${account} ${type === 'expense' ? 'Expense' : 'Income'}`}
                </button>
                <div style={{ height: 'max(20px, env(safe-area-inset-bottom))' }} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <TransferSheet open={showTransfer} onClose={() => setShowTransfer(false)} />
    </>
  );
}

function FL({ children }) {
  return <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{children}</p>;
}
