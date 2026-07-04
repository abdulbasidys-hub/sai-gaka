// src/context/FinanceContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, where, orderBy, onSnapshot, Timestamp,
  setDoc, getDoc, getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { startOfMonth, endOfMonth, format, subMonths, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

// ─── BASE CATEGORY DEFINITIONS ───────────────────────────────────────────────
export const BUDGET_CATEGORIES = {
  Housing: {
    color: '#7c6aff',
    icon: '🏠',
    suggestions: ['Rent', 'Electricity', 'Council Tax', 'Water', 'Gas', 'Home Insurance', 'Broadband'],
  },
  Vehicle: {
    color: '#f87171',
    icon: '🚗',
    suggestions: ['Car Finance (Lendable)', 'Car Tax (DVLA)', 'Car Insurance (GoSkippy)', 'Fuel', 'MOT', 'Parking', 'Repairs'],
  },
  'Household & Family': {
    color: '#fbbf24',
    icon: '👨‍👩‍👧',
    suggestions: ['Sky Internet', "Kids' Foodstuffs", 'My Shopping', 'Hajiya Yaya', 'Groceries', 'Clothing', 'Household Items'],
  },
  'Education & Business': {
    color: '#4ade80',
    icon: '📚',
    suggestions: ['Northwest University', 'Dayyib Corporation', 'Books', 'Courses', 'Subscriptions', 'Software'],
  },
  'Support & Obligations': {
    color: '#fb923c',
    icon: '🤝',
    suggestions: ['Landowners', 'Family Support (Babayi)', 'Abba Yakasai Generation', 'Charity', 'Zakat', 'Gifts'],
  },
  Savings: {
    color: '#38bdf8',
    icon: '💰',
    suggestions: ['Emergency Fund', 'Savings', 'Investment', 'Pension'],
  },
};

export const ALL_CATEGORIES = Object.keys(BUDGET_CATEGORIES);

// ─── BUDGET STATUS HELPER ────────────────────────────────────────────────────
export function getBudgetStatus(spent, budgeted) {
  if (!budgeted) return { pct: 0, color: 'var(--text-muted)', label: 'No budget', level: 'none' };
  const pct = (spent / budgeted) * 100;
  if (pct > 100) return { pct, color: 'var(--accent-red)', label: 'Over budget', level: 'over' };
  if (pct >= 90) return { pct, color: '#ef4444', label: 'Almost over', level: 'critical' };
  if (pct >= 70) return { pct, color: 'var(--accent-amber)', label: 'Watch out', level: 'warning' };
  return { pct, color: 'var(--accent-green)', label: 'On track', level: 'good' };
}

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});       // { [category]: { id, amount, subItems: [{name,budget}] } }
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));

  // ── Transactions (current month) ──────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const monthStart = startOfMonth(new Date(currentMonth + '-01'));
    const monthEnd = endOfMonth(new Date(currentMonth + '-01'));
    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      where('date', '>=', Timestamp.fromDate(monthStart)),
      where('date', '<=', Timestamp.fromDate(monthEnd)),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate() })));
    });
  }, [user, currentMonth]);

  // ── Budgets (current month) ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'budgets'), where('month', '==', currentMonth));
    return onSnapshot(q, snap => {
      const data = {};
      snap.docs.forEach(d => { data[d.data().category] = { id: d.id, ...d.data() }; });
      setBudgets(data);
    });
  }, [user, currentMonth]);

  // ── Savings goals ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'savingsGoals'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setSavingsGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [user]);

  // ── Monthly income ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid, 'monthlySettings', currentMonth))
      .then(snap => setMonthlyIncome(snap.exists() ? (snap.data().income || 0) : 0));
  }, [user, currentMonth]);

  // ── Transaction CRUD ──────────────────────────────────────────────────────
  const addTransaction = async (data) => {
    if (!user) return;
    const newTx = {
      ...data,
      date: Timestamp.fromDate(data.date || new Date()),
      createdAt: Timestamp.now(),
      notes: data.notes || '',
      recurring: data.recurring || false,
      subItem: data.subItem || '',
    };
    await addDoc(collection(db, 'users', user.uid, 'transactions'), newTx);

    // Check budget overrun
    if (data.type === 'expense' && budgets[data.category]) {
      const currentSpent = spentByCategory[data.category] || 0;
      const newSpent = currentSpent + data.amount;
      const budgeted = budgets[data.category]?.amount || 0;
      if (budgeted > 0 && newSpent > budgeted) {
        toast.error(`⚠️ Over budget in ${data.category}! £${(newSpent - budgeted).toFixed(0)} over`, { duration: 4000 });
      } else if (budgeted > 0 && newSpent / budgeted >= 0.9) {
        toast(`🔶 ${data.category} is at ${Math.round((newSpent / budgeted) * 100)}% of budget`, {
          icon: '⚠️', duration: 3500,
          style: { background: '#78350f', color: '#fef3c7' },
        });
      } else {
        toast.success('Transaction added');
      }
    } else {
      toast.success('Transaction added');
    }
  };

  const deleteTransaction = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    toast.success('Transaction deleted');
  };

  const updateTransaction = async (id, updates) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'transactions', id), updates);
    toast.success('Transaction updated');
  };

  // ── Budget CRUD (with sub-items) ──────────────────────────────────────────
  const upsertBudget = async (category, amount, subItems) => {
    if (!user) return;
    const existing = budgets[category];
    const payload = {
      category,
      amount: Number(amount),
      month: currentMonth,
      subItems: subItems || [],
    };
    if (existing) {
      await updateDoc(doc(db, 'users', user.uid, 'budgets', existing.id), payload);
    } else {
      await addDoc(collection(db, 'users', user.uid, 'budgets'), payload);
    }
  };

  const addSubItem = async (category, subItem) => {
    if (!user) return;
    const existing = budgets[category];
    const currentSubs = existing?.subItems || [];
    const newSubs = [...currentSubs, { name: subItem.name, budget: Number(subItem.budget || 0), id: Date.now().toString() }];
    const newTotal = newSubs.reduce((s, si) => s + si.budget, 0);
    await upsertBudget(category, newTotal, newSubs);
    toast.success('Sub-item added');
  };

  const updateSubItem = async (category, subId, updates) => {
    if (!user) return;
    const existing = budgets[category];
    const newSubs = (existing?.subItems || []).map(si => si.id === subId ? { ...si, ...updates } : si);
    const newTotal = newSubs.reduce((s, si) => s + si.budget, 0);
    await upsertBudget(category, newTotal, newSubs);
  };

  const deleteSubItem = async (category, subId) => {
    if (!user) return;
    const existing = budgets[category];
    const newSubs = (existing?.subItems || []).filter(si => si.id !== subId);
    const newTotal = newSubs.reduce((s, si) => s + si.budget, 0);
    await upsertBudget(category, newTotal, newSubs);
    toast.success('Sub-item removed');
  };

  // ── Savings CRUD ──────────────────────────────────────────────────────────
  const addSavingsGoal = async (data) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'savingsGoals'), {
      ...data, currentAmount: 0, createdAt: Timestamp.now(),
    });
    toast.success('Savings goal created!');
  };

  const updateSavingsGoal = async (id, updates) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'savingsGoals', id), updates);
    toast.success('Goal updated!');
  };

  const deleteSavingsGoal = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'savingsGoals', id));
    toast.success('Goal deleted');
  };

  // ── Income ────────────────────────────────────────────────────────────────
  const updateMonthlyIncome = async (income) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'monthlySettings', currentMonth), {
      income: Number(income), month: currentMonth,
    });
    setMonthlyIncome(Number(income));
    toast.success('Income updated');
  };

  // ── Insights: fetch last N months of spending data ────────────────────────
  const fetchInsightsData = async (numMonths = 4) => {
    if (!user) return [];
    const results = [];
    for (let i = numMonths - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const q = query(
        collection(db, 'users', user.uid, 'transactions'),
        where('date', '>=', Timestamp.fromDate(monthStart)),
        where('date', '<=', Timestamp.fromDate(monthEnd)),
        where('type', '==', 'expense')
      );
      const snap = await getDocs(q);
      const byCategory = {};
      let total = 0;
      snap.docs.forEach(d => {
        const tx = d.data();
        byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
        total += tx.amount;
      });
      // Also fetch income setting
      const incomeSnap = await getDoc(doc(db, 'users', user.uid, 'monthlySettings', monthKey));
      const income = incomeSnap.exists() ? (incomeSnap.data().income || 0) : 0;
      results.push({ month: monthKey, label: format(monthDate, 'MMM'), byCategory, total, income });
    }
    return results;
  };

  // ── Computed values ───────────────────────────────────────────────────────
  const totalSpent = transactions.reduce((s, t) => s + (t.type === 'expense' ? t.amount : 0), 0);
  const totalIncome = transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : 0), 0) + monthlyIncome;
  const balance = totalIncome - totalSpent;

  const spentByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const spentBySubItem = transactions
    .filter(t => t.type === 'expense' && t.subItem)
    .reduce((acc, t) => {
      const key = `${t.category}::${t.subItem}`;
      acc[key] = (acc[key] || 0) + t.amount;
      return acc;
    }, {});

  // Categories with spend but no budget set
  const unbudgetedCategories = ALL_CATEGORIES.filter(
    cat => (spentByCategory[cat] || 0) > 0 && !budgets[cat]?.amount
  );

  return (
    <FinanceContext.Provider value={{
      transactions, budgets, savingsGoals, monthlyIncome,
      loading, currentMonth, setCurrentMonth,
      totalSpent, totalIncome, balance,
      spentByCategory, spentBySubItem, unbudgetedCategories,
      addTransaction, deleteTransaction, updateTransaction,
      upsertBudget, addSubItem, updateSubItem, deleteSubItem,
      updateMonthlyIncome,
      addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
      fetchInsightsData,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
};
