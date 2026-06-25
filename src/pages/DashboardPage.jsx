// src/pages/DashboardPage.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance, BUDGET_CATEGORIES } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, startOfMonth } from 'date-fns';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import { TrendingDown, TrendingUp, Wallet, ChevronRight, Plus, Pencil } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AddTransactionSheet from '../components/transactions/AddTransactionSheet';
import IncomeModal from '../components/dashboard/IncomeModal';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08 } } },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  },
};

function formatCurrency(n) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const { totalSpent, totalIncome, balance, transactions, spentByCategory, budgets, monthlyIncome } = useFinance();
  const { user } = useAuth();
  const [showAddTx, setShowAddTx] = useState(false);
  const [showIncome, setShowIncome] = useState(false);

  const recentTx = transactions.slice(0, 5);

  // Pie chart data for spending
  const pieData = Object.entries(spentByCategory).map(([cat, amount]) => ({
    name: cat,
    value: amount,
    color: BUDGET_CATEGORIES[cat]?.color || '#7c6aff',
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const spendPercent = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0;

  return (
    <>
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        style={{ padding: '16px' }}
      >
        {/* Balance Card */}
        <motion.div variants={stagger.item}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            marginBottom: '12px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-glow)',
          }}>
            {/* Glow */}
            <div style={{
              position: 'absolute',
              top: '-40px', right: '-40px',
              width: '180px', height: '180px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124,106,255,0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '8px' }}>
              Net Balance
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '20px' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '38px',
                fontWeight: '800',
                letterSpacing: '-2px',
                color: balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                lineHeight: 1,
              }}>
                {formatCurrency(Math.abs(balance))}
              </span>
              {balance < 0 && <span style={{ color: 'var(--accent-red)', fontSize: '14px', marginBottom: '4px' }}>overdrawn</span>}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <StatPill
                icon={<TrendingUp size={13} />}
                label="Income"
                value={formatCurrency(totalIncome)}
                color="var(--accent-green)"
                onClick={() => setShowIncome(true)}
              />
              <StatPill
                icon={<TrendingDown size={13} />}
                label="Spent"
                value={formatCurrency(totalSpent)}
                color="var(--accent-red)"
              />
            </div>
          </div>
        </motion.div>

        {/* Spend meter */}
        {totalIncome > 0 && (
          <motion.div variants={stagger.item}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-display)' }}>Monthly Spending</span>
                <span style={{
                  fontSize: '13px', fontWeight: '700',
                  color: spendPercent > 80 ? 'var(--accent-red)' : spendPercent > 60 ? 'var(--accent-amber)' : 'var(--accent-green)'
                }}>
                  {spendPercent.toFixed(0)}%
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spendPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  style={{
                    height: '100%',
                    borderRadius: '4px',
                    background: spendPercent > 80
                      ? 'linear-gradient(90deg, #f87171, #ff4444)'
                      : spendPercent > 60
                        ? 'linear-gradient(90deg, #fbbf24, #f97316)'
                        : 'linear-gradient(90deg, #4ade80, #22d3ee)',
                  }}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                {formatCurrency(totalSpent)} of {formatCurrency(totalIncome)} spent
              </p>
            </div>
          </motion.div>
        )}

        {/* Spending breakdown */}
        {pieData.length > 0 && (
          <motion.div variants={stagger.item}>
            <SectionHeader title="Spending Breakdown" linkTo="/budget" />
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Pie chart */}
                <div style={{ width: 100, height: 100, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={46} strokeWidth={0}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {pieData.map((d) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '2px', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {formatCurrency(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent transactions */}
        <motion.div variants={stagger.item}>
          <SectionHeader title="Recent Activity" linkTo="/transactions" />
          {recentTx.length === 0 ? (
            <EmptyState
              icon="💸"
              title="No transactions yet"
              subtitle="Tap + to add your first transaction"
            />
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              marginBottom: '12px',
            }}>
              {recentTx.map((tx, i) => (
                <TxRow key={tx.id} tx={tx} last={i === recentTx.length - 1} />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* FAB */}
      <motion.button
        onClick={() => setShowAddTx(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
        whileTap={{ scale: 0.92 }}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height) + 16px)',
          right: '20px',
          width: 52, height: 52,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c6aff, #9c6aff)',
          boxShadow: '0 4px 24px rgba(124,106,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 90,
          border: 'none',
          cursor: 'pointer',
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
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.3px' }}>{label}</span>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
        {value}
      </span>
    </button>
  );
}

function SectionHeader({ title, linkTo }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingLeft: '2px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '700', letterSpacing: '-0.3px' }}>{title}</h2>
      {linkTo && (
        <Link to={linkTo} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', color: 'var(--accent-primary)' }}>
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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      gap: '12px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
        background: `${catMeta.color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px',
      }}>
        {catMeta.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {tx.description || tx.category}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {tx.category} · {tx.date ? format(tx.date, 'dd MMM') : ''}
        </p>
      </div>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: '15px',
        fontWeight: '700',
        color: isExpense ? 'var(--accent-red)' : 'var(--accent-green)',
        flexShrink: 0,
      }}>
        {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
      </span>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '32px 16px',
      textAlign: 'center',
      marginBottom: '12px',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '4px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{subtitle}</p>
    </div>
  );
}
