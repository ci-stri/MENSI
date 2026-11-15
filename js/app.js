// Einstieg: Tages-Screen mit Tagesnavigation. Jede Änderung wird sofort gespeichert.
import { ladeTag, speichereTag, bitteUmDauerhaftenSpeicher } from './db.js';
import { tagesSchluessel, plusTage } from './logik.js';
import { initSchmerz } from './features/schmerz.js';
import { initMedikamente } from './features/medikamente.js';

const $ = (id) => document.getElementById(id);
const heute = () => { const j = new Date(); return new Date(j.getFullYear(), j.getMonth(), j.getDate()); };

let datum = heute();
let tag = { datum: tagesSchluessel(datum) };
let statusUhr;

function melde(text, bleibt) {
  $('status').textContent = text;
  clearTimeout(statusUhr);
  if (!bleibt) statusUhr = setTimeout(() => { $('status').textContent = ''; }, 1500);
}

async function sichere() {
  try {
    await speichereTag(tag);
    melde('Gespeichert');
  } catch (fehler) {
    console.error(fehler);
    melde('Speichern fehlgeschlagen. Bitte noch einmal antippen.', true);
  }
}

const schmerz = initSchmerz((wert) => {
  if (wert) tag.schmerz = wert; else delete tag.schmerz;
  return sichere();
});

const medikamente = initMedikamente(sichere, melde);

async function zeigeTag() {
  const schluessel = tagesSchluessel(datum);
  const abstand = Math.round((heute() - datum) / 86400000);
  $('datum-klein').textContent = abstand === 0 ? 'Heute' : abstand === 1 ? 'Gestern' : `vor ${abstand} Tagen`;
  $('datum-gross').textContent = datum.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  $('tag-vor').disabled = abstand <= 0;
  try {
    tag = await ladeTag(schluessel);
  } catch (fehler) {
    console.error(fehler);
    tag = { datum: schluessel };
    melde('Daten konnten nicht geladen werden.', true);
  }
  schmerz.zeige(tag.schmerz);
  await medikamente.zeige(tag);
}

$('tag-zurueck').addEventListener('click', () => { datum = plusTage(datum, -1); zeigeTag(); });
$('tag-vor').addEventListener('click', () => { if (datum < heute()) { datum = plusTage(datum, 1); zeigeTag(); } });

bitteUmDauerhaftenSpeicher();
zeigeTag();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((fehler) => console.error(fehler));
}
