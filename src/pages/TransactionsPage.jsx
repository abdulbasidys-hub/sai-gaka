// src/pages/TransactionsPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance, BUDGET_CATEGORIES, ALL_CATEGORIES } from '../context/FinanceContext';
import { format } from 'date-fns';
import { Trash2, Plus, SlidersHorizontal, X } from 'lucide-react';
import AddTransactionSheet from '../components/transactions/AddTransactionSheet';

function fmt(n) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function TransactionsPage() {
  const { transactions, deleteTransaction } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [filterType, setFilterType] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  const filtered = transactions.filter(t => {
    if (filterCat !== 'All' && t.category !== filterCat) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  // Group by date
  const grouped = filtered.reduce((acc, tx) => {
    const key = tx.date ? format(tx.date, 'yyyy-MM-dd') : 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div style={{ padding: '16px' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flex: 1, gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {['all', 'expense', 'income'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  border: `1px solid ${filterType === t ? 'var(--accent-primary)' : 'var(--border)'}`,
                  background: filterType === t ? 'var(--accent-primary-dim)' : 'var(--bg-card)',
                  color: filterType === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  flexShrink: 0,
                }}
              >
                {t === 'all' ? 'All' : t === 'expense' ? '↓ Expenses' : '↑ Income'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilter(f => !f)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: `1px solid ${showFilter ? 'var(--accent-primary)' : 'var(--border)'}`,
              background: showFilter ? 'var(--accent-primary-dim)' : 'var(--bg-card)',
              color: showFilter ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '4px',
              flexShrink: 0,
            }}
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>

        {/* Category filter */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '12px' }}
            >
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingBottom: '4px' }}>
                {['All', ...ALL_CATEGORIES].map(cat => {
                  const meta = cat !== 'All' ? BUDGET_CATEGORIES[cat] : null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCat(cat)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: filterCat === cat ? '600' : '400',
                        border: `1px solid ${filterCat === cat ? (meta?.color || 'var(--accent-primary)') : 'var(--border)'}`,
                        background: filterCat === cat ? `${meta?.color || 'var(--accent-primary)'}15` : 'var(--bg-elevated)',
                        color: filterCat === cat ? (meta?.color || 'var(--accent-primary)') : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >
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
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '48px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '4px' }}>No transactions found</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {filterCat !== 'All' || filterType !== 'all' ? 'Try adjusting your filters' : 'Tap + to add your first one'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sortedDates.map(dateKey => (
              <div key={dateKey}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '2px' }}>
                  {format(new Date(dateKey), 'EEEE, d MMM')}
                </p>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                }}>
                  {grouped[dateKey].map((tx, i) => (
                    <SwipeableTxRow
                      key={tx.id}
                      tx={tx}
                      onDelete={() => deleteTransaction(tx.id)}
                      last={i === grouped[dateKey].length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setShowAdd(true)}
        whileTap={{ scale: 0.92 }}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height) + 16px)', right: '20px',
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c6aff, #9c6aff)',
          boxShadow: '0 4px 24px rgba(124,106,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 90, border: 'none', cursor: 'pointer',
        }}
      >
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </motion.button>

      <AddTransactionSheet open={showAdd} onClose={() => setShowAdd(false)} />
    </>
  );
}

function SwipeableTxRow({ tx, onDelete, last }) {
  const [showDelete, setShowDelete] = useState(false);
  const catMeta = BUDGET_CATEGORIES[tx.category] || { color: '#7c6aff', icon: '💳' };
  const isExpense = tx.type === 'expense';

  return (
    <motion.div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: last ? 'none' : '1px solid var(--border)',
      }}
    >
      {/* Delete bg */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'var(--accent-red-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              padding: '0 16px', gap: '12px',
            }}
          >
            <button
              onClick={onDelete}
              style={{
                background: 'var(--accent-red)', color: '#fff',
                border: 'none', borderRadius: '8px',
                padding: '6px 16px', fontSize: '13px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
            <button
              onClick={() => setShowDelete(false)}
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px' }}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '12px',
          background: 'var(--bg-card)', position: 'relative', zIndex: 1,
        }}
        onContextMenu={e => { e.preventDefault(); setShowDelete(true); }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: '10px',
          background: `${catMeta.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', flexShrink: 0,
        }}>
          {catMeta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tx.description || tx.category}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{tx.category}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '700',
            color: isExpense ? 'var(--accent-red)' : 'var(--accent-green)',
          }}>
            {isExpense ? '-' : '+'}{fmt(tx.amount)}
          </span>
          <button
            onClick={() => setShowDelete(v => !v)}
            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          >
            {showDelete ? <X size={15} /> : <Trash2 size={15} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
