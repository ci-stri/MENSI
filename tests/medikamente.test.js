import test from 'node:test';
import assert from 'node:assert/strict';
import { aktivAm, gruppiereNachZeit, mitVorlage, favoritenZuerst } from '../js/logik.js';
import { erinnerungsKalender } from '../js/kalender.js';

const medis = [
  { id: 'a', name: 'Ibuprofen 400 mg', zeit: '20:00', erinnern: true, von: '2026-11-01', bis: null },
  { id: 'b', name: 'Magnesium 300 mg', zeit: '08:00', erinnern: true, von: '2026-11-01', bis: null },
  { id: 'c', name: 'Ibuprofen 400 mg', zeit: '08:00', erinnern: true, von: '2026-11-01', bis: null },
  { id: 'd', name: 'Eisen, 100 mg', zeit: '12:00', erinnern: false, von: '2026-11-01', bis: null },
];

test('tägliches Medikament gilt ab Starttag bis vor dem Endtag', () => {
  const m = { von: '2026-11-10', bis: '2026-11-14' };
  assert.equal(aktivAm(m, '2026-11-09'), false);
  assert.equal(aktivAm(m, '2026-11-10'), true);
  assert.equal(aktivAm(m, '2026-11-13'), true);
  assert.equal(aktivAm(m, '2026-11-14'), false);
  assert.equal(aktivAm({ von: '2026-11-10', bis: null }, '2027-01-01'), true);
});

test('Gruppen sind nach Uhrzeit sortiert und fassen gleiche Uhrzeiten zusammen', () => {
  const g = gruppiereNachZeit(medis);
  assert.deepEqual(g.map((x) => x.zeit), ['08:00', '12:00', '20:00']);
  assert.deepEqual(g[0].medikamente.map((m) => m.id), ['b', 'c']);
});

test('neue Namen werden Vorlage, vorhandene nicht doppelt', () => {
  const v = ['Ibuprofen 400 mg'];
  assert.equal(mitVorlage(v, 'ibuprofen 400 MG '), v);
  assert.deepEqual(mitVorlage(v, ' Novalgin 500 mg '), ['Ibuprofen 400 mg', 'Novalgin 500 mg']);
});

test('Kalender: ein Termin pro Uhrzeit, nur für Medikamente mit Erinnerung', () => {
  const ics = erinnerungsKalender(medis, new Date(2026, 10, 14), new Date(Date.UTC(2026, 10, 14, 12, 0, 0)));
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 2);
  assert.equal(ics.match(/BEGIN:VALARM/g).length, 2);
  assert.ok(ics.includes('DTSTART:20261114T080000'));
  assert.ok(ics.includes('DTSTART:20261114T200000'));
  assert.ok(ics.includes('SUMMARY:Medikamente: Magnesium 300 mg\\, Ibuprofen 400 mg'));
  assert.ok(ics.includes('RRULE:FREQ=DAILY'));
  assert.ok(ics.includes('DTSTAMP:20261114T120000Z'));
  assert.ok(!ics.includes('Eisen'));
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'));
});

test('Favoriten stehen oben, der Rest behält seine Reihenfolge', () => {
  const v = ['Ibuprofen 200 mg', 'Ibuprofen 400 mg', 'Paracetamol 500 mg', 'Buscopan'];
  assert.deepEqual(favoritenZuerst(v, ['Buscopan', 'Ibuprofen 400 mg']),
    ['Ibuprofen 400 mg', 'Buscopan', 'Ibuprofen 200 mg', 'Paracetamol 500 mg']);
  assert.deepEqual(favoritenZuerst(v, []), v);
});
