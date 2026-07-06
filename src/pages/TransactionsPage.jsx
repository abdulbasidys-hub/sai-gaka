// src/pages/TransactionsPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { fmtGBP, fmtNGN } from '../context/CurrencyContext';
import { format } from 'date-fns';
import { Trash2, Plus, SlidersHorizontal, RefreshCw, StickyNote, ArrowLeftRight } from 'lucide-react';
import AddTransactionSheet from '../components/transactions/AddTransactionSheet';
import TransferSheet from '../components/transfer/TransferSheet';

export default function TransactionsPage() {
  const {
    transactions, deleteTransaction,
    totalSpentGBP, totalSpentNGN, totalIncomeGBP,
    borrowedItems, markBorrowedRepaid,
    BUDGET_CATEGORIES, ALL_CATEGORIES,
  } = useFinance();

  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  const filtered = transactions.filter(t => {
    if (filterCat !== 'All' && t.category !== filterCat) return false;
    if (filterType === 'expense' && t.type !== 'expense') return false;
    if (filterType === 'income' && t.type !== 'income') return false;
    if (filterAccount !== 'all' && t.account !== filterAccount) return false;
    return true;
  });

  const grouped = filtered.reduce((acc, tx) => {
    const key = tx.date ? format(tx.date, 'yyyy-MM-dd') : 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const recurringCount = transactions.filter(t => t.recurring).length;
  const unpaidBorrowed = (borrowedItems || []).filter(b => !b.repaid);

  return (
    <>
      <div style={{ padding: '16px' }}>

        {/* Totals strip */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>£ Out</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', color: 'var(--accent-red)' }}>{fmtGBP(totalSpentGBP)}</p>
          </div>
          <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>£ In</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', color: 'var(--accent-green)' }}>{fmtGBP(totalIncomeGBP)}</p>
          </div>
          {totalSpentNGN > 0 && (
            <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--accent-naira)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <p style={{ fontSize: '10px', color: 'var(--accent-naira)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>₦ Out</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', color: 'var(--accent-naira)' }}>{fmtNGN(totalSpentNGN, true)}</p>
            </div>
          )}
        </div>

        {/* Borrowed banner */}
        {unpaidBorrowed.length > 0 && (
          <div style={{ background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '12px' }}>
            <p style={{ padding: '9px 14px 6px', fontSize: '11px', fontWeight: '700', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              🤝 Borrowed Money ({unpaidBorrowed.length})
            </p>
            {unpaidBorrowed.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', gap: '10px', borderTop: '1px solid rgba(220,38,38,0.2)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{b.description}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.account}</p>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '800', color: 'var(--accent-red)' }}>
                  {b.account === 'NGN' ? fmtNGN(b.amount) : fmtGBP(b.amount)}
                </span>
                <button onClick={() => markBorrowedRepaid(b.id)} style={{ background: 'var(--accent-green)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                  Repaid ✓
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recurring banner */}
        {recurringCount > 0 && (
          <div style={{ background: 'var(--accent-primary-dim)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <RefreshCw size={13} color="var(--accent-primary)" />
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-primary)' }}>{recurringCount} recurring transaction{recurringCount > 1 ? 's' : ''} this month</p>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['all', 'expense', 'income'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0, border: `1px solid ${filterType === t ? 'var(--accent-primary)' : 'var(--border)'}`, background: filterType === t ? 'var(--accent-primary-dim)' : 'var(--bg-card)', color: filterType === t ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
              {t === 'all' ? 'All' : t === 'expense' ? '↓ Out' : '↑ In'}
            </button>
          ))}
          {['all', 'GBP', 'NGN'].map(a => (
            <button key={a} onClick={() => setFilterAccount(a)} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0, border: `1px solid ${filterAccount === a ? (a === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)') : 'var(--border)'}`, background: filterAccount === a ? (a === 'NGN' ? 'var(--accent-naira-dim)' : 'var(--accent-primary-dim)') : 'var(--bg-card)', color: filterAccount === a ? (a === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)') : 'var(--text-secondary)' }}>
              {a === 'all' ? '£ + ₦' : a === 'GBP' ? '🇬🇧 GBP' : '🇳🇬 NGN'}
            </button>
          ))}
          <button onClick={() => setShowFilter(f => !f)} style={{ padding: '6px 10px', borderRadius: '20px', flexShrink: 0, border: `1px solid ${showFilter ? 'var(--accent-primary)' : 'var(--border)'}`, background: showFilter ? 'var(--accent-primary-dim)' : 'var(--bg-card)', color: showFilter ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
            <SlidersHorizontal size={12} />
          </button>
        </div>

        {/* Category filter */}
        <AnimatePresence>
          {showFilter && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['All', ...ALL_CATEGORIES].map(cat => {
                  const meta = cat !== 'All' ? BUDGET_CATEGORIES[cat] : null;
                  return (
                    <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: filterCat === cat ? '700' : '400', border: `1px solid ${filterCat === cat ? (meta?.color || 'var(--accent-primary)') : 'var(--border)'}`, background: filterCat === cat ? `${meta?.color || 'var(--accent-primary)'}15` : 'var(--bg-elevated)', color: filterCat === cat ? (meta?.color || 'var(--accent-primary)') : 'var(--text-secondary)' }}>
                      {meta ? `${meta.icon} ${cat}` : cat}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction list */}
        {filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Nothing here</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{transactions.length === 0 ? 'Tap + to log your first transaction' : 'Try adjusting your filters'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {sortedDates.map(dateKey => (
              <div key={dateKey}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px', paddingLeft: '2px' }}>
                  {format(new Date(dateKey), 'EEE, d MMM')}
                </p>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  {grouped[dateKey].map((tx, i) => (
                    <TxRow key={tx.id} tx={tx} onDelete={() => deleteTransaction(tx.id)} last={i === grouped[dateKey].length - 1} budgetCategories={BUDGET_CATEGORIES} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer FAB */}
      <motion.button onClick={() => setShowTransfer(true)} whileTap={{ scale: 0.9 }}
        style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 16px)', right: '82px', width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, color: 'var(--accent-primary)' }}>
        <ArrowLeftRight size={18} />
      </motion.button>

      {/* Add FAB */}
      <motion.button onClick={() => setShowAdd(true)} whileTap={{ scale: 0.9 }}
        style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 16px)', right: '20px', width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #9c6aff)', boxShadow: '0 4px 20px var(--accent-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, border: 'none' }}>
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </motion.button>

      <AddTransactionSheet open={showAdd} onClose={() => setShowAdd(false)} />
      <TransferSheet open={showTransfer} onClose={() => setShowTransfer(false)} />
    </>
  );
}

function TxRow({ tx, onDelete, last, budgetCategories }) {
  const catMeta = budgetCategories[tx.category] || { color: '#7c6aff', icon: '💳' };
  const isExpense = tx.type === 'expense';
  const isNGN = tx.account === 'NGN';
  const isTransfer = tx.type === 'transfer_in' || tx.type === 'transfer_out';
  const [showDelete, setShowDelete] = useState(false);
  const [showNote, setShowNote] = useState(false);

  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', gap: '10px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '10px', background: isTransfer ? 'var(--accent-primary-dim)' : `${catMeta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
          {isTransfer ? '⇄' : catMeta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tx.description || tx.category}
            </p>
            {tx.recurring && <RefreshCw size={11} color="var(--accent-primary)" style={{ flexShrink: 0 }} />}
            {tx.isBorrowed && <span style={{ fontSize: '10px', color: 'var(--accent-red)', background: 'var(--accent-red-dim)', borderRadius: '4px', padding: '1px 5px', fontWeight: '700', flexShrink: 0 }}>Borrowed</span>}
            {tx.notes && <button onClick={() => setShowNote(s => !s)} style={{ display: 'flex', flexShrink: 0 }}><StickyNote size={11} color="var(--accent-amber)" /></button>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
            {isNGN && <span style={{ fontSize: '10px', background: 'var(--accent-naira-dim)', color: 'var(--accent-naira)', borderRadius: '4px', padding: '1px 5px', fontWeight: '700' }}>₦</span>}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isTransfer ? `${tx.account} account` : `${tx.subItem ? tx.subItem + ' · ' : ''}${tx.category}`}</span>
          </div>
          <AnimatePresence>
            {showNote && tx.notes && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ fontSize: '12px', color: 'var(--accent-amber)', marginTop: '3px', fontStyle: 'italic', lineHeight: 1.4 }}>
                "{tx.notes}"
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: isTransfer ? 'var(--accent-primary)' : isExpense ? (isNGN ? 'var(--accent-naira)' : 'var(--accent-red)') : 'var(--accent-green)' }}>
            {tx.type === 'transfer_out' ? '-' : tx.type === 'transfer_in' ? '+' : isExpense ? '-' : '+'}
            {isNGN ? fmtNGN(tx.amount) : fmtGBP(tx.amount)}
          </span>
          {!showDelete ? (
              <button onClick={() => setShowDelete(true)} style={{ color: 'var(--text-muted)', opacity: 0.5, display: 'flex' }}><Trash2 size={14} /></button>
            ) : (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={onDelete} style={{ background: 'var(--accent-red)', color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '700' }}>Del</button>
                <button onClick={() => setShowDelete(false)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 6px', fontSize: '11px', color: 'var(--text-secondary)' }}>✕</button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
