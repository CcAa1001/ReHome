-- FIX RLS FOR CHECKOUT
-- Jalankan script ini di Supabase SQL Editor.
-- Script ini memperbaiki aturan keamanan (RLS) yang sebelumnya memblokir sistem
-- untuk mengubah status barang menjadi 'sold' setelah dibeli.

DROP POLICY IF EXISTS "Buyers can reduce stock of active products" ON public.products;

CREATE POLICY "Buyers can reduce stock of active products" ON public.products
FOR UPDATE TO authenticated
USING (status = 'active')
WITH CHECK (true);
