-- Enable UUID generation extension
create extension if not exists "uuid-ossp";


-- ============================================
-- 1. Testimonials Table
-- ============================================
create table testimonials (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  text text not null,
  source text default 'Google',
  rating numeric check (rating >= 0 and rating <= 5),
  created_at timestamptz default now()
);

-- ============================================
-- 2. Profiles Table (linked to Supabase Auth users)
-- ============================================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text check (role in ('admin', 'editor')) default 'admin',
  created_at timestamptz default now()
);

-- ============================================
-- 3. Patients Table
-- ============================================
create table patients (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text,
  phone text,
  birth_date date,
  gender text check (gender in ('male', 'female', 'other')),
  notes text,
  created_at timestamptz default now()
);

-- ============================================
-- 4. Appointments Table
-- ============================================
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  reason text,
  appointment_time timestamptz not null,
  duration_minutes int default 30,
  status text check (status in ('scheduled', 'completed', 'cancelled')) default 'scheduled',
  notes text,
  created_at timestamptz default now()
);

-- ============================================
-- 5. Optional: Admin Notes or Logs
-- ============================================
create table admin_logs (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  performed_by uuid references profiles(id),
  timestamp timestamptz default now()
);
