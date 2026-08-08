/*
# Create transactions table for Revenue & Expenses

1. Purpose
   Stores individual financial transactions (revenue or expense entries)
   for the Revenue & Expenses admin page. Each row represents one income
   or expense record with an amount, category, date, and optional note.

2. New Tables
   - `transactions`
     - `id`         (uuid, primary key)
     - `type`       (text enum: 'revenue' | 'expense', not null)
     - `title`      (text, not null) — short description / label
     - `category`   (text, not null) — e.g. "Subscription", "Server Costs"
     - `amount`     (numeric(12,2), not null) — always positive; sign determined by `type`
     - `date`       (date, not null) — the transaction date
     - `note`       (text, nullable) — optional longer description
     - `created_at` (timestamptz, default now())
     - `updated_at` (timestamptz, default now())

3. Indexes
   - `idx_transactions_date`   on `date` (DESC) — dashboard sorting
   - `idx_transactions_type`   on `type` — filtering revenue vs expense
   - `idx_transactions_category` on `category` — grouping

4. Security
   - RLS enabled on `transactions`.
   - The app uses demo/mock auth (no real Supabase auth sessions), so
     policies are open to `anon, authenticated` — the data is intentionally
     shared across the admin panel.
*/

CREATE TABLE IF NOT EXISTS transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL CHECK (type IN ('revenue', 'expense')),
  title       text NOT NULL,
  category    text NOT NULL,
  amount      numeric(12,2) NOT NULL CHECK (amount >= 0),
  date        date NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type     ON transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions"
  ON transactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions"
  ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions"
  ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions"
  ON transactions FOR DELETE
  TO anon, authenticated USING (true);
