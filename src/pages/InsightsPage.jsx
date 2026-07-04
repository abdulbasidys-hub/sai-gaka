// src/pages/InsightsPage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFinance, BUDGET_CATEGORIES, ALL_CATEGORIES } from '../context/FinanceContext';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function fmt(n) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
    }}>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill || p.stroke || 'var(--text-secondary)' }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function InsightsPage() {
  const { fetchInsightsData, spentByCategory, totalSpent, totalIncome, transactions } = useFinance();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview'); // overview | categories | trends

  useEffect(() => {
    fetchInsightsData(4).then(d => { setData(d); setLoading(false); });
  }, []);

  const currentMonth = data[data.length - 1];
  const prevMonth = data[data.length - 2];

  const monthlyTrend = currentMonth && prevMonth
    ? ((currentMonth.total - prevMonth.total) / (prevMonth.total || 1)) * 100
    : 0;

  // Category comparison data for bar chart
  const categoryCompareData = ALL_CATEGORIES.map(cat => {
    const row = { category: cat.split(' ')[0], icon: BUDGET_CATEGORIES[cat].icon };
    data.forEach(m => { row[m.label] = m.byCategory[cat] || 0; });
    return row;
  }).filter(row => data.some(m => row[m.label] > 0));

  // Monthly overview bar chart data
  const overviewData = data.map(m => ({
    month: m.label, Spent: m.total, Income: m.income,
  }));

  // Top spending categories this month
  const topCats = Object.entries(spentByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Avg daily spend
  const daysInData = transactions.length > 0 ? (new Date().getDate()) : 1;
  const dailyAvg = totalSpent / daysInData;

  if (loading) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px' }}>Loading insights…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>

      {/* View toggle */}
      <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', marginBottom: '16px', gap: '2px' }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'categories', label: 'Categories' },
          { id: 'trends', label: 'Trends' },
        ].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} style={{
            flex: 1, padding: '8px 6px', borderRadius: '8px',
            fontSize: '12px', fontWeight: '600', fontFamily: 'var(--font-display)',
            background: activeView === v.id ? 'var(--bg-card)' : 'transparent',
            color: activeView === v.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: activeView === v.id ? '1px solid var(--border)' : '1px solid transparent',
            boxShadow: activeView === v.id ? 'var(--shadow-card)' : 'none',
            transition: 'all 0.2s',
          }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeView === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <KpiCard
              label="vs Last Month"
              value={`${monthlyTrend > 0 ? '+' : ''}${monthlyTrend.toFixed(0)}%`}
              sub={monthlyTrend > 0 ? 'spending up' : monthlyTrend < 0 ? 'spending down' : 'no change'}
              color={monthlyTrend > 5 ? 'var(--accent-red)' : monthlyTrend < -5 ? 'var(--accent-green)' : 'var(--accent-amber)'}
              icon={monthlyTrend > 0 ? <TrendingUp size={16} /> : monthlyTrend < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
            />
            <KpiCard
              label="Daily Average"
              value={fmt(dailyAvg)}
              sub={`over ${daysInData} days`}
              color="var(--accent-primary)"
              icon={<span style={{ fontSize: '16px' }}>📅</span>}
            />
          </div>

          {/* Monthly income vs spend bar */}
          <SectionLabel>Income vs Spending (4 months)</SectionLabel>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '14px' }}>
            {overviewData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>Not enough data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={overviewData} barGap={4} barCategoryGap="30%">
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Income" fill="var(--accent-green)" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="Spent" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
              <LegendDot color="var(--accent-green)" label="Income" />
              <LegendDot color="var(--accent-primary)" label="Spent" />
            </div>
          </div>

          {/* Top categories this month */}
          <SectionLabel>Top Spending This Month</SectionLabel>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '14px' }}>
            {topCats.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 16px' }}>No spending data yet</p>
            ) : topCats.map(([cat, amount], i) => {
              const meta = BUDGET_CATEGORIES[cat];
              const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: i < topCats.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{cat}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{fmt(amount)}</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.1 }}
                        style={{ height: '100%', borderRadius: '2px', background: meta.color }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, fontWeight: '600' }}>{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── CATEGORIES ── */}
      {activeView === 'categories' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SectionLabel>Category Breakdown — Last 4 Months</SectionLabel>
          {categoryCompareData.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 16px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No data yet — start logging transactions!</p>
            </div>
          ) : categoryCompareData.map((row, i) => {
            const catKey = ALL_CATEGORIES.find(c => c.startsWith(row.category)) || ALL_CATEGORIES[i];
            const meta = BUDGET_CATEGORIES[catKey] || { color: '#7c6aff', icon: '💳' };
            const monthValues = data.map(m => ({ name: m.label, value: row[m.label] || 0 }));
            const maxVal = Math.max(...monthValues.map(m => m.value), 1);
            return (
              <motion.div key={row.category} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '18px' }}>{meta.icon}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{catKey}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  {monthValues.map(mv => (
                    <div key={mv.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>{fmt(mv.value)}</span>
                      <div style={{ width: '100%', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden', height: '48px', display: 'flex', alignItems: 'flex-end' }}>
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: `${mv.value > 0 ? Math.max((mv.value / maxVal) * 100, 8) : 0}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          style={{ width: '100%', background: meta.color, borderRadius: '3px' }}
                        />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{mv.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── TRENDS ── */}
      {activeView === 'trends' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SectionLabel>Spending Trend (4 months)</SectionLabel>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '14px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Spent" stroke="var(--accent-primary)" strokeWidth={2.5} dot={{ fill: 'var(--accent-primary)', r: 4 }} name="Spent" />
                <Line type="monotone" dataKey="Income" stroke="var(--accent-green)" strokeWidth={2.5} dot={{ fill: 'var(--accent-green)', r: 4 }} name="Income" strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
              <LegendDot color="var(--accent-primary)" label="Spent" />
              <LegendDot color="var(--accent-green)" label="Income" dashed />
            </div>
          </div>

          {/* Month-over-month summary */}
          <SectionLabel>Month Summary</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.map((m, i) => {
              const prev = data[i - 1];
              const diff = prev ? m.total - prev.total : null;
              return (
                <div key={m.month} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{m.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Income: {fmt(m.income)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '800', color: 'var(--accent-red)' }}>{fmt(m.total)}</p>
                    {diff !== null && (
                      <p style={{ fontSize: '11px', fontWeight: '600', color: diff > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                        {diff > 0 ? '↑' : '↓'} {fmt(Math.abs(diff))} vs prev
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, marginBottom: '6px' }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</p>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</p>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600', marginBottom: '10px', paddingLeft: '2px' }}>
      {children}
    </p>
  );
}

function LegendDot({ color, label, dashed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: 12, height: 3, borderRadius: '2px', background: color, borderTop: dashed ? `2px dashed ${color}` : 'none' }} />
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</span>
    </div>
  );
}
