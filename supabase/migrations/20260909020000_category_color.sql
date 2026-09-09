-- ==============================================================================
-- Migration: 20260909020000_category_color.sql
-- Proyek: Expense Tracker — Fase 6 (lanjutan opsional)
-- Deskripsi: Warna kustom per kategori (hex #RRGGBB). NULL = pakai palet bawaan
--            (lib/category-colors.ts). Dipakai untuk kotak-cat & seri chart.
-- ==============================================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS color TEXT
  CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');
