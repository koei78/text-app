-- 拡張（Supabaseはだいたい有効だが一応）
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Students table
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text not null check (grade in ('1-2','3-4','5-6')),
  email text,
  parentContact text,
  auth_user_id uuid,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);

-- RLS ON
alter table public.students enable row level security;

-- 既存ポリシーを消してから作り直す（IF NOT EXISTSは使えません）
drop policy if exists "students_select_all" on public.students;
drop policy if exists "students_insert_all" on public.students;
drop policy if exists "students_update_all" on public.students;
drop policy if exists "students_delete_all" on public.students;

-- 認証ユーザーに開放（デモ用。本番は締める）
create policy "students_select_all"
on public.students
for select
to authenticated
using (true);

create policy "students_insert_all"
on public.students
for insert
to authenticated
with check (true);

create policy "students_update_all"
on public.students
for update
to authenticated
using (true);

create policy "students_delete_all"
on public.students
for delete
to authenticated
using (true);

-- Messages table for chat
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_email text not null,
  receiver_email text not null,
  text text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

alter table public.messages enable row level security;

drop policy if exists "messages_select_all" on public.messages;
drop policy if exists "messages_insert_all" on public.messages;
drop policy if exists "messages_update_all" on public.messages;
drop policy if exists "messages_delete_all" on public.messages;

create policy "messages_select_all"
on public.messages
for select
to authenticated
using (true);

-- Materials
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  grade text not null check (grade in ('1-2','3-4','5-6')),
  level text not null check (level in ('easy','normal','hard')),
  tags jsonb not null default '[]'::jsonb,
  html_content text not null,
  thumbnail_url text,
  description text,
  createdat timestamptz not null default now(),
  updatedat timestamptz not null default now()
);

alter table public.materials enable row level security;

drop policy if exists "materials_select_all" on public.materials;
drop policy if exists "materials_insert_all" on public.materials;
drop policy if exists "materials_update_all" on public.materials;
drop policy if exists "materials_delete_all" on public.materials;

create policy "materials_select_all" on public.materials for select to authenticated using (true);
create policy "materials_insert_all" on public.materials for insert to authenticated with check (true);
create policy "materials_update_all" on public.materials for update to authenticated using (true);
create policy "materials_delete_all" on public.materials for delete to authenticated using (true);

-- Quizzes
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  level text not null check (level in ('easy','normal','hard')),
  description text,
  createdat timestamptz not null default now(),
  updatedat timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  type text not null check (type in ('single','multiple','boolean','text')),
  text text not null,
  choices jsonb,
  correct_indices jsonb,
  correct_index int,
  answer_bool boolean,
  rubric_hint text,
  idx int not null default 0
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_email text not null,
  answers jsonb not null,
  score_auto int,
  submitted_at timestamptz not null default now()
);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "quizzes_select_all" on public.quizzes;
drop policy if exists "quizzes_insert_all" on public.quizzes;
drop policy if exists "quizzes_update_all" on public.quizzes;
drop policy if exists "quizzes_delete_all" on public.quizzes;
create policy "quizzes_select_all" on public.quizzes for select to authenticated using (true);
create policy "quizzes_insert_all" on public.quizzes for insert to authenticated with check (true);
create policy "quizzes_update_all" on public.quizzes for update to authenticated using (true);
create policy "quizzes_delete_all" on public.quizzes for delete to authenticated using (true);

drop policy if exists "quiz_questions_all" on public.quiz_questions;
create policy "quiz_questions_all" on public.quiz_questions for all to authenticated using (true) with check (true);

drop policy if exists "quiz_attempts_select_insert" on public.quiz_attempts;
create policy "quiz_attempts_select_insert" on public.quiz_attempts for select to authenticated using (true);
create policy "quiz_attempts_insert" on public.quiz_attempts for insert to authenticated with check (true);

create policy "messages_insert_all"
on public.messages
for insert
to authenticated
with check (true);

create policy "messages_update_all"
on public.messages
for update
to authenticated
using (true);

create policy "messages_delete_all"
on public.messages
for delete
to authenticated
using (true);
