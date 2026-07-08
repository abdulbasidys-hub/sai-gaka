// src/pages/BudgetSettingsPage.jsx
// All budget configuration: set budgets, sub-items, custom categories, month start day
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance, getBudgetStatus } from '../context/FinanceContext';
import { useCurrency, fmtGBP, fmtNGN } from '../context/CurrencyContext';
import { Pencil, Check, X, ChevronDown, ChevronUp, Plus, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ICON_OPTIONS = ['🏠','🚗','👨‍👩‍👧','📚','🤝','💰','🍔','✈️','🏥','👗','🎮','⚽','🎵','🛒','🐕','💊','🔧','📱','🎁','💄'];
const COLOR_OPTIONS = ['#7c6aff','#f87171','#fbbf24','#4ade80','#fb923c','#38bdf8','#e879f9','#34d399','#f97316','#06b6d4'];

function fmt(n, currency) {
  return currency === 'NGN' ? fmtNGN(n) : fmtGBP(n);
}

export default function BudgetSettingsPage() {
  const navigate = useNavigate();
  const {
    budgets, upsertBudget, addSubItem, updateSubItem, deleteSubItem,
    spentByCategory, spentByCategoryNGN, spentBySubItem,
    BUDGET_CATEGORIES, ALL_CATEGORIES,
    addCustomCategory, deleteCustomCategory,
  } = useFinance();

  const [expanded, setExpanded] = useState({});
  const [editingCat, setEditingCat] = useState(null);
  const [editCatValue, setEditCatValue] = useState('');
  const [editCatCurrency, setEditCatCurrency] = useState('GBP');
  const [addingSubTo, setAddingSubTo] = useState(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubBudget, setNewSubBudget] = useState('');
  const [newSubCurrency, setNewSubCurrency] = useState('GBP');
  const [editingSubId, setEditingSubId] = useState(null);
  const [editSubBudget, setEditSubBudget] = useState('');
  const [editSubCurrency, setEditSubCurrency] = useState('GBP');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📂');
  const [newCatColor, setNewCatColor] = useState('#7c6aff');
  const [newCatCurrency, setNewCatCurrency] = useState('GBP');

  const handleSaveCat = async (cat) => {
    if (!editCatValue) return;
    const existing = budgets[cat];
    await upsertBudget(cat, editCatValue, existing?.subItems || [], editCatCurrency);
    setEditingCat(null);
  };

  const handleAddSub = async (cat) => {
    if (!newSubName.trim()) return;
    await addSubItem(cat, { name: newSubName.trim(), budget: newSubBudget || 0, currency: newSubCurrency });
    setNewSubName(''); setNewSubBudget(''); setNewSubCurrency('GBP'); setAddingSubTo(null);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await addCustomCategory({ name: newCatName.trim(), icon: newCatIcon, color: newCatColor, defaultCurrency: newCatCurrency });
    setNewCatName(''); setNewCatIcon('📂'); setNewCatColor('#7c6aff'); setNewCatCurrency('GBP');
    setShowAddCat(false);
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '40px' }}>

      {/* Back button */}
      <button onClick={() => navigate('/budget')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '14px', fontWeight: '600', background: 'none', border: 'none', marginBottom: '16px', padding: '0' }}>
        <ArrowLeft size={16} /> Back to Budget
      </button>

      <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>Budget Settings</p>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Set amounts, add sub-items, and create custom categories.</p>

      {/* Category list */}
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
            <div key={cat} style={{ background: 'var(--bg-card)', border: `1px solid ${status.level === 'over' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '13px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${meta?.color || '#7c6aff'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {meta?.icon || '📂'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: budgeted > 0 ? '5px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{cat}</span>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: budgetCurrency === 'NGN' ? 'var(--accent-naira)' : budgetCurrency === 'MIXED' ? 'var(--accent-amber)' : 'var(--accent-primary)', background: budgetCurrency === 'NGN' ? 'var(--accent-naira-dim)' : budgetCurrency === 'MIXED' ? 'var(--accent-amber-dim)' : 'var(--accent-primary-dim)', borderRadius: '4px', padding: '1px 5px' }}>
                          {budgetCurrency === 'MIXED' ? '£+₦' : budgetCurrency}
                        </span>
                        {subItems.length > 0 && <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '4px', padding: '1px 5px' }}>{subItems.length}</span>}
                      </div>
                      {!isEditingCat ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: '700', color: status.color }}>
                            {budgetCurrency === 'MIXED' ? '—' : `${fmt(spent, budgetCurrency)}${budgeted > 0 ? ' / ' + fmt(budgeted, budgetCurrency) : ''}`}
                          </span>
                          <button onClick={() => { setEditingCat(cat); setEditCatValue(budgeted || ''); setEditCatCurrency(budgetCurrency === 'MIXED' ? 'GBP' : budgetCurrency); }} style={{ color: 'var(--text-muted)', display: 'flex', padding: '2px' }}><Pencil size={11} /></button>
                          {isCustom && <button onClick={() => deleteCustomCategory(cat)} style={{ color: 'var(--accent-red)', display: 'flex', padding: '2px', opacity: 0.6 }}><Trash2 size={11} /></button>}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button onClick={() => setEditCatCurrency(c => c === 'GBP' ? 'NGN' : 'GBP')} style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${editCatCurrency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)'}`, background: editCatCurrency === 'NGN' ? 'var(--accent-naira-dim)' : 'var(--accent-primary-dim)', color: editCatCurrency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)' }}>
                            {editCatCurrency === 'GBP' ? '£' : '₦'}
                          </button>
                          <input autoFocus type="number" value={editCatValue} onChange={e => setEditCatValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveCat(cat); if (e.key === 'Escape') setEditingCat(null); }}
                            style={{ width: '70px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-primary)', borderRadius: '6px', padding: '3px 7px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-display)', fontWeight: '700', outline: 'none' }}
                          />
                          <button onClick={() => handleSaveCat(cat)} style={{ color: 'var(--accent-green)' }}><Check size={13} /></button>
                          <button onClick={() => setEditingCat(null)} style={{ color: 'var(--accent-red)' }}><X size={13} /></button>
                        </div>
                      )}
                    </div>
                    {budgeted > 0 && budgetCurrency !== 'MIXED' && (
                      <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(status.pct, 100)}%`, borderRadius: '2px', background: status.color, transition: 'width 0.5s ease' }} />
                      </div>
                    )}
                    {!budgeted && (
                      <button onClick={() => { setEditingCat(cat); setEditCatValue(''); setEditCatCurrency(meta?.defaultCurrency || 'GBP'); }}
                        style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'none', border: 'none', fontWeight: '600', padding: '2px 0', cursor: 'pointer' }}>
                        + Set budget
                      </button>
                    )}
                  </div>
                  <button onClick={() => setExpanded(e => ({ ...e, [cat]: !e[cat] }))} style={{ color: 'var(--text-muted)', display: 'flex', padding: '4px', flexShrink: 0 }}>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px' }}>

                      {/* Sub-items */}
                      {subItems.map(si => {
                        const siCurrency = si.currency || budgetCurrency;
                        const siKey = cat + '::' + si.name + '::' + siCurrency;
                        const siSpent = spentBySubItem[siKey] || 0;
                        const siStatus = getBudgetStatus(siSpent, si.budget);
                        const isEditingSub = editingSubId === si.id;
                        return (
                          <div key={si.id} style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: meta?.color || '#7c6aff', flexShrink: 0 }} />
                              <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{si.name}</span>
                              <span style={{ fontSize: '10px', fontWeight: '700', color: siCurrency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)', background: siCurrency === 'NGN' ? 'var(--accent-naira-dim)' : 'var(--accent-primary-dim)', borderRadius: '3px', padding: '1px 4px', flexShrink: 0 }}>
                                {siCurrency === 'GBP' ? '£' : '₦'}
                              </span>
                              {!isEditingSub ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'var(--font-display)', color: siStatus.color }}>
                                    {fmt(siSpent, siCurrency)}{si.budget ? ' / ' + fmt(si.budget, siCurrency) : ''}
                                  </span>
                                  <button onClick={() => { setEditingSubId(si.id); setEditSubBudget(si.budget || ''); setEditSubCurrency(siCurrency); }} style={{ color: 'var(--text-muted)' }}><Pencil size={10} /></button>
                                  <button onClick={() => deleteSubItem(cat, si.id)} style={{ color: 'var(--accent-red)', opacity: 0.6 }}><Trash2 size={10} /></button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <button onClick={() => setEditSubCurrency(c => c === 'GBP' ? 'NGN' : 'GBP')} style={{ fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px', border: `1px solid ${editSubCurrency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)'}`, background: editSubCurrency === 'NGN' ? 'var(--accent-naira-dim)' : 'var(--accent-primary-dim)', color: editSubCurrency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)' }}>
                                    {editSubCurrency === 'GBP' ? '£' : '₦'}
                                  </button>
                                  <input autoFocus type="number" value={editSubBudget} onChange={e => setEditSubBudget(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { updateSubItem(cat, si.id, { budget: Number(editSubBudget), currency: editSubCurrency }); setEditingSubId(null); } if (e.key === 'Escape') setEditingSubId(null); }}
                                    style={{ width: '55px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-primary)', borderRadius: '6px', padding: '2px 5px', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: '700', outline: 'none' }}
                                  />
                                  <button onClick={() => { updateSubItem(cat, si.id, { budget: Number(editSubBudget), currency: editSubCurrency }); setEditingSubId(null); }} style={{ color: 'var(--accent-green)' }}><Check size={12} /></button>
                                  <button onClick={() => setEditingSubId(null)} style={{ color: 'var(--accent-red)' }}><X size={12} /></button>
                                </div>
                              )}
                            </div>
                            {si.budget > 0 && (
                              <div style={{ height: '3px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginLeft: '12px', marginTop: '3px' }}>
                                <div style={{ height: '100%', width: `${Math.min(siStatus.pct, 100)}%`, background: siStatus.color, borderRadius: '2px' }} />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add sub-item */}
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
                          <input placeholder="Item name" value={newSubName} onChange={e => setNewSubName(e.target.value)}
                            style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', marginBottom: '8px' }} />
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                            <button onClick={() => setNewSubCurrency(c => c === 'GBP' ? 'NGN' : 'GBP')} style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)', border: `1px solid ${newSubCurrency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)'}`, background: newSubCurrency === 'NGN' ? 'var(--accent-naira-dim)' : 'var(--accent-primary-dim)', color: newSubCurrency === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)', flexShrink: 0 }}>
                              {newSubCurrency === 'GBP' ? '£' : '₦'}
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 10px', flex: 1 }}>
                              <input type="number" placeholder="Budget" value={newSubBudget} onChange={e => setNewSubBudget(e.target.value)}
                                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-display)', fontWeight: '700', padding: '8px 0' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleAddSub(cat)} style={{ flex: 1, padding: '8px', background: meta?.color || 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>Add</button>
                            <button onClick={() => { setAddingSubTo(null); setNewSubName(''); setNewSubBudget(''); setNewSubCurrency('GBP'); }} style={{ padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setAddingSubTo(cat); setNewSubCurrency(budgetCurrency === 'NGN' ? 'NGN' : 'GBP'); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: meta?.color || 'var(--accent-primary)', background: `${meta?.color || 'var(--accent-primary)'}10`, border: `1px dashed ${meta?.color || 'var(--accent-primary)'}50`, borderRadius: '8px', padding: '7px 12px', width: '100%', justifyContent: 'center', marginTop: subItems.length > 0 ? '4px' : '0' }}>
                          <Plus size={12} /> Add sub-item
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Add custom category */}
        <button onClick={() => setShowAddCat(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '2px dashed var(--border)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)', width: '100%' }}>
          <Plus size={16} /> Add Custom Category
        </button>
      </div>

      {/* Add category sheet */}
      <AnimatePresence>
        {showAddCat && (
          <>
            <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddCat(false)} />
            <motion.div className="sheet-panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 38 }}>
              <div className="sheet-handle-area">
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              </div>
              <div className="sheet-scroll-area">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '18px' }}>New Category</h3>

                <FL>Name</FL>
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Personal Care, Eating Out…"
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '14px' }} />

                <FL>Icon</FL>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {ICON_OPTIONS.map(ic => (
                    <button key={ic} onClick={() => setNewCatIcon(ic)} style={{ width: 36, height: 36, borderRadius: '8px', fontSize: '18px', background: newCatIcon === ic ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)', border: `1px solid ${newCatIcon === ic ? 'var(--accent-primary)' : 'var(--border)'}` }}>{ic}</button>
                  ))}
                </div>

                <FL>Color</FL>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setNewCatColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: newCatColor === c ? '3px solid var(--text-primary)' : '2px solid transparent', flexShrink: 0 }} />
                  ))}
                </div>

                <FL>Default Currency</FL>
                <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', marginBottom: '18px' }}>
                  {['GBP', 'NGN'].map(c => (
                    <button key={c} onClick={() => setNewCatCurrency(c)} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)', background: newCatCurrency === c ? (c === 'NGN' ? 'var(--accent-naira)' : 'var(--accent-primary)') : 'transparent', color: newCatCurrency === c ? '#fff' : 'var(--text-secondary)' }}>
                      {c === 'GBP' ? '🇬🇧 GBP' : '🇳🇬 NGN'}
                    </button>
                  ))}
                </div>

                <button onClick={handleAddCategory} disabled={!newCatName.trim()}
                  style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 'var(--radius-md)', background: !newCatName.trim() ? 'var(--bg-elevated)' : `linear-gradient(135deg, ${newCatColor}, ${newCatColor}bb)`, color: !newCatName.trim() ? 'var(--text-muted)' : '#fff', fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: !newCatName.trim() ? 'default' : 'pointer' }}>
                  <Check size={16} /> {newCatIcon} Create "{newCatName || 'Category'}"
                </button>
                <div style={{ height: 'max(20px, env(safe-area-inset-bottom))' }} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FL({ children }) {
  return <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{children}</p>;
}
