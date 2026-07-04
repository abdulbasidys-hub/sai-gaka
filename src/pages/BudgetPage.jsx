// src/pages/BudgetPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance, BUDGET_CATEGORIES, ALL_CATEGORIES, getBudgetStatus } from '../context/FinanceContext';
import { Pencil, Check, X, ChevronDown, ChevronUp, Plus, Trash2, AlertTriangle, Layers } from 'lucide-react';

function fmt(n) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function BudgetPage() {
  const { budgets, upsertBudget, addSubItem, updateSubItem, deleteSubItem, spentByCategory, spentBySubItem, totalSpent, unbudgetedCategories } = useFinance();
  const [expanded, setExpanded] = useState({});
  const [editingCat, setEditingCat] = useState(null);
  const [editCatValue, setEditCatValue] = useState('');
  const [addingSubTo, setAddingSubTo] = useState(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubBudget, setNewSubBudget] = useState('');
  const [editingSubId, setEditingSubId] = useState(null);
  const [editSubBudget, setEditSubBudget] = useState('');

  const totalBudgeted = ALL_CATEGORIES.reduce((s, cat) => s + (budgets[cat]?.amount || 0), 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overBudgetCats = ALL_CATEGORIES.filter(cat => {
    const spent = spentByCategory[cat] || 0;
    const budgeted = budgets[cat]?.amount || 0;
    return budgeted > 0 && spent > budgeted;
  });

  const handleSaveCat = async (cat) => {
    if (!editCatValue) return;
    // If there are sub-items, keep them — just update overall amount
    const existing = budgets[cat];
    const subItems = existing?.subItems || [];
    // If sub-items exist and their total !== input, warn but save
    await upsertBudget(cat, editCatValue, subItems);
    setEditingCat(null);
  };

  const handleAddSub = async (cat) => {
    if (!newSubName.trim()) return;
    await addSubItem(cat, { name: newSubName.trim(), budget: newSubBudget || 0 });
    setNewSubName(''); setNewSubBudget(''); setAddingSubTo(null);
  };

  const handleUpdateSub = async (cat, subId) => {
    await updateSubItem(cat, subId, { budget: Number(editSubBudget) });
    setEditingSubId(null);
  };

  return (
    <div style={{ padding: '16px' }}>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '12px' }}
      >
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '16px' }}>
          Month at a Glance
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <SummaryCell label="Budgeted" value={fmt(totalBudgeted)} color="var(--accent-primary)" />
          <SummaryCell label="Spent" value={fmt(totalSpent)} color="var(--accent-red)" />
          <SummaryCell
            label={totalRemaining >= 0 ? 'Remaining' : 'Overrun'}
            value={fmt(Math.abs(totalRemaining))}
            color={totalRemaining >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
          />
        </div>

        {/* Overall bar */}
        {totalBudgeted > 0 && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%', borderRadius: '3px',
                  background: totalSpent > totalBudgeted
                    ? 'var(--accent-red)'
                    : totalSpent / totalBudgeted > 0.8
                      ? 'var(--accent-amber)'
                      : 'var(--accent-green)',
                }}
              />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
              {Math.round((totalSpent / totalBudgeted) * 100)}% of total budget used
            </p>
          </div>
        )}
      </motion.div>

      {/* Over-budget alert */}
      <AnimatePresence>
        {overBudgetCats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)',
              borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: '12px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}
          >
            <AlertTriangle size={16} color="var(--accent-red)" style={{ marginTop: '1px', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-red)', marginBottom: '2px' }}>
                Over budget in {overBudgetCats.length} {overBudgetCats.length === 1 ? 'category' : 'categories'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--accent-red)', opacity: 0.8 }}>
                {overBudgetCats.join(' · ')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unbudgeted spend */}
      <AnimatePresence>
        {unbudgetedCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)',
              borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: '12px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}
          >
            <AlertTriangle size={16} color="var(--accent-amber)" style={{ marginTop: '1px', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-amber)', marginBottom: '2px' }}>
                Unplanned spending detected
              </p>
              <p style={{ fontSize: '12px', color: 'var(--accent-amber)', opacity: 0.9 }}>
                {unbudgetedCategories.join(' · ')} — no budget set
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category list */}
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600', marginBottom: '10px', paddingLeft: '2px' }}>
        Categories
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {ALL_CATEGORIES.map((cat, i) => {
          const meta = BUDGET_CATEGORIES[cat];
          const budget = budgets[cat];
          const budgeted = budget?.amount || 0;
          const subItems = budget?.subItems || [];
          const spent = spentByCategory[cat] || 0;
          const status = getBudgetStatus(spent, budgeted);
          const isExpanded = expanded[cat];
          const isEditingCat = editingCat === cat;
          const hasSubItems = subItems.length > 0;

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${status.level === 'over' ? 'rgba(239,68,68,0.4)' : status.level === 'critical' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {/* ── Category header ── */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Icon */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '10px',
                    background: `${meta.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '17px', flexShrink: 0,
                  }}>
                    {meta.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: budgeted > 0 ? '7px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{cat}</span>
                        {hasSubItems && (
                          <span style={{ fontSize: '10px', background: `${meta.color}15`, color: meta.color, borderRadius: '4px', padding: '1px 5px', fontWeight: '600' }}>
                            {subItems.length} items
                          </span>
                        )}
                        {status.level === 'over' && <AlertTriangle size={13} color="var(--accent-red)" />}
                      </div>

                      {/* Budget edit / display */}
                      {!isEditingCat ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '700', color: status.color }}>
                            {fmt(spent)}{budgeted > 0 ? ` / ${fmt(budgeted)}` : ''}
                          </span>
                          <button onClick={() => { setEditingCat(cat); setEditCatValue(budgeted || ''); }}
                            style={{ color: 'var(--text-muted)', display: 'flex', padding: '2px' }}>
                            <Pencil size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>£</span>
                          <input autoFocus type="number" value={editCatValue}
                            onChange={e => setEditCatValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveCat(cat); if (e.key === 'Escape') setEditingCat(null); }}
                            style={{
                              width: '75px', background: 'var(--bg-elevated)',
                              border: '1px solid var(--accent-primary)', borderRadius: '6px',
                              padding: '3px 8px', color: 'var(--text-primary)',
                              fontSize: '14px', fontFamily: 'var(--font-display)', fontWeight: '600', outline: 'none',
                            }}
                          />
                          <button onClick={() => handleSaveCat(cat)} style={{ color: 'var(--accent-green)' }}><Check size={14} /></button>
                          <button onClick={() => setEditingCat(null)} style={{ color: 'var(--accent-red)' }}><X size={14} /></button>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    {budgeted > 0 && (
                      <>
                        <div style={{ height: '5px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(status.pct, 100)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: '3px', background: status.color }}
                          />
                        </div>
                        {status.level === 'over' && (
                          <p style={{ fontSize: '10px', color: 'var(--accent-red)', marginTop: '3px', fontWeight: '600' }}>
                            {fmt(spent - budgeted)} over budget
                          </p>
                        )}
                      </>
                    )}

                    {!budgeted && (
                      <button onClick={() => { setEditingCat(cat); setEditCatValue(''); }}
                        style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: '600' }}>
                        + Set budget
                      </button>
                    )}
                  </div>

                  {/* Expand */}
                  <button onClick={() => setExpanded(e => ({ ...e, [cat]: !e[cat] }))}
                    style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0, padding: '4px' }}>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {/* ── Expanded panel: sub-items ── */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>

                      {/* Sub-item rows */}
                      {subItems.map(si => {
                        const siKey = `${cat}::${si.name}`;
                        const siSpent = spentBySubItem[siKey] || 0;
                        const siStatus = getBudgetStatus(siSpent, si.budget);
                        const isEditingSub = editingSubId === si.id;

                        return (
                          <div key={si.id} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: si.budget ? '5px' : '0' }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                              <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{si.name}</span>
                              {!isEditingSub ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-display)', color: siStatus.color }}>
                                    {fmt(siSpent)}{si.budget ? ` / ${fmt(si.budget)}` : ''}
                                  </span>
                                  <button onClick={() => { setEditingSubId(si.id); setEditSubBudget(si.budget || ''); }}
                                    style={{ color: 'var(--text-muted)', display: 'flex' }}>
                                    <Pencil size={11} />
                                  </button>
                                  <button onClick={() => deleteSubItem(cat, si.id)}
                                    style={{ color: 'var(--accent-red)', display: 'flex', opacity: 0.6 }}>
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>£</span>
                                  <input autoFocus type="number" value={editSubBudget}
                                    onChange={e => setEditSubBudget(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleUpdateSub(cat, si.id); if (e.key === 'Escape') setEditingSubId(null); }}
                                    style={{
                                      width: '65px', background: 'var(--bg-elevated)',
                                      border: '1px solid var(--accent-primary)', borderRadius: '6px',
                                      padding: '3px 6px', color: 'var(--text-primary)',
                                      fontSize: '13px', fontFamily: 'var(--font-display)', fontWeight: '600', outline: 'none',
                                    }}
                                  />
                                  <button onClick={() => handleUpdateSub(cat, si.id)} style={{ color: 'var(--accent-green)' }}><Check size={13} /></button>
                                  <button onClick={() => setEditingSubId(null)} style={{ color: 'var(--accent-red)' }}><X size={13} /></button>
                                </div>
                              )}
                            </div>
                            {si.budget > 0 && (
                              <div style={{ height: '3px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginLeft: '14px' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(siStatus.pct, 100)}%` }}
                                  transition={{ duration: 0.5 }}
                                  style={{ height: '100%', borderRadius: '2px', background: siStatus.color }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add sub-item */}
                      {addingSubTo === cat ? (
                        <div style={{
                          background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                          padding: '12px', border: '1px solid var(--border)', marginTop: '4px',
                        }}>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                            New Sub-item
                          </p>
                          {/* Suggestions */}
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {meta.suggestions
                              .filter(s => !subItems.find(si => si.name === s))
                              .map(s => (
                                <button key={s} onClick={() => setNewSubName(s)}
                                  style={{
                                    padding: '3px 8px', borderRadius: '5px', fontSize: '11px',
                                    border: `1px solid ${newSubName === s ? meta.color : 'var(--border)'}`,
                                    background: newSubName === s ? `${meta.color}15` : 'var(--bg-card)',
                                    color: newSubName === s ? meta.color : 'var(--text-muted)',
                                  }}>
                                  {s}
                                </button>
                              ))}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                            <input placeholder="Item name" value={newSubName}
                              onChange={e => setNewSubName(e.target.value)}
                              style={{
                                flex: 2, background: 'var(--bg-card)', border: '1px solid var(--border)',
                                borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)',
                                fontSize: '13px', fontFamily: 'var(--font-body)', outline: 'none',
                              }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 8px', flex: 1 }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>£</span>
                              <input type="number" placeholder="Budget" value={newSubBudget}
                                onChange={e => setNewSubBudget(e.target.value)}
                                style={{
                                  flex: 1, background: 'none', border: 'none', outline: 'none',
                                  color: 'var(--text-primary)', fontSize: '13px',
                                  fontFamily: 'var(--font-display)', fontWeight: '600', width: '60px',
                                }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleAddSub(cat)} style={{
                              flex: 1, padding: '8px', background: meta.color, color: '#fff',
                              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                              fontFamily: 'var(--font-display)',
                            }}>
                              Add
                            </button>
                            <button onClick={() => { setAddingSubTo(null); setNewSubName(''); setNewSubBudget(''); }}
                              style={{
                                padding: '8px 12px', background: 'var(--bg-card)',
                                border: '1px solid var(--border)', borderRadius: '8px',
                                fontSize: '13px', color: 'var(--text-secondary)',
                              }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setAddingSubTo(cat)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            fontSize: '12px', fontWeight: '600', color: meta.color,
                            background: `${meta.color}10`, border: `1px dashed ${meta.color}50`,
                            borderRadius: '8px', padding: '7px 12px', width: '100%',
                            justifyContent: 'center', marginTop: subItems.length > 0 ? '4px' : '0',
                          }}>
                          <Plus size={13} /> Add sub-item
                        </button>
                      )}
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
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', color }}>{value}</p>
    </div>
  );
}
