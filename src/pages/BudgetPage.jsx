// src/pages/BudgetPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance, getBudgetStatus } from '../context/FinanceContext';
import { fmtGBP, fmtNGN } from '../context/CurrencyContext';
import { Pencil, Check, X, ChevronDown, ChevronUp, Plus, Trash2, AlertTriangle } from 'lucide-react';

const ICON_OPTIONS = ['🏠','🚗','👨‍👩‍👧','📚','🤝','💰','🍔','✈️','🏥','👗','💄','🎮','⚽','🎵','🛒','🐕','💊','🔧','📱','🎁'];
const COLOR_OPTIONS = ['#7c6aff','#f87171','#fbbf24','#4ade80','#fb923c','#38bdf8','#e879f9','#34d399','#f97316','#06b6d4'];

function fmt(n, currency) {
  return currency === 'NGN' ? fmtNGN(n) : fmtGBP(n);
}

export default function BudgetPage() {
  const { budgets, upsertBudget, addSubItem, updateSubItem, deleteSubItem,
    spentByCategory, spentByCategoryNGN, spentBySubItem, totalSpentGBP,
    unbudgetedCategories, BUDGET_CATEGORIES, ALL_CATEGORIES,
    addCustomCategory, deleteCustomCategory } = useFinance();

  const [expanded, setExpanded] = useState({});
  const [editingCat, setEditingCat] = useState(null);
  const [editCatValue, setEditCatValue] = useState('');
  const [editCatCurrency, setEditCatCurrency] = useState('GBP');
  const [addingSubTo, setAddingSubTo] = useState(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubBudget, setNewSubBudget] = useState('');
  const [editingSubId, setEditingSubId] = useState(null);
  const [editSubBudget, setEditSubBudget] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📂');
  const [newCatColor, setNewCatColor] = useState('#7c6aff');
  const [newCatCurrency, setNewCatCurrency] = useState('GBP');

  const totalBudgetedGBP = ALL_CATEGORIES.filter(c => !budgets[c]?.budgetCurrency || budgets[c]?.budgetCurrency === 'GBP').reduce((s, c) => s + (budgets[c]?.amount || 0), 0);
  const totalBudgetedNGN = ALL_CATEGORIES.filter(c => budgets[c]?.budgetCurrency === 'NGN').reduce((s, c) => s + (budgets[c]?.amount || 0), 0);
  const overBudgetCats = ALL_CATEGORIES.filter(cat => {
    const bc = budgets[cat]?.budgetCurrency || 'GBP';
    const spent = bc === 'NGN' ? (spentByCategoryNGN[cat] || 0) : (spentByCategory[cat] || 0);
    const budgeted = budgets[cat]?.amount || 0;
    return budgeted > 0 && spent > budgeted;
  });

  const handleSaveCat = async (cat) => {
    if (!editCatValue) return;
    const existing = budgets[cat];
    await upsertBudget(cat, editCatValue, existing?.subItems || [], editCatCurrency);
    setEditingCat(null);
  };

  const handleAddSub = async (cat) => {
    if (!newSubName.trim()) return;
    await addSubItem(cat, { name: newSubName.trim(), budget: newSubBudget || 0 });
    setNewSubName(''); setNewSubBudget(''); setAddingSubTo(null);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await addCustomCategory({ name: newCatName.trim(), icon: newCatIcon, color: newCatColor, defaultCurrency: newCatCurrency });
    setNewCatName(''); setNewCatIcon('📂'); setNewCatColor('#7c6aff'); setNewCatCurrency('GBP');
    setShowAddCat(false);
  };

  return (
    <div style={{ padding: '16px' }}>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '18px', marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '14px' }}>Month Summary</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <Cell label="£ Budgeted" value={fmtGBP(totalBudgetedGBP)} color="var(--accent-primary)" />
          <Cell label="£ Spent" value={fmtGBP(totalSpentGBP)} color="var(--accent-red)" />
        </div>
        {totalBudgetedNGN > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
            <Cell label="₦ Budgeted" value={fmtNGN(totalBudgetedNGN)} color="var(--accent-naira)" />
            <Cell label="₦ Spent" value={fmtNGN(Object.values(spentByCategoryNGN).reduce((s, v) => s + v, 0))} color="var(--accent-red)" />
          </div>
        )}
        {totalBudgetedGBP > 0 && (
          <div style={{ marginTop: '12px', height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((totalSpentGBP / totalBudgetedGBP) * 100, 100)}%` }}
              transition={{ duration: 0.8 }}
              style={{ height: '100%', borderRadius: '3px', background: totalSpentGBP > totalBudgetedGBP ? 'var(--accent-red)' : totalSpentGBP / totalBudgetedGBP > 0.8 ? 'var(--accent-amber)' : 'var(--accent-green)' }} />
          </div>
        )}
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {overBudgetCats.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-lg)', padding: '11px 14px', marginBottom: '10px', display: 'flex', gap: '8px' }}>
            <AlertTriangle size={15} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-red)' }}>Over budget: {overBudgetCats.join(' · ')}</p>
            </div>
          </motion.div>
        )}
        {unbudgetedCategories.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)', borderRadius: 'var(--radius-lg)', padding: '11px 14px', marginBottom: '10px', display: 'flex', gap: '8px' }}>
            <AlertTriangle size={15} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-amber)' }}>No budget set: {unbudgetedCategories.join(' · ')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700', marginBottom: '10px', paddingLeft: '2px' }}>Categories</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ALL_CATEGORIES.map((cat, i) => {
          const meta = BUDGET_CATEGORIES[cat];
          const budget = budgets[cat];
          const budgetCurrency = budget?.budgetCurrency || meta?.defaultCurrency || 'GBP';
          const budgeted = budget?.amount || 0;
          const subItems = budget?.subItems || [];
          const spent = budgetCurrency === 'NGN' ? (spentByCategoryNGN[cat] || 0) : (spentByCategory[cat] || 0);
          const status = getBudgetStatus(spent, budgeted);
          const isExpanded = expanded[cat];
          const isEditingCat = editingCat === cat;
          const isCustom = meta?.custom;

          return (
            <motion.div key={cat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              style={{ background: 'var(--bg-card)', border: `1px solid ${status.level === 'over' ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>

              <div style={{ padding: '13px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${meta?.color || '#7c6aff'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {meta?.icon || '📂'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: budgeted > 0 ? '6px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{cat}</span>
                        {/* Currency badge */}
                        <span style={{ fontSize: '10px', fontWeight: '700', color: budgetCurrency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)', background: budgetCurrency === 'NGN' ? 'var(--accent-naira-dim)' : 'var(--accent-primary-dim)', borderRadius: '4px', padding: '1px 5px' }}>
                          {budgetCurrency}
                        </span>
                        {subItems.length > 0 && <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '4px', padding: '1px 5px' }}>{subItems.length} items</span>}
                        {status.level === 'over' && <AlertTriangle size={12} color="var(--accent-red)" />}
                      </div>

                      {!isEditingCat ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: '700', color: status.color }}>
                            {fmt(spent, budgetCurrency)}{budgeted > 0 ? ` / ${fmt(budgeted, budgetCurrency)}` : ''}
                          </span>
                          <button onClick={() => { setEditingCat(cat); setEditCatValue(budgeted || ''); setEditCatCurrency(budgetCurrency); }}
                            style={{ color: 'var(--text-muted)', display: 'flex', padding: '2px' }}><Pencil size={11} /></button>
                          {isCustom && (
                            <button onClick={() => deleteCustomCategory(cat)} style={{ color: 'var(--accent-red)', display: 'flex', padding: '2px', opacity: 0.6 }}><Trash2 size={11} /></button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {/* Currency toggle in edit mode */}
                          <button onClick={() => setEditCatCurrency(c => c === 'GBP' ? 'NGN' : 'GBP')} style={{
                            fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                            border: `1px solid ${editCatCurrency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)'}`,
                            background: editCatCurrency === 'NGN' ? 'var(--accent-naira-dim)' : 'var(--accent-primary-dim)',
                            color: editCatCurrency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)',
                          }}>
                            {editCatCurrency === 'GBP' ? '£' : '₦'}
                          </button>
                          <input autoFocus type="number" value={editCatValue} onChange={e => setEditCatValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveCat(cat); if (e.key === 'Escape') setEditingCat(null); }}
                            style={{ width: '70px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-primary)', borderRadius: '6px', padding: '3px 8px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-display)', fontWeight: '700', outline: 'none' }}
                          />
                          <button onClick={() => handleSaveCat(cat)} style={{ color: 'var(--accent-green)' }}><Check size={13} /></button>
                          <button onClick={() => setEditingCat(null)} style={{ color: 'var(--accent-red)' }}><X size={13} /></button>
                        </div>
                      )}
                    </div>

                    {budgeted > 0 && (
                      <>
                        <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(status.pct, 100)}%` }} transition={{ duration: 0.5 }}
                            style={{ height: '100%', borderRadius: '2px', background: status.color }} />
                        </div>
                        {status.level === 'over' && <p style={{ fontSize: '10px', color: 'var(--accent-red)', marginTop: '2px', fontWeight: '700' }}>{fmt(spent - budgeted, budgetCurrency)} over budget</p>}
                      </>
                    )}
                    {!budgeted && (
                      <button onClick={() => { setEditingCat(cat); setEditCatValue(''); setEditCatCurrency(meta?.defaultCurrency || 'GBP'); }}
                        style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 0' }}>
                        + Set budget
                      </button>
                    )}
                  </div>

                  <button onClick={() => setExpanded(e => ({ ...e, [cat]: !e[cat] }))}
                    style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0, padding: '4px' }}>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Sub-items panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px' }}>
                      {subItems.map(si => {
                        const siKey = `${cat}::${si.name}`;
                        const siSpent = spentBySubItem[siKey] || 0;
                        const siStatus = getBudgetStatus(siSpent, si.budget);
                        const isEditingSub = editingSubId === si.id;
                        return (
                          <div key={si.id} style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: meta?.color || '#7c6aff', flexShrink: 0 }} />
                              <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{si.name}</span>
                              {!isEditingSub ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'var(--font-display)', color: siStatus.color }}>
                                    {fmt(siSpent, budgetCurrency)}{si.budget ? ` / ${fmt(si.budget, budgetCurrency)}` : ''}
                                  </span>
                                  <button onClick={() => { setEditingSubId(si.id); setEditSubBudget(si.budget || ''); }} style={{ color: 'var(--text-muted)' }}><Pencil size={10} /></button>
                                  <button onClick={() => deleteSubItem(cat, si.id)} style={{ color: 'var(--accent-red)', opacity: 0.6 }}><Trash2 size={10} /></button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input autoFocus type="number" value={editSubBudget} onChange={e => setEditSubBudget(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { updateSubItem(cat, si.id, { budget: Number(editSubBudget) }); setEditingSubId(null); } if (e.key === 'Escape') setEditingSubId(null); }}
                                    style={{ width: '60px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-primary)', borderRadius: '6px', padding: '2px 6px', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: '700', outline: 'none' }}
                                  />
                                  <button onClick={() => { updateSubItem(cat, si.id, { budget: Number(editSubBudget) }); setEditingSubId(null); }} style={{ color: 'var(--accent-green)' }}><Check size={12} /></button>
                                  <button onClick={() => setEditingSubId(null)} style={{ color: 'var(--accent-red)' }}><X size={12} /></button>
                                </div>
                              )}
                            </div>
                            {si.budget > 0 && (
                              <div style={{ height: '3px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginLeft: '12px', marginTop: '3px' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(siStatus.pct, 100)}%` }} transition={{ duration: 0.4 }}
                                  style={{ height: '100%', background: siStatus.color, borderRadius: '2px' }} />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {addingSubTo === cat ? (
                        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px', border: '1px solid var(--border)', marginTop: '4px' }}>
                          {/* Suggestions */}
                          {(meta?.suggestions || []).filter(s => !subItems.find(si => si.name === s)).length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                              {(meta?.suggestions || []).filter(s => !subItems.find(si => si.name === s)).map(s => (
                                <button key={s} onClick={() => setNewSubName(s)} style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', border: `1px solid ${newSubName === s ? meta?.color : 'var(--border)'}`, background: newSubName === s ? `${meta?.color}15` : 'var(--bg-card)', color: newSubName === s ? meta?.color : 'var(--text-muted)' }}>{s}</button>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                            <input placeholder="Item name" value={newSubName} onChange={e => setNewSubName(e.target.value)}
                              style={{ flex: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 8px', flex: 1 }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{budgetCurrency === 'NGN' ? '₦' : '£'}</span>
                              <input type="number" placeholder="Budget" value={newSubBudget} onChange={e => setNewSubBudget(e.target.value)}
                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-display)', fontWeight: '700', width: '55px' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleAddSub(cat)} style={{ flex: 1, padding: '8px', background: meta?.color || 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>Add</button>
                            <button onClick={() => { setAddingSubTo(null); setNewSubName(''); setNewSubBudget(''); }} style={{ padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setAddingSubTo(cat)} style={{
                          display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700',
                          color: meta?.color || 'var(--accent-primary)', background: `${meta?.color || 'var(--accent-primary)'}10`,
                          border: `1px dashed ${meta?.color || 'var(--accent-primary)'}50`,
                          borderRadius: '8px', padding: '7px 12px', width: '100%', justifyContent: 'center', marginTop: subItems.length > 0 ? '4px' : '0',
                        }}>
                          <Plus size={12} /> Add sub-item
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Add custom category button */}
        <button onClick={() => setShowAddCat(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '14px', borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)', border: '2px dashed var(--border)',
          color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)',
          width: '100%',
        }}>
          <Plus size={16} /> Add Custom Category
        </button>
      </div>

      {/* Add category sheet */}
      <AnimatePresence>
        {showAddCat && (
          <>
            <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddCat(false)} />
            <motion.div className="sheet-panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 38 }}>
              <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              </div>
              <div style={{ padding: '14px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '18px' }}>New Category</h3>

                <FLabel>Name</FLabel>
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Personal Care, Eating Out..."
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '14px' }} />

                <FLabel>Icon</FLabel>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {ICON_OPTIONS.map(ic => (
                    <button key={ic} onClick={() => setNewCatIcon(ic)} style={{ width: 36, height: 36, borderRadius: '8px', fontSize: '18px', background: newCatIcon === ic ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)', border: `1px solid ${newCatIcon === ic ? 'var(--accent-primary)' : 'var(--border)'}` }}>{ic}</button>
                  ))}
                </div>

                <FLabel>Color</FLabel>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setNewCatColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: newCatColor === c ? '3px solid var(--text-primary)' : '2px solid transparent' }} />
                  ))}
                </div>

                <FLabel>Default Currency</FLabel>
                <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', marginBottom: '18px' }}>
                  {['GBP', 'NGN'].map(c => (
                    <button key={c} onClick={() => setNewCatCurrency(c)} style={{
                      flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)',
                      background: newCatCurrency === c ? (c === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)') : 'transparent',
                      color: newCatCurrency === c ? '#fff' : 'var(--text-secondary)',
                    }}>{c === 'GBP' ? '£ GBP' : '₦ NGN'}</button>
                  ))}
                </div>

                <motion.button onClick={handleAddCategory} disabled={!newCatName.trim()} whileTap={{ scale: 0.97 }} style={{
                  width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                  background: !newCatName.trim() ? 'var(--bg-elevated)' : `linear-gradient(135deg, ${newCatColor}, ${newCatColor}bb)`,
                  color: !newCatName.trim() ? 'var(--text-muted)' : '#fff',
                  fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  <Check size={16} /> {newCatIcon} Create "{newCatName || 'Category'}"
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Cell({ label, value, color }) {
  return (
    <div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: '600' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', color }}>{value}</p>
    </div>
  );
}
function FLabel({ children }) {
  return <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{children}</p>;
}
