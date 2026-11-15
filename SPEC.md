# Projekt: MENSI – Zyklus- & Schmerztagebuch (iOS, privat)

## Kontext
MENSI ist eine native iOS-App für genau eine Nutzerin, rein privat, kein App Store. Ersetzt Apple Health, das bisher nur Medikamente erfasst, aber kein Schmerzempfinden, keine Schmerzdauer, keine Schmerzorte und keinen brauchbaren Export bietet. Zielgruppe des Exports: Ärzt:innen und medizinische Einrichtungen.

## Stack & Rahmen
Entscheidung vom 14.11.2026: Web-App für den Homescreen statt nativer App. Grund: Es liegt nur ein kostenloser Developer-Account vor (7-Tage-Signatur), ein bezahlter lohnt sich vorerst nicht.

- Web-App (PWA) für den iPhone-Homescreen: HTML, CSS, JavaScript ohne Framework und ohne Build-Schritt
- 100 % offline-fähig (Service Worker), alle Daten lokal auf dem Gerät (IndexedDB)
- Datensicherung: Export/Import aller Daten als Datei, da es kein iCloud-Backup der App-Daten gibt
- Kein Backend, kein Account, kein Tracking. Der Server liefert nur die App-Dateien aus, nie Daten.
- Sicherung per Knopf „In iCloud sichern" ganz unten auf dem Tages-Screen (Teilen-Menü → „In Dateien sichern"); genutzt wird die iCloud des jeweiligen iPhones
- Entfällt durch die Web-App: Homescreen-/Lockscreen-Widget und direkter HealthKit-Zugriff
- Bisherige Health-Einträge: einmalige Übernahme über die Export-Datei aus Health, falls die Medikamenten-Einträge darin enthalten sind (an echtem Export prüfen), sonst manuell
- Erinnerungen (Web-App kann keine eigenen Wecker stellen): Kalendereinträge mit Alarm, ein Eintrag pro Uhrzeit auch bei mehreren Medikamenten; Erinnerung an den Tageseintrag als fester täglicher Termin abends und morgens, Uhrzeiten einstellbar
- Hosting: GitHub Pages über den GitHub-Account des Entwicklers; bei Umzug der Adresse Daten per Sicherungsdatei mitnehmen
- Gestaltung: abgestimmter Entwurf (pastellfarbene Karten, schwarze Pillen-Navigation), siehe Artefakt „MENSI Entwurf"
- Keine Abhängigkeit von der Kurzbefehle-App
- Deployment: statische Dateien auf einem HTTPS-Webspace, auf dem iPhone über Safari „Zum Home-Bildschirm"
- App-Name: MENSI
- Sprache der App: Deutsch

## Kernprinzip
Die Schmerzeingabe ist das wichtigste Feature und muss in maximal zwei Taps erledigt sein. Jede UI-Entscheidung wird daran gemessen. Alles andere darf mehr Taps kosten.

## Features (Priorität absteigend)

### 1. Schmerzeingabe
- Eingabe erfolgt abends gesammelt: ein Schmerzeintrag pro Tag, direkt auf dem Startscreen der App
- Schmerzstärke als Spanne auf der Skala 1–10 (z. B. 1–6 oder 3–7), große Tap-Flächen
- Eigene Option „Schmerzfrei", wird ausdrücklich gespeichert (Unterschied zu „nichts eingetragen")
- Tageszeiten: 1 bis 4 wählbar (morgens, mittags, abends, nachts). Sie benennen nur den Zeitraum des stärksten Schmerzes und sind unabhängig von der Skala
- Dauer: eine Gesamtangabe für den Tag, nachträglich editierbar
- Optional Schmerzort über Körperschaubild (Vorder-/Rückseite, antippbare Regionen, Fokus Unterleib/Rücken). Nicht Pflicht, nie im Weg der Schnellerfassung

### 2. Medikamente
- Tägliche Checkliste
- Zwei Abschnitte: „Täglich" (regelmäßig, mit Uhrzeit, erscheint automatisch, nach Uhrzeit gruppiert) und „Heute zusätzlich" (spontane Einnahmen des Tages)
- „Bearbeiten"-Knopf für die tägliche Medikation; beim Hinzufügen wird die Uhrzeit abgefragt, Erinnerung optional
- „+ Einzelne Einnahme" für zusätzliche Medikamente
- Vorlagen-Knöpfe für Standardmedikamente (z. B. Ibuprofen 200/400/800 mg); neu eingetragene Medikamente erscheinen automatisch als Vorlage
- Packung scannen: über „Text scannen" der iPhone-Tastatur im Namensfeld
- Dosis, Uhrzeit, optional Notiz

### 3. Menstruation
- Blutung mit Stärke (z. B. Schmierblutung / leicht / mittel / stark)
- Ein Tag ohne Eintrag gilt als „keine Blutung"; gespeichert wird nur, was ausdrücklich eingegeben wird
- Zyklusübersicht und einfache Zykluslängen-Berechnung, keine Prognose-Spielereien

### 4. Zusätzliche Symptome
- Konfigurierbare Symptomliste, beim Setup angelegt, jederzeit über „Bearbeiten" erweiterbar
- Neue Symptome wirken rückwirkend nicht auf alte Einträge, brechen aber nichts: Datenmodell muss das von Anfang an vorsehen
- Pro Symptom: Vorhanden ja/nein, optional Intensität

### 5. Kalender
- Tagesansicht als Standard, Monatsansicht als Überblick mit Markierungen für Blutung, Schmerz, Medikamente
- Nachträgliches Eintragen und Editieren vergangener Tage

### 6. PDF-Export
- Zeitraum wählbar
- Aufbau für medizinisches Personal: Übersichtsseite (Zyklen, Schmerztage, Durchschnitts-/Maximalintensität), dann chronologisches Protokoll pro Tag mit Schmerz, Dauer, Ort, Medikamenten, Blutung, Symptomen, Notizen
- Klar, tabellarisch, druckbar, keine Dekoration
- Teilen über iOS Share Sheet

### 7. Notizen
- Freitext pro Tag

## Vorgehen
1. Lies diesen Prompt vollständig, stelle Rückfragen nur bei echten Blockern.
2. Lege zuerst Datenmodell und Projektstruktur vor und begründe kurz die Entscheidungen zu Symptom-Erweiterbarkeit und Schmerz-Dauer-Modell. Warte auf Freigabe.
3. Dann iterativ in dieser Reihenfolge: Schmerzeingabe → Medikamente → Menstruation → Symptome → Kalender → PDF → Datensicherung (Export/Import).
4. Nach jedem Schritt: lauffähiger Stand im Browser bzw. Safari im iOS-Simulator, kurze Zusammenfassung, was testbar ist.
5. Keine externen Dependencies ohne Rückfrage.
