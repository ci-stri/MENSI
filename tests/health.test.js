import test from 'node:test';
import assert from 'node:assert/strict';
import { neuerHealthLeser, uebernimm, zaehle } from '../js/health.js';
import { leererSchmerz, istLeer, staerkeText, waehleStaerke } from '../js/logik.js';

const zeile = (art, datum, wert) => ` <Record type="HKCategoryTypeIdentifier${art}" sourceName="Health" sourceVersion="18" creationDate="2026-01-01 10:00:00 +0100" startDate="${datum} 12:00:00 +0100" endDate="${datum} 12:00:00 +0100" value="${wert}">\n  <MetadataEntry key="HKWasUserEntered" value="1"/>\n </Record>\n`;
const xml = [
  ' <Record type="HKQuantityTypeIdentifierStepCount" startDate="2026-01-01 08:00:00 +0100" endDate="2026-01-01 08:10:00 +0100" value="120"/>\n',
  zeile('MenstrualFlow', '2026-01-10', 'HKCategoryValueVaginalBleedingLight'),
  zeile('MenstrualFlow', '2026-01-10', 'HKCategoryValueVaginalBleedingHeavy'),
  zeile('MenstrualFlow', '2026-01-11', 'HKCategoryValueVaginalBleedingNone'),
  zeile('MenstrualFlow', '2026-01-12', 'HKCategoryValueVaginalBleedingUnspecified'),
  zeile('PelvicPain', '2026-01-10', 'HKCategoryValueSeverityUnspecified'),
  zeile('Headache', '2026-01-10', 'HKCategoryValueSeverityModerate'),
  zeile('Headache', '2026-01-13', 'HKCategoryValueSeverityNotPresent'),
  zeile('Nausea', '2026-01-10', 'HKCategoryValueSeverityUnspecified'),
].join('');

test('Health-Leser: gleiches Ergebnis, egal wie die Datei zerstückelt ankommt', () => {
  const ganz = neuerHealthLeser();
  ganz.fuettere(xml);
  const stueckweise = neuerHealthLeser();
  for (let i = 0; i < xml.length; i += 37) stueckweise.fuettere(xml.slice(i, i + 37));
  const a = ganz.ergebnis();
  assert.deepEqual([...stueckweise.ergebnis()], [...a]);
  assert.deepEqual(a.get('2026-01-10'), { symptome: ['Kopfschmerzen', 'Übelkeit'], blutung: 'stark', schmerz: true });
  assert.equal(a.has('2026-01-11'), false);
  assert.equal(a.get('2026-01-12').blutung, 'unbekannt');
  assert.equal(a.has('2026-01-13'), false);
  assert.deepEqual(zaehle(a), { tage: 2, blutung: 2, schmerz: 1, symptome: 1 });
});

test('Übernahme überschreibt keine MENSI-Einträge und ist wiederholbar', () => {
  const health = { blutung: 'stark', schmerz: true, symptome: ['Übelkeit'] };
  const neu = uebernimm({ datum: '2026-01-10' }, health, leererSchmerz);
  assert.equal(neu.blutung, 'stark');
  assert.equal(neu.schmerz.ohneStaerke, true);
  assert.deepEqual(neu.symptome, ['Übelkeit']);
  assert.equal(uebernimm(neu, health, leererSchmerz), null);
  const eigen = { datum: '2026-01-10', blutung: 'leicht', schmerz: { ...leererSchmerz(), von: 3, bis: 7 } };
  const gemischt = uebernimm(eigen, health, leererSchmerz);
  assert.equal(gemischt.blutung, 'leicht');
  assert.equal(gemischt.schmerz.von, 3);
});

test('Schmerz ohne Stärke: zählt als Eintrag und wird durch eine Stärke ersetzt', () => {
  const s = { ...leererSchmerz(), ohneStaerke: true };
  assert.equal(istLeer(s), false);
  assert.equal(staerkeText(s), 'ja');
  const mit = waehleStaerke(s, 5);
  assert.equal(mit.ohneStaerke, false);
  assert.equal(staerkeText(mit), '5');
});
