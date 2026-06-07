
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  location text default '',
  role text not null default 'buyer',
  impact_score integer not null default 0,
  shop_name text,
  avatar_url text,
  description text,
  created_at timestamptz not null default now()
);

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  if old.role is distinct from new.role and auth.uid() = new.id then
    raise exception 'Role changes must be performed by trusted backend/admin tooling.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_change on public.profiles;
create trigger prevent_profile_role_change
before update on public.profiles
for each row execute function public.prevent_profile_role_change();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  maker text,
  description text,
  category text not null default 'Furniture',
  condition text not null default 'Excellent',
  price numeric(12,2) not null,
  currency text not null default 'USD',
  image_url text,
  image_urls jsonb not null default '[]'::jsonb,
  stock integer not null default 1,
  carbon_offset numeric(8,2) not null default 0,
  seller_id uuid references public.profiles(id) on delete set null,
  is_featured boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  subtotal numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  carbon_credit numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title text not null,
  quantity integer not null default 1,
  price numeric(12,2) not null,
  delivery_status text not null default 'vaulted'
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'USD',
  theme text not null default 'light',
  email_notifications boolean not null default true,
  carbon_tracking boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.user_settings enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_allowed') then
    alter table public.profiles
    add constraint profiles_role_allowed check (role in ('buyer', 'seller', 'admin'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_text_size_guard') then
    alter table public.profiles
    add constraint profiles_text_size_guard check (
      length(full_name) <= 120
      and length(email) <= 254
      and length(coalesce(location, '')) <= 160
      and length(coalesce(avatar_url, '')) <= 2048
    );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'products_size_and_price_guard') then
    alter table public.products
    add constraint products_size_and_price_guard check (
      length(title) between 1 and 120
      and length(coalesce(maker, '')) <= 120
      and length(coalesce(description, '')) <= 1000
      and length(category) between 1 and 80
      and length(condition) between 1 and 80
      and length(currency) between 3 and 8
      and length(coalesce(image_url, '')) <= 2048
      and price >= 0
      and carbon_offset >= 0
    );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cart_items_quantity_guard') then
    alter table public.cart_items
    add constraint cart_items_quantity_guard check (quantity between 1 and 99);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_status_and_amount_guard') then
    alter table public.orders
    add constraint orders_status_and_amount_guard check (
      status in ('pending', 'transit', 'shipped', 'delivered', 'completed', 'cancelled')
      and subtotal >= 0
      and shipping >= 0
      and carbon_credit >= 0
      and total >= 0
    );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'order_items_size_and_amount_guard') then
    alter table public.order_items
    add constraint order_items_size_and_amount_guard check (
      length(title) between 1 and 120
      and quantity between 1 and 99
      and price >= 0
    );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_settings_allowed_values') then
    alter table public.user_settings
    add constraint user_settings_allowed_values check (
      currency in ('USD', 'IDR', 'EUR')
      and theme in ('light', 'soft')
    );
  end if;
end;
$$;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
on public.profiles for select
to authenticated, anon
using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Products are public" on public.products;
create policy "Products are public"
on public.products for select
to authenticated, anon
using (true);

drop policy if exists "Sellers can create products" on public.products;
create policy "Sellers can create products"
on public.products for insert
to authenticated
with check ((select auth.uid()) = seller_id);

drop policy if exists "Sellers can update their own products" on public.products;
create policy "Sellers can update their own products"
on public.products for update
to authenticated
using ((select auth.uid()) = seller_id)
with check ((select auth.uid()) = seller_id);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
    and profiles.role = 'admin'
  )
);

drop policy if exists "Users can view their own cart" on public.cart_items;
create policy "Users can view their own cart"
on public.cart_items for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own cart" on public.cart_items;
create policy "Users can manage their own cart"
on public.cart_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own cart" on public.cart_items;
create policy "Users can update their own cart"
on public.cart_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own cart" on public.cart_items;
create policy "Users can delete their own cart"
on public.cart_items for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
on public.orders for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own orders" on public.orders;
create policy "Users can create their own orders"
on public.orders for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own order items" on public.order_items;
create policy "Users can view their own order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can create their own order items" on public.order_items;
create policy "Users can create their own order items"
on public.order_items for insert
to authenticated
with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can view their own settings" on public.user_settings;
create policy "Users can view their own settings"
on public.user_settings for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own settings" on public.user_settings;
create policy "Users can manage their own settings"
on public.user_settings for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own settings" on public.user_settings;
create policy "Users can update their own settings"
on public.user_settings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'New ReHome User')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Product images are public" on storage.objects;
create policy "Product images are public"
on storage.objects for select
to authenticated, anon
using (bucket_id = 'product-images');

drop policy if exists "Users can upload product images" on storage.objects;
create policy "Users can upload product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update their product images" on storage.objects;
create policy "Users can update their product images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete their product images" on storage.objects;
create policy "Users can delete their product images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

insert into public.products
(title, maker, description, category, condition, price, currency, image_url, carbon_offset, is_featured)
select title, maker, description, category, condition, price, currency, image_url, carbon_offset, is_featured
from (values
('About A Chair 22', 'HAY Design', 'A clean Scandinavian chair for slow interiors.', 'Seating', 'Like New', 185, 'USD', 'assets/figma-export/c7a2095a5d0eb16cbdcad4fcb7c6f07e034adb0f.png', 1.2, true),
('Control Table Lamp', 'Muuto', 'Compact table lamp with sculptural presence.', 'Decor', 'Pristine', 120, 'USD', 'assets/figma-export/585f92e3662d379261eb92c36f8bc58c7e846362.png', 0.8, true),
('Grib Toolbox Vase', 'Ferm Living', 'A calm ceramic set for tactile homes.', 'Decor', 'Excellent', 85, 'USD', 'assets/figma-export/e24b16ff6b341c1759a6066cedd4c69ab55c09ee.png', 0.9, true),
('Elowen Lounge Chair', 'Artek', 'A restored oak lounge chair with gray woven upholstery.', 'Seating', 'Like New', 850, 'USD', 'assets/figma-export/c92ff17556827d47a8e24c0f458a0824ae243188.png', 2.2, false),
('Walnut Writing Bureau', 'Vintage Studio', 'Circa 1960 walnut writing bureau from London.', 'Storage & Tables', 'Good', 1100, 'USD', 'assets/figma-export/2c599988de934055ead448b9abf9204292e752e2.png', 2.8, false),
('Brass Sculptural Lamp', 'Atelier Nocturne', 'Handcrafted sculptural lamp with warm brass tone.', 'Decor', 'Excellent', 340, 'USD', 'assets/figma-export/d7ab5e4107ceb6fa602d2a38b6fd105e10f50217.jpg', 1.1, false),
('Mags Soft Modular', 'HAY', 'Original HAY modular sofa from Paris.', 'Seating', 'Like New', 2900, 'USD', 'assets/figma-export/ff589ffcc586624306d3a40d43bc7c5c6a29c8eb.png', 4.8, false),
('Oak Arc Table', 'Custom Made', 'Custom oak table from Amsterdam.', 'Storage & Tables', 'Like New', 1450, 'USD', 'assets/figma-export/70e1f26af8d8c8a801bc699d95272597eb1791a6.png', 3.0, false)
) as seed(title, maker, description, category, condition, price, currency, image_url, carbon_offset, is_featured)
where not exists (
  select 1 from public.products
  where products.title = seed.title
  and products.maker = seed.maker
);
