-- FIX RLS FOR ORDER ITEMS (RESELL & DELIVER)
-- Jalankan script ini di Supabase SQL Editor.
-- Script ini memberikan izin (policy) agar user bisa mengubah status barang mereka di Purchase History
-- menjadi 'resold' atau 'delivered'. Sebelumnya policy UPDATE ini terlupa sehingga sistem menolak diam-diam.

DROP POLICY IF EXISTS "Users update own order items" ON public.order_items;

CREATE POLICY "Users update own order items" ON public.order_items
FOR UPDATE TO authenticated
USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);
