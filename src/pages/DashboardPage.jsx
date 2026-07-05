// src/pages/DashboardPage.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance, BUDGET_CATEGORIES, getBudgetStatus } from '../context/FinanceContext';
import { useCurrency, fmtGBP, fmtNGN } from '../context/CurrencyContext';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, ChevronRight, Plus, AlertTriangle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import TransferSheet from '../components/transfer/TransferSheet';
import AddTransactionSheet from '../components/transactions/AddTransactionSheet';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.32 } } },
};

export default function DashboardPage() {
  const {
    totalSpentGBP, totalIncomeGBP, balanceGBP,
    totalSpentNGN, totalIncomeNGN,
    transactions, spentByCategory, spentByCategoryNGN,
    budgets, unbudgetedCategories, salarySettings, getSalaryNextDate,
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

  const hasNGNActivity = totalSpentNGN > 0 || totalIncomeNGN > 0;

  return (
    <>
      <motion.div variants={stagger.container} initial="initial" animate="animate" style={{ padding: '16px' }}>

        {/* ── GBP Balance Card ── */}
        <motion.div variants={stagger.item}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '10px',
            position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-glow)',
          }}>
            <div style={{
              position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px',
              borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-primary-dim) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '700', marginBottom: '12px' }}>
              Accounts
            </p>
            {/* Two account balances side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>🇬🇧</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>GBP</span>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: balanceGBP >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', letterSpacing: '-0.5px' }}>
                  {balanceGBP < 0 ? '-' : ''}{fmtGBP(Math.abs(balanceGBP))}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  In: {fmtGBP(totalIncomeGBP)} · Out: {fmtGBP(totalSpentGBP)}
                </p>
              </div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent-naira-dim)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>🇳🇬</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent-naira)', fontWeight: '700' }}>NGN</span>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: balanceNGN >= 0 ? 'var(--accent-naira)' : 'var(--accent-red)', letterSpacing: '-0.5px' }}>
                  {balanceNGN < 0 ? '-' : ''}{fmtNGN(Math.abs(balanceNGN), true)}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Out: {fmtNGN(totalSpentNGN, true)}
                </p>
              </div>
            </div>

            {/* Salary chip */}
            {salarySettings?.dayOfMonth && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Salary {salarySettings.currency === 'GBP' ? fmtGBP(salarySettings.amountGBP) : fmtNGN(salarySettings.amountNGN, true)}
                    {daysUntilSalary !== null && ` · ${daysUntilSalary === 0 ? 'pays today! 🎉' : daysUntilSalary === 1 ? 'tomorrow' : `in ${daysUntilSalary} days`}`}
                  </span>
                </div>
                <button onClick={() => setShowTransfer(true)} style={{
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700',
                  color: 'var(--accent-primary)', background: 'var(--accent-primary-dim)',
                  border: '1px solid var(--accent-primary)', borderRadius: '6px', padding: '4px 8px',
                }}>
                  ⇄ Convert
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── NGN Activity Card (only shows when there's NGN data) ── */}
        {hasNGNActivity && (
          <motion.div variants={stagger.item}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--accent-naira)',
              borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: '10px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px',
                borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-naira-dim) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px' }}>🇳🇬</span>
                <p style={{ fontSize: '10px', color: 'var(--accent-naira)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                  Naira Activity This Month
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <StatPill icon={<TrendingDown size={12} />} label="Sent (₦)" value={fmtNGN(totalSpentNGN, true)} color="var(--accent-red)" />
                {totalIncomeNGN > 0 && <StatPill icon={<TrendingUp size={12} />} label="Received (₦)" value={fmtNGN(totalIncomeNGN, true)} color="var(--accent-naira)" />}
                {exchangeRate > 0 && totalSpentNGN > 0 && (
                  <StatPill icon={<span style={{ fontSize: '11px' }}>£</span>} label="GBP equiv" value={fmtGBP(totalSpentNGN / exchangeRate)} color="var(--text-secondary)" />
                )}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Rate: £1 = ₦{exchangeRate?.toLocaleString()} · <Link to="/settings" style={{ color: 'var(--accent-primary)' }}>Update</Link>
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Spend meter ── */}
        {totalIncomeGBP > 0 && (
          <motion.div variants={stagger.item}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Monthly Spending</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: spendStatus.color }}>
                  {spendPct.toFixed(0)}% — {spendStatus.label}
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${spendPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  style={{ height: '100%', borderRadius: '4px', background: spendStatus.color }} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                {fmtGBP(totalSpentGBP)} of {fmtGBP(totalIncomeGBP)} income
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Alerts ── */}
        {budgetAlerts.length > 0 && (
          <motion.div variants={stagger.item}>
            <div style={{
              background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)',
              borderRadius: 'var(--radius-lg)', padding: '11px 14px', marginBottom: '10px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}>
              <AlertTriangle size={15} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-amber)' }}>
                  {budgetAlerts.length} {budgetAlerts.length === 1 ? 'category' : 'categories'} approaching limit
                </p>
                <p style={{ fontSize: '11px', color: 'var(--accent-amber)', opacity: 0.9, marginTop: '2px' }}>
                  {budgetAlerts.map(cat => `${BUDGET_CATEGORIES[cat].icon} ${Math.round(((spentByCategory[cat] || 0) / budgets[cat].amount) * 100)}%`).join('  ·  ')}
                </p>
              </div>
              <Link to="/budget"><ChevronRight size={15} color="var(--accent-amber)" /></Link>
            </div>
          </motion.div>
        )}

        {unbudgetedCategories.length > 0 && (
          <motion.div variants={stagger.item}>
            <div style={{
              background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)',
              borderRadius: 'var(--radius-lg)', padding: '11px 14px', marginBottom: '10px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}>
              <AlertTriangle size={15} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-red)' }}>Unplanned spending</p>
                <p style={{ fontSize: '11px', color: 'var(--accent-red)', opacity: 0.85, marginTop: '2px' }}>{unbudgetedCategories.join(' · ')}</p>
              </div>
              <Link to="/budget"><ChevronRight size={15} color="var(--accent-red)" /></Link>
            </div>
          </motion.div>
        )}

        {/* ── Breakdown pie ── */}
        {pieData.length > 0 && (
          <motion.div variants={stagger.item}>
            <SectionHeader title="GBP Breakdown" linkTo="/budget" />
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 90, height: 90, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={24} outerRadius={42} strokeWidth={0}>
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
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                        {fmtGBP(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── NGN breakdown (if any) ── */}
        {Object.keys(spentByCategoryNGN).length > 0 && (
          <motion.div variants={stagger.item}>
            <SectionHeader title="₦ Naira Spending" linkTo="/insights" />
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '10px' }}>
              {Object.entries(spentByCategoryNGN).sort((a, b) => b[1] - a[1]).map(([cat, amount], i, arr) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '16px' }}>{BUDGET_CATEGORIES[cat]?.icon || '💳'}</span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{cat}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '700', color: 'var(--accent-naira)' }}>{fmtNGN(amount)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Recent transactions ── */}
        <motion.div variants={stagger.item}>
          <SectionHeader title="Recent" linkTo="/transactions" />
          {recentTx.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px 16px', textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '30px', marginBottom: '10px' }}>💸</div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Nothing yet</p>
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
        transition={{ type: 'spring', stiffness: 300, delay: 0.4 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 16px)', right: '20px',
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), #9c6aff)',
          boxShadow: '0 4px 20px var(--accent-primary-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, border: 'none',
        }}
      >
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </motion.button>

      <AddTransactionSheet open={showAddTx} onClose={() => setShowAddTx(false)} />
    </>
  );
}

function StatPill({ icon, label, value, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '9px 10px',
      display: 'flex', flexDirection: 'column', gap: '2px',
      cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color }}>
        {icon}
        <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{value}</span>
    </button>
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

function TxRow({ tx, last }) {
  const catMeta = BUDGET_CATEGORIES[tx.category] || { color: '#7c6aff', icon: '💳' };
  const isExpense = tx.type === 'expense';
  const isNGN = tx.currency === 'NGN';
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
          {tx.category} · {tx.date ? format(tx.date, 'dd MMM') : ''}
          {isNGN && <span style={{ color: 'var(--accent-naira)', marginLeft: '4px' }}>₦</span>}
        </p>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: isExpense ? (isNGN ? 'var(--accent-naira)' : 'var(--accent-red)') : 'var(--accent-green)', flexShrink: 0 }}>
        {isExpense ? '-' : '+'}{isNGN ? fmtNGN(tx.amount) : fmtGBP(tx.amount)}
      </span>
    </div>
  );
}
