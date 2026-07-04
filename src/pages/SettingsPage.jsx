// src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useCurrency, fmtGBP, fmtNGN } from '../context/CurrencyContext';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { LogOut, ChevronLeft, ChevronRight, RefreshCw, Check, Banknote, Calendar, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { currentMonth, setCurrentMonth } = useFinance();
  const { exchangeRate, rateUpdatedAt, salaryConfig, updateExchangeRate, updateSalaryConfig, fetchLiveRate } = useCurrency();

  const [rateInput, setRateInput] = useState(exchangeRate || '');
  const [fetchingRate, setFetchingRate] = useState(false);

  // Salary form state
  const [salary, setSalary] = useState({
    currency: salaryConfig?.currency || 'GBP',
    amountGBP: salaryConfig?.amountGBP || '',
    amountNGN: salaryConfig?.amountNGN || '',
    dayOfMonth: salaryConfig?.dayOfMonth || 25,
  });

  useEffect(() => {
    setRateInput(exchangeRate);
  }, [exchangeRate]);

  useEffect(() => {
    if (salaryConfig) {
      setSalary({
        currency: salaryConfig.currency || 'GBP',
        amountGBP: salaryConfig.amountGBP || '',
        amountNGN: salaryConfig.amountNGN || '',
        dayOfMonth: salaryConfig.dayOfMonth || 25,
      });
    }
  }, [salaryConfig]);

  const monthDate = parseISO(currentMonth + '-01');

  const handleSaveRate = async () => {
    if (!rateInput || isNaN(rateInput)) return;
    await updateExchangeRate(rateInput);
  };

  const handleFetchRate = async () => {
    setFetchingRate(true);
    const rate = await fetchLiveRate();
    if (rate) setRateInput(rate);
    setFetchingRate(false);
  };

  const handleSaveSalary = async () => {
    await updateSalaryConfig({
      currency: salary.currency,
      amountGBP: Number(salary.amountGBP) || 0,
      amountNGN: Number(salary.amountNGN) || 0,
      dayOfMonth: Number(salary.dayOfMonth) || 25,
    });
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '40px' }}>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), #b06aff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', color: '#fff',
          boxShadow: '0 0 16px var(--accent-primary-dim)', flexShrink: 0,
        }}>
          {user?.displayName?.[0]?.toUpperCase() || 'S'}
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {user?.displayName || 'Sadik'}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user?.email}</p>
        </div>
      </motion.div>

      {/* ── Month navigation ── */}
      <Label>Viewing Period</Label>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setCurrentMonth(format(subMonths(monthDate, 1), 'yyyy-MM'))}
            style={{ padding: '8px', color: 'var(--text-secondary)', display: 'flex' }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {format(monthDate, 'MMMM yyyy')}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>All data shown is for this month</p>
          </div>
          <button
            onClick={() => {
              const next = addMonths(monthDate, 1);
              if (next <= new Date()) setCurrentMonth(format(next, 'yyyy-MM'));
            }}
            style={{ padding: '8px', color: 'var(--text-secondary)', display: 'flex' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>

      {/* ── Salary Configuration ── */}
      <Label>Salary Setup</Label>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '20px' }}>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
          Set your base salary — it will be used as your monthly income starting point. Add extra income separately as a transaction.
        </p>

        {/* Currency of salary */}
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Salary currency</p>
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '3px', marginBottom: '14px' }}>
          {['GBP', 'NGN'].map(c => (
            <button key={c} onClick={() => setSalary(s => ({ ...s, currency: c }))} style={{
              flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
              fontFamily: 'var(--font-display)',
              background: salary.currency === c ? 'var(--accent-primary)' : 'transparent',
              color: salary.currency === c ? '#fff' : 'var(--text-secondary)',
            }}>
              {c === 'GBP' ? '£ British Pound' : '₦ Nigerian Naira'}
            </button>
          ))}
        </div>

        {/* Salary amounts */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>GBP Amount</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', border: `1px solid ${salary.currency === 'GBP' ? 'var(--accent-primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--text-muted)' }}>£</span>
              <input type="number" value={salary.amountGBP} onChange={e => setSalary(s => ({ ...s, amountGBP: e.target.value }))}
                placeholder="0"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>NGN Amount</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', border: `1px solid ${salary.currency === 'NGN' ? 'var(--accent-naira)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--text-muted)' }}>₦</span>
              <input type="number" value={salary.amountNGN} onChange={e => setSalary(s => ({ ...s, amountNGN: e.target.value }))}
                placeholder="0"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }} />
            </div>
          </div>
        </div>

        {/* Payday */}
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Payday (day of month)</p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[1, 5, 10, 15, 20, 25, 28, 30].map(d => (
            <button key={d} onClick={() => setSalary(s => ({ ...s, dayOfMonth: d }))} style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              fontFamily: 'var(--font-display)',
              border: `1px solid ${salary.dayOfMonth === d ? 'var(--accent-primary)' : 'var(--border)'}`,
              background: salary.dayOfMonth === d ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)',
              color: salary.dayOfMonth === d ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}>
              {d}
            </button>
          ))}
          <input type="number" min="1" max="31" placeholder="Other"
            value={![1,5,10,15,20,25,28,30].includes(salary.dayOfMonth) ? salary.dayOfMonth : ''}
            onChange={e => setSalary(s => ({ ...s, dayOfMonth: Number(e.target.value) }))}
            style={{
              width: '64px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '6px 10px', color: 'var(--text-primary)',
              fontSize: '13px', fontFamily: 'var(--font-display)', outline: 'none', textAlign: 'center',
            }}
          />
        </div>

        <motion.button onClick={handleSaveSalary} whileTap={{ scale: 0.97 }} style={{
          width: '100%', padding: '12px',
          background: 'linear-gradient(135deg, var(--accent-primary), #9c6aff)',
          border: 'none', borderRadius: 'var(--radius-md)',
          color: '#fff', fontSize: '14px', fontWeight: '700', fontFamily: 'var(--font-display)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <Check size={15} /> Save Salary Settings
        </motion.button>
      </motion.div>

      {/* ── Exchange Rate ── */}
      <Label>GBP → NGN Exchange Rate</Label>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '20px' }}>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
          Used to show approximate GBP value of Naira transactions. Update whenever the rate changes.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>£1 =</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-muted)' }}>₦</span>
          <input type="number" value={rateInput} onChange={e => setRateInput(e.target.value)}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)',
            }} />
        </div>

        {rateUpdatedAt && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Last updated: {format(new Date(rateUpdatedAt), 'dd MMM yyyy, HH:mm')}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button onClick={handleSaveRate} whileTap={{ scale: 0.97 }} style={{
            flex: 1, padding: '11px',
            background: 'linear-gradient(135deg, var(--accent-naira), #22c55e)',
            border: 'none', borderRadius: 'var(--radius-md)',
            color: '#fff', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}>
            <Check size={14} /> Save Rate
          </motion.button>
          <motion.button onClick={handleFetchRate} disabled={fetchingRate} whileTap={{ scale: 0.97 }} style={{
            flex: 1, padding: '11px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-display)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}>
            <RefreshCw size={13} className={fetchingRate ? 'spin' : ''} />
            {fetchingRate ? 'Fetching…' : 'Get Live Rate'}
          </motion.button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
          Live rate auto-fetch may not always succeed — manual entry as backup.
        </p>
      </motion.div>

      {/* ── Security ── */}
      <Label>App</Label>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px' }}>
          <Shield size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', flex: 1 }}>Data & Privacy</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Firebase secured</span>
        </div>
      </motion.div>

      {/* ── Sign out ── */}
      <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        onClick={logout} whileTap={{ scale: 0.97 }}
        style={{
          width: '100%', padding: '14px',
          background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)',
          borderRadius: 'var(--radius-lg)', color: 'var(--accent-red)',
          fontSize: '15px', fontWeight: '700', fontFamily: 'var(--font-display)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        <LogOut size={16} /> Sign Out
      </motion.button>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
        Sadik Finance v2.0 · Private App
      </p>
    </div>
  );
}

function Label({ children }) {
  return (
    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '2px' }}>
      {children}
    </p>
  );
}
