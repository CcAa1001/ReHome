-- REHOME: MOCK DATA GENERATION
-- 1. Pastikan RLS Storage sudah diatur agar gambar bisa diakses publik (sudah kita bahas sebelumnya).
-- 2. Pastikan file gambar sudah di-rename dan di-upload ke bucket masing-masing sesuai instruksi.

-- ==============================================================================
-- INSERT MOCK PROFILES (SELLERS)
-- Kita akan membuat 3 akun Seller (tanpa melalui proses registrasi auth.users normal 
-- karena ini hanya mock data. Oleh karena itu kita bypass auth.users sementara).
-- ==============================================================================

-- Karena tabel profiles punya foreign key ke auth.users, kita perlu bikin data bayangan di auth.users dulu:
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'elena@example.com', 'dummy', now(), '{"full_name":"Elena Studio"}'::jsonb, now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcus@example.com', 'dummy', now(), '{"full_name":"Marcus Design"}'::jsonb, now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vintage@example.com', 'dummy', now(), '{"full_name":"Vintage Archive"}'::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Trigger otomatis akan membuat profiles, tapi kita update profil mereka:
UPDATE public.profiles SET 
  full_name = 'Elena Studio',
  shop_name = 'Elena Studio',
  description = 'Curating mid-century modern pieces from Copenhagen to the world.',
  location = 'Copenhagen, DK',
  role = 'seller',
  avatar_url = 'https://gmetwwjxgqeclapbnyfo.supabase.co/storage/v1/object/public/avatars/avatar-elena.jpg'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET 
  full_name = 'Marcus Design',
  shop_name = 'Marcus Design',
  description = 'Passionate about sustainable materials and brutalist architecture.',
  location = 'Berlin, DE',
  role = 'seller',
  avatar_url = 'https://gmetwwjxgqeclapbnyfo.supabase.co/storage/v1/object/public/avatars/avatar-marcus.jpg'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET 
  full_name = 'Vintage Archive',
  shop_name = 'Vintage Archive',
  description = 'Rare finds and exceptional classics. Verified authenticity guaranteed.',
  location = 'London, UK',
  role = 'seller'
WHERE id = '33333333-3333-3333-3333-333333333333';

-- ==============================================================================
-- INSERT MOCK PRODUCTS
-- ==============================================================================

INSERT INTO public.products (title, maker, description, category, condition, price, currency, carbon_offset, seller_id, status, image_url, image_urls, stock)
VALUES
(
  'Curated Oak Lounge Chair',
  'Hans J. Wegner',
  'A masterpiece of Scandinavian influence, this lounge chair features a solid white oak frame with hand-finished joinery. The upholstery is a sustainable blend of organic linen and wool.',
  'Seating',
  'Excellent',
  1240,
  'USD',
  45,
  '11111111-1111-1111-1111-111111111111',
  'active',
  'https://gmetwwjxgqeclapbnyfo.supabase.co/storage/v1/object/public/product-images/product-chair.png',
  '["https://gmetwwjxgqeclapbnyfo.supabase.co/storage/v1/object/public/product-images/product-chair.png"]'::jsonb,
  2
),
(
  'Amber Glass Organic Vase',
  'Murano',
  'Handblown in Murano, Italy in the late 1970s. This vase captures the light beautifully and serves as a striking centerpiece. Mint condition with original maker mark.',
  'Decor',
  'Pristine',
  320,
  'USD',
  12,
  '11111111-1111-1111-1111-111111111111',
  'active',
  'https://gmetwwjxgqeclapbnyfo.supabase.co/storage/v1/object/public/product-images/product-vase.png',
  '["https://gmetwwjxgqeclapbnyfo.supabase.co/storage/v1/object/public/product-images/product-vase.png"]'::jsonb,
  1
),
(
  'Mid-Century Teak Sideboard',
  'G-Plan',
  'Classic 1960s teak sideboard offering ample storage. Beautiful grain matching on the doors. Fully restored and oiled with eco-friendly finishes.',
  'Storage & Tables',
  'Good',
  850,
  'USD',
  120,
  '22222222-2222-2222-2222-222222222222',
  'active',
  'https://gmetwwjxgqeclapbnyfo.supabase.co/storage/v1/object/public/product-images/product-desk.png',
  '["https://gmetwwjxgqeclapbnyfo.supabase.co/storage/v1/object/public/product-images/product-desk.png"]'::jsonb,
  1
),
(
  'Togo Modular Sofa',
  'Ligne Roset',
  'An iconic piece of 1970s design. Reupholstered in premium sustainable corduroy. Features two corner pieces and one center module.',
  'Seating',
  'Excellent',
  4500,
  'USD',
  210,
  '33333333-3333-3333-3333-333333333333',
  'active',
  'https://gmetwwjxgqeclapbnyfo.supabase.co/storage/v1/object/public/product-images/product-sofa.png',
  '["https://gmetwwjxgqeclapbnyfo.supabase.co/storage/v1/object/public/product-images/product-sofa.png"]'::jsonb,
  1
),
(
  'Brutalist Steel Floor Lamp',
  'Unknown',
  'A striking geometric floor lamp from the 1980s. Raw welded steel base with a custom linen shade. Newly rewired.',
  'Lighting',
  'Fair',
  560,
  'USD',
  35,
  '22222222-2222-2222-2222-222222222222',
  'active',
  NULL,
  '[]'::jsonb,
  1
),
(
  'Travertine Coffee Table',
  'Italian Design',
  'Solid unfilled travertine coffee table with a sculptural pedestal base. Very heavy and substantial. Shows natural variations in the stone.',
  'Storage & Tables',
  'Excellent',
  1100,
  'USD',
  85,
  '33333333-3333-3333-3333-333333333333',
  'active',
  NULL,
  '[]'::jsonb,
  1
);
