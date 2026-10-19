-- ==============================================================================
-- Migration: 20261019000000_receipt_tokens.sql
-- Proyek: Expense Tracker
-- Deskripsi: Token pribadi untuk kirim struk dari luar browser (iOS Shortcuts)
--            ke POST /api/receipts. Hanya hash SHA-256 yang disimpan.
--            Akses lewat token memakai fungsi SECURITY DEFINER (tanpa service
--            role key); fungsi sendiri yang memastikan data milik pemilik token.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.receipt_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_receipt_tokens_updated_at ON public.receipt_tokens;
CREATE TRIGGER trg_receipt_tokens_updated_at
  BEFORE UPDATE ON public.receipt_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.receipt_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own receipt token" ON public.receipt_tokens;
CREATE POLICY "Users can view their own receipt token"
  ON public.receipt_tokens FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own receipt token" ON public.receipt_tokens;
CREATE POLICY "Users can insert their own receipt token"
  ON public.receipt_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own receipt token" ON public.receipt_tokens;
CREATE POLICY "Users can update their own receipt token"
  ON public.receipt_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own receipt token" ON public.receipt_tokens;
CREATE POLICY "Users can delete their own receipt token"
  ON public.receipt_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Kategori milik pemilik token (untuk prompt scan). Token salah -> kosong.
CREATE OR REPLACE FUNCTION public.receipt_token_categories(p_token TEXT)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.name::TEXT
  FROM public.categories c
  JOIN public.receipt_tokens t ON t.user_id = c.user_id
  WHERE t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

-- Catat transaksi atas nama pemilik token. Token salah -> NULL.
-- Kategori bukan milik user / NULL -> fallback 'Lainnya' (atau kategori pertama).
CREATE OR REPLACE FUNCTION public.receipt_token_add_transaction(
  p_token TEXT,
  p_amount NUMERIC,
  p_date DATE,
  p_category_id UUID,
  p_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_cat UUID;
  v_id UUID;
BEGIN
  UPDATE public.receipt_tokens
     SET last_used_at = NOW()
   WHERE token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  RETURNING user_id INTO v_user;

  IF v_user IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT c.id INTO v_cat
    FROM public.categories c
   WHERE c.id = p_category_id AND c.user_id = v_user;

  IF v_cat IS NULL THEN
    SELECT c.id INTO v_cat
      FROM public.categories c
     WHERE c.user_id = v_user
     ORDER BY (c.name = 'Lainnya') DESC, c.created_at
     LIMIT 1;
  END IF;

  INSERT INTO public.transactions (user_id, category_id, amount, description, transaction_date)
  VALUES (v_user, v_cat, p_amount, LEFT(p_description, 500), COALESCE(p_date, CURRENT_DATE))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.receipt_token_categories(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.receipt_token_add_transaction(TEXT, NUMERIC, DATE, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.receipt_token_categories(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.receipt_token_add_transaction(TEXT, NUMERIC, DATE, UUID, TEXT) TO anon, authenticated;
