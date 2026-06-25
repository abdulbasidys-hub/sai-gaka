# 💰 Sadik Finance

A private, mobile-first personal finance tracker built with React + Firebase.

---

## ⚡ Quick Setup (5 steps)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Open your project → **Project Settings** → **Your Apps**
3. If you don't have a web app, click **Add App** → Web
4. Copy the `firebaseConfig` object

### 3. Paste your Firebase config
Open `src/lib/firebase.js` and replace the placeholder values:
```js
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
```

### 4. Enable Firebase services
In Firebase Console:
- **Authentication** → Sign-in method → Enable **Email/Password**
- **Firestore Database** → Create database → Start in **production mode**
- Deploy the security rules from `firestore.rules` (or paste them manually in the Rules tab)

### 5. Run the app
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔐 Access Control

Only these emails can register/sign in:
- `aabello143@yahoo.com` (Sadik)
- `aminubello2468@gmail.com` (Aminu — testing)

Anyone else will get an "unauthorized" error. To change this, edit `ALLOWED_EMAILS` in `src/context/AuthContext.jsx`.

---

## 📱 Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Net balance, income vs spending meter, category breakdown, recent activity |
| **Transactions** | Log expenses & income, filter by category/type, delete entries |
| **Budget** | Set monthly budgets per category, track progress with live bars |
| **Savings** | Create named goals with icons & colors, contribute funds, track progress |
| **Settings** | Switch months to view historical data, set monthly income baseline, sign out |

### Budget Categories (from Sadik's list)
- 🏠 Housing — Rent, Electricity, Council Tax, Water
- 🚗 Vehicle — Car Finance, Car Tax, Car Insurance
- 👨‍👩‍👧 Household & Family — Internet, Kids' Foodstuffs, Shopping, Hajiya Yaya
- 📚 Education & Business — Northwest University, Dayyib Corporation
- 🤝 Support & Obligations — Landowners, Babayi, Abba Yakasai Generation, Charity
- 💰 Savings

---

## 🛠 Tech Stack

- **React 18** + **Vite** — frontend
- **Framer Motion** — animations
- **Firebase Auth** — authentication
- **Firestore** — real-time database
- **Recharts** — charts
- **react-hot-toast** — notifications
- **Lucide React** — icons

---

## 🚀 Deploy to Vercel

```bash
npm run build
# Upload the dist/ folder to Vercel, or use:
npx vercel --prod
```

---

## 📁 Project Structure

```
src/
├── context/
│   ├── AuthContext.jsx     # Firebase auth + whitelist
│   └── FinanceContext.jsx  # All data + Firestore ops
├── pages/
│   ├── AuthPage.jsx        # Login / Register
│   ├── DashboardPage.jsx   # Home overview
│   ├── TransactionsPage.jsx
│   ├── BudgetPage.jsx
│   ├── SavingsPage.jsx
│   └── SettingsPage.jsx
├── components/
│   ├── layout/             # TopBar, BottomNav, AppLayout
│   ├── transactions/       # AddTransactionSheet
│   └── dashboard/          # IncomeModal
├── lib/
│   └── firebase.js         # ← PUT YOUR CONFIG HERE
└── styles/
    └── globals.css         # Design tokens
```
