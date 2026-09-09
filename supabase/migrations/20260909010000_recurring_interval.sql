-- ==============================================================================
-- Migration: 20260909010000_recurring_interval.sql
-- Proyek: Expense Tracker — Fase 6 (lanjutan opsional)
-- Deskripsi: Tambah kolom `interval` pada recurring_transactions supaya
--            transaksi berulang tidak cuma bulanan (mingguan / tahunan).
--            `day_of_month` tetap dipakai untuk kunci tanggal saat interval
--            'monthly'; untuk 'weekly'/'yearly' jadwal ditentukan `next_run`.
-- ==============================================================================

ALTER TABLE public.recurring_transactions
  ADD COLUMN IF NOT EXISTS interval TEXT NOT NULL DEFAULT 'monthly'
  CHECK (interval IN ('weekly', 'monthly', 'yearly'));
