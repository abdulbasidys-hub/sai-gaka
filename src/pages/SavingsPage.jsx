// src/pages/SavingsPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, PiggyBank, Target, X, Check, TrendingUp } from 'lucide-react';

function fmt(n) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

const GOAL_ICONS = ['🏠', '🚗', '✈️', '💍', '📱', '🎓', '💰', '🏥', '🎮', '👶', '💼', '🌍'];
const GOAL_COLORS = ['#7c6aff', '#4ade80', '#fbbf24', '#fb923c', '#f87171', '#38bdf8', '#e879f9', '#34d399'];

export default function SavingsPage() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useFinance();
  const [showCreate, setShowCreate] = useState(false);
  const [showContribute, setShowContribute] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const totalSaved = savingsGoals.reduce((s, g) => s + (g.currentAmount || 0), 0);
  const totalTarget = savingsGoals.reduce((s, g) => s + (g.targetAmount || 0), 0);

  const handleContribute = async () => {
    if (!showContribute || !contributeAmount) return;
    const goal = savingsGoals.find(g => g.id === showContribute);
    if (!goal) return;
    const newAmount = (goal.currentAmount || 0) + parseFloat(contributeAmount);
    await updateSavingsGoal(showContribute, { currentAmount: Math.min(newAmount, goal.targetAmount) });
    setShowContribute(null);
    setContributeAmount('');
  };

  return (
    <>
      <div style={{ padding: '16px' }}>
        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--accent-green-dim)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            marginBottom: '16px',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 0 32px var(--accent-green-dim)',
          }}
        >
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: 140, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(74,222,128,0.15) 0%, transparent 70%)',
          }} />
          <p style={{ fontSize: '11px', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>
            Total Saved
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '800', letterSpacing: '-1.5px', color: 'var(--accent-green)', marginBottom: '4px' }}>
            {fmt(totalSaved)}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            of {fmt(totalTarget)} total target · {savingsGoals.length} goal{savingsGoals.length !== 1 ? 's' : ''}
          </p>
          {totalTarget > 0 && (
            <div style={{ marginTop: '14px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalSaved / totalTarget) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #4ade80, #22d3ee)' }}
              />
            </div>
          )}
        </motion.div>

        {/* Goals */}
        {savingsGoals.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '48px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '4px' }}>No savings goals yet</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Set a goal and start building wealth</p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                padding: '10px 20px', fontSize: '14px', fontWeight: '700',
                fontFamily: 'var(--font-display)',
              }}
            >
              Create First Goal
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {savingsGoals.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={i}
                onContribute={() => setShowContribute(goal.id)}
                onDelete={() => deleteSavingsGoal(goal.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setShowCreate(true)}
        whileTap={{ scale: 0.92 }}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height) + 16px)', right: '20px',
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #4ade80, #22c55e)',
          boxShadow: '0 4px 24px rgba(74,222,128,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 90, border: 'none', cursor: 'pointer',
        }}
      >
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </motion.button>

      <CreateGoalSheet open={showCreate} onClose={() => setShowCreate(false)} />

      {/* Contribute modal */}
      <AnimatePresence>
        {showContribute && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowContribute(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 48px)', maxWidth: 360,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)', padding: '24px', zIndex: 301,
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                Add to Goal
              </h3>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-muted)' }}>£</span>
                <input
                  type="number" inputMode="decimal" placeholder="0.00"
                  value={contributeAmount} onChange={e => setContributeAmount(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowContribute(null)} style={{
                  flex: 1, padding: '12px', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: '600', fontSize: '14px',
                }}>Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleContribute} style={{
                  flex: 1, padding: '12px',
                  background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  color: '#fff', fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '14px',
                }}>Add Funds</motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function GoalCard({ goal, index, onContribute, onDelete }) {
  const pct = goal.targetAmount > 0 ? Math.min(((goal.currentAmount || 0) / goal.targetAmount) * 100, 100) : 0;
  const completed = pct >= 100;
  const color = goal.color || '#4ade80';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${completed ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {completed && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'var(--accent-green)', color: '#0a0a0f',
          fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px',
          padding: '2px 8px', borderRadius: '20px',
        }}>
          ✓ COMPLETE
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '12px',
          background: `${color}20`, fontSize: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {goal.icon || '💰'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>{goal.name}</p>
          {goal.deadline && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target: {goal.deadline}</p>
          )}
        </div>
        <button onClick={onDelete} style={{ color: 'var(--text-muted)', display: 'flex' }}>
          <Trash2 size={15} />
        </button>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color }}>
            {fmt(goal.currentAmount || 0)}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', alignSelf: 'flex-end' }}>
            of {fmt(goal.targetAmount)}
          </span>
        </div>
        <div style={{ height: '7px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%', borderRadius: '4px',
              background: completed ? 'linear-gradient(90deg, #4ade80, #22d3ee)' : color,
            }}
          />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {pct.toFixed(0)}% saved · {fmt((goal.targetAmount || 0) - (goal.currentAmount || 0))} remaining
        </p>
      </div>

      {!completed && (
        <button
          onClick={onContribute}
          style={{
            width: '100%', padding: '10px',
            background: `${color}15`, border: `1px solid ${color}30`,
            borderRadius: 'var(--radius-md)',
            color, fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <Plus size={14} /> Add Funds
        </button>
      )}
    </motion.div>
  );
}

function CreateGoalSheet({ open, onClose }) {
  const { addSavingsGoal } = useFinance();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('💰');
  const [color, setColor] = useState('#4ade80');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !target) return;
    setLoading(true);
    try {
      await addSavingsGoal({ name, targetAmount: parseFloat(target), deadline, icon, color, currentAmount: 0 });
      setName(''); setTarget(''); setDeadline('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            className="sheet-backdrop" />
          <motion.div
            className="sheet-panel"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38 }}
          >
            <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', cursor: 'grab' }} />
            </div>
            <div style={{ padding: '14px 16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>New Savings Goal</h3>
              <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}>close</button>
            </div>

            {/* Icon picker */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Icon</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {GOAL_ICONS.map(ic => (
                  <button key={ic} onClick={() => setIcon(ic)} style={{
                    width: 36, height: 36, borderRadius: '10px', fontSize: '18px',
                    background: icon === ic ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)',
                    border: `1px solid ${icon === ic ? 'var(--accent-primary)' : 'var(--border)'}`,
                  }}>{ic}</button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Color</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {GOAL_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{
                    width: 28, height: 28, borderRadius: '50%', background: c,
                    border: color === c ? '3px solid white' : '2px solid transparent',
                    flexShrink: 0,
                  }} />
                ))}
              </div>
            </div>

            <FormInput label="Goal Name" placeholder="e.g. New Car, Holiday, Emergency Fund" value={name} onChange={e => setName(e.target.value)} />
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Target Amount</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-muted)' }}>£</span>
                <input type="number" inputMode="decimal" placeholder="0" value={target} onChange={e => setTarget(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <FormInput label="Target Date (optional)" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={!name || !target || loading} style={{
              width: '100%', padding: '15px', marginTop: '4px',
              background: !name || !target ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #4ade80, #22c55e)',
              color: !name || !target ? 'var(--text-muted)' : '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '15px', fontWeight: '700', fontFamily: 'var(--font-display)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <Check size={16} /> Create Goal
            </motion.button>
            <div style={{ height: 'max(20px, env(safe-area-inset-bottom))' }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FormInput({ label, placeholder, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{
          width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--text-primary)',
          fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', colorScheme: 'dark',
        }} />
    </div>
  );
}
