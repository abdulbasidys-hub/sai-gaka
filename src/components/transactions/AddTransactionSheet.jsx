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
  const [customCategory, setCustomCategory] = useState(false); // true = "Other", no category required
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
  const dragStartY = useRef(null);
  const isDraggingFromHandle = useRef(false);

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
      setIncomeSource(''); setNotes(''); setRecurring(false); setShowNotes(false);
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

  // ── Drag to dismiss — handle area only ─────────────────────────────────
  const applyDrag = (delta) => {
    if (sheetRef.current && delta > 0) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  };
  const resetDrag = () => {
    if (sheetRef.current) sheetRef.current.style.transform = '';
  };

  const handleHandleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    isDraggingFromHandle.current = true;
  };
  const handleHandleTouchMove = (e) => {
    if (!isDraggingFromHandle.current) return;
    applyDrag(e.touches[0].clientY - dragStartY.current);
  };
  const handleHandleTouchEnd = (e) => {
    if (!isDraggingFromHandle.current) return;
    const delta = e.changedTouches[0].clientY - dragStartY.current;
    resetDrag();
    if (delta > 80) onClose();
    dragStartY.current = null;
    isDraggingFromHandle.current = false;
  };

  // Scroll area: dismiss only when scrolled to very top and swiping down
  const scrollDragStartY = useRef(null);
  const handleScrollTouchStart = (e) => {
    const el = scrollAreaRef.current;
    if (el && el.scrollTop <= 0) {
      scrollDragStartY.current = e.touches[0].clientY;
    } else {
      scrollDragStartY.current = null;
    }
  };
  const handleScrollTouchMove = (e) => {
    if (scrollDragStartY.current === null) return;
    const el = scrollAreaRef.current;
    if (!el || el.scrollTop > 2) { scrollDragStartY.current = null; return; }
    const delta = e.touches[0].clientY - scrollDragStartY.current;
    if (delta > 10) applyDrag(delta);
    // NOTE: no preventDefault() here — that was blocking button taps
  };
  const handleScrollTouchEnd = (e) => {
    if (scrollDragStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - scrollDragStartY.current;
    resetDrag();
    if (delta > 80) onClose();
    scrollDragStartY.current = null;
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
        incomeSource: type === 'income' ? incomeSource : undefined,
        subItem,
        description: description || subItem || (type === 'income' ? selectedSource?.label : (customCategory ? 'Other' : category)) || '',
        notes, date: new Date(date), recurring,
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
            {/* No inline transition style — let Framer Motion handle it cleanly */}
            <motion.div
              ref={sheetRef}
              className="sheet-panel"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 0.8 }}
            >
              {/* Handle — only touch events here trigger dismiss */}
              <div
                className="sheet-handle-area"
                onTouchStart={handleHandleTouchStart}
                onTouchMove={handleHandleTouchMove}
                onTouchEnd={handleHandleTouchEnd}
              >
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              </div>

              {/* Scroll content */}
              <div
                className="sheet-scroll-area"
                ref={scrollAreaRef}
                onTouchStart={handleScrollTouchStart}
                onTouchMove={handleScrollTouchMove}
                onTouchEnd={handleScrollTouchEnd}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {prefill ? 'Quick Pay' : 'Add Transaction'}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { onClose(); setTimeout(() => setShowTransfer(true), 100); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', background: 'var(--accent-primary-dim)', border: '1px solid var(--accent-primary)', borderRadius: '8px', padding: '5px 9px' }}>
                      <ArrowLeftRight size={11} /> Transfer
                    </button>
                    <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                      <ChevronDown size={20} />
                    </button>
                  </div>
                </div>

                {/* Type toggle */}
                {!prefill && (
                  <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', marginBottom: '14px' }}>
                    {['expense', 'income'].map(t => (
                      <button key={t} onClick={() => setType(t)} style={{
                        flex: 1, padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)',
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
                      flex: 1, padding: '9px 8px', borderRadius: 'var(--radius-md)',
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
                <div style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px',
                }}>
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

                {/* EXPENSE: categories */}
                {type === 'expense' && (
                  <>
                    <FL>Category</FL>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {ALL_CATEGORIES.map(cat => {
                        const meta = BUDGET_CATEGORIES[cat];
                        const active = !customCategory && category === cat;
                        return (
                          <button key={cat} onClick={() => { setCategory(cat); setCustomCategory(false); }} style={{
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
                      {/* Other — clears category requirement */}
                      <button onClick={() => { setCustomCategory(true); setCategory(''); setSubItem(''); }} style={{
                        padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
                        fontWeight: customCategory ? '700' : '400',
                        border: `1px solid ${customCategory ? 'var(--text-secondary)' : 'var(--border)'}`,
                        background: customCategory ? 'var(--bg-elevated)' : 'var(--bg-elevated)',
                        color: customCategory ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}>
                        ➕ Other
                      </button>
                    </div>

                    {/* Sub-items — only shown when a real category is selected */}
                    {!customCategory && subItemOptions.length > 0 && (
                      <>
                        <FL>Specific item (optional)</FL>
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

                {/* INCOME: source */}
                {type === 'income' && (
                  <>
                    <FL>Income Source</FL>
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

                {/* Description */}
                <input type="text"
                  placeholder={type === 'income' ? 'Who from / what for' : customCategory ? 'What did you spend on? (required)' : 'Description (optional)'}
                  value={description} onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: `1px solid ${customCategory && !description ? 'var(--accent-amber)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '10px' }}
                />

                {/* Date */}
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', colorScheme: 'light dark', marginBottom: '10px' }}
                />

                {/* Recurring + Note */}
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

                {showNotes && (
                  <textarea placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'none', lineHeight: 1.5, marginBottom: '12px' }}
                  />
                )}

                {/* Save button — plain HTML button, no motion wrapper that could eat taps */}
                <button
                  onClick={handleSubmit}
                  disabled={!isReady}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '8px',
                    background: !isReady
                      ? 'var(--bg-elevated)'
                      : type === 'expense'
                        ? account === 'NGN' ? 'linear-gradient(135deg, var(--accent-naira), #16a34a)' : 'linear-gradient(135deg, var(--accent-red), #e53e3e)'
                        : 'linear-gradient(135deg, var(--accent-green), #22c55e)',
                    color: !isReady ? 'var(--text-muted)' : '#fff',
                    fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    cursor: isReady ? 'pointer' : 'not-allowed', border: 'none',
                    WebkitAppearance: 'none',
                    touchAction: 'manipulation', // prevents double-tap zoom delay
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
