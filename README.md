# Clarity

Dein persönliches Command Center — eine responsive PWA, die dir morgens
einen Tagesplan zeigt. **Phase 1:** Fundament + Heute-View mit Dummy-Daten
(noch keine APIs, kein Login, keine KI).

## Tech-Stack

- **Vite + React** — schnelles Setup, simpel gehalten (kein Next.js)
- **Tailwind CSS v4** — Styling über Utility-Klassen
- **lucide-react** — Icons
- **vite-plugin-pwa** — Manifest + Service Worker (auf dem iPhone zum
  Homescreen hinzufügbar)

## Loslegen

```bash
npm install      # Abhängigkeiten installieren
npm run dev      # Dev-Server starten → http://localhost:5173
npm run build    # Produktions-Build (erzeugt auch Service Worker)
npm run preview  # Build lokal ansehen
npm run icons    # PWA-Icons neu generieren (public/*.png)
```

## Projektstruktur

```
src/
  components/   Wiederverwendbare UI-Teile (FocusCard, TimelineItem, TaskCard …)
  views/        Die Seiten (TodayView)
  data/         Dummy-Daten — getrennt von der UI, in Phase 2 durch APIs ersetzbar
  lib/          Hilfsfunktionen (Datum formatieren)
scripts/        Icon-Generator für die PWA
```

### Der saubere Schnitt

Die Komponenten kennen ihre Datenquelle **nicht** — sie bekommen alles als
Props. Alle Beispiel-Daten liegen zentral in `src/data/dummyData.js`. In
Phase 2 tauschen wir dort nur den Inhalt gegen echte API-Calls (Notion,
Google Calendar) — die UI bleibt unverändert.

## Die Heute-View enthält

1. **Header** — Begrüßung + heutiges Datum
2. **Dein Fokus heute** — 3 KI-vorgeschlagene Top-Tasks
3. **Dein Tag** — kompakte Timeline mit Terminen
4. **Offene Tasks** — gruppiert nach Studium / Arbeit / Privat (je eigener Akzent)
5. **+ Task** — schwebender Button zum Erfassen (Phase 1: nur UI)

## Nächste Phasen

| Phase | Inhalt |
|-------|--------|
| 1 ✅  | Fundament + Heute-View mit Dummy-Daten |
| 2     | Echte Integrationen: Notion API, Google Calendar API |
| 3     | KI-Kern: Auto-Priorisierung + Tagesplan-Vorschlag |
| 4     | Voice Capture, Muster-Erkennung, Focus Mode |
| 5     | Deployment, Login, Onboarding |
