-- CLEAN UP TEST DATA
-- Jalankan script ini di Supabase SQL Editor.
-- Script ini akan menghapus SEMUA barang "duplikat" atau barang uji coba yang Anda buat sendiri saat testing Resell, 
-- dan hanya akan menyisakan barang-barang original dari akun toko palsu (Elena, Marcus, Vintage).

DELETE FROM public.products 
WHERE seller_id NOT IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);
