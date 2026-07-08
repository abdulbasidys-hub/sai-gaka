// src/context/FinanceContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, where, orderBy, onSnapshot, Timestamp,
  setDoc, getDoc, getDocs, writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { startOfMonth, endOfMonth, format, subMonths, setDate, isAfter } from 'date-fns';
import toast from 'react-hot-toast';

// ─── BASE CATEGORIES ─────────────────────────────────────────────────────────
export const BASE_CATEGORIES = {
  Housing: { color: '#7c6aff', icon: '🏠', defaultCurrency: 'GBP', suggestions: ['Rent', 'Electricity', 'Council Tax', 'Water', 'Gas', 'Home Insurance', 'Broadband'] },
  Vehicle: { color: '#f87171', icon: '🚗', defaultCurrency: 'GBP', suggestions: ['Car Finance (Lendable)', 'Car Tax (DVLA)', 'Car Insurance (GoSkippy)', 'Fuel', 'MOT', 'Parking'] },
  'Household & Family': { color: '#fbbf24', icon: '👨‍👩‍👧', defaultCurrency: 'GBP', suggestions: ["Sky Internet", "Kids' Foodstuffs", 'My Shopping', 'Hajiya Yaya', 'Groceries', 'Clothing'] },
  'Education & Business': { color: '#4ade80', icon: '📚', defaultCurrency: 'GBP', suggestions: ['Northwest University', 'Dayyib Corporation', 'Books', 'Courses', 'Software'] },
  'Support & Obligations': { color: '#fb923c', icon: '🤝', defaultCurrency: 'NGN', suggestions: ['Landowners', 'Family Support (Babayi)', 'Abba Yakasai Generation', 'Charity', 'Zakat', 'Gifts'] },
  Savings: { color: '#38bdf8', icon: '💰', defaultCurrency: 'GBP', suggestions: ['Emergency Fund', 'Savings', 'Investment', 'Pension'] },
};

// ─── INCOME SOURCES ───────────────────────────────────────────────────────────
export const INCOME_SOURCES = [
  { id: 'salary',    label: 'Salary',          icon: '💼', color: '#4ade80' },
  { id: 'freelance', label: 'Freelance',        icon: '💻', color: '#7c6aff' },
  { id: 'trading',   label: 'Trading',          icon: '📈', color: '#38bdf8' },
  { id: 'stipend',   label: 'Grant / Stipend',  icon: '🎓', color: '#fb923c' },
  { id: 'borrowed',  label: 'Borrowed',         icon: '🤝', color: '#f87171', isBorrowed: true },
  { id: 'other',     label: 'Other',            icon: '➕', color: '#9898b0' },
];

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
  const [budgets, setBudgets] = useState({});
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [customCategories, setCustomCategories] = useState({});
  const [salarySettings, setSalarySettings] = useState(null);
  const [borrowedItems, setBorrowedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Merged categories (base + custom)
  const BUDGET_CATEGORIES = { ...BASE_CATEGORIES, ...customCategories };
  const ALL_CATEGORIES = Object.keys(BUDGET_CATEGORIES);

  // ── Listeners ─────────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'budgets'), where('month', '==', currentMonth));
    return onSnapshot(q, snap => {
      const data = {};
      snap.docs.forEach(d => { data[d.data().category] = { id: d.id, ...d.data() }; });
      setBudgets(data);
    });
  }, [user, currentMonth]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'savingsGoals'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setSavingsGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [user]);

  // Custom categories
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid, 'settings', 'categories'), snap => {
      if (snap.exists()) setCustomCategories(snap.data().categories || {});
    });
  }, [user]);

  // Salary & borrowed from settings
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid, 'settings', 'currency'), snap => {
      if (snap.exists() && snap.data().salaryConfig) setSalarySettings(snap.data().salaryConfig);
    });
  }, [user]);

  // Borrowed items
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'borrowed'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setBorrowedItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  // ── Account balances ──────────────────────────────────────────────────────
  // We compute running balances from ALL transactions (not just current month)
  // For simplicity we use currentMonth transactions + salary as the monthly view
  // True account balance needs all-time data — we'll store it as a snapshot

  const getAccountBalance = (currency) => {
    // Income for this currency
    const income = transactions
      .filter(t => t.type === 'income' && t.account === currency && !t.isBorrowed)
      .reduce((s, t) => s + t.amount, 0);
    // Salary contribution
    const salaryIncome = salarySettings?.currency === currency
      ? (currency === 'GBP' ? (salarySettings.amountGBP || 0) : (salarySettings.amountNGN || 0))
      : 0;
    // Transfers in
    const transfersIn = transactions
      .filter(t => t.type === 'transfer_in' && t.account === currency)
      .reduce((s, t) => s + t.amount, 0);
    // Expenses
    const expenses = transactions
      .filter(t => t.type === 'expense' && t.account === currency)
      .reduce((s, t) => s + t.amount, 0);
    // Transfers out
    const transfersOut = transactions
      .filter(t => t.type === 'transfer_out' && t.account === currency)
      .reduce((s, t) => s + t.amount, 0);

    return salaryIncome + income + transfersIn - expenses - transfersOut;
  };

  const balanceGBP = getAccountBalance('GBP');
  const balanceNGN = getAccountBalance('NGN');

  // Totals for display
  const totalSpentGBP = transactions.filter(t => t.type === 'expense' && t.account === 'GBP').reduce((s, t) => s + t.amount, 0);
  const totalSpentNGN = transactions.filter(t => t.type === 'expense' && t.account === 'NGN').reduce((s, t) => s + t.amount, 0);
  const totalIncomeGBP = transactions.filter(t => t.type === 'income' && t.account === 'GBP').reduce((s, t) => s + t.amount, 0)
    + (salarySettings?.currency === 'GBP' ? (salarySettings.amountGBP || 0) : 0);
  const totalIncomeNGN = transactions.filter(t => t.type === 'income' && t.account === 'NGN').reduce((s, t) => s + t.amount, 0)
    + (salarySettings?.currency === 'NGN' ? (salarySettings.amountNGN || 0) : 0);

  const spentByCategory = transactions
    .filter(t => t.type === 'expense' && t.account === 'GBP')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});

  const spentByCategoryNGN = transactions
    .filter(t => t.type === 'expense' && t.account === 'NGN')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});

  // spentBySubItem tracks per sub-item per currency: key = "Cat::SubItem::GBP" or "Cat::SubItem::NGN"
  const spentBySubItem = transactions
    .filter(t => t.type === 'expense' && t.subItem)
    .reduce((acc, t) => {
      const k = t.category + '::' + t.subItem + '::' + (t.account || 'GBP');
      acc[k] = (acc[k] || 0) + t.amount;
      return acc;
    }, {});

  const unbudgetedCategories = ALL_CATEGORIES.filter(
    cat => (spentByCategory[cat] || 0) > 0 && !budgets[cat]?.amount
  );

  // ── Add transaction ───────────────────────────────────────────────────────
  const addTransaction = async (data) => {
    if (!user) return false;
    const account = data.account || 'GBP';

    // Soft warning only — never block. Balance check was broken because
    // it only sees current-month transactions, not all-time balance.
    if (data.type === 'expense') {
      const currentBalance = getAccountBalance(account);
      if (currentBalance < data.amount && currentBalance > 0) {
        toast(`Low balance in ${account} — proceeding anyway`, { icon: '⚠️', duration: 3000 });
      }
    }

    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
      ...data,
      account,
      date: Timestamp.fromDate(data.date || new Date()),
      createdAt: Timestamp.now(),
      notes: data.notes || '',
      recurring: data.recurring || false,
      subItem: data.subItem || '',
      isBorrowed: data.isBorrowed || false,
    });

    // Budget overrun check (informational only)
    if (data.type === 'expense' && account === 'GBP' && budgets[data.category]) {
      const currentSpent = spentByCategory[data.category] || 0;
      const newSpent = currentSpent + data.amount;
      const budgeted = budgets[data.category]?.amount || 0;
      if (budgeted > 0 && newSpent > budgeted) {
        toast.error(`Over budget in ${data.category} by £${(newSpent - budgeted).toFixed(0)}`, { duration: 4000 });
      } else if (budgeted > 0 && newSpent / budgeted >= 0.9) {
        toast(`${data.category} at ${Math.round((newSpent / budgeted) * 100)}% of budget`, { icon: '⚠️', duration: 3000 });
      } else {
        toast.success('Transaction saved');
      }
    } else {
      toast.success('Transaction saved');
    }

    if (data.isBorrowed) {
      await addDoc(collection(db, 'users', user.uid, 'borrowed'), {
        description: data.description || 'Borrowed funds',
        amount: data.amount, account, repaid: false,
        createdAt: Timestamp.now(),
        date: Timestamp.fromDate(data.date || new Date()),
      });
    }

    return true;
  };

  // ── Transfer between accounts ─────────────────────────────────────────────
  const transferBetweenAccounts = async ({ fromAccount, toAccount, fromAmount, toAmount, notes, date, exchangeRate }) => {
    if (!user) return false;

    // Check balance
    const fromBalance = getAccountBalance(fromAccount);
    if (fromAmount > fromBalance) {
      toast.error(
        `Not enough in ${fromAccount} account. Balance: ${fromAccount === 'GBP' ? '£' : '₦'}${fromBalance.toLocaleString()}`,
        { duration: 5000, icon: '🚫' }
      );
      return false;
    }

    const batch = writeBatch(db);
    const now = Timestamp.fromDate(date || new Date());
    const transferId = Date.now().toString();

    // Debit from source
    const outRef = doc(collection(db, 'users', user.uid, 'transactions'));
    batch.set(outRef, {
      type: 'transfer_out',
      account: fromAccount,
      amount: fromAmount,
      toAccount,
      transferId,
      description: `Transfer to ${toAccount}`,
      notes: notes || '',
      date: now,
      createdAt: Timestamp.now(),
      exchangeRate: exchangeRate || null,
    });

    // Credit to destination
    const inRef = doc(collection(db, 'users', user.uid, 'transactions'));
    batch.set(inRef, {
      type: 'transfer_in',
      account: toAccount,
      amount: toAmount,
      fromAccount,
      transferId,
      description: `Transfer from ${fromAccount}`,
      notes: notes || '',
      date: now,
      createdAt: Timestamp.now(),
      exchangeRate: exchangeRate || null,
    });

    await batch.commit();
    toast.success(`Transferred ${fromAccount === 'GBP' ? '£' : '₦'}${fromAmount.toLocaleString()} → ${toAccount === 'GBP' ? '£' : '₦'}${toAmount.toLocaleString()}`);
    return true;
  };

  const deleteTransaction = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    toast.success('Transaction deleted');
  };

  // ── Budget CRUD ───────────────────────────────────────────────────────────
  const upsertBudget = async (category, amount, subItems, budgetCurrency) => {
    if (!user) return;
    const existing = budgets[category];
    const payload = {
      category, amount: Number(amount), month: currentMonth,
      subItems: subItems || [],
      budgetCurrency: budgetCurrency || 'GBP',
    };
    if (existing) await updateDoc(doc(db, 'users', user.uid, 'budgets', existing.id), payload);
    else await addDoc(collection(db, 'users', user.uid, 'budgets'), payload);
  };

  // When sub-items have mixed currencies, we don't sum them into one parent total.
  // Instead the parent amount is stored per-currency as separate sums.
  const calcSubTotals = (subs) => {
    const gbp = subs.filter(si => !si.currency || si.currency === 'GBP').reduce((s, si) => s + (si.budget || 0), 0);
    const ngn = subs.filter(si => si.currency === 'NGN').reduce((s, si) => s + (si.budget || 0), 0);
    return { gbp, ngn, mixed: gbp > 0 && ngn > 0 };
  };

  const addSubItem = async (category, subItem) => {
    if (!user) return;
    const existing = budgets[category];
    const currentSubs = existing?.subItems || [];
    const newSub = {
      name: subItem.name,
      budget: Number(subItem.budget || 0),
      currency: subItem.currency || existing?.budgetCurrency || 'GBP',
      id: Date.now().toString(),
    };
    const newSubs = [...currentSubs, newSub];
    const totals = calcSubTotals(newSubs);
    // Parent amount = GBP total (primary), NGN stored separately in subItems
    await upsertBudget(category, totals.gbp, newSubs, totals.mixed ? 'MIXED' : (totals.ngn > 0 ? 'NGN' : 'GBP'));
    toast.success('Sub-item added');
  };

  const updateSubItem = async (category, subId, updates) => {
    if (!user) return;
    const existing = budgets[category];
    const newSubs = (existing?.subItems || []).map(si => si.id === subId ? { ...si, ...updates } : si);
    const totals = calcSubTotals(newSubs);
    await upsertBudget(category, totals.gbp, newSubs, totals.mixed ? 'MIXED' : (totals.ngn > 0 ? 'NGN' : 'GBP'));
  };

  const deleteSubItem = async (category, subId) => {
    if (!user) return;
    const existing = budgets[category];
    const newSubs = (existing?.subItems || []).filter(si => si.id !== subId);
    const totals = calcSubTotals(newSubs);
    await upsertBudget(category, totals.gbp, newSubs, totals.mixed ? 'MIXED' : (totals.ngn > 0 ? 'NGN' : 'GBP'));
    toast.success('Sub-item removed');
  };

  // ── Custom categories ─────────────────────────────────────────────────────
  const addCustomCategory = async (cat) => {
    if (!user) return;
    const updated = { ...customCategories, [cat.name]: { color: cat.color, icon: cat.icon, defaultCurrency: cat.defaultCurrency, suggestions: [], custom: true } };
    await setDoc(doc(db, 'users', user.uid, 'settings', 'categories'), { categories: updated }, { merge: true });
    toast.success(`Category "${cat.name}" added`);
  };

  const deleteCustomCategory = async (name) => {
    if (!user) return;
    const updated = { ...customCategories };
    delete updated[name];
    await setDoc(doc(db, 'users', user.uid, 'settings', 'categories'), { categories: updated });
    toast.success(`Category removed`);
  };

  // ── Savings ───────────────────────────────────────────────────────────────
  const addSavingsGoal = async (data) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'savingsGoals'), { ...data, currentAmount: 0, createdAt: Timestamp.now() });
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

  // ── Borrowed ──────────────────────────────────────────────────────────────
  const markBorrowedRepaid = async (id) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'borrowed', id), { repaid: true, repaidAt: Timestamp.now() });
    toast.success('Marked as repaid');
  };

  // ── Salary ────────────────────────────────────────────────────────────────
  const getSalaryNextDate = () => {
    if (!salarySettings?.dayOfMonth) return null;
    const today = new Date();
    const thisMonthDate = setDate(new Date(), salarySettings.dayOfMonth);
    if (isAfter(thisMonthDate, today)) return thisMonthDate;
    return new Date(today.getFullYear(), today.getMonth() + 1, salarySettings.dayOfMonth);
  };

  // ── Insights ──────────────────────────────────────────────────────────────
  const fetchInsightsData = async (numMonths = 4) => {
    if (!user) return [];
    const results = [];
    for (let i = numMonths - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthKey = format(monthDate, 'yyyy-MM');
      const q = query(
        collection(db, 'users', user.uid, 'transactions'),
        where('date', '>=', Timestamp.fromDate(startOfMonth(monthDate))),
        where('date', '<=', Timestamp.fromDate(endOfMonth(monthDate))),
      );
      const snap = await getDocs(q);
      const byCategory = {}, byCategoryNGN = {};
      let totalGBP = 0, totalNGN = 0, incomeGBP = 0, incomeNGN = 0;
      snap.docs.forEach(d => {
        const tx = d.data();
        const acct = tx.account || (tx.currency === 'NGN' ? 'NGN' : 'GBP');
        if (tx.type === 'expense') {
          if (acct === 'NGN') { byCategoryNGN[tx.category] = (byCategoryNGN[tx.category] || 0) + tx.amount; totalNGN += tx.amount; }
          else { byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount; totalGBP += tx.amount; }
        } else if (tx.type === 'income') {
          if (acct === 'NGN') incomeNGN += tx.amount; else incomeGBP += tx.amount;
        }
      });
      if (salarySettings) {
        if (salarySettings.currency === 'GBP') incomeGBP += salarySettings.amountGBP || 0;
        else incomeNGN += salarySettings.amountNGN || 0;
      }
      results.push({ month: monthKey, label: format(monthDate, 'MMM'), byCategory, byCategoryNGN, totalGBP, totalNGN, incomeGBP, incomeNGN });
    }
    return results;
  };

  return (
    <FinanceContext.Provider value={{
      transactions, budgets, savingsGoals, customCategories, borrowedItems,
      salarySettings, loading, currentMonth, setCurrentMonth,
      BUDGET_CATEGORIES, ALL_CATEGORIES,
      balanceGBP, balanceNGN,
      totalSpentGBP, totalSpentNGN, totalIncomeGBP, totalIncomeNGN,
      spentByCategory, spentByCategoryNGN, spentBySubItem, unbudgetedCategories,
      getSalaryNextDate,
      addTransaction, deleteTransaction, transferBetweenAccounts,
      upsertBudget, addSubItem, updateSubItem, deleteSubItem,
      addCustomCategory, deleteCustomCategory,
      addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
      markBorrowedRepaid,
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
