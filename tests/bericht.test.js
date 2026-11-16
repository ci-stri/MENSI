import test from 'node:test';
import assert from 'node:assert/strict';
import { periodenStarts, zyklusLaengen, berichtZeilen, kennzahlen, hatEintrag } from '../js/bericht.js';
import { istSicherung } from '../js/sicherung.js';
import { eintragsKalender } from '../js/kalender.js';
import { leererSchmerz } from '../js/logik.js';

const tage = [
  { datum: '2026-01-05', blutung: 'schmier' },
  { datum: '2026-01-06', blutung: 'stark', schmerz: { ...leererSchmerz(), von: 3, bis: 7, tageszeiten: ['abends'], dauerStunden: 4, orte: ['unterbauch-mitte'] } },
  { datum: '2026-01-07', blutung: 'mittel', symptome: ['Übelkeit'] },
  { datum: '2026-01-20', schmerz: { ...leererSchmerz(), ohneStaerke: true } },
  { datum: '2026-02-03', blutung: 'leicht', einnahmen: [{ name: 'Ibuprofen 400 mg', art: 'spontan', zeit: '14:00' }], notiz: 'Arzttermin' },
  { datum: '2026-02-04', blutung: 'unbekannt' },
  { datum: '2026-03-05', blutung: 'leicht' },
];

test('Perioden beginnen nach mehr als 10 blutungsfreien Tagen, Schmierblutung zählt nicht', () => {
  const starts = periodenStarts(tage);
  assert.deepEqual(starts, ['2026-01-06', '2026-02-03', '2026-03-05']);
  assert.deepEqual(zyklusLaengen(starts), [28, 30]);
});

test('Bericht: eine Zeile pro Tag mit Monats- und Wochenmarken', () => {
  const z = berichtZeilen(tage, '2026-01-05', '2026-02-04', { ortNamen: { 'unterbauch-mitte': 'Unterbauch Mitte' } });
  assert.equal(z.length, 31);
  assert.equal(z[0].monatsTitel, 'Januar 2026');
  assert.equal(z[0].wochenStart, true);
  assert.equal(z[0].zyklustag, null);
  const t6 = z[1];
  assert.deepEqual([t6.tagText, t6.zyklustag, t6.blutungText, t6.schmerzText, t6.wann, t6.ort],
    ['Di 06.01.', 1, 'stark', '3–7', 'abends · 4 Std.', 'Unterbauch Mitte']);
  assert.equal(z.find((x) => x.datum === '2026-01-20').schmerzText, 'ja');
  const feb = z.find((x) => x.datum === '2026-02-01');
  assert.equal(feb.monatsTitel, 'Februar 2026');
  const t3 = z.find((x) => x.datum === '2026-02-03');
  assert.deepEqual([t3.zyklustag, t3.medikamente, t3.notiz], [1, 'Ibuprofen 400 mg (14:00)', 'Arzttermin']);
  assert.equal(berichtZeilen(tage, '2026-01-05', '2026-02-04', { nurEintraege: true }).length, 6);
});

test('Kennzahlen und leere Tage', () => {
  const k = kennzahlen(tage, '2026-01-01', '2026-03-31');
  assert.deepEqual([k.blutungsTage, k.schmerzTage, k.zyklen, k.zyklusMittel, k.staerksterSchmerz], [5, 2, 2, 29, 7]);
  assert.equal(hatEintrag({ datum: '2026-01-01' }), false);
  assert.equal(hatEintrag(undefined), false);
});

test('Sicherung wird erkannt, Fremddateien nicht', () => {
  assert.equal(istSicherung({ app: 'MENSI', format: 1, tage: [{ datum: '2026-01-01' }], medikamente: [], einstellungen: [] }), true);
  assert.equal(istSicherung({ app: 'MENSI', format: 1, tage: [{ datum: 'x' }], medikamente: [], einstellungen: [] }), false);
  assert.equal(istSicherung({ tage: [] }), false);
  assert.equal(istSicherung(null), false);
});

test('Erinnerung an den Eintrag: abends und morgens, leere Uhrzeit entfällt', () => {
  const ics = eintragsKalender('21:30', '08:00', new Date(2026, 10, 15), new Date(Date.UTC(2026, 10, 15, 12)));
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 2);
  assert.ok(ics.includes('DTSTART:20261115T213000') && ics.includes('DTSTART:20261115T080000'));
  assert.ok(ics.includes('UID:mensi-eintrag-abends@mensi'));
  assert.equal(eintragsKalender('21:30', '', new Date(2026, 10, 15)).match(/BEGIN:VEVENT/g).length, 1);
});
