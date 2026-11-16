// Einmalige Übernahme der bisherigen Einträge aus dem Export der Health-App (Datei Export.xml).
import { ladeTag, speichereTag } from '../db.js';
import { leererSchmerz } from '../logik.js';
import { neuerHealthLeser, uebernimm, zaehle } from '../health.js';

// Liest den Datenstrom stückweise und schreibt die gefundenen Tage in die Datenbank.
export async function importiereHealth(strom, groesse, fortschritt) {
  const leser = neuerHealthLeser();
  const quelle = strom.getReader();
  const text = new TextDecoder('utf-8');
  let gelesen = 0;
  for (;;) {
    const { done, value } = await quelle.read();
    if (done) break;
    gelesen += value.byteLength;
    leser.fuettere(text.decode(value, { stream: true }));
    if (fortschritt && groesse) fortschritt(Math.min(99, Math.round((gelesen / groesse) * 100)));
  }
  const tage = leser.ergebnis();
  let neu = 0;
  for (const [datum, health] of tage) {
    const geaendert = uebernimm(await ladeTag(datum), health, leererSchmerz);
    if (geaendert) { await speichereTag(geaendert); neu++; }
  }
  return { ...zaehle(tage), neu };
}

export function initImport(danach) {
  const $ = (id) => document.getElementById(id);
  const melde = (t) => { $('import-status').textContent = t; };
  $('import-ok').addEventListener('click', () => $('import-datei').click());
  $('import-datei').addEventListener('change', async () => {
    const datei = $('import-datei').files[0];
    $('import-datei').value = '';
    if (!datei) return;
    $('import-ok').disabled = true;
    try {
      const e = await importiereHealth(datei.stream(), datei.size, (p) => melde(`Lese Datei … ${p} %`));
      melde(e.tage === 0
        ? 'In dieser Datei wurden keine Zyklus- oder Schmerzeinträge gefunden. Bitte die Datei „Export.xml" aus dem Health-Export wählen.'
        : `Fertig. Gefunden: ${e.blutung} Tage mit Blutung, ${e.schmerz} Tage mit Schmerz, ${e.symptome} Tage mit Symptomen. Neu eingetragen: ${e.neu} Tage.`);
      await danach();
    } catch (fehler) {
      console.error(fehler);
      melde('Die Datei konnte nicht gelesen werden. Bitte noch einmal versuchen.');
    } finally {
      $('import-ok').disabled = false;
    }
  });
}
