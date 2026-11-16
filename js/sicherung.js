// Datensicherung als Datei: alles aus der Datenbank in eine JSON-Datei und zurück.
import { alle, lege } from './db.js';

export async function erstelleSicherung(jetzt = new Date()) {
  return {
    app: 'MENSI',
    format: 1,
    erstellt: jetzt.toISOString(),
    tage: await alle('tage'),
    medikamente: await alle('medikamente'),
    einstellungen: await alle('einstellungen'),
  };
}

export function istSicherung(daten) {
  return Boolean(daten && daten.app === 'MENSI' && daten.format === 1
    && Array.isArray(daten.tage) && daten.tage.every((t) => typeof t.datum === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.datum))
    && Array.isArray(daten.medikamente) && Array.isArray(daten.einstellungen));
}

// Spielt eine Sicherung ein. Einträge der Sicherung ersetzen gleiche Tage in der App, andere Tage bleiben.
export async function spieleEin(daten) {
  if (!istSicherung(daten)) throw new Error('Keine gültige MENSI-Sicherung');
  for (const t of daten.tage) await lege('tage', t);
  for (const m of daten.medikamente) await lege('medikamente', m);
  for (const e of daten.einstellungen) await lege('einstellungen', e);
  return { tage: daten.tage.length, medikamente: daten.medikamente.length };
}
