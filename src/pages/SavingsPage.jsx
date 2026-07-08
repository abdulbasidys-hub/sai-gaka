// src/pages/SavingsPage.jsx
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, Check, ChevronDown } from 'lucide-react';

function fmt(n) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

const GOAL_ICONS = ['🏠','🚗','✈️','💍','📱','🎓','💰','🏥','🎮','👶','💼','🌍','🛒','🐕','⚽','🎵'];
const GOAL_COLORS = ['#7c6aff','#4ade80','#fbbf24','#fb923c','#f87171','#38bdf8','#e879f9','#34d399','#06b6d4','#f97316'];

function useHandleDrag(onClose) {
  const sheetRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const dragStartY = useRef(null);
  const scrollDragY = useRef(null);

  const applyDrag = (delta) => {
    if (sheetRef.current && delta > 0) sheetRef.current.style.transform = `translateY(${delta}px)`;
  };
  const resetDrag = () => {
    if (sheetRef.current) sheetRef.current.style.transform = '';
  };

  // Handle area
  const onTouchStart = (e) => { dragStartY.current = e.touches[0].clientY; };
  const onTouchMove = (e) => {
    if (dragStartY.current === null) return;
    applyDrag(e.touches[0].clientY - dragStartY.current);
  };
  const onTouchEnd = (e) => {
    const d = e.changedTouches[0].clientY - (dragStartY.current || 0);
    resetDrag();
    if (d > 80) onClose();
    dragStartY.current = null;
  };

  // Scroll area — dismiss when at top
  const onScrollTouchStart = (e) => {
    const el = scrollAreaRef.current;
    scrollDragY.current = (el && el.scrollTop <= 0) ? e.touches[0].clientY : null;
  };
  const onScrollTouchMove = (e) => {
    if (scrollDragY.current === null) return;
    const el = scrollAreaRef.current;
    if (!el || el.scrollTop > 2) { scrollDragY.current = null; return; }
    applyDrag(e.touches[0].clientY - scrollDragY.current);
  };
  const onScrollTouchEnd = (e) => {
    if (scrollDragY.current === null) return;
    const d = e.changedTouches[0].clientY - scrollDragY.current;
    resetDrag();
    if (d > 80) onClose();
    scrollDragY.current = null;
  };

  return {
    sheetRef, scrollAreaRef,
    handleProps: { onTouchStart, onTouchMove, onTouchEnd },
    scrollProps: { onTouchStart: onScrollTouchStart, onTouchMove: onScrollTouchMove, onTouchEnd: onScrollTouchEnd },
  };
}

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
        {/* Summary card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-green-dim)', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 32px var(--accent-green-dim)' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.15) 0%, transparent 70%)' }} />
          <p style={{ fontSize: '11px', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '8px', opacity: 0.8 }}>Total Saved</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '800', letterSpacing: '-1.5px', color: 'var(--accent-green)', marginBottom: '4px' }}>{fmt(totalSaved)}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>of {fmt(totalTarget)} target · {savingsGoals.length} goal{savingsGoals.length !== 1 ? 's' : ''}</p>
          {totalTarget > 0 && (
            <div style={{ marginTop: '14px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((totalSaved / totalTarget) * 100, 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #4ade80, #22d3ee)' }} />
            </div>
          )}
        </motion.div>

        {/* Goals list */}
        {savingsGoals.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>No savings goals yet</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Set a goal and start building wealth</p>
            <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: '14px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
              Create First Goal
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {savingsGoals.map((goal, i) => {
              const pct = goal.targetAmount > 0 ? Math.min(((goal.currentAmount || 0) / goal.targetAmount) * 100, 100) : 0;
              const completed = pct >= 100;
              const color = goal.color || '#4ade80';
              return (
                <motion.div key={goal.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: 'var(--bg-card)', border: `1px solid ${completed ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                  {completed && (
                    <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--accent-green)', color: '#0a0a0f', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px' }}>✓ COMPLETE</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${color}20`, fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {goal.icon || '💰'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>{goal.name}</p>
                      {goal.deadline && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target: {goal.deadline}</p>}
                    </div>
                    <button onClick={() => deleteSavingsGoal(goal.id)} style={{ color: 'var(--text-muted)', opacity: 0.5, display: 'flex' }}><span style={{ fontSize: '16px' }}>🗑</span></button>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', color }}>{fmt(goal.currentAmount || 0)}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', alignSelf: 'flex-end' }}>of {fmt(goal.targetAmount)}</span>
                    </div>
                    <div style={{ height: '7px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', borderRadius: '4px', background: completed ? 'linear-gradient(90deg, #4ade80, #22d3ee)' : color }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{pct.toFixed(0)}% · {fmt((goal.targetAmount || 0) - (goal.currentAmount || 0))} remaining</p>
                  </div>
                  {!completed && (
                    <button onClick={() => setShowContribute(goal.id)} style={{ width: '100%', padding: '10px', background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 'var(--radius-md)', color, fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Plus size={14} /> Add Funds
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button onClick={() => setShowCreate(true)} whileTap={{ scale: 0.92 }}
        style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 16px)', right: '20px', width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #4ade80, #22c55e)', boxShadow: '0 4px 24px rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, border: 'none' }}>
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </motion.button>

      <CreateGoalSheet open={showCreate} onClose={() => setShowCreate(false)} />

      {/* Contribute bottom sheet */}
      <AnimatePresence>
        {showContribute && (() => {
          const ContributeSheet = () => {
            const { sheetRef, scrollAreaRef, handleProps, scrollProps } = useHandleDrag(() => { setShowContribute(null); setContributeAmount(''); });
            return (
              <>
                <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => { setShowContribute(null); setContributeAmount(''); }} />
                <motion.div ref={sheetRef} className="sheet-panel"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 340, damping: 38 }}>
                  <div className="sheet-handle-area" {...handleProps}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
                  </div>
                  <div className="sheet-scroll-area" ref={scrollAreaRef} {...scrollProps}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Add to Goal</h3>
                      <button onClick={() => { setShowContribute(null); setContributeAmount(''); }} style={{ color: 'var(--text-muted)', display: 'flex' }}><ChevronDown size={20} /></button>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      {savingsGoals.find(g => g.id === showContribute)?.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-muted)' }}>£</span>
                      <input type="number" inputMode="decimal" placeholder="0.00" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} autoFocus
                        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => { setShowContribute(null); setContributeAmount(''); }} style={{ flex: 1, padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: '600', fontSize: '14px' }}>Cancel</button>
                      <button onClick={handleContribute} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #4ade80, #22c55e)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '14px' }}>Add Funds</button>
                    </div>
                    <div style={{ height: 'max(20px, env(safe-area-inset-bottom))' }} />
                  </div>
                </motion.div>
              </>
            );
          };
          return <ContributeSheet key="contribute" />;
        })()}
      </AnimatePresence>
    </>
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
  const { sheetRef, scrollAreaRef, handleProps, scrollProps } = useHandleDrag(onClose);

  const handleCreate = async () => {
    if (!name || !target) return;
    setLoading(true);
    try {
      await addSavingsGoal({ name, targetAmount: parseFloat(target), deadline, icon, color, currentAmount: 0 });
      setName(''); setTarget(''); setDeadline(''); setIcon('💰'); setColor('#4ade80');
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div ref={sheetRef} className="sheet-panel"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38 }}>
            <div className="sheet-handle-area" {...handleProps}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>
            <div className="sheet-scroll-area" ref={scrollAreaRef} {...scrollProps}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>New Savings Goal</h3>
                <button onClick={onClose} style={{ color: 'var(--text-muted)', display: 'flex' }}><ChevronDown size={20} /></button>
              </div>

              <FL>Icon</FL>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {GOAL_ICONS.map(ic => (
                  <button key={ic} onClick={() => setIcon(ic)} style={{ width: 36, height: 36, borderRadius: '10px', fontSize: '18px', background: icon === ic ? 'var(--accent-primary-dim)' : 'var(--bg-elevated)', border: `1px solid ${icon === ic ? 'var(--accent-primary)' : 'var(--border)'}` }}>{ic}</button>
                ))}
              </div>

              <FL>Color</FL>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {GOAL_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid var(--text-primary)' : '2px solid transparent', flexShrink: 0 }} />
                ))}
              </div>

              <FL>Goal Name</FL>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Car, Holiday, Emergency Fund"
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', marginBottom: '12px' }} />

              <FL>Target Amount</FL>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '12px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-muted)' }}>£</span>
                <input type="number" inputMode="decimal" placeholder="0" value={target} onChange={e => setTarget(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }} />
              </div>

              <FL>Target Date (optional)</FL>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', colorScheme: 'light dark', marginBottom: '18px' }} />

              <button onClick={handleCreate} disabled={!name || !target || loading}
                style={{
                  width: '100%', padding: '15px', border: 'none', borderRadius: 'var(--radius-md)',
                  background: !name || !target ? 'var(--bg-elevated)' : `linear-gradient(135deg, ${color}, ${color}bb)`,
                  color: !name || !target ? 'var(--text-muted)' : '#fff',
                  fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  cursor: !name || !target ? 'default' : 'pointer',
                }}>
                <Check size={16} /> {icon} Create "{name || 'Goal'}"
              </button>
              <div style={{ height: 'max(20px, env(safe-area-inset-bottom))' }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FL({ children }) {
  return <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{children}</p>;
}
