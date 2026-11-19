# RupeeSense — Y2K Old-Money Edition

A React + Vite + Supabase starter application for personal financial tracking, balance forecasting, shared expense rooms, settlement calculations and UPI hand-off.

## Visual direction

The interface uses an old-money editorial palette: deep forest green, parchment, warm ivory, muted brass, Playfair Display headlines and restrained Y2K-inspired details.

## Included in this starter

- Supabase email/password authentication
- Personal income and expense ledger
- Dashboard with balance, income, expense and forecast cards
- Simple end-of-month forecast based on recent expense pace
- Basic unusual-expense screening
- Personal budget stored locally in the browser
- Savings goals stored in Supabase
- Create private expense rooms
- Join rooms with an invitation code
- Equal and custom expense splits
- Room member balances and suggested settlement transfers
- Pending payment records and recipient confirmation
- Responsive layout for desktop and mobile

## Not yet production-complete

This is a working capstone starter, not a regulated banking/payment product.

- The app can launch a UPI payment intent when the recipient has saved a UPI ID. UPI payments are not automatically verified: the app records a pending settlement and the recipient must confirm it. A production integration needs a suitable payment provider or verified payment flow.
- The app currently supports a payer being the signed-in member who adds the group expense.
- Billing deadlines are stored and displayed; scheduled email/push reminders need a server-side scheduled function.
- Forecasting and anomaly detection are starter statistical methods, not trained predictive models. Their reliability depends on the quality and amount of transaction history.
- Receipt OCR, recurring expense automation, PDF exports and full billing-cycle close/reopen workflows are planned extensions.
- Set up email confirmation and redirect URLs in Supabase Auth before deployment.

## 1. Requirements

- Node.js 20 or newer
- npm
- A Supabase account and project
- A Vercel account (for deployment)

## 2. Create your Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Open **Project Settings → API**.
3. Copy the Project URL and the anon/publishable key.
4. Open **SQL Editor**.
5. Run the complete `supabase/schema.sql` file.
6. In **Authentication → URL Configuration**, set your local URL to `http://localhost:5173` while developing. Add your deployed Vercel URL after deployment.
7. For a quick demo, you may disable email confirmation in **Authentication → Providers → Email**. For real users, keep confirmation enabled and configure email delivery.

## 3. Configure the app

Copy `.env.example` to `.env.local` and fill in:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
```

Never use the Supabase `service_role` secret in frontend code or Vercel client environment variables.

## 4. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

To test:
1. Create two or more accounts (use separate browsers or private windows).
2. Create an expense room with one account.
3. Copy the room invitation code from the room URL/share link or use the room's code shown in the database `rooms` table.
4. Join with another account using the code.
5. Add expenses and test equal/custom splits.
6. Mark a suggested transfer as paid from the payer account, then confirm it from the recipient account.

## 5. Deploy to Vercel

1. Create a GitHub repository and upload the contents of this folder.
2. In Vercel, choose **Add New → Project**, import the repository.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Deploy.
8. In Supabase **Authentication → URL Configuration**, add your Vercel domain to Site URL / Redirect URLs.
9. Redeploy after changing environment variables.

The included `vercel.json` handles client-side route fallback.

## 6. Suggested next improvements

1. Add server-side payment verification through an approved provider.
2. Add a secure room invite preview and invitation expiry UI.
3. Add billing-cycle close and immutable settlement snapshots.
4. Add recurring expenses and reminder scheduling with Supabase Edge Functions.
5. Train and evaluate a forecasting model using historical daily transaction aggregates.
6. Add audit history for edits, disputes and payment confirmations.
7. Add PDF/CSV export and receipt OCR.
8. Move monthly budget settings from local storage into a database table.

## Financial calculation notes

- Personal balance = opening balance + income − expenses.
- Group net = amount paid by member − that member's allocated expense shares.
- Positive group net means the member should receive money.
- Negative group net means the member owes money.
- The settlement optimiser matches debtors to creditors to reduce the number of transfers.
- For real payment reconciliation, never treat a user clicking a UPI link as proof of payment.
