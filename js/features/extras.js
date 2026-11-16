// Kleinere Bereiche der Heute-Ansicht: Notiz zum Tag, Erinnerung an den Eintrag, Datensicherung.
import { ladeEinstellung, speichereEinstellung } from '../db.js';
import { eintragsKalender } from '../kalender.js';
import { erstelleSicherung, spieleEin } from '../sicherung.js';
import { teile } from '../teilen.js';

const $ = (id) => document.getElementById(id);

// Notiz: wird kurz nach dem letzten Tastendruck gespeichert, spätestens beim Verlassen des Tages.
export function initNotiz(speichern) {
  const feld = $('notiz');
  let uhr = null;
  let offen = null;
  feld.addEventListener('input', () => {
    const wert = feld.value.trim();
    clearTimeout(uhr);
    offen = () => speichern(wert);
    uhr = setTimeout(() => { const jetzt = offen; offen = null; jetzt(); }, 700);
  });
  return {
    zeige(text) { feld.value = text || ''; },
    async abschliessen() {
      if (!offen) return;
      clearTimeout(uhr);
      const jetzt = offen;
      offen = null;
      await jetzt();
    },
  };
}

// Erinnerung an den Tageseintrag als Kalendertermine (abends und am Morgen danach).
export function initErinnerung(melde) {
  const abends = $('er-abends');
  const morgens = $('er-morgens');
  ladeEinstellung('eintragErinnerung').then((e) => {
    if (e) { abends.value = e.abends; morgens.value = e.morgens; }
  }).catch((fehler) => console.error(fehler));
  const merke = () => speichereEinstellung('eintragErinnerung', { abends: abends.value, morgens: morgens.value })
    .catch((fehler) => console.error(fehler));
  abends.addEventListener('change', merke);
  morgens.addEventListener('change', merke);
  $('er-ok').addEventListener('click', async () => {
    if (!abends.value && !morgens.value) { melde('Bitte mindestens eine Uhrzeit eintragen.'); return; }
    const text = eintragsKalender(abends.value, morgens.value, new Date());
    try {
      await teile(new File([text], 'mensi-eintrag-erinnerung.ics', { type: 'text/calendar' }));
    } catch (fehler) {
      console.error(fehler);
      melde('Kalenderdatei konnte nicht geteilt werden.', true);
    }
  });
}

// Sicherung: eine Datei mit immer gleichem Namen, damit sie am Speicherort die vorige ersetzt.
export function initSicherung(melde, danach) {
  const stand = async () => {
    const wann = await ladeEinstellung('letzteSicherung').catch(() => null);
    const text = wann
      ? `Zuletzt gesichert: ${new Date(wann).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : 'Noch keine Sicherung angelegt.';
    $('sichern-stand').textContent = text;
  };
  async function sichern() {
    try {
      const daten = await erstelleSicherung();
      const datei = new File([JSON.stringify(daten)], 'MENSI-Sicherung.json', { type: 'application/json' });
      const ergebnis = await teile(datei);
      if (ergebnis === 'abgebrochen') return;
      await speichereEinstellung('letzteSicherung', daten.erstellt);
      await stand();
      melde(ergebnis === 'geteilt' ? 'Sicherung übergeben' : 'Sicherung geladen');
    } catch (fehler) {
      console.error(fehler);
      melde('Sicherung fehlgeschlagen. Bitte noch einmal versuchen.', true);
    }
  }
  $('sichern').addEventListener('click', sichern);
  $('sichern-export').addEventListener('click', sichern);

  $('einspielen-ok').addEventListener('click', () => $('einspielen-datei').click());
  $('einspielen-datei').addEventListener('change', async () => {
    const datei = $('einspielen-datei').files[0];
    $('einspielen-datei').value = '';
    if (!datei) return;
    try {
      const e = await spieleEin(JSON.parse(await datei.text()));
      $('sicherung-status').textContent = `Eingespielt: ${e.tage} Tage und ${e.medikamente} tägliche Medikamente.`;
      await danach();
    } catch (fehler) {
      console.error(fehler);
      $('sicherung-status').textContent = 'Das ist keine MENSI-Sicherung oder die Datei ist beschädigt. Es wurde nichts verändert.';
    }
  });
  stand();
}
