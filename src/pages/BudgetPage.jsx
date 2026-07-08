// src/pages/BudgetPage.jsx
// This page shows all budget items ready to be paid.
// Editing budgets lives in BudgetSettingsPage (/budget-settings).
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance, getBudgetStatus } from '../context/FinanceContext';
import { fmtGBP, fmtNGN } from '../context/CurrencyContext';
import { Settings2, Check, X, AlertTriangle, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddTransactionSheet from '../components/transactions/AddTransactionSheet';

export default function BudgetPage() {
  const navigate = useNavigate();
  const {
    budgets, BUDGET_CATEGORIES, ALL_CATEGORIES,
    spentByCategory, spentByCategoryNGN, spentBySubItem,
    totalSpentGBP,
  } = useFinance();

  const [confirmPay, setConfirmPay] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [quickPay, setQuickPay] = useState(null);

  // Split categories into paid (spent >= budget) and unpaid
  const withBudget = ALL_CATEGORIES.filter(cat => budgets[cat]?.amount > 0);
  const noBudget = ALL_CATEGORIES.filter(cat => !budgets[cat]?.amount);

  const totalBudgeted = withBudget.reduce((s, cat) => {
    const bc = budgets[cat]?.budgetCurrency || 'GBP';
    return bc === 'GBP' ? s + (budgets[cat]?.amount || 0) : s;
  }, 0);

  const handleConfirmPay = (cat) => {
    const budget = budgets[cat];
    setConfirmPay(cat);
    setEditAmount(budget?.amount?.toString() || '');
  };

  const handlePay = (cat) => {
    const budget = budgets[cat];
    const bc = budget?.budgetCurrency || 'GBP';
    setQuickPay({
      category: cat,
      amount: parseFloat(editAmount) || budget?.amount || 0,
      account: bc === 'MIXED' ? 'GBP' : bc,
    });
    setConfirmPay(null);
  };

  return (
    <>
      <div style={{ padding: '16px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              {withBudget.length} budgets set · {fmtGBP(totalBudgeted)} total
            </p>
          </div>
          <button onClick={() => navigate('/budget-settings')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-display)' }}>
            <Settings2 size={14} /> Budget Settings
          </button>
        </div>

        {withBudget.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>No budgets set yet</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>Set up your monthly budgets in Budget Settings, then come back here to pay them off one by one.</p>
            <button onClick={() => navigate('/budget-settings')}
              style={{ background: 'linear-gradient(135deg, var(--accent-primary), #9c6aff)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontSize: '14px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
              Go to Budget Settings
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {withBudget.map((cat, i) => {
              const meta = BUDGET_CATEGORIES[cat];
              const budget = budgets[cat];
              const bc = budget?.budgetCurrency || 'GBP';
              const spent = bc === 'NGN' ? (spentByCategoryNGN[cat] || 0) : (spentByCategory[cat] || 0);
              const budgeted = budget?.amount || 0;
              const status = getBudgetStatus(spent, budgeted);
              const isDone = spent >= budgeted && budgeted > 0;
              const subItems = budget?.subItems || [];
              const isConfirming = confirmPay === cat;

              return (
                <motion.div key={cat}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${isDone ? 'rgba(74,222,128,0.3)' : status.level === 'over' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    opacity: isDone ? 0.75 : 1,
                  }}
                >
                  <div style={{ padding: '14px 14px 12px' }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '12px', background: `${meta?.color || '#7c6aff'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                        {meta?.icon || '📂'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{cat}</p>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: bc === 'NGN' ? 'var(--accent-naira)' : bc === 'MIXED' ? 'var(--accent-amber)' : 'var(--accent-primary)', background: bc === 'NGN' ? 'var(--accent-naira-dim)' : bc === 'MIXED' ? 'var(--accent-amber-dim)' : 'var(--accent-primary-dim)', borderRadius: '4px', padding: '1px 5px' }}>
                            {bc === 'MIXED' ? '£+₦' : bc}
                          </span>
                          {isDone && <CheckCircle2 size={14} color="var(--accent-green)" />}
                          {status.level === 'over' && <AlertTriangle size={13} color="var(--accent-red)" />}
                        </div>
                        <p style={{ fontSize: '12px', color: status.color, fontWeight: '600', marginTop: '1px' }}>
                          {bc === 'MIXED' ? `mixed` : bc === 'NGN' ? fmtNGN(spent) : fmtGBP(spent)} of {bc === 'NGN' ? fmtNGN(budgeted) : fmtGBP(budgeted)}
                          {isDone ? ' · Done ✓' : status.level === 'over' ? ' · Over!' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {bc !== 'MIXED' && (
                      <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(status.pct, 100)}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
                          style={{ height: '100%', borderRadius: '3px', background: isDone ? 'var(--accent-green)' : status.color }} />
                      </div>
                    )}

                    {/* Sub-items summary */}
                    {subItems.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {subItems.map(si => {
                          const siCurrency = si.currency || bc;
                          const siKey = cat + '::' + si.name + '::' + siCurrency;
                          const siSpent = spentBySubItem[siKey] || 0;
                          const siDone = si.budget > 0 && siSpent >= si.budget;
                          return (
                            <span key={si.id} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600', background: siDone ? 'var(--accent-green-dim)' : 'var(--bg-elevated)', color: siDone ? 'var(--accent-green)' : 'var(--text-muted)', border: `1px solid ${siDone ? 'var(--accent-green)' : 'var(--border)'}` }}>
                              {siDone ? '✓ ' : ''}{si.name} {siCurrency === 'NGN' ? fmtNGN(si.budget, true) : fmtGBP(si.budget)}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Confirm pay UI */}
                    {isConfirming ? (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px', border: `1px solid ${meta?.color || 'var(--accent-primary)'}40` }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
                          Paying <strong>{cat}</strong> — confirm amount:
                        </p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-muted)' }}>
                            {bc === 'NGN' ? '₦' : '£'}
                          </span>
                          <input type="number" inputMode="decimal" value={editAmount} onChange={e => setEditAmount(e.target.value)} autoFocus
                            style={{ flex: 1, background: 'var(--bg-card)', border: `1px solid ${meta?.color || 'var(--accent-primary)'}`, borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', outline: 'none' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handlePay(cat)}
                            style={{ flex: 1, padding: '11px', background: meta?.color || 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '14px', fontWeight: '700', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Check size={15} /> Confirm & Pay
                          </button>
                          <button onClick={() => setConfirmPay(null)}
                            style={{ padding: '11px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                            <X size={15} />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      !isDone && (
                        <button onClick={() => handleConfirmPay(cat)}
                          style={{ width: '100%', padding: '10px', background: `${meta?.color || 'var(--accent-primary)'}15`, border: `1px solid ${meta?.color || 'var(--accent-primary)'}40`, borderRadius: 'var(--radius-md)', color: meta?.color || 'var(--accent-primary)', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Check size={14} /> Mark as Paid
                        </button>
                      )
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Unbudgeted categories notice */}
            {noBudget.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={15} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-amber)' }}>No budget set for {noBudget.length} {noBudget.length === 1 ? 'category' : 'categories'}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{noBudget.join(' · ')}</p>
                </div>
                <button onClick={() => navigate('/budget-settings')}
                  style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', background: 'none', border: 'none', flexShrink: 0 }}>
                  Set →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AddTransactionSheet
        open={!!quickPay}
        onClose={() => setQuickPay(null)}
        prefill={quickPay}
      />
    </>
  );
}
