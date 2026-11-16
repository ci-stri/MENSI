// Einstieg: vier Ansichten (Heute, Kalender, Medikamente, Export). Jede Änderung wird sofort gespeichert.
import { ladeTag, speichereTag, bitteUmDauerhaftenSpeicher } from './db.js';
import { tagesSchluessel, plusTage } from './logik.js';
import { initSchmerz } from './features/schmerz.js';
import { initMedikamente } from './features/medikamente.js';
import { initBlutung } from './features/blutung.js';
import { initSymptome } from './features/symptome.js';
import { initImport } from './features/import.js';
import { initNotiz, initErinnerung, initSicherung } from './features/extras.js';
import { initMonat } from './features/monat.js';
import { initMediAnsicht } from './features/medi-ansicht.js';
import { initExport } from './features/export.js';

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

async function sichere(ziel = tag) {
  try {
    await speichereTag(ziel);
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
const blutung = initBlutung((wert) => {
  if (wert) tag.blutung = wert; else delete tag.blutung;
  return sichere();
});
const medikamente = initMedikamente(sichere, melde);
const symptome = initSymptome(sichere, melde);
// Die Notiz wird beim Tippen verzögert gespeichert; das Ziel ist der Tag, zu dem sie gehört.
const notiz = initNotiz((wert) => {
  const ziel = tag;
  if (wert) ziel.notiz = wert; else delete ziel.notiz;
  return sichere(ziel);
});
initErinnerung(melde);

async function zeigeTag() {
  await notiz.abschliessen();
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
  blutung.zeige(tag.blutung);
  notiz.zeige(tag.notiz);
  await medikamente.zeige(tag);
  await symptome.zeige(tag);
}

$('tag-zurueck').addEventListener('click', () => { datum = plusTage(datum, -1); zeigeTag(); });
$('tag-vor').addEventListener('click', () => { if (datum < heute()) { datum = plusTage(datum, 1); zeigeTag(); } });

// ---- Ansichten ----
const ansichten = {
  heute: { zeige: zeigeTag },
  kalender: initMonat((gewaehlt) => { datum = gewaehlt; zeigeAnsicht('heute'); }),
  medikamente: initMediAnsicht(melde),
  export: initExport(melde),
};

async function zeigeAnsicht(name) {
  await notiz.abschliessen();
  for (const b of document.querySelectorAll('.leiste button')) {
    if (b.dataset.ansicht === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  }
  for (const id of Object.keys(ansichten)) $(`ansicht-${id}`).hidden = id !== name;
  window.scrollTo(0, 0);
  await ansichten[name].zeige(datum);
}

document.querySelector('.leiste').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  // Ein Tap auf „Heute" in der Heute-Ansicht springt zum heutigen Tag zurück.
  if (b.dataset.ansicht === 'heute' && !$('ansicht-heute').hidden) datum = heute();
  zeigeAnsicht(b.dataset.ansicht);
});

initSicherung(melde, zeigeTag);
initImport(zeigeTag);
document.addEventListener('visibilitychange', () => { if (document.hidden) notiz.abschliessen(); });

bitteUmDauerhaftenSpeicher();
zeigeTag();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((fehler) => console.error(fehler));
}
