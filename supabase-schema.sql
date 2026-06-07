-- REHOME V5 DATABASE RESET SCRIPT
-- WARNING: Running this will drop your existing tables and data!
-- Execute this entirely in the Supabase SQL Editor.

-- 1. DROP EXISTING TABLES AND TRIGGERS
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user cascade;
drop function if exists public.prevent_profile_role_change cascade;

drop table if exists public.favorites cascade;
drop table if exists public.user_settings cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.cart_items cascade;
drop table if exists public.products cascade;
drop table if exists public.profiles cascade;

-- 2. CREATE TABLES EXACTLY AS REQUESTED

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL DEFAULT ''::text,
  email text NOT NULL DEFAULT ''::text,
  location text DEFAULT ''::text,
  role text NOT NULL DEFAULT 'buyer'::text,
  impact_score integer NOT NULL DEFAULT 0,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  shop_name text,
  description text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  maker text,
  description text,
  category text NOT NULL DEFAULT 'Furniture'::text,
  condition text NOT NULL DEFAULT 'Excellent'::text,
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  image_url text,
  carbon_offset numeric NOT NULL DEFAULT 0,
  seller_id uuid,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  stock integer DEFAULT 1,
  status text NOT NULL DEFAULT 'active'::text,
  image_urls jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  carbon_credit numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid,
  title text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  delivery_status text NOT NULL DEFAULT 'vaulted'::text,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

CREATE TABLE public.user_settings (
  user_id uuid NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  theme text NOT NULL DEFAULT 'light'::text,
  email_notifications boolean NOT NULL DEFAULT true,
  carbon_tracking boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

-- 3. ENABLE ROW LEVEL SECURITY

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.user_settings enable row level security;
alter table public.favorites enable row level security;

-- 4. CREATE RLS POLICIES

-- Profiles
create policy "Profiles are public" on public.profiles for select to public using (true);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

-- Products
create policy "Products are public" on public.products for select to public using (true);
create policy "Sellers can insert products" on public.products for insert to authenticated with check (auth.uid() = seller_id);
create policy "Sellers can update own products" on public.products for update to authenticated using (auth.uid() = seller_id);
-- NEW: Allow ANY authenticated user to buy/reduce stock of active products!
create policy "Buyers can reduce stock of active products" on public.products for update to authenticated using (status = 'active');

-- Cart Items
create policy "Users manage own cart" on public.cart_items for all to authenticated using (auth.uid() = user_id);

-- Orders
create policy "Users view own orders" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own orders" on public.orders for insert to authenticated with check (auth.uid() = user_id);

-- Order Items
create policy "Users view own order items" on public.order_items for select to authenticated using (
  order_id in (select id from public.orders where user_id = auth.uid())
);
create policy "Users insert order items" on public.order_items for insert to authenticated with check (
  order_id in (select id from public.orders where user_id = auth.uid())
);

-- Favorites
create policy "Users manage own favorites" on public.favorites for all to authenticated using (auth.uid() = user_id);

-- User Settings
create policy "Users manage own settings" on public.user_settings for all to authenticated using (auth.uid() = user_id);


-- 5. CREATE AUTHENTICATION TRIGGERS

create or replace function public.handle_new_user() 
returns trigger 
language plpgsql 
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Curator'),
    new.email
  );
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. SETUP STORAGE BUCKETS (Optional, just in case they were deleted)
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
