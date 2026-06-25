// src/pages/BudgetPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance, BUDGET_CATEGORIES, ALL_CATEGORIES } from '../context/FinanceContext';
import { Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

function fmt(n) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

export default function BudgetPage() {
  const { budgets, upsertBudget, spentByCategory, totalIncome, totalSpent } = useFinance();
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [expanded, setExpanded] = useState({});

  const totalBudgeted = ALL_CATEGORIES.reduce((sum, cat) => sum + (budgets[cat]?.amount || 0), 0);

  const handleEdit = (cat) => {
    setEditing(cat);
    setEditValue(budgets[cat]?.amount || '');
  };

  const handleSave = async () => {
    if (!editing) return;
    await upsertBudget(editing, editValue);
    setEditing(null);
    setEditValue('');
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '16px' }}>
          Month Summary
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <SummaryCell label="Budgeted" value={fmt(totalBudgeted)} color="var(--accent-primary)" />
          <SummaryCell label="Spent" value={fmt(totalSpent)} color="var(--accent-red)" />
          <SummaryCell label="Remaining" value={fmt(totalBudgeted - totalSpent)} color={totalBudgeted - totalSpent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} />
        </div>
      </motion.div>

      {/* Category budgets */}
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600', marginBottom: '10px', paddingLeft: '2px' }}>
        Budget by Category
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {ALL_CATEGORIES.map((cat, i) => {
          const meta = BUDGET_CATEGORIES[cat];
          const budgeted = budgets[cat]?.amount || 0;
          const spent = spentByCategory[cat] || 0;
          const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
          const over = spent > budgeted && budgeted > 0;
          const isExpanded = expanded[cat];
          const isEditing = editing === cat;

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${over ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {/* Header row */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: `${meta.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', flexShrink: 0,
                  }}>
                    {meta.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700' }}>{cat}</span>
                      {!isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '600', color: over ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                            {fmt(spent)} {budgeted > 0 ? `/ ${fmt(budgeted)}` : ''}
                          </span>
                          <button onClick={() => handleEdit(cat)} style={{ color: 'var(--text-muted)', display: 'flex' }}>
                            <Pencil size={13} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>£</span>
                          <input
                            autoFocus
                            type="number"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            style={{
                              width: '80px', background: 'var(--bg-elevated)',
                              border: '1px solid var(--accent-primary)', borderRadius: '6px',
                              padding: '4px 8px', color: 'var(--text-primary)',
                              fontSize: '14px', fontFamily: 'var(--font-display)', fontWeight: '600',
                              outline: 'none',
                            }}
                          />
                          <button onClick={handleSave} style={{ color: 'var(--accent-green)' }}><Check size={15} /></button>
                          <button onClick={() => setEditing(null)} style={{ color: 'var(--accent-red)' }}><X size={15} /></button>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    {budgeted > 0 && (
                      <div style={{ height: '5px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          style={{
                            height: '100%', borderRadius: '3px',
                            background: over ? 'var(--accent-red)' : pct > 75 ? 'var(--accent-amber)' : meta.color,
                          }}
                        />
                      </div>
                    )}
                    {!budgeted && (
                      <button
                        onClick={() => handleEdit(cat)}
                        style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      >
                        Set budget →
                      </button>
                    )}
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(e => ({ ...e, [cat]: !e[cat] }))}
                    style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {/* Expanded items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px 12px' }}>
                      {meta.items.map(item => (
                        <div key={item} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCell({ label, value, color }) {
  return (
    <div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', color }}>{value}</p>
    </div>
  );
}
