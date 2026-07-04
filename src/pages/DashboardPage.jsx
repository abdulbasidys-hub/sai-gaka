// src/pages/DashboardPage.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance, BUDGET_CATEGORIES, getBudgetStatus } from '../context/FinanceContext';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, ChevronRight, Plus, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddTransactionSheet from '../components/transactions/AddTransactionSheet';
import IncomeModal from '../components/dashboard/IncomeModal';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
};

function fmt(n) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

export default function DashboardPage() {
  const { totalSpent, totalIncome, balance, transactions, spentByCategory, budgets, unbudgetedCategories } = useFinance();
  const [showAddTx, setShowAddTx] = useState(false);
  const [showIncome, setShowIncome] = useState(false);

  const recentTx = transactions.slice(0, 6);

  const pieData = Object.entries(spentByCategory)
    .map(([cat, amount]) => ({ name: cat, value: amount, color: BUDGET_CATEGORIES[cat]?.color || '#7c6aff' }))
    .sort((a, b) => b.value - a.value).slice(0, 5);

  const spendPct = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0;
  const spendStatus = getBudgetStatus(totalSpent, totalIncome);

  // Categories nearing/over budget
  const budgetAlerts = Object.keys(BUDGET_CATEGORIES).filter(cat => {
    const s = spentByCategory[cat] || 0;
    const b = budgets[cat]?.amount || 0;
    return b > 0 && s / b >= 0.8;
  });

  return (
    <>
      <motion.div variants={stagger.container} initial="initial" animate="animate" style={{ padding: '16px' }}>

        {/* Balance card */}
        <motion.div variants={stagger.item}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-xl)', padding: '22px', marginBottom: '10px',
            position: 'relative', overflow: 'hidden',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px',
              borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-primary-dim) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '6px' }}>
              Net Balance
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '18px' }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: '800', letterSpacing: '-1.5px',
                color: balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', lineHeight: 1,
              }}>
                {balance < 0 ? '-' : ''}{fmt(Math.abs(balance))}
              </span>
              {balance < 0 && <span style={{ color: 'var(--accent-red)', fontSize: '13px', marginBottom: '5px', fontWeight: '600' }}>overdrawn</span>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <StatPill icon={<TrendingUp size={13} />} label="Income" value={fmt(totalIncome)} color="var(--accent-green)" onClick={() => setShowIncome(true)} />
              <StatPill icon={<TrendingDown size={13} />} label="Spent" value={fmt(totalSpent)} color="var(--accent-red)" />
            </div>
          </div>
        </motion.div>

        {/* Spend meter */}
        {totalIncome > 0 && (
          <motion.div variants={stagger.item}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Monthly Spending</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: spendStatus.color }}>
                  {spendPct.toFixed(0)}% — {spendStatus.label}
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${spendPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  style={{ height: '100%', borderRadius: '4px', background: spendStatus.color }}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {fmt(totalSpent)} spent of {fmt(totalIncome)} income
              </p>
            </div>
          </motion.div>
        )}

        {/* Budget alerts */}
        {budgetAlerts.length > 0 && (
          <motion.div variants={stagger.item}>
            <div style={{
              background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)',
              borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: '10px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <AlertTriangle size={16} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-amber)' }}>
                  {budgetAlerts.length} {budgetAlerts.length === 1 ? 'category' : 'categories'} approaching limit
                </p>
                <p style={{ fontSize: '11px', color: 'var(--accent-amber)', opacity: 0.85, marginTop: '1px' }}>
                  {budgetAlerts.map(cat => {
                    const pct = Math.round(((spentByCategory[cat] || 0) / budgets[cat].amount) * 100);
                    return `${BUDGET_CATEGORIES[cat].icon} ${cat} ${pct}%`;
                  }).join('  ·  ')}
                </p>
              </div>
              <Link to="/budget">
                <ChevronRight size={16} color="var(--accent-amber)" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Unbudgeted spend */}
        {unbudgetedCategories.length > 0 && (
          <motion.div variants={stagger.item}>
            <div style={{
              background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)',
              borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: '10px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <AlertTriangle size={16} color="var(--accent-red)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-red)' }}>Unplanned spending</p>
                <p style={{ fontSize: '11px', color: 'var(--accent-red)', opacity: 0.85, marginTop: '1px' }}>
                  {unbudgetedCategories.join(' · ')} — no budget set
                </p>
              </div>
              <Link to="/budget"><ChevronRight size={16} color="var(--accent-red)" /></Link>
            </div>
          </motion.div>
        )}

        {/* Spending breakdown */}
        {pieData.length > 0 && (
          <motion.div variants={stagger.item}>
            <SectionHeader title="Spending Breakdown" linkTo="/budget" />
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 96, height: 96, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={26} outerRadius={44} strokeWidth={0}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {pieData.map(d => {
                    const status = getBudgetStatus(d.value, budgets[d.name]?.amount || 0);
                    return (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ width: 7, height: 7, borderRadius: '2px', background: d.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.name}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: status.level === 'over' ? 'var(--accent-red)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                          {fmt(d.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent activity */}
        <motion.div variants={stagger.item}>
          <SectionHeader title="Recent Activity" linkTo="/transactions" />
          {recentTx.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '36px 16px', textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>💸</div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>No transactions yet</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tap + to log your first transaction</p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '10px' }}>
              {recentTx.map((tx, i) => <TxRow key={tx.id} tx={tx} last={i === recentTx.length - 1} />)}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* FAB */}
      <motion.button
        onClick={() => setShowAddTx(true)}
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
        whileTap={{ scale: 0.92 }}
        style={{
          position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 16px)', right: '20px',
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), #9c6aff)',
          boxShadow: '0 4px 24px var(--accent-primary-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 90, border: 'none',
        }}
      >
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </motion.button>

      <AddTransactionSheet open={showAddTx} onClose={() => setShowAddTx(false)} />
      <IncomeModal open={showIncome} onClose={() => setShowIncome(false)} />
    </>
  );
}

function StatPill({ icon, label, value, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: '3px',
      cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.3px' }}>{label}</span>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{value}</span>
    </button>
  );
}

function SectionHeader({ title, linkTo }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingLeft: '2px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h2>
      {linkTo && (
        <Link to={linkTo} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '600' }}>
          See all <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

function TxRow({ tx, last }) {
  const catMeta = BUDGET_CATEGORIES[tx.category] || { color: '#7c6aff', icon: '💳' };
  const isExpense = tx.type === 'expense';
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', gap: '10px', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${catMeta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
        {catMeta.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {tx.description || tx.category}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
          {tx.subItem ? `${tx.subItem} · ` : ''}{tx.category} · {tx.date ? format(tx.date, 'dd MMM') : ''}
        </p>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: isExpense ? 'var(--accent-red)' : 'var(--accent-green)', flexShrink: 0 }}>
        {isExpense ? '-' : '+'}{fmt(tx.amount)}
      </span>
    </div>
  );
}
