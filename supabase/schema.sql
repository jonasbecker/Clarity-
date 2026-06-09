-- Clarity – Datenbank-Setup für Supabase
-- ----------------------------------------------------------------------
-- So benutzt du diese Datei:
--   1. Supabase-Projekt anlegen auf https://supabase.com (kostenlos).
--   2. Im Projekt links auf "SQL Editor" → "New query".
--   3. Diesen kompletten Inhalt einfügen und auf "Run" klicken.
-- Danach existiert die Tabelle "tasks" inklusive Sicherheit (RLS).

-- Die Tabelle für Tasks.
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  -- user_id verknüpft jede Task mit dem eingeloggten Konto.
  -- default auth.uid() setzt sie automatisch auf den aktuellen Nutzer.
  user_id     uuid not null references auth.users (id) on delete cascade
              default auth.uid(),
  title       text not null,
  area        text not null check (area in ('study', 'work', 'private')),
  due         text,
  done        boolean not null default false,
  inserted_at timestamptz not null default now()
);

-- Row Level Security einschalten: ohne passende Regel sieht niemand etwas.
alter table public.tasks enable row level security;

-- Eine Regel, die alles erlaubt — ABER nur für die eigenen Zeilen.
-- So sieht und ändert jeder Nutzer ausschließlich seine eigenen Tasks,
-- obwohl alle denselben öffentlichen "anon key" verwenden.
create policy "Nutzer verwalten ihre eigenen Tasks"
  on public.tasks
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
