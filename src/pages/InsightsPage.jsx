// src/pages/InsightsPage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFinance, BUDGET_CATEGORIES, ALL_CATEGORIES } from '../context/FinanceContext';
import { useCurrency, fmtGBP, fmtNGN } from '../context/CurrencyContext';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: '700', marginBottom: '4px', fontSize: '13px', color: 'var(--text-primary)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ fontSize: '12px', color: p.fill || p.stroke || 'var(--text-secondary)' }}>
          {p.name}: {p.name?.includes('₦') ? fmtNGN(p.value) : fmtGBP(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function InsightsPage() {
  const { fetchInsightsData, spentByCategory, spentByCategoryNGN, totalSpentGBP, totalSpentNGN, transactions } = useFinance();
  const { exchangeRate } = useCurrency();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    fetchInsightsData(4).then(d => { setData(d); setLoading(false); });
  }, []);

  const currentMonthData = data[data.length - 1];
  const prevMonthData = data[data.length - 2];

  const monthlyTrend = currentMonthData && prevMonthData && prevMonthData.totalGBP > 0
    ? ((currentMonthData.totalGBP - prevMonthData.totalGBP) / prevMonthData.totalGBP) * 100
    : 0;

  const daysElapsed = Math.max(new Date().getDate(), 1);
  const dailyAvg = totalSpentGBP / daysElapsed;

  const overviewData = data.map(m => ({
    month: m.label,
    'GBP Spent': m.totalGBP,
    'GBP Income': m.incomeGBP,
  }));

  const topGBP = Object.entries(spentByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topNGN = Object.entries(spentByCategoryNGN).sort((a, b) => b[1] - a[1]);
  const hasAnyData = data.some(d => d.totalGBP > 0 || d.totalNGN > 0);
  const hasNGNData = data.some(d => d.totalNGN > 0);

  if (loading) {
    return (
      <div style={{ padding: '60px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
          {[0, 1, 2].map(i => (
            <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading insights…</p>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
            No data yet
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Start logging transactions and your insights will build up here over the coming months. The more you track, the more useful this becomes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>

      {/* View toggle */}
      <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', marginBottom: '16px', gap: '2px' }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'gbp', label: '£ GBP' },
          ...(hasNGNData ? [{ id: 'ngn', label: '₦ Naira' }] : []),
          { id: 'trends', label: 'Trends' },
        ].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} style={{
            flex: 1, padding: '8px 4px', borderRadius: '8px',
            fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-display)',
            background: activeView === v.id ? 'var(--bg-card)' : 'transparent',
            color: activeView === v.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: activeView === v.id ? '1px solid var(--border)' : '1px solid transparent',
            boxShadow: activeView === v.id ? 'var(--shadow-card)' : 'none',
          }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeView === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <KpiCard
              label="vs Last Month"
              value={`${monthlyTrend > 0 ? '+' : ''}${monthlyTrend.toFixed(0)}%`}
              sub={monthlyTrend > 0 ? 'spending up' : monthlyTrend < 0 ? 'spending down' : 'no change'}
              color={monthlyTrend > 5 ? 'var(--accent-red)' : monthlyTrend < -5 ? 'var(--accent-green)' : 'var(--accent-amber)'}
              icon={monthlyTrend > 0 ? <TrendingUp size={15} /> : monthlyTrend < 0 ? <TrendingDown size={15} /> : <Minus size={15} />}
            />
            <KpiCard
              label="Daily Average"
              value={fmtGBP(dailyAvg, true)}
              sub={`over ${daysElapsed} days`}
              color="var(--accent-primary)"
              icon={<span>📅</span>}
            />
          </div>

          {/* This month at a glance */}
          <SLabel>This Month</SLabel>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>GBP Spending</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--accent-red)' }}>{fmtGBP(totalSpentGBP)}</span>
            </div>
            {hasNGNData && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '13px' }}>🇳🇬</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Naira Sent</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--accent-naira)' }}>{fmtNGN(totalSpentNGN)}</p>
                  {exchangeRate > 0 && <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>≈ {fmtGBP(totalSpentNGN / exchangeRate)}</p>}
                </div>
              </div>
            )}
          </div>

          {/* 4-month chart */}
          <SLabel>Income vs Spending (4 months)</SLabel>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '14px' }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={overviewData} barGap={3} barCategoryGap="32%">
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="GBP Income" fill="var(--accent-green)" radius={[4,4,0,0]} />
                <Bar dataKey="GBP Spent" fill="var(--accent-primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
              <LDot color="var(--accent-green)" label="Income" />
              <LDot color="var(--accent-primary)" label="Spent" />
            </div>
          </div>

          {/* Top GBP categories */}
          <SLabel>Top GBP Categories</SLabel>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '14px' }}>
            {topGBP.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No GBP spending yet</p>
            ) : topGBP.map(([cat, amount], i) => {
              const meta = BUDGET_CATEGORIES[cat];
              const pct = totalSpentGBP > 0 ? (amount / totalSpentGBP) * 100 : 0;
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderBottom: i < topGBP.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '8px', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{cat}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{fmtGBP(amount)}</span>
                    </div>
                    <div style={{ height: '3px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.08 }}
                        style={{ height: '100%', borderRadius: '2px', background: meta.color }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, fontWeight: '600', minWidth: '28px', textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── GBP TAB ── */}
      {activeView === 'gbp' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SLabel>GBP Category Breakdown — Last 4 Months</SLabel>
          {ALL_CATEGORIES.filter(cat => data.some(m => (m.byCategory[cat] || 0) > 0)).map((cat, i) => {
            const meta = BUDGET_CATEGORIES[cat];
            const monthValues = data.map(m => ({ name: m.label, value: m.byCategory[cat] || 0 }));
            const maxVal = Math.max(...monthValues.map(m => m.value), 1);
            return (
              <motion.div key={cat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '18px' }}>{meta.icon}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{cat}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: meta.color }}>
                    {fmtGBP(monthValues[monthValues.length - 1]?.value || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '52px' }}>
                  {monthValues.map(mv => (
                    <div key={mv.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden', flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                        <motion.div initial={{ height: 0 }} animate={{ height: `${mv.value > 0 ? Math.max((mv.value / maxVal) * 100, 10) : 0}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          style={{ width: '100%', background: meta.color, borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>{mv.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
          {!data.some(m => Object.keys(m.byCategory).length > 0) && (
            <EmptyState msg="No GBP transactions logged yet" />
          )}
        </motion.div>
      )}

      {/* ── NGN TAB ── */}
      {activeView === 'ngn' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* This month NGN reasons */}
          <SLabel>What Naira Was Spent On This Month</SLabel>
          {topNGN.length === 0 ? (
            <EmptyState msg="No Naira transactions this month" />
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '14px' }}>
              {topNGN.map(([cat, amount], i) => {
                const meta = BUDGET_CATEGORIES[cat];
                const pct = totalSpentNGN > 0 ? (amount / totalSpentNGN) * 100 : 0;
                return (
                  <div key={cat} style={{ padding: '12px 14px', borderBottom: i < topNGN.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '8px', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                        {meta.icon}
                      </div>
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{cat}</span>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '800', color: 'var(--accent-naira)' }}>{fmtNGN(amount)}</p>
                        {exchangeRate > 0 && <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>≈ {fmtGBP(amount / exchangeRate)}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.08 }}
                          style={{ height: '100%', background: meta.color, borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', minWidth: '30px' }}>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* NGN over 4 months */}
          <SLabel>Naira Sent — Last 4 Months</SLabel>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '14px' }}>
            {data.every(d => d.totalNGN === 0) ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>No Naira data across last 4 months</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={data.map(m => ({ month: m.label, '₦ Sent': m.totalNGN }))} barCategoryGap="35%">
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="₦ Sent" fill="var(--accent-naira)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                {exchangeRate > 0 && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                    GBP equivalents based on rate £1 = ₦{exchangeRate?.toLocaleString()}
                  </p>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* ── TRENDS ── */}
      {activeView === 'trends' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SLabel>GBP Trend — 4 Months</SLabel>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '14px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="GBP Spent" stroke="var(--accent-primary)" strokeWidth={2.5} dot={{ fill: 'var(--accent-primary)', r: 4 }} />
                <Line type="monotone" dataKey="GBP Income" stroke="var(--accent-green)" strokeWidth={2.5} dot={{ fill: 'var(--accent-green)', r: 4 }} strokeDasharray="5 4" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
              <LDot color="var(--accent-primary)" label="Spent" />
              <LDot color="var(--accent-green)" label="Income" dashed />
            </div>
          </div>

          <SLabel>Month by Month</SLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...data].reverse().map((m, i) => {
              const prev = data[data.length - 2 - i];
              const diff = prev ? m.totalGBP - prev.totalGBP : null;
              return (
                <motion.div key={m.month} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{m.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Income: {fmtGBP(m.incomeGBP)}{m.totalNGN > 0 ? ` · ₦${fmtNGN(m.totalNGN, true)} sent` : ''}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '800', color: 'var(--accent-red)' }}>{fmtGBP(m.totalGBP)}</p>
                    {diff !== null && diff !== 0 && (
                      <p style={{ fontSize: '11px', fontWeight: '600', color: diff > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                        {diff > 0 ? '↑' : '↓'} {fmtGBP(Math.abs(diff))}
                      </p>
                    )}
                  </div>
                </motion.div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color, marginBottom: '5px' }}>
        {icon}
        <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</p>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</p>
    </div>
  );
}

function SLabel({ children }) {
  return <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700', marginBottom: '8px', paddingLeft: '2px' }}>{children}</p>;
}

function LDot({ color, label, dashed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: 14, height: 3, borderRadius: '2px', background: dashed ? 'transparent' : color, borderTop: dashed ? `2px dashed ${color}` : 'none' }} />
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</span>
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px 16px', textAlign: 'center', marginBottom: '14px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{msg}</p>
    </div>
  );
}
