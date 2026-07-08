// src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { format, addMonths, subMonths, parseISO, isSameMonth } from 'date-fns';
import { LogOut, ChevronLeft, ChevronRight, Check, Shield, Sun, Moon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fmtGBP, fmtNGN } from '../context/CurrencyContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { currentMonth, setCurrentMonth, fetchInsightsData } = useFinance();
  const { exchangeRate, rateUpdatedAt, salaryConfig, updateExchangeRate, updateSalaryConfig } = useCurrency();
  const { isDark, toggleTheme } = useTheme();

  const [rateInput, setRateInput] = useState(exchangeRate || '');
  const [salary, setSalary] = useState({
    currency: salaryConfig?.currency || 'GBP',
    amountGBP: salaryConfig?.amountGBP || '',
    amountNGN: salaryConfig?.amountNGN || '',
    dayOfMonth: salaryConfig?.dayOfMonth || 25,
  });
  const [monthlyScores, setMonthlyScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(true);

  useEffect(() => { setRateInput(exchangeRate); }, [exchangeRate]);
  useEffect(() => {
    if (salaryConfig) setSalary({ currency: salaryConfig.currency || 'GBP', amountGBP: salaryConfig.amountGBP || '', amountNGN: salaryConfig.amountNGN || '', dayOfMonth: salaryConfig.dayOfMonth || 25 });
  }, [salaryConfig]);

  // Load 6-month scorecard
  useEffect(() => {
    fetchInsightsData(6).then(data => {
      setMonthlyScores(data);
      setLoadingScores(false);
    });
  }, []);

  const monthDate = parseISO(currentMonth + '-01');

  const handleSaveRate = async () => {
    if (!rateInput || isNaN(rateInput)) return;
    await updateExchangeRate(rateInput);
  };

  const handleSaveSalary = async () => {
    await updateSalaryConfig({
      currency: salary.currency,
      amountGBP: Number(salary.amountGBP) || 0,
      amountNGN: Number(salary.amountNGN) || 0,
      dayOfMonth: Number(salary.dayOfMonth) || 25,
    });
  };

  const isCurrentMonth = isSameMonth(monthDate, new Date());

  return (
    <div style={{ padding: '16px', paddingBottom: '40px' }}>

      {/* Profile + Theme toggle + Logout */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #b06aff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', color: '#fff', boxShadow: '0 0 16px var(--accent-primary-dim)', flexShrink: 0 }}>
            {user?.displayName?.[0]?.toUpperCase() || 'S'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>{user?.displayName || 'Sadik'}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user?.email}</p>
          </div>
        </div>

        {/* Theme toggle row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isDark ? <Moon size={16} color="var(--accent-primary)" /> : <Sun size={16} color="var(--accent-amber)" />}
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
              {isDark ? 'Dark mode' : 'Light mode'}
            </span>
          </div>
          <button onClick={toggleTheme} style={{
            width: 48, height: 26, borderRadius: '13px',
            background: isDark ? 'var(--accent-primary)' : 'var(--bg-elevated)',
            border: `1px solid ${isDark ? 'var(--accent-primary)' : 'var(--border)'}`,
            position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
          }}>
            <div style={{
              position: 'absolute', top: '3px',
              left: isDark ? '25px' : '3px',
              width: 18, height: 18, borderRadius: '50%',
              background: isDark ? '#fff' : 'var(--text-muted)',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {/* Sign out */}
        <button onClick={logout} style={{ width: '100%', padding: '11px', background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-md)', color: 'var(--accent-red)', fontSize: '14px', fontWeight: '700', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <LogOut size={15} /> Sign Out
        </button>
      </motion.div>

      {/* ── Month navigation ── */}
      <SLabel>Viewing Period</SLabel>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setCurrentMonth(format(subMonths(monthDate, 1), 'yyyy-MM'))} style={{ padding: '8px', color: 'var(--text-secondary)', display: 'flex' }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{format(monthDate, 'MMMM yyyy')}</p>
            <p style={{ fontSize: '11px', color: isCurrentMonth ? 'var(--accent-green)' : 'var(--text-muted)', marginTop: '2px', fontWeight: isCurrentMonth ? '600' : '400' }}>
              {isCurrentMonth ? '● Live — current month' : 'Historical view'}
            </p>
          </div>
          <button onClick={() => { const next = addMonths(monthDate, 1); if (next <= new Date()) setCurrentMonth(format(next, 'yyyy-MM')); }} style={{ padding: '8px', color: isCurrentMonth ? 'var(--border)' : 'var(--text-secondary)', display: 'flex' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>

      <div style={{ background: 'var(--accent-primary-dim)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', color: 'var(--accent-primary)', lineHeight: 1.5 }}>
          💡 <strong>How months work:</strong> Each month's data is separate. The app never automatically resets — just use the arrows to switch between months. Budget limits, transactions, and balances all update to show the selected month.
        </p>
      </div>

      {/* ── Monthly Scorecard ── */}
      <SLabel>Monthly Performance</SLabel>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '20px' }}>
        {loadingScores ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
              {[0,1,2].map(i => <motion.div key={i} animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i*0.2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }} />)}
            </div>
          </div>
        ) : monthlyScores.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>No data yet — start logging transactions</p>
        ) : (
          <div>
            {/* Column header */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 40px', gap: '8px', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Month</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Income</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Spent</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>vs prev</p>
            </div>
            {[...monthlyScores].reverse().map((m, i, arr) => {
              const prev = arr[i + 1];
              const trend = prev && prev.totalGBP > 0 ? ((m.totalGBP - prev.totalGBP) / prev.totalGBP) * 100 : null;
              const isCurrent = m.month === format(new Date(), 'yyyy-MM');
              const isViewing = m.month === currentMonth;
              const savedAmount = m.incomeGBP - m.totalGBP;
              return (
                <button key={m.month} onClick={() => setCurrentMonth(m.month)}
                  style={{ width: '100%', display: 'grid', gridTemplateColumns: '80px 1fr 1fr 40px', gap: '8px', padding: '12px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: isViewing ? 'var(--accent-primary-dim)' : 'transparent', textAlign: 'left' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: isViewing ? '800' : '600', color: isViewing ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      {format(parseISO(m.month + '-01'), 'MMM yy')}
                    </p>
                    {isCurrent && <p style={{ fontSize: '9px', color: 'var(--accent-green)', fontWeight: '700' }}>LIVE</p>}
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-green)', fontFamily: 'var(--font-display)' }}>{fmtGBP(m.incomeGBP, true)}</p>
                    {savedAmount > 0 && <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>saved {fmtGBP(savedAmount, true)}</p>}
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: m.totalGBP > m.incomeGBP ? 'var(--accent-red)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{fmtGBP(m.totalGBP, true)}</p>
                    {m.totalNGN > 0 && <p style={{ fontSize: '10px', color: 'var(--accent-naira)' }}>{fmtNGN(m.totalNGN, true)}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {trend === null ? <Minus size={14} color="var(--text-muted)" />
                      : trend > 5 ? <TrendingUp size={14} color="var(--accent-red)" />
                      : trend < -5 ? <TrendingDown size={14} color="var(--accent-green)" />
                      : <Minus size={14} color="var(--accent-amber)" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Salary ── */}
      <SLabel>Salary Setup</SLabel>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>Base salary used as monthly income starting point. Add extra income separately via transactions.</p>

        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Salary currency</p>
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', marginBottom: '14px' }}>
          {['GBP', 'NGN'].map(c => (
            <button key={c} onClick={() => setSalary(s => ({ ...s, currency: c }))} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)', background: salary.currency === c ? 'var(--accent-primary)' : 'transparent', color: salary.currency === c ? '#fff' : 'var(--text-secondary)' }}>
              {c === 'GBP' ? '🇬🇧 GBP' : '🇳🇬 NGN'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {[{ label: 'GBP Amount', sym: '£', key: 'amountGBP', active: salary.currency === 'GBP' }, { label: 'NGN Amount', sym: '₦', key: 'amountNGN', active: salary.currency === 'NGN' }].map(f => (
            <div key={f.key} style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>{f.label}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', border: `1px solid ${f.active ? 'var(--accent-primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--text-muted)' }}>{f.sym}</span>
                <input type="number" value={salary[f.key]} onChange={e => setSalary(s => ({ ...s, [f.key]: e.target.value }))} placeholder="0"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }} />
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Payday</p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[1, 5, 10, 15, 20, 25, 28, 30].map(d => (
            <button key={d} onClick={() => setSalary(s => ({ ...s, dayOfMonth: d }))} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-display)', border: `1px solid ${salary.dayOfMonth === d ? 'var(--accent-primary)' : 'var(--border)'}`, background: salary.dayOfMonth === d ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)', color: salary.dayOfMonth === d ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{d}</button>
          ))}
          <input type="number" min="1" max="31" placeholder="Other"
            value={![1,5,10,15,20,25,28,30].includes(salary.dayOfMonth) ? salary.dayOfMonth : ''}
            onChange={e => setSalary(s => ({ ...s, dayOfMonth: Number(e.target.value) }))}
            style={{ width: '64px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-display)', outline: 'none', textAlign: 'center' }} />
        </div>

        <button onClick={handleSaveSalary} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--accent-primary), #9c6aff)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '14px', fontWeight: '700', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Check size={15} /> Save Salary Settings
        </button>
      </motion.div>

      {/* ── Exchange Rate ── */}
      <SLabel>GBP → NGN Rate</SLabel>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
          Enter the rate <strong>you actually receive</strong> after app charges (Wise, Sendwave, etc). Update it whenever it changes.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>£1 =</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-muted)' }}>₦</span>
          <input type="number" value={rateInput} onChange={e => setRateInput(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }} />
        </div>
        {rateUpdatedAt && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Last updated: {format(new Date(rateUpdatedAt), 'dd MMM yyyy, HH:mm')}</p>}
        <button onClick={handleSaveRate} style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg, var(--accent-naira), #22c55e)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Check size={14} /> Save Rate
        </button>
      </motion.div>

      {/* ── App info ── */}
      <SLabel>App</SLabel>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px' }}>
          <Shield size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', flex: 1 }}>Data & Privacy</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Firebase secured</span>
        </div>
      </motion.div>

      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>Sadik Finance v2.0 · Private App</p>
    </div>
  );
}

function SLabel({ children }) {
  return <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '2px' }}>{children}</p>;
}
