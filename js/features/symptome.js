// Symptome: antippbare Liste pro Tag. Über „Bearbeiten" lässt sich die Liste anpassen.
// Symptome liegen als Namen im Tagesdokument (tag.symptome), die Auswahlliste in der Einstellung „symptomliste".
import { ladeEinstellung, speichereEinstellung } from '../db.js';
import { schalteInListe, mitVorlage } from '../logik.js';

export const STANDARD_SYMPTOME = [
  'Kopfschmerzen', 'Übelkeit', 'Bauchkrämpfe', 'Blähbauch', 'Rückenschmerzen unten', 'Brustschmerzen',
  'Erschöpfung', 'Stimmungsschwankung', 'Schlafveränderung', 'Appetitveränderung', 'Schwindel', 'Durchfall',
];

export function initSymptome(speichern, melde) {
  const $ = (id) => document.getElementById(id);
  let tag = { datum: '' };
  let liste = [...STANDARD_SYMPTOME];
  let bearbeiten = false;

  const gewaehlt = () => tag.symptome || [];

  function sichereListe() {
    speichereEinstellung('symptomliste', liste).catch((fehler) => {
      console.error(fehler);
      melde('Speichern fehlgeschlagen. Bitte noch einmal versuchen.', true);
    });
  }

  function zeichne() {
    const box = $('symptome');
    box.textContent = '';
    // Auch Symptome zeigen, die an diesem Tag eingetragen sind, aber nicht (mehr) in der Liste stehen.
    const alle = [...liste, ...gewaehlt().filter((s) => !liste.includes(s))];
    for (const name of alle) {
      const an = gewaehlt().includes(name);
      if (bearbeiten) {
        const b = document.createElement('button');
        b.className = 'entfernen';
        b.textContent = `${name} ×`;
        b.setAttribute('aria-label', `${name} aus der Liste entfernen`);
        b.disabled = !liste.includes(name);
        b.addEventListener('click', () => { liste = liste.filter((s) => s !== name); zeichne(); sichereListe(); });
        box.appendChild(b);
      } else {
        const b = document.createElement('button');
        b.textContent = name;
        b.classList.toggle('an', an);
        b.setAttribute('aria-pressed', an);
        b.addEventListener('click', () => {
          const neu = schalteInListe(gewaehlt(), name);
          if (neu.length) tag.symptome = neu; else delete tag.symptome;
          zeichne();
          speichern();
        });
        box.appendChild(b);
      }
    }
    $('symptom-neu').hidden = !bearbeiten;
    $('symptom-edit').textContent = bearbeiten ? 'Fertig' : 'Bearbeiten';
    $('symptom-edit').classList.toggle('an', bearbeiten);
    $('symptom-edit').setAttribute('aria-pressed', bearbeiten);
  }

  $('symptom-edit').addEventListener('click', () => { bearbeiten = !bearbeiten; zeichne(); });
  $('symptom-ok').addEventListener('click', () => {
    const name = $('symptom-name').value.trim();
    if (!name) { $('symptom-name').focus(); return; }
    const neu = mitVorlage(liste, name);
    $('symptom-name').value = '';
    if (neu === liste) return;
    liste = neu;
    zeichne();
    sichereListe();
  });

  return {
    async zeige(neuerTag) {
      tag = neuerTag;
      try {
        liste = (await ladeEinstellung('symptomliste')) || [...STANDARD_SYMPTOME];
      } catch (fehler) {
        console.error(fehler);
      }
      zeichne();
    },
  };
}
