// src/pages/DashboardPage.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance, getBudgetStatus } from '../context/FinanceContext';
import { useCurrency, fmtGBP, fmtNGN } from '../context/CurrencyContext';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, ChevronRight, Plus, AlertTriangle, Calendar, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddTransactionSheet from '../components/transactions/AddTransactionSheet';
import TransferSheet from '../components/transfer/TransferSheet';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.32 } } },
};

export default function DashboardPage() {
  const {
    totalSpentGBP, totalIncomeGBP, balanceGBP,
    totalSpentNGN, totalIncomeNGN, balanceNGN,
    transactions, spentByCategory, spentByCategoryNGN,
    budgets, unbudgetedCategories, salarySettings, getSalaryNextDate,
    BUDGET_CATEGORIES,
  } = useFinance();
  const { exchangeRate } = useCurrency();
  const [showAddTx, setShowAddTx] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const recentTx = transactions.slice(0, 6);

  const pieData = Object.entries(spentByCategory)
    .map(([cat, amount]) => ({ name: cat, value: amount, color: BUDGET_CATEGORIES[cat]?.color || '#7c6aff' }))
    .sort((a, b) => b.value - a.value).slice(0, 5);

  const spendPct = totalIncomeGBP > 0 ? Math.min((totalSpentGBP / totalIncomeGBP) * 100, 100) : 0;
  const spendStatus = getBudgetStatus(totalSpentGBP, totalIncomeGBP);

  const budgetAlerts = Object.keys(BUDGET_CATEGORIES).filter(cat => {
    const s = spentByCategory[cat] || 0;
    const b = budgets[cat]?.amount || 0;
    return b > 0 && s / b >= 0.8;
  });

  const salaryNextDate = getSalaryNextDate();
  const daysUntilSalary = salaryNextDate
    ? Math.ceil((salaryNextDate - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      <motion.div variants={stagger.container} initial="initial" animate="animate" style={{ padding: '16px' }}>

        {/* ── Account balances ── */}
        <motion.div variants={stagger.item}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-xl)', padding: '18px', marginBottom: '10px',
            position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-glow)',
          }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-primary-dim) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Accounts</p>
              <button onClick={() => setShowTransfer(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', background: 'var(--accent-primary-dim)', border: '1px solid var(--accent-primary)', borderRadius: '6px', padding: '4px 9px' }}>
                <ArrowLeftRight size={11} /> Convert
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: salarySettings?.dayOfMonth ? '12px' : '0' }}>
              {/* GBP */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <span>🇬🇧</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>GBP</span>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: balanceGBP >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {balanceGBP < 0 ? '-' : ''}{fmtGBP(Math.abs(balanceGBP))}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  In {fmtGBP(totalIncomeGBP)} · Out {fmtGBP(totalSpentGBP)}
                </p>
              </div>
              {/* NGN */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent-naira-dim)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <span>🇳🇬</span>
                  <span style={{ fontSize: '10px', color: 'var(--accent-naira)', fontWeight: '700', textTransform: 'uppercase' }}>NGN</span>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: balanceNGN >= 0 ? 'var(--accent-naira)' : 'var(--accent-red)' }}>
                  {balanceNGN < 0 ? '-' : ''}{fmtNGN(Math.abs(balanceNGN), true)}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  In {fmtNGN(totalIncomeNGN, true)} · Out {fmtNGN(totalSpentNGN, true)}
                </p>
              </div>
            </div>

            {salarySettings?.dayOfMonth && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <Calendar size={11} color="var(--text-muted)" />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Salary {salarySettings.currency === 'GBP' ? fmtGBP(salarySettings.amountGBP) : fmtNGN(salarySettings.amountNGN, true)}
                  {daysUntilSalary !== null && ` · ${daysUntilSalary === 0 ? 'pays today 🎉' : daysUntilSalary === 1 ? 'tomorrow' : `in ${daysUntilSalary}d`}`}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Spend meter ── */}
        {totalIncomeGBP > 0 && (
          <motion.div variants={stagger.item}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '13px 14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>GBP Spending</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: spendStatus.color }}>{spendPct.toFixed(0)}% · {spendStatus.label}</span>
              </div>
              <div style={{ height: '7px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${spendPct}%` }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  style={{ height: '100%', borderRadius: '4px', background: spendStatus.color }} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{fmtGBP(totalSpentGBP)} of {fmtGBP(totalIncomeGBP)}</p>
            </div>
          </motion.div>
        )}

        {/* ── Budget alerts ── */}
        {budgetAlerts.length > 0 && (
          <motion.div variants={stagger.item}>
            <div style={{ background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)', borderRadius: 'var(--radius-lg)', padding: '10px 14px', marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertTriangle size={14} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-amber)' }}>{budgetAlerts.length} {budgetAlerts.length === 1 ? 'category' : 'categories'} near limit</p>
                <p style={{ fontSize: '11px', color: 'var(--accent-amber)', opacity: 0.9, marginTop: '2px' }}>
                  {budgetAlerts.map(cat => `${BUDGET_CATEGORIES[cat]?.icon} ${Math.round(((spentByCategory[cat] || 0) / budgets[cat].amount) * 100)}%`).join('  ·  ')}
                </p>
              </div>
              <Link to="/budget"><ChevronRight size={14} color="var(--accent-amber)" /></Link>
            </div>
          </motion.div>
        )}

        {unbudgetedCategories.length > 0 && (
          <motion.div variants={stagger.item}>
            <div style={{ background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-lg)', padding: '10px 14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} color="var(--accent-red)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-red)' }}>Unplanned spending: {unbudgetedCategories.join(' · ')}</p>
              </div>
              <Link to="/budget"><ChevronRight size={14} color="var(--accent-red)" /></Link>
            </div>
          </motion.div>
        )}

        {/* ── GBP pie breakdown ── */}
        {pieData.length > 0 && (
          <motion.div variants={stagger.item}>
            <SectionHeader title="GBP Breakdown" linkTo="/budget" />
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 86, height: 86, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={22} outerRadius={40} strokeWidth={0}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '2px', background: d.color }} />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{d.name.split(' ')[0]}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{fmtGBP(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── NGN breakdown ── */}
        {Object.keys(spentByCategoryNGN).length > 0 && (
          <motion.div variants={stagger.item}>
            <SectionHeader title="₦ Naira Spending" linkTo="/insights" />
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '10px' }}>
              {Object.entries(spentByCategoryNGN).sort((a, b) => b[1] - a[1]).map(([cat, amount], i, arr) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '15px' }}>{BUDGET_CATEGORIES[cat]?.icon || '💳'}</span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{cat}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '700', color: 'var(--accent-naira)' }}>{fmtNGN(amount)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Recent ── */}
        <motion.div variants={stagger.item}>
          <SectionHeader title="Recent" linkTo="/transactions" />
          {recentTx.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px 16px', textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💸</div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Nothing yet</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tap + to log your first transaction</p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '10px' }}>
              {recentTx.map((tx, i) => (
                <TxRow key={tx.id} tx={tx} last={i === recentTx.length - 1} budgetCategories={BUDGET_CATEGORIES} />
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>

      {/* FABs */}
      <motion.button onClick={() => setShowTransfer(true)} whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
        style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 16px)', right: '82px', width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, color: 'var(--accent-primary)' }}>
        <ArrowLeftRight size={18} />
      </motion.button>

      <motion.button onClick={() => setShowAddTx(true)} whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.4 }}
        style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 16px)', right: '20px', width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #9c6aff)', boxShadow: '0 4px 20px var(--accent-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, border: 'none' }}>
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </motion.button>

      <AddTransactionSheet open={showAddTx} onClose={() => setShowAddTx(false)} />
      <TransferSheet open={showTransfer} onClose={() => setShowTransfer(false)} />
    </>
  );
}

function StatPill({ icon, label, value, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color, marginBottom: '2px' }}>
        {icon}
        <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</span>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function SectionHeader({ title, linkTo }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingLeft: '2px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h2>
      {linkTo && (
        <Link to={linkTo} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '600' }}>
          See all <ChevronRight size={13} />
        </Link>
      )}
    </div>
  );
}

// TxRow receives budgetCategories as prop so it doesn't rely on closure scope
function TxRow({ tx, last, budgetCategories }) {
  const catMeta = budgetCategories[tx.category] || { color: '#7c6aff', icon: '💳' };
  const isExpense = tx.type === 'expense';
  const isNGN = tx.account === 'NGN';
  const isTransfer = tx.type === 'transfer_in' || tx.type === 'transfer_out';

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', gap: '10px', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '10px', background: isTransfer ? 'var(--accent-primary-dim)' : `${catMeta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
        {isTransfer ? '⇄' : catMeta.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {tx.description || tx.category}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
          {isTransfer ? `${tx.account} account` : tx.category} · {tx.date ? format(tx.date, 'dd MMM') : ''}
          {isNGN && !isTransfer && <span style={{ color: 'var(--accent-naira)', marginLeft: '4px' }}>₦</span>}
        </p>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', flexShrink: 0, color: isTransfer ? 'var(--accent-primary)' : isExpense ? (isNGN ? 'var(--accent-naira)' : 'var(--accent-red)') : 'var(--accent-green)' }}>
        {tx.type === 'transfer_out' ? '-' : tx.type === 'transfer_in' ? '+' : isExpense ? '-' : '+'}
        {isNGN ? fmtNGN(tx.amount) : fmtGBP(tx.amount)}
      </span>
    </div>
  );
}
