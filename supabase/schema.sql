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

-- Nur erlaubte Werte für die Wiederholung.
alter table public.tasks drop constraint if exists tasks_repeat_check;
alter table public.tasks add constraint tasks_repeat_check
  check (repeat is null or repeat in ('daily', 'weekly'));

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
  repeat       text check (repeat is null or repeat in ('daily', 'weekly')),
  inserted_at  timestamptz not null default now()
);

alter table public.task_templates enable row level security;

drop policy if exists "Nutzer verwalten ihre eigenen Vorlagen" on public.task_templates;
create policy "Nutzer verwalten ihre eigenen Vorlagen"
  on public.task_templates
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
