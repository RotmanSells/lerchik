create extension if not exists "uuid-ossp";

create table public.masters (
    id text primary key,
    name text not null,
    color text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.procedures (
    id text primary key,
    title text not null,
    duration integer not null default 60,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.clients (
    phone_last_4 text primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_booking_at timestamp with time zone
);

create table public.bookings (
    id uuid default uuid_generate_v4() primary key,
    master_id text not null references public.masters(id),
    procedure_id text not null references public.procedures(id),
    client_phone text not null references public.clients(phone_last_4),
    date date not null,
    time_start time not null,
    time_end time not null,
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    constraint no_double_booking unique (master_id, date, time_start)
);

create table public.breaks (
    id uuid default uuid_generate_v4() primary key,
    master_id text not null references public.masters(id),
    date date not null,
    time_start time not null,
    time_end time not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.masters (id, name, color) values 
('ulya', 'Уля', 'mint'),
('lerchik', 'Лерчик', 'purple')
on conflict (id) do nothing;

insert into public.procedures (id, title, duration) values 
('massage', 'Массаж', 60),
('laser', 'Лазер', 60)
on conflict (id) do nothing;

alter table public.masters enable row level security;
alter table public.procedures enable row level security;
alter table public.bookings enable row level security;
alter table public.clients enable row level security;
alter table public.breaks enable row level security;

create policy "Public masters access" on public.masters for select using (true);
create policy "Public procedures access" on public.procedures for select using (true);
create policy "Public bookings select" on public.bookings for select using (true);
create policy "Public bookings insert" on public.bookings for insert with check (true);
create policy "Public bookings delete" on public.bookings for delete using (true);
create policy "Public clients access" on public.clients for all using (true);
create policy "Public breaks access" on public.breaks for select using (true);
