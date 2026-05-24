-- =============================================
-- FINKU - Run this in Supabase SQL Editor
-- Settings > SQL Editor > New Query > Paste > Run
-- =============================================

-- 1. Profiles table (stores language preference)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  language text default null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table profiles enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);


-- 2. Income table
create table income (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount decimal(10,2) not null,
  description text not null,
  client text default '',
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table income enable row level security;

create policy "Users manage own income" on income
  for all using (auth.uid() = user_id);


-- 3. Expenses table
create table expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount decimal(10,2) not null,
  description text not null,
  category text default 'other',
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table expenses enable row level security;

create policy "Users manage own expenses" on expenses
  for all using (auth.uid() = user_id);


-- 4. Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
