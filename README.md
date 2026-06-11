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
4. **Offene Tasks** — gruppiert nach Studium / Arbeit / Privat (je eigener Akzent),
   mit Suche und Bereichsfilter
5. **+ Task** — schwebender Button zum Erfassen

## KI-Tagesplan (Auto-Scheduler)

Das Herzstück — wie bei [Motion](https://www.usemotion.com/): Clarity legt
deine offenen Tasks automatisch als Zeitblöcke in die freien Lücken zwischen
deinen Kalender-Terminen, innerhalb deines Arbeitszeit-Fensters.

- Jede Task hat eine **geschätzte Dauer** (15 Min – 2 Std, im Task-Formular).
- Der **Scheduler** (`src/lib/scheduler.js`) ist eine reine, deterministische
  Funktion: er packt die Tasks verlässlich um deine Termine herum — läuft
  immer, auch ohne KI-Key.
- **„Mit KI optimieren"** ruft Groq auf: die KI bestimmt eine smartere
  Reihenfolge, schätzt fehlende Dauern und liefert kurze Begründungen. Fällt
  die KI aus, bleibt der deterministische Plan stehen.
- Das **Arbeitszeit-Fenster** stellst du direkt im Tagesplan ein (gemerkt im
  Browser). Tasks, die heute nicht mehr reinpassen, landen in einer eigenen
  Liste.
- **Reihenfolge selbst anpassen**: Task-Blöcke per Drag & Drop (Desktop) oder
  Hoch/Runter (überall, auch Touch) umsortieren — der Plan rechnet die Zeiten
  sofort neu. Deine manuelle Reihenfolge gilt für den Tag; „Auto" setzt sie
  zurück. Die Blöcke entsprechen genau deiner Prioritäts-Reihenfolge.
- **Heute / Woche**: über den Umschalter planst du nur heute oder gleich die
  nächsten 5 Tage. In der Wochenansicht rutscht alles, was an einem Tag nicht
  mehr reinpasst, automatisch auf den nächsten. Umsortieren wirkt global —
  schiebst du eine Task weit nach oben, landet sie an einem früheren Tag.
  Mit verbundenem Google Kalender plant Clarity **jeden** Tag um die echten
  Termine herum (es lädt die nächsten 7 Tage), nicht nur heute.
- **„Woche mit KI planen"**: in der Wochenansicht verteilt Groq deine offenen
  Tasks proaktiv auf die kommenden Tage — berücksichtigt Fälligkeiten, die
  freie Kapazität jedes Tages (Arbeitsfenster minus Termine) und gruppiert
  ähnliche Bereiche, mit kurzer Begründung je Task und einem Wochenüberblick.
  Das *Wann genau* rechnet weiterhin der deterministische Scheduler; fällt die
  KI aus, bleibt die normale Verteilung stehen.
- Mit verbundenem **Google Kalender** plant Clarity um deine echten Termine
  herum; ohne dienen Beispiel-Termine als Demo. Die Termine werden im
  Hintergrund automatisch aktualisiert (in Intervallen und beim Zurückkehren
  zur App), damit neue Meetings ohne Neuladen im Plan landen.

## Weitere Funktionen

- **Vorlagen & Schnellerfassung**: beim Anlegen einer Task „Als Vorlage merken"
  ankreuzen — danach erscheint sie als Chip unter „Schnell hinzufügen". Ein
  Tipp legt daraus sofort eine Task für heute an (mit Bereich, Dauer und
  Wiederholung der Vorlage), das × entfernt die Vorlage wieder. Mit Supabase
  liegen Vorlagen im Konto (geräteübergreifend), sonst lokal im Browser.
- **Wiederkehrende Tasks**: beim Anlegen/Bearbeiten „Täglich", „Werktags",
  „Wöchentlich", „Alle 2 Wochen" oder „Bestimmte Tage" (einzelne Wochentage
  Mo–So) wählen — nach dem Abhaken erscheint automatisch die nächste Instanz
  mit passender Fälligkeit. Priorität und Tags wandern mit, Checklisten-Haken
  werden zurückgesetzt.
- **Erinnerungen**: optionale Browser-Benachrichtigung beim Öffnen, wenn
  Tasks für heute fällig oder überfällig sind (höchstens einmal pro Tag).
- **Wochenrückblick**: zeigt, wie viele Tasks die letzten 7 Tage erledigt
  wurden — pro Bereich und als Streak.
- **Suche & Filter**: Tasks per Stichwort oder Bereich filtern.
- **Rückgängig**: gelöschte Tasks lassen sich kurz danach per Toast
  wiederherstellen.
- **Onboarding**: beim allerersten Start zeigt Clarity eine kurze,
  überspringbare Einführung in die wichtigsten Funktionen (KI-Tagesplan,
  Fokus-Modus, Vorlagen). Erscheint nur einmal — gemerkt im Browser.
- **Dark Mode**, **Voice Capture** (Task per Spracheingabe) und
  **Focus Mode** (eine Task im Vollbild). Der Focus Mode folgt dem Tagesplan:
  er geht die heute noch anstehenden Blöcke in geplanter Reihenfolge durch und
  zeigt je Task ihren geplanten Zeit-Slot.
- Im **Tagesplan** sind bereits vergangene Slots ausgegraut, der laufende
  Block ist mit „Jetzt" markiert.
- **Tagesfortschritt**: ein kleiner Fortschrittsring im Header zeigt, wie
  viele der heute fälligen Tasks schon erledigt sind.
- **Polish**: Lade-Skeletons statt „Lädt …", freundlichere Empty-States mit
  Icons sowie sanfte Animationen beim Erscheinen neuer Tasks und beim Abhaken.
- **Einklappbar**: „Dein Fokus heute" und „Dein Tagesplan" lassen sich per
  Klick auf die Überschrift einklappen — gemerkt im Browser, für eine
  schlankere Seite.
- **Priorität**: jede Task ist Niedrig/Mittel/Hoch — „Hoch" wird mit einer
  kleinen roten Flagge vor dem Titel hervorgehoben.
- **Tags**: frei wählbare Schlagwörter quer zu den drei Bereichen (z.B.
  „#Seminararbeit", „#dringend"). Im Formular hinzufügen, auf der Karte als
  kleine Chips sichtbar; über eine Tag-Leiste oder die Suche danach filtern.
- **Kurse/Module (Studium)**: Tasks im Bereich Studium lassen sich einem Kurs
  zuordnen (Name, Farbe, Semester, ECTS, Note). Im Task-Formular wählst du den
  Kurs aus oder legst per „+" direkt einen neuen an; auf der Karte erscheint ein
  farbiger Kurs-Chip, und über eine Kurs-Leiste filterst du die Liste danach.
  Kurse liegen mit Supabase im Konto, sonst lokal im Browser.
- **Klausuren & Lernfortschritt**: eine Studium-Task lässt sich als „Klausur"
  markieren — das Fälligkeitsfeld wird zum Klausurdatum, die Checkliste zu
  „Lernthemen". Der Fortschritt der Lernthemen (z.B. „2/4") zeigt, wie weit die
  Vorbereitung ist. Im Tagesplan rückt die Vorbereitung schon einige Tage vor
  der Klausur nach vorne, statt erst am Klausurtag aufzutauchen.
- **Studium-Hub als Startseite**: Clarity startet im **Studium-Hub** — Kennzahlen
  (Notenschnitt, ECTS, Klausuren), anstehende Klausuren mit Countdown und
  Lernfortschritt, eine Kachel-Galerie deiner aktuellen Kurse (Tippen springt zur
  gefilterten Aufgabenliste) und der **Notenspiegel** (ECTS-gewichteter Schnitt je
  Semester). Über die obere Navigation wechselst du zwischen **Studium** und
  **Heute** (Tagesplan/Fokus); archivierte Kurse bleiben außen vor.
- **Fach-Detailseite**: ein Tipp auf eine Kurs-Kachel öffnet die Detailseite mit
  Eckdaten, **wichtigen Links** (Moodle/Skript — hinzufügen/öffnen) und
  **Vorlesungsnotizen** als Akkordeon (reiner Text). Tabs trennen Inhalt,
  kursbezogene **Aufgaben** und **Termine**. Notizen/Links liegen am Kurs (mit
  Supabase im Konto, sonst lokal).
- **Lernaufgaben-Kanban**: im Aufgaben-Tab eines Kurses landen die Aufgaben in
  einem Board mit den Spalten **Nicht angefangen / In Arbeit / Fertig**. Am
  Desktop ziehst du Karten per Drag & Drop zwischen den Spalten, auf dem
  Smartphone verschieben kleine Pfeil-Knöpfe. „Fertig" hakt die Aufgabe ab; per
  „+ Aufgabe" legst du direkt eine neue Aufgabe im Kurs an.
- **KI-Studiencoach**: auf der Fach-Detailseite schlägt dir die KI per Knopf
  („KI-Empfehlung") die für genau diesen Kurs effizienteste Lernmethode vor (z.B.
  „Programmieraufgaben selbst lösen" vs. „Active Recall + Altklausuren") und eine
  priorisierte Liste der nächsten Schritte — Schritte mit Bezug zu einer Aufgabe
  öffnen diese direkt. Läuft über dieselbe Server-Funktion/denselben Groq-Key wie
  der KI-Tagesplan (nur auf der veröffentlichten Seite; ohne Key ein Hinweis).
- **Drag & Drop**: Tasks lassen sich am Griff (erscheint beim Drüberfahren)
  in eine andere Bereichs-Spalte ziehen (Desktop). Auf dem Smartphone den
  Bereich wie gewohnt im Formular ändern.
- **Mobile-Feinschliff**: Als installierte PWA zeigt das App-Icon ein Badge
  mit der Anzahl heute fälliger/überfälliger Tasks; nach unten ziehen
  aktualisiert die Liste (Pull-to-Refresh); beim Abhaken gibt es ein kurzes
  haptisches Feedback (sofern unterstützt). Offline läuft die App weiter und
  zeigt einen dezenten Hinweis.
- **Checklisten (Subtasks)**: einer Task im Formular Teilschritte hinzufügen;
  in der Liste erscheint der Fortschritt als „2/4".
- **Überfällig**: gibt es überfällige offene Tasks, erscheint ein Filter-Chip
  „Überfällig (n)"; überfällige Zeilen werden zusätzlich rot markiert und nach
  oben sortiert.
- **Tastatur-Shortcuts**: `n` neue Task, `/` Suche fokussieren, `f`
  Fokus-Modus — greifen nicht, während du in einem Eingabefeld tippst.
- **Statistik**: ein Knopf im Header (Balkendiagramm-Icon) öffnet eine
  Vollbild-Übersicht deiner erledigten Tasks — Gesamtzahl, Ø pro Woche,
  aktuelle Serie, Verteilung nach Bereich, Tageszeit und Wochentag sowie ein
  Wochentrend. Über einen Umschalter wählst du den Zeitraum (4/12/26 Wochen);
  ein Tipp auf einen Bereichsbalken filtert direkt die Task-Liste danach.
  Zeigt einen Hinweis, solange noch nichts erledigt wurde.

## Tasks speichern mit Supabase (optional)

Ohne Einrichtung läuft die App im **Demo-Modus**: Tasks funktionieren, werden
aber beim Neuladen nicht gespeichert. Damit Tasks dauerhaft in deinem eigenen
Konto liegen (und über Geräte synchronisieren), verbinde Supabase — kostenlos:

1. **Projekt anlegen** auf [supabase.com](https://supabase.com) (kostenloser Account).
2. **Tabelle erstellen**: im Projekt links *SQL Editor → New query*, den Inhalt
   von [`supabase/schema.sql`](supabase/schema.sql) einfügen und *Run* klicken.
3. **Schlüssel eintragen**: *Project Settings → API* öffnen, dann:
   ```bash
   cp .env.example .env.local
   ```
   In `.env.local` die *Project URL* und den *anon public* Key eintragen.
4. **(Empfohlen)** *Authentication → Providers → Email*: „Confirm email"
   ausschalten, damit du dich ohne Bestätigungs-Mail sofort anmelden kannst.
5. **Neu starten**: `npm run dev`. Jetzt erscheint statt des Demo-Banners ein
   Login — registrieren, anmelden, fertig. Deine Tasks liegen nun in Supabase.

> Die zwei Schlüssel sind **öffentlich** (kein Geheimnis). Die Sicherheit kommt
> aus *Row Level Security*: jeder sieht nur seine eigenen Tasks.

## Google Calendar verbinden (optional)

Ohne Einrichtung zeigt die Timeline Beispiel-Termine. Für deine echten
Termine brauchst du eine kostenlose **OAuth Client ID** von Google:

1. [console.cloud.google.com](https://console.cloud.google.com) → oben ein
   **neues Projekt** anlegen.
2. **APIs & Services → Library** → „Google Calendar API" suchen → **Enable**.
3. **APIs & Services → OAuth consent screen** → Typ **External** → App-Name +
   deine E-Mail eintragen. Unter **Test users** deine eigene Google-Adresse
   hinzufügen (sonst lässt Google dich nicht zu).
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** →
   Typ **Web application**. Bei **Authorized JavaScript origins** beide URLs
   eintragen:
   - `http://localhost:5173`
   - deine Vercel-URL, z. B. `https://clarity-chi-three.vercel.app`
   → **Create**, dann die **Client ID** kopieren.
5. Als `VITE_GOOGLE_CLIENT_ID` hinterlegen — in `.env.local` **und** in den
   Vercel Environment Variables. Danach (auf Vercel) einmal neu deployen.

In der App erscheint dann in der Timeline der Knopf **„Mit Google Kalender
verbinden"**. Beim ersten Mal zeigt Google evtl. „App nicht verifiziert" →
*Erweitert → trotzdem fortfahren* (normal im Test-Modus deiner eigenen App).

> Nur **Lesezugriff** (`calendar.readonly`). Im Test-Modus gilt die Verbindung
> etwa eine Stunde, danach einfach erneut verbinden.

## KI-Priorisierung mit Groq (optional)

„Dein Fokus heute" sortiert standardmäßig nach Dringlichkeit. Mit einem
kostenlosen **Groq**-Key kannst du per Knopf **„KI-Plan"** eine echte
KI-Priorisierung + Tagesüberblick erzeugen. Der Key bleibt geheim, weil der
Aufruf über die Server-Funktion [`api/prioritize.js`](api/prioritize.js)
läuft (nicht im Browser).

1. Kostenlosen Key holen auf [console.groq.com/keys](https://console.groq.com/keys).
2. Bei **Vercel** als Environment Variable hinterlegen — **ohne** `VITE_`-Präfix:
   - Key: `GROQ_API_KEY` · Value: dein Groq-Key
   - (optional `GROQ_MODEL`, Standard `llama-3.3-70b-versatile`)
3. Einmal neu deployen (*Deployments → ⋯ → Redeploy*).

> Die KI-Funktion läuft nur auf der **veröffentlichten Seite** (Vercel), nicht
> im lokalen `npm run dev` — dort fehlt die Server-Funktion. Zum lokalen Testen
> ginge `vercel dev`. Ohne Key zeigt der Knopf einen freundlichen Hinweis und
> die Heuristik bleibt aktiv.

## Nächste Phasen

| Phase | Inhalt |
|-------|--------|
| 1 ✅  | Fundament + Heute-View mit Dummy-Daten |
| 2 ✅  | Tasks speichern + Login (Supabase) · Google Calendar (Timeline) |
| 3 ✅  | KI-Priorisierung + Tagesüberblick (Groq, serverless) |
| 4 ✅  | Voice Capture, Focus Mode, Dark Mode, wiederkehrende Tasks, Erinnerungen, Wochenrückblick, Suche/Filter, Undo |
| 5 ✅  | KI-Tagesplan / Auto-Scheduler (Tasks automatisch in den Kalender einplanen) |
| 6 ✅  | Onboarding, Statistik/Mustererkennung |
| 7 ✅  | Studium: Kurse/Module, Klausuren mit Lernfortschritt, Notenspiegel (ECTS), Studium-Dashboard |
| 8 🚧  | Studium-Hub als Startseite, Fach-Detailseiten, Lernaufgaben-Kanban, KI-Studiencoach, Lernumgebung (Pomodoro/Sounds), Archiv, Hausarbeiten |
