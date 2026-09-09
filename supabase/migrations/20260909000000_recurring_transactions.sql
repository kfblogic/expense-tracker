-- ==============================================================================
-- Migration: 20260909000000_recurring_transactions.sql
-- Proyek: Expense Tracker — Fase 6
-- Deskripsi: Tabel recurring_transactions (template transaksi berulang bulanan),
--            RLS, dan trigger updated_at. Materialisasi dilakukan di app
--            (catch-up saat halaman dibuka) — tanpa cron.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  -- 1..28 saja supaya aman di semua bulan (Feb dst)
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 28),
  -- tanggal occurrence berikutnya yang belum dibukukan
  next_run DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_user_active_next
  ON public.recurring_transactions(user_id, active, next_run);

DROP TRIGGER IF EXISTS trg_recurring_updated_at ON public.recurring_transactions;
CREATE TRIGGER trg_recurring_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- RLS: user hanya akses miliknya sendiri
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can view their own recurring"
  ON public.recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can insert their own recurring"
  ON public.recurring_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can update their own recurring"
  ON public.recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can delete their own recurring"
  ON public.recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);
