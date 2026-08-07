# MoneyTrail

A simple, private, installable expense tracker — built as a mobile-first Progressive Web App (PWA).

Track your daily spending, see it broken down by category and time, set monthly budgets, and get warned before you overspend — all without an account, a server, or a subscription. Your data stays on your device.

**Live app:** https://moneytrail-phi.vercel.app/

---

## Features

- Add expenses with amount, category, date, and optional note
- Edit or delete any expense
- Filter expense history by category, with running totals
- Dashboard with a category breakdown (pie chart) and 7-day spending trend (bar chart)
- Set monthly budgets — overall or per category — with visual progress and over-budget alerts
- Export your data as a backup file, and restore it anytime
- Installable to your phone's home screen, works offline
- Dark mode, mobile-first design

## Tech Stack

- **React + Vite** — UI framework and build tool
- **Tailwind CSS** — styling
- **Dexie.js (IndexedDB)** — local, on-device database (no server, no account)
- **Recharts** — charts
- **Framer Motion** — animations
- **React Router** — navigation
- **Lucide React** — icons
- **vite-plugin-pwa** — installable/offline support
- **Vercel** — free hosting/deployment

No backend, no database server, no API keys, and no login are required — all data is stored locally in your browser via IndexedDB.

## Project Structure

```
moneytrail/
├── public/
│   └── icons/              → PWA app icons
├── src/
│   ├── components/         → Button, Card, Input, BottomNav
│   ├── pages/               → AddExpense, ExpenseList, Dashboard, Budgets, Settings
│   ├── db/                  → Dexie database setup
│   ├── hooks/                → useExpenses, useCategories, useBudgets
│   ├── utils/                → backup.js (export/import)
│   ├── App.jsx
│   └── main.jsx
├── vite.config.js
└── package.json
```

## Local Development

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## Building for Production

```bash
npm run build
npm run preview
```

## Deployment

Deployed automatically via Vercel on every push to the `main` branch on GitHub. See `DEPLOYMENT_GUIDE.md` for full setup steps.

## Data & Privacy

All expense, budget, and category data is stored locally on your device using IndexedDB. Nothing is sent to a server. Clearing your browser data or switching devices will erase this data unless you've exported a backup — see the in-app Settings tab.

## License

Personal academic project — no license specified.
