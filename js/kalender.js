// Erzeugt eine Kalenderdatei (iCalendar) mit täglichen Erinnerungen:
// ein Termin pro Uhrzeit, auch wenn mehrere Medikamente dieselbe Uhrzeit haben.
import { gruppiereNachZeit } from './logik.js';

const zwei = (n) => String(n).padStart(2, '0');
const text = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

export function erinnerungsKalender(medikamente, start, jetzt = new Date()) {
  const tag = `${start.getFullYear()}${zwei(start.getMonth() + 1)}${zwei(start.getDate())}`;
  const stempel = jetzt.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const zeilen = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MENSI//Erinnerungen//DE', 'CALSCALE:GREGORIAN'];
  for (const gruppe of gruppiereNachZeit(medikamente.filter((m) => m.erinnern))) {
    const uhr = gruppe.zeit.replace(':', '');
    const namen = gruppe.medikamente.map((m) => m.name).join(', ');
    zeilen.push(
      'BEGIN:VEVENT',
      `UID:mensi-medikamente-${uhr}@mensi`,
      `DTSTAMP:${stempel}`,
      `DTSTART:${tag}T${uhr}00`,
      'DURATION:PT5M',
      'RRULE:FREQ=DAILY',
      `SUMMARY:${text(`Medikamente: ${namen}`)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${text(`Medikamente: ${namen}`)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  zeilen.push('END:VCALENDAR');
  return zeilen.join('\r\n') + '\r\n';
}
