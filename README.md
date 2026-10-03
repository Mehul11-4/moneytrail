# MoneyTrail

A mobile-friendly web app (PWA) for tracking personal money and running a small business.

## Modes

- **Personal**: expenses, balance, budgets and a dashboard.
- **Business (CBN CHAI)**: sales, purchases, inventory, parties (udhaar), loans, jama/kharch ledger, profit & loss and monthly PDF reports.

## Tech

- React + Vite
- Supabase (login and database)
- Tailwind CSS, Recharts, Framer Motion
- PWA support through vite-plugin-pwa

## Run locally

1. Install: `npm install`
2. Create a `.env` file in the project root with your own Supabase details:
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
3. Start: `npm run dev`
4. Build for production: `npm run build`

Never commit the `.env` file.

## Data and backups

All data is stored in Supabase and each user can only see their own rows (Row Level Security).
Use **Settings → Export Backup** to download a copy of your data.
