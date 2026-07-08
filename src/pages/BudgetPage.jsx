// src/pages/BudgetPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance, getBudgetStatus } from '../context/FinanceContext';
import { fmtGBP, fmtNGN } from '../context/CurrencyContext';
import { Settings2, Check, X, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddTransactionSheet from '../components/transactions/AddTransactionSheet';

function fmt(n, currency) {
  return currency === 'NGN' ? fmtNGN(n) : fmtGBP(n);
}

export default function BudgetPage() {
  const navigate = useNavigate();
  const {
    budgets, BUDGET_CATEGORIES, ALL_CATEGORIES,
    spentByCategory, spentByCategoryNGN, spentBySubItem,
  } = useFinance();

  const [expanded, setExpanded] = useState({});
  const [confirmPay, setConfirmPay] = useState(null); // { cat, subItem, amount, account }
  const [editAmount, setEditAmount] = useState('');
  const [quickPay, setQuickPay] = useState(null);

  const withBudget = ALL_CATEGORIES.filter(cat => budgets[cat]?.amount > 0);
  const noBudget = ALL_CATEGORIES.filter(cat => !budgets[cat]?.amount);

  const openConfirm = (cat, subItemName = null, amount, account) => {
    setConfirmPay({ cat, subItem: subItemName, amount, account });
    setEditAmount(String(amount));
  };

  const handlePay = () => {
    if (!confirmPay) return;
    setQuickPay({
      category: confirmPay.cat,
      subItem: confirmPay.subItem || '',
      amount: parseFloat(editAmount) || confirmPay.amount,
      account: confirmPay.account,
      description: confirmPay.subItem || confirmPay.cat,
    });
    setConfirmPay(null);
  };

  return (
    <>
      <div style={{ padding: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
            {withBudget.length} budget{withBudget.length !== 1 ? 's' : ''} this month
          </p>
          <button onClick={() => navigate('/budget-settings')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-display)' }}>
            <Settings2 size={14} /> Settings
          </button>
        </div>

        {withBudget.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>No budgets set yet</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>Set your monthly budgets in Budget Settings, then come back here to mark them as paid.</p>
            <button onClick={() => navigate('/budget-settings')}
              style={{ background: 'linear-gradient(135deg, var(--accent-primary), #9c6aff)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontSize: '14px', fontWeight: '700', fontFamily: 'var(--font-display)', touchAction: 'manipulation' }}>
              Go to Budget Settings
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {withBudget.map((cat, i) => {
              const meta = BUDGET_CATEGORIES[cat];
              const budget = budgets[cat];
              const bc = budget?.budgetCurrency || 'GBP';
              const subItems = budget?.subItems || [];
              const hasSubItems = subItems.length > 0;
              const spent = bc === 'NGN' ? (spentByCategoryNGN[cat] || 0) : (spentByCategory[cat] || 0);
              const budgeted = budget?.amount || 0;
              const status = getBudgetStatus(spent, budgeted);
              const isDone = spent >= budgeted && budgeted > 0;
              const isExpanded = expanded[cat];
              const isConfirmingThis = confirmPay?.cat === cat && !confirmPay?.subItem;

              return (
                <motion.div key={cat}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${isDone ? 'rgba(74,222,128,0.3)' : status.level === 'over' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Category header row */}
                  <div style={{ padding: '13px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '12px', background: `${meta?.color || '#7c6aff'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                        {meta?.icon || '📂'}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <p style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{cat}</p>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: bc === 'NGN' ? 'var(--accent-naira)' : bc === 'MIXED' ? 'var(--accent-amber)' : 'var(--accent-primary)', background: bc === 'NGN' ? 'var(--accent-naira-dim)' : bc === 'MIXED' ? 'var(--accent-amber-dim)' : 'var(--accent-primary-dim)', borderRadius: '4px', padding: '1px 5px' }}>
                            {bc === 'MIXED' ? '£+₦' : bc}
                          </span>
                          {isDone && <CheckCircle2 size={14} color="var(--accent-green)" />}
                          {status.level === 'over' && !isDone && <AlertTriangle size={13} color="var(--accent-red)" />}
                        </div>
                        <p style={{ fontSize: '12px', color: status.color, fontWeight: '600' }}>
                          {bc === 'MIXED' ? 'Mixed currencies' : `${fmt(spent, bc)} of ${fmt(budgeted, bc)}`}
                          {isDone ? ' · Paid ✓' : status.level === 'over' ? ' · Over budget' : ''}
                        </p>
                      </div>

                      {/* Expand toggle (if sub-items) or Pay button (if no sub-items) */}
                      {hasSubItems ? (
                        <button
                          onClick={() => setExpanded(e => ({ ...e, [cat]: !e[cat] }))}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', flexShrink: 0, touchAction: 'manipulation' }}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Less' : 'Items'}
                        </button>
                      ) : (
                        !isDone && !isConfirmingThis && (
                          <button
                            onClick={() => openConfirm(cat, null, budgeted, bc === 'MIXED' ? 'GBP' : bc)}
                            style={{ padding: '7px 12px', borderRadius: '8px', background: `${meta?.color}18`, border: `1px solid ${meta?.color}40`, color: meta?.color, fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-display)', flexShrink: 0, touchAction: 'manipulation' }}>
                            <Check size={13} style={{ display: 'inline', marginRight: '3px' }} />Pay
                          </button>
                        )
                      )}
                    </div>

                    {/* Progress bar */}
                    {bc !== 'MIXED' && (
                      <div style={{ height: '5px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden', marginTop: '10px' }}>
                        <div style={{ height: '100%', width: `${Math.min(status.pct, 100)}%`, borderRadius: '3px', background: isDone ? 'var(--accent-green)' : status.color, transition: 'width 0.5s ease' }} />
                      </div>
                    )}

                    {/* Confirm pay inline — category level */}
                    {isConfirmingThis && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ marginTop: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px', border: `1px solid ${meta?.color}40` }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
                          Confirm payment for <strong>{cat}</strong>
                        </p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-muted)' }}>{bc === 'NGN' ? '₦' : '£'}</span>
                          <input type="number" inputMode="decimal" value={editAmount} onChange={e => setEditAmount(e.target.value)} autoFocus
                            style={{ flex: 1, background: 'var(--bg-card)', border: `1px solid ${meta?.color}`, borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', outline: 'none' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={handlePay} style={{ flex: 1, padding: '11px', background: meta?.color, border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '14px', fontWeight: '700', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', touchAction: 'manipulation' }}>
                            <Check size={15} /> Confirm & Pay
                          </button>
                          <button onClick={() => setConfirmPay(null)} style={{ padding: '11px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', touchAction: 'manipulation' }}>
                            <X size={15} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Expanded sub-items */}
                  <AnimatePresence>
                    {isExpanded && hasSubItems && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {subItems.map(si => {
                            const siCurrency = si.currency || bc;
                            const siKey = cat + '::' + si.name + '::' + siCurrency;
                            const siSpent = spentBySubItem[siKey] || 0;
                            const siStatus = getBudgetStatus(siSpent, si.budget);
                            const siDone = si.budget > 0 && siSpent >= si.budget;
                            const isConfirmingSub = confirmPay?.cat === cat && confirmPay?.subItem === si.name;

                            return (
                              <div key={si.id}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: siDone ? 'var(--accent-green)' : (meta?.color || 'var(--accent-primary)'), flexShrink: 0 }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{si.name}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: siStatus.color, fontFamily: 'var(--font-display)' }}>
                                          {fmt(siSpent, siCurrency)}{si.budget ? ' / ' + fmt(si.budget, siCurrency) : ''}
                                        </span>
                                        {siDone
                                          ? <CheckCircle2 size={14} color="var(--accent-green)" />
                                          : !isConfirmingSub && (
                                            <button onClick={() => openConfirm(cat, si.name, si.budget, siCurrency)}
                                              style={{ padding: '4px 9px', borderRadius: '6px', background: `${meta?.color}15`, border: `1px solid ${meta?.color}40`, color: meta?.color, fontSize: '11px', fontWeight: '700', touchAction: 'manipulation' }}>
                                              Pay
                                            </button>
                                          )
                                        }
                                      </div>
                                    </div>
                                    {si.budget > 0 && (
                                      <div style={{ height: '3px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                                        <div style={{ height: '100%', width: `${Math.min(siStatus.pct, 100)}%`, background: siDone ? 'var(--accent-green)' : siStatus.color, borderRadius: '2px' }} />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Inline confirm for sub-item */}
                                {isConfirmingSub && (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ marginTop: '8px', marginLeft: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px', border: `1px solid ${meta?.color}40` }}>
                                    <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                      Pay <strong>{si.name}</strong>
                                    </p>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-muted)' }}>{siCurrency === 'NGN' ? '₦' : '£'}</span>
                                      <input type="number" inputMode="decimal" value={editAmount} onChange={e => setEditAmount(e.target.value)} autoFocus
                                        style={{ flex: 1, background: 'var(--bg-card)', border: `1px solid ${meta?.color}`, borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', outline: 'none' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button onClick={handlePay} style={{ flex: 1, padding: '9px', background: meta?.color, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', touchAction: 'manipulation' }}>
                                        <Check size={13} /> Confirm
                                      </button>
                                      <button onClick={() => setConfirmPay(null)} style={{ padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', touchAction: 'manipulation' }}>
                                        <X size={13} />
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            );
                          })}

                          {/* Also allow paying the whole category even when it has sub-items */}
                          {!isDone && !confirmPay && (
                            <button onClick={() => openConfirm(cat, null, budgeted, bc === 'MIXED' ? 'GBP' : bc)}
                              style={{ marginTop: '4px', padding: '8px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', touchAction: 'manipulation' }}>
                              Pay full category (£{budgeted})
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Unbudgeted notice */}
            {noBudget.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={14} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-amber)' }}>No budget: {noBudget.join(' · ')}</p>
                </div>
                <button onClick={() => navigate('/budget-settings')} style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', background: 'none', border: 'none', flexShrink: 0, touchAction: 'manipulation' }}>
                  Set →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AddTransactionSheet open={!!quickPay} onClose={() => setQuickPay(null)} prefill={quickPay} />
    </>
  );
}
