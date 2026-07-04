// src/pages/TransactionsPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance, BUDGET_CATEGORIES, ALL_CATEGORIES } from '../context/FinanceContext';
import { format } from 'date-fns';
import { Trash2, Plus, SlidersHorizontal, X, RefreshCw, ChevronDown, StickyNote } from 'lucide-react';
import AddTransactionSheet from '../components/transactions/AddTransactionSheet';

function fmt(n) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

export default function TransactionsPage() {
  const { transactions, deleteTransaction, totalSpent, totalIncome } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [filterType, setFilterType] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  const filtered = transactions.filter(t => {
    if (filterCat !== 'All' && t.category !== filterCat) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  const grouped = filtered.reduce((acc, tx) => {
    const key = tx.date ? format(tx.date, 'yyyy-MM-dd') : 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const recurringTxs = transactions.filter(t => t.recurring && t.type === 'expense');

  return (
    <>
      <div style={{ padding: '16px' }}>

        {/* Totals strip */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Total out</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', color: 'var(--accent-red)' }}>{fmt(totalSpent)}</p>
          </div>
          <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Total in</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', color: 'var(--accent-green)' }}>{fmt(totalIncome)}</p>
          </div>
        </div>

        {/* Recurring banner */}
        {recurringTxs.length > 0 && (
          <div style={{
            background: 'var(--accent-primary-dim)', border: '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
          }}>
            <RefreshCw size={14} color="var(--accent-primary)" />
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-primary)' }}>
              {recurringTxs.length} recurring transaction{recurringTxs.length > 1 ? 's' : ''} this month
            </p>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flex: 1, gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {['all', 'expense', 'income'].map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{
                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                whiteSpace: 'nowrap', flexShrink: 0,
                border: `1px solid ${filterType === t ? 'var(--accent-primary)' : 'var(--border)'}`,
                background: filterType === t ? 'var(--accent-primary-dim)' : 'var(--bg-card)',
                color: filterType === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}>
                {t === 'all' ? 'All' : t === 'expense' ? '↓ Out' : '↑ In'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowFilter(f => !f)} style={{
            padding: '6px 10px', borderRadius: '8px', flexShrink: 0,
            border: `1px solid ${showFilter ? 'var(--accent-primary)' : 'var(--border)'}`,
            background: showFilter ? 'var(--accent-primary-dim)' : 'var(--bg-card)',
            color: showFilter ? 'var(--accent-primary)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600',
          }}>
            <SlidersHorizontal size={13} /> Filter
          </button>
        </div>

        {/* Category filter */}
        <AnimatePresence>
          {showFilter && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingBottom: '4px' }}>
                {['All', ...ALL_CATEGORIES].map(cat => {
                  const meta = cat !== 'All' ? BUDGET_CATEGORIES[cat] : null;
                  return (
                    <button key={cat} onClick={() => setFilterCat(cat)} style={{
                      padding: '5px 10px', borderRadius: '6px', fontSize: '12px',
                      fontWeight: filterCat === cat ? '600' : '400',
                      border: `1px solid ${filterCat === cat ? (meta?.color || 'var(--accent-primary)') : 'var(--border)'}`,
                      background: filterCat === cat ? `${meta?.color || 'var(--accent-primary)'}15` : 'var(--bg-elevated)',
                      color: filterCat === cat ? (meta?.color || 'var(--accent-primary)') : 'var(--text-secondary)',
                    }}>
                      {meta ? `${meta.icon} ${cat}` : cat}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>No transactions found</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {filterCat !== 'All' || filterType !== 'all' ? 'Try adjusting your filters' : 'Tap + to log your first transaction'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sortedDates.map(dateKey => (
              <div key={dateKey}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '2px' }}>
                  {format(new Date(dateKey), 'EEEE, d MMM')}
                </p>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  {grouped[dateKey].map((tx, i) => (
                    <TxRow key={tx.id} tx={tx} onDelete={() => deleteTransaction(tx.id)} last={i === grouped[dateKey].length - 1} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button onClick={() => setShowAdd(true)} whileTap={{ scale: 0.92 }}
        style={{
          position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 16px)', right: '20px',
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), #9c6aff)',
          boxShadow: '0 4px 24px var(--accent-primary-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 90, border: 'none',
        }}>
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </motion.button>

      <AddTransactionSheet open={showAdd} onClose={() => setShowAdd(false)} />
    </>
  );
}

function TxRow({ tx, onDelete, last }) {
  const catMeta = BUDGET_CATEGORIES[tx.category] || { color: '#7c6aff', icon: '💳' };
  const isExpense = tx.type === 'expense';
  const [showDelete, setShowDelete] = useState(false);
  const [showNote, setShowNote] = useState(false);

  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--border)', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: '10px' }}>
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: '10px',
          background: `${catMeta.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', flexShrink: 0,
        }}>
          {catMeta.icon}
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tx.description || tx.category}
            </p>
            {tx.recurring && <RefreshCw size={11} color="var(--accent-primary)" style={{ flexShrink: 0 }} />}
            {tx.notes && (
              <button onClick={() => setShowNote(s => !s)} style={{ display: 'flex', flexShrink: 0 }}>
                <StickyNote size={11} color="var(--accent-amber)" />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {tx.subItem ? `${tx.subItem} · ` : ''}{tx.category}
            </span>
          </div>
          {/* Note preview */}
          <AnimatePresence>
            {showNote && tx.notes && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ fontSize: '12px', color: 'var(--accent-amber)', marginTop: '4px', fontStyle: 'italic', lineHeight: '1.4' }}>
                "{tx.notes}"
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Amount + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '700', color: isExpense ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {isExpense ? '-' : '+'}{fmt(tx.amount)}
          </span>
          {!showDelete ? (
            <button onClick={() => setShowDelete(true)} style={{ color: 'var(--text-muted)', display: 'flex', opacity: 0.5 }}>
              <Trash2 size={14} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={onDelete} style={{
                background: 'var(--accent-red)', color: '#fff', border: 'none',
                borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '700',
              }}>Del</button>
              <button onClick={() => setShowDelete(false)} style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '6px', padding: '3px 6px', fontSize: '11px', color: 'var(--text-secondary)',
              }}>✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
