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
  const [incomeSource, setIncomeSource] = useState('');
  const [subItem, setSubItem] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(null);
  const sheetRef = useRef(null);

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
    if (type === 'expense' && !category) setCategory(ALL_CATEGORIES[0] || '');
    if (type === 'income') { setCategory(''); setIncomeSource(''); }
  }, [type]);

  // Handle drag-to-close ONLY from the handle area
  const handleHandleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    setDragging(true);
  };
  const handleHandleTouchMove = (e) => {
    if (!dragging || dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
      sheetRef.current.style.transition = 'none';
    }
  };
  const handleHandleTouchEnd = (e) => {
    if (!dragging) return;
    const delta = e.changedTouches[0].clientY - (dragStartY.current || 0);
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
      sheetRef.current.style.transition = '';
    }
    if (delta > 100) onClose();
    dragStartY.current = null;
    setDragging(false);
  };

  const catMeta = BUDGET_CATEGORIES[category];
  const storedSubItems = category ? (budgets[category]?.subItems || []) : [];
  const subItemOptions = storedSubItems.length > 0
    ? storedSubItems.map(si => si.name)
    : (catMeta?.suggestions || []);

  const currentBalance = account === 'GBP' ? balanceGBP : balanceNGN;
  const symbol = account === 'GBP' ? '£' : '₦';
  const hasIncome = account === 'GBP'
    ? (totalIncomeGBP > 0 || (salarySettings?.amountGBP || 0) > 0)
    : (totalIncomeNGN > 0 || (salarySettings?.amountNGN || 0) > 0);
  const wouldOverdraw = type === 'expense' && !!amount && parseFloat(amount) > currentBalance && hasIncome;
  const warnNoIncome = type === 'expense' && !!amount && parseFloat(amount) > currentBalance && !hasIncome;
  const selectedSource = INCOME_SOURCES.find(s => s.id === incomeSource);

  const isReady = !!amount && !isNaN(Number(amount)) && Number(amount) > 0
    && !wouldOverdraw && !loading
    && (type === 'expense' ? !!category : !!incomeSource);

  const handleSubmit = async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const result = await addTransaction({
        type: type === 'income' ? 'income' : 'expense',
        account,
        amount: parseFloat(amount),
        category: type === 'income' ? (selectedSource?.label || incomeSource) : category,
        incomeSource: type === 'income' ? incomeSource : undefined,
        subItem,
        description: description || subItem || (type === 'income' ? selectedSource?.label : category) || '',
        notes, date: new Date(date), recurring,
        isBorrowed: incomeSource === 'borrowed',
      });
      if (result !== false) onClose();
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
              style={{ willChange: 'transform', transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)' }}
            >
              {/* Drag handle — ONLY this triggers dismiss */}
              <div
                className="sheet-handle-area"
                onTouchStart={handleHandleTouchStart}
                onTouchMove={handleHandleTouchMove}
                onTouchEnd={handleHandleTouchEnd}
              >
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              </div>

              {/* Scrollable content — normal scroll, no drag dismiss */}
              <div className="sheet-scroll-area">
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
                  background: wouldOverdraw ? 'var(--accent-red-dim)' : 'var(--bg-elevated)',
                  border: `1px solid ${wouldOverdraw ? 'var(--accent-red)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: (wouldOverdraw || warnNoIncome) ? '4px' : '14px',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: wouldOverdraw ? 'var(--accent-red)' : 'var(--text-muted)' }}>{symbol}</span>
                  <input type="number" inputMode="decimal" placeholder="0.00"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800', color: wouldOverdraw ? 'var(--accent-red)' : 'var(--text-primary)' }}
                  />
                  {amount && exchangeRate > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {account === 'NGN' ? `≈ £${(parseFloat(amount) / exchangeRate).toFixed(0)}` : `≈ ₦${Math.round(parseFloat(amount) * exchangeRate).toLocaleString()}`}
                    </span>
                  )}
                </div>
                {wouldOverdraw && <p style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: '700', marginBottom: '10px' }}>🚫 Exceeds {account} balance ({symbol}{currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })})</p>}
                {warnNoIncome && <p style={{ fontSize: '12px', color: 'var(--accent-amber)', fontWeight: '600', marginBottom: '10px' }}>⚠️ Set up salary or add income first to enable balance tracking</p>}

                {/* EXPENSE */}
                {type === 'expense' && (
                  <>
                    <FL>Category</FL>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {ALL_CATEGORIES.map(cat => {
                        const meta = BUDGET_CATEGORIES[cat];
                        const active = category === cat;
                        return (
                          <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: active ? '700' : '400', border: `1px solid ${active ? meta.color : 'var(--border)'}`, background: active ? `${meta.color}18` : 'var(--bg-elevated)', color: active ? meta.color : 'var(--text-secondary)' }}>
                            {meta.icon} {cat}
                          </button>
                        );
                      })}
                    </div>
                    {subItemOptions.length > 0 && (
                      <>
                        <FL>Specific item (optional)</FL>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {subItemOptions.map(item => (
                            <button key={item} onClick={() => setSubItem(subItem === item ? '' : item)} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', border: `1px solid ${subItem === item ? catMeta?.color : 'var(--border)'}`, background: subItem === item ? `${catMeta?.color}15` : 'var(--bg-elevated)', color: subItem === item ? catMeta?.color : 'var(--text-secondary)' }}>
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
                          <button key={src.id} onClick={() => setIncomeSource(src.id)} style={{ padding: '10px 6px', borderRadius: 'var(--radius-md)', border: `1px solid ${active ? src.color : 'var(--border)'}`, background: active ? `${src.color}18` : 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
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

                <input type="text" placeholder={type === 'income' ? 'Who from / what for' : 'Description (optional)'}
                  value={description} onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '10px' }}
                />
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', colorScheme: 'light dark', marginBottom: '10px' }}
                />

                <div style={{ display: 'flex', gap: '8px', marginBottom: showNotes ? '10px' : '14px' }}>
                  <button onClick={() => setRecurring(r => !r)} style={{ flex: 1, padding: '9px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600', fontFamily: 'var(--font-display)', border: `1px solid ${recurring ? 'var(--accent-primary)' : 'var(--border)'}`, background: recurring ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)', color: recurring ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <RefreshCw size={12} /> Recurring
                  </button>
                  <button onClick={() => setShowNotes(s => !s)} style={{ flex: 1, padding: '9px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600', fontFamily: 'var(--font-display)', border: `1px solid ${showNotes ? 'var(--accent-amber)' : 'var(--border)'}`, background: showNotes ? 'var(--accent-amber-dim)' : 'var(--bg-elevated)', color: showNotes ? 'var(--accent-amber)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <StickyNote size={12} /> Note
                  </button>
                </div>

                {showNotes && (
                  <textarea placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'none', lineHeight: 1.5, marginBottom: '12px' }}
                  />
                )}

                <button onClick={handleSubmit} disabled={!isReady}
                  style={{
                    width: '100%', padding: '15px', borderRadius: 'var(--radius-md)', marginBottom: '8px',
                    background: !isReady
                      ? 'var(--bg-elevated)'
                      : type === 'expense'
                        ? account === 'NGN' ? 'linear-gradient(135deg, var(--accent-naira), #16a34a)' : 'linear-gradient(135deg, var(--accent-red), #e53e3e)'
                        : 'linear-gradient(135deg, var(--accent-green), #22c55e)',
                    color: !isReady ? 'var(--text-muted)' : '#fff',
                    fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    cursor: isReady ? 'pointer' : 'default', border: 'none',
                  }}
                >
                  <Check size={16} />
                  {loading ? 'Saving…' : wouldOverdraw ? 'Insufficient balance' : `Save ${account} ${type === 'expense' ? 'Expense' : 'Income'}`}
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
