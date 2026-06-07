-- REHOME: ADMIN RLS POLICIES
-- Jalankan script ini di Supabase SQL Editor SETELAH menjalankan migration-offers.sql
-- Script ini memberikan akses admin untuk melihat dan mengelola semua data.

-- 1. Admin bisa lihat semua orders (bukan hanya milik sendiri)
DROP POLICY IF EXISTS "Admin view all orders" ON public.orders;
CREATE POLICY "Admin view all orders" ON public.orders FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Admin bisa lihat semua order items
DROP POLICY IF EXISTS "Admin view all order items" ON public.order_items;
CREATE POLICY "Admin view all order items" ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Admin bisa hapus produk apapun
DROP POLICY IF EXISTS "Admin delete products" ON public.products;
CREATE POLICY "Admin delete products" ON public.products FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Admin bisa ubah role user
DROP POLICY IF EXISTS "Admin update profiles" ON public.profiles;
CREATE POLICY "Admin update profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Set your account as admin (GANTI EMAIL DIBAWAH DENGAN EMAIL ANDA!)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL@example.com';
