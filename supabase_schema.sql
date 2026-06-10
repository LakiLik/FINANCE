-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: public.profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger for new auth users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Table: transactions (Entrate e Uscite)
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount numeric not null,
  type text check (type in ('income', 'expense')) not null,
  category text not null,
  notes text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.transactions enable row level security;
create policy "Users can CRUD own transactions" on public.transactions for all using (auth.uid() = user_id);

-- Table: subscriptions (Abbonamenti)
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  cost numeric not null,
  frequency text check (frequency in ('monthly', 'yearly')) not null,
  next_billing_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.subscriptions enable row level security;
create policy "Users can CRUD own subscriptions" on public.subscriptions for all using (auth.uid() = user_id);

-- Table: fuel_logs (Carburante)
create table public.fuel_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  price_per_liter numeric not null,
  total_spent numeric not null,
  liters numeric generated always as (total_spent / price_per_liter) stored,
  mileage integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.fuel_logs enable row level security;
create policy "Users can CRUD own fuel logs" on public.fuel_logs for all using (auth.uid() = user_id);

-- Table: inventory_items (Magazzino)
create table public.inventory_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  purchase_price numeric not null,
  selling_price numeric,
  quantity integer default 0 not null,
  category text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.inventory_items enable row level security;
create policy "Users can CRUD own inventory" on public.inventory_items for all using (auth.uid() = user_id);

-- Table: inventory_images (Immagini Magazzino)
create table public.inventory_images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  item_id uuid references public.inventory_items on delete cascade not null,
  storage_path text not null,
  public_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.inventory_images enable row level security;
create policy "Users can CRUD own inventory images" on public.inventory_images for all using (auth.uid() = user_id);

-- Table: invoices (Fatture)
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  type text check (type in ('active', 'passive')) not null,
  date date not null,
  amount numeric not null,
  partner_name text not null,
  status text check (status in ('paid', 'pending', 'waiting')) not null,
  storage_path text,
  public_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.invoices enable row level security;
create policy "Users can CRUD own invoices" on public.invoices for all using (auth.uid() = user_id);

-- Storage Buckets & Policies
insert into storage.buckets (id, name, public) values ('inventory_images', 'inventory_images', true);
insert into storage.buckets (id, name, public) values ('invoices', 'invoices', false);

create policy "Users can upload their own inventory images" on storage.objects for insert with check (bucket_id = 'inventory_images' AND auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update their own inventory images" on storage.objects for update using (bucket_id = 'inventory_images' AND auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete their own inventory images" on storage.objects for delete using (bucket_id = 'inventory_images' AND auth.uid()::text = (storage.foldername(name))[1]);
create policy "Anyone can view inventory images" on storage.objects for select using (bucket_id = 'inventory_images');

create policy "Users can upload their own invoices" on storage.objects for insert with check (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can view their own invoices" on storage.objects for select using (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update their own invoices" on storage.objects for update using (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete their own invoices" on storage.objects for delete using (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable explicit realtime publications
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.inventory_items;
alter publication supabase_realtime add table public.invoices;
