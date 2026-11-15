// Ausführen mit: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  leererSchmerz, waehleStaerke, schalteSchmerzfrei, schalteInListe, aendereDauer,
  istLeer, staerkeText, dauerText, tagesSchluessel, plusTage,
} from '../js/logik.js';

test('ein Tap setzt eine einzelne Stärke', () => {
  const s = waehleStaerke(leererSchmerz(), 5);
  assert.equal(staerkeText(s), '5');
});

test('zweiter Tap ergibt eine Spanne, egal in welcher Reihenfolge', () => {
  assert.equal(staerkeText(waehleStaerke(waehleStaerke(leererSchmerz(), 3), 7)), '3–7');
  assert.equal(staerkeText(waehleStaerke(waehleStaerke(leererSchmerz(), 7), 3)), '3–7');
});

test('derselbe Wert noch einmal löscht die Stärke', () => {
  const s = waehleStaerke(waehleStaerke(leererSchmerz(), 4), 4);
  assert.equal(s.von, null);
  assert.equal(staerkeText(s), '–');
});

test('Tap bei bestehender Spanne beginnt neu', () => {
  let s = waehleStaerke(waehleStaerke(leererSchmerz(), 3), 7);
  s = waehleStaerke(s, 2);
  assert.equal(staerkeText(s), '2');
});

test('Schmerzfrei löscht alle anderen Angaben und ist kein leerer Eintrag', () => {
  let s = { ...waehleStaerke(leererSchmerz(), 6), tageszeiten: ['abends'], dauerStunden: 3, orte: ['leiste'] };
  s = schalteSchmerzfrei(s);
  assert.deepEqual(s, { ...leererSchmerz(), schmerzfrei: true });
  assert.equal(istLeer(s), false);
  assert.equal(staerkeText(s), '0');
  assert.equal(istLeer(schalteSchmerzfrei(s)), true);
});

test('eine Stärke nach Schmerzfrei hebt Schmerzfrei auf', () => {
  const s = waehleStaerke(schalteSchmerzfrei(leererSchmerz()), 2);
  assert.equal(s.schmerzfrei, false);
  assert.equal(staerkeText(s), '2');
});

test('Listen schalten Werte ein und aus', () => {
  assert.deepEqual(schalteInListe([], 'abends'), ['abends']);
  assert.deepEqual(schalteInListe(['abends', 'nachts'], 'abends'), ['nachts']);
});

test('Dauer bleibt zwischen offen und ganzem Tag', () => {
  assert.equal(aendereDauer(null, -1), null);
  assert.equal(aendereDauer(null, 1), 1);
  assert.equal(aendereDauer(1, -1), null);
  assert.equal(aendereDauer(24, 1), 24);
  assert.equal(dauerText(null), 'offen');
  assert.equal(dauerText(4), '4 Std.');
  assert.equal(dauerText(24), 'ganzer Tag');
});

test('Tagesschlüssel nutzt das lokale Datum, auch über Monatsgrenzen', () => {
  assert.equal(tagesSchluessel(new Date(2026, 10, 14, 23, 59)), '2026-11-14');
  assert.equal(tagesSchluessel(plusTage(new Date(2026, 10, 1), -1)), '2026-10-31');
});
