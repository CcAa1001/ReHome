-- REHOME: OFFERS TABLE MIGRATION
-- Jalankan script ini di Supabase SQL Editor.

CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount numeric NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  counter_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Buyer & Seller bisa lihat offers mereka masing-masing
CREATE POLICY "Users view own offers" ON public.offers FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can insert offers" ON public.offers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Offer participants can update" ON public.offers FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Admin bisa lihat semua offers
CREATE POLICY "Admin view all offers" ON public.offers FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
