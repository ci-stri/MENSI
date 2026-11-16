// Erzeugt Kalenderdateien (iCalendar) mit täglichen Erinnerungen.
// Feste Kennungen (UID) sorgen dafür, dass eine erneute Übernahme Termine ersetzt statt verdoppelt.
import { gruppiereNachZeit } from './logik.js';

const zwei = (n) => String(n).padStart(2, '0');
const text = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

function kalender(termine, start, jetzt) {
  const tag = `${start.getFullYear()}${zwei(start.getMonth() + 1)}${zwei(start.getDate())}`;
  const stempel = jetzt.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const zeilen = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MENSI//Erinnerungen//DE', 'CALSCALE:GREGORIAN'];
  for (const t of termine) {
    zeilen.push(
      'BEGIN:VEVENT',
      `UID:${t.uid}@mensi`,
      `DTSTAMP:${stempel}`,
      `DTSTART:${tag}T${t.zeit.replace(':', '')}00`,
      'DURATION:PT5M',
      'RRULE:FREQ=DAILY',
      `SUMMARY:${text(t.titel)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${text(t.titel)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  zeilen.push('END:VCALENDAR');
  return zeilen.join('\r\n') + '\r\n';
}

// Ein Termin pro Uhrzeit, auch wenn mehrere Medikamente dieselbe Uhrzeit haben.
export function erinnerungsKalender(medikamente, start, jetzt = new Date()) {
  const termine = gruppiereNachZeit(medikamente.filter((m) => m.erinnern)).map((gruppe) => ({
    uid: `mensi-medikamente-${gruppe.zeit.replace(':', '')}`,
    zeit: gruppe.zeit,
    titel: `Medikamente: ${gruppe.medikamente.map((m) => m.name).join(', ')}`,
  }));
  return kalender(termine, start, jetzt);
}

// Erinnerung an den Tageseintrag: abends und am Folgemorgen. Leere Uhrzeit = keine Erinnerung.
export function eintragsKalender(abends, morgens, start, jetzt = new Date()) {
  const termine = [];
  if (abends) termine.push({ uid: 'mensi-eintrag-abends', zeit: abends, titel: 'MENSI: Tageseintrag' });
  if (morgens) termine.push({ uid: 'mensi-eintrag-morgens', zeit: morgens, titel: 'MENSI: Eintrag von gestern nachtragen?' });
  return kalender(termine, start, jetzt);
}
