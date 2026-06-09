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
  done        boolean not null default false,
  inserted_at timestamptz not null default now()
);

-- Falls die Tabelle aus einer früheren Version stammt: fehlende Spalten
-- nachträglich ergänzen.
alter table public.tasks add column if not exists due_date date;
alter table public.tasks add column if not exists description text;

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
