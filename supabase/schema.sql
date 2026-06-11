-- Clarity – Datenbank-Setup für Supabase
-- ----------------------------------------------------------------------
-- So benutzt du diese Datei:
--   1. Supabase-Projekt anlegen auf https://supabase.com (kostenlos).
--   2. Im Projekt links auf "SQL Editor" → "New query".
--   3. Diesen kompletten Inhalt einfügen und auf "Run" klicken.
-- Die Datei ist idempotent: Du kannst sie nach Updates erneut ausführen,
-- um neue Spalten zu ergänzen, ohne bestehende Daten zu verlieren.

-- Die Tabelle für Tasks.
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  -- user_id verknüpft jede Task mit dem eingeloggten Konto.
  user_id     uuid not null references auth.users (id) on delete cascade
              default auth.uid(),
  title       text not null,
  area        text not null check (area in ('study', 'work', 'private')),
  due_date    date,        -- Fälligkeit als echtes Datum (optional)
  description text,         -- Beschreibung (optional)
  repeat      text,        -- Wiederholung: null, 'daily' oder 'weekly'
  duration_min int default 30, -- geschätzte Dauer in Minuten (für den Tagesplan)
  done        boolean not null default false,
  completed_at timestamptz, -- wann zuletzt erledigt (für Wochenrückblick)
  inserted_at timestamptz not null default now()
);

-- Falls die Tabelle aus einer früheren Version stammt: fehlende Spalten
-- nachträglich ergänzen.
alter table public.tasks add column if not exists due_date date;
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists repeat text;
alter table public.tasks add column if not exists duration_min int default 30;
alter table public.tasks add column if not exists completed_at timestamptz;
alter table public.tasks add column if not exists priority text default 'medium';
alter table public.tasks add column if not exists subtasks jsonb not null default '[]';
alter table public.tasks add column if not exists tags jsonb not null default '[]';

-- Erlaubte Werte für die Wiederholung: feste Voreinstellungen oder ein
-- 'days:'-Muster für bestimmte Wochentage (z.B. 'days:1,3,5').
alter table public.tasks drop constraint if exists tasks_repeat_check;
alter table public.tasks add constraint tasks_repeat_check
  check (
    repeat is null
    or repeat in ('daily', 'weekdays', 'weekly', 'biweekly')
    or repeat ~ '^days:[0-6](,[0-6])*$'
  );

-- Priorität: 'low', 'medium' oder 'high' (Standard 'medium').
alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.tasks add constraint tasks_priority_check
  check (priority in ('low', 'medium', 'high'));

-- Dauer muss positiv und im Tagesrahmen bleiben.
alter table public.tasks drop constraint if exists tasks_duration_check;
alter table public.tasks add constraint tasks_duration_check
  check (duration_min is null or (duration_min > 0 and duration_min <= 1440));

-- Row Level Security: ohne passende Regel sieht niemand etwas.
alter table public.tasks enable row level security;

-- Regel neu setzen (erst löschen, dann anlegen → wiederholbar ausführbar).
drop policy if exists "Nutzer verwalten ihre eigenen Tasks" on public.tasks;
create policy "Nutzer verwalten ihre eigenen Tasks"
  on public.tasks
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------
-- Vorlagen: wiederkehrende Routine-Tasks als Blaupause (ohne Fälligkeit).
-- Per Tipp lässt sich daraus mit einem Klick eine echte Task anlegen.
create table if not exists public.task_templates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade
               default auth.uid(),
  title        text not null,
  area         text not null check (area in ('study', 'work', 'private')),
  duration_min int default 30,
  description  text,
  repeat       text,
  inserted_at  timestamptz not null default now()
);

-- Wiederholung der Vorlage: gleiche erlaubte Werte wie bei den Tasks.
alter table public.task_templates drop constraint if exists task_templates_repeat_check;
alter table public.task_templates add constraint task_templates_repeat_check
  check (
    repeat is null
    or repeat in ('daily', 'weekdays', 'weekly', 'biweekly')
    or repeat ~ '^days:[0-6](,[0-6])*$'
  );

alter table public.task_templates enable row level security;

drop policy if exists "Nutzer verwalten ihre eigenen Vorlagen" on public.task_templates;
create policy "Nutzer verwalten ihre eigenen Vorlagen"
  on public.task_templates
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------
-- Studium: Kurse/Module. Eine Task kann optional zu einem Kurs gehören
-- (nur im Bereich 'study' genutzt). Note/ECTS speisen den Notenspiegel.
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade
              default auth.uid(),
  name        text not null,
  color       text,          -- Akzentfarbe (CSS-Variable oder Hex)
  semester    text,          -- z.B. 'WS25/26'
  ects        int,           -- Leistungspunkte (optional)
  grade       numeric,       -- deutsche Note 1.0–5.0 oder null (noch offen)
  inserted_at timestamptz not null default now()
);

-- Note im deutschen System (1.0 sehr gut … 5.0 nicht bestanden), optional.
alter table public.courses drop constraint if exists courses_grade_check;
alter table public.courses add constraint courses_grade_check
  check (grade is null or (grade >= 1.0 and grade <= 5.0));

-- ECTS plausibel begrenzen, optional.
alter table public.courses drop constraint if exists courses_ects_check;
alter table public.courses add constraint courses_ects_check
  check (ects is null or (ects >= 0 and ects <= 300));

alter table public.courses enable row level security;

drop policy if exists "Nutzer verwalten ihre eigenen Kurse" on public.courses;
create policy "Nutzer verwalten ihre eigenen Kurse"
  on public.courses
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Verknüpfung Task → Kurs (beim Löschen des Kurses auf null gesetzt, die
-- Task bleibt erhalten) und der Task-Typ: normale Aufgabe oder Klausur.
alter table public.tasks add column if not exists course_id uuid
  references public.courses (id) on delete set null;
alter table public.tasks add column if not exists kind text default 'task';
alter table public.tasks drop constraint if exists tasks_kind_check;
alter table public.tasks add constraint tasks_kind_check
  check (kind in ('task', 'exam'));
