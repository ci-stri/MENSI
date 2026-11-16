// Medikamente: tägliche Checkliste (nach Uhrzeit gruppiert) und zusätzliche Einnahmen des Tages.
// Einnahmen liegen im Tagesdokument (tag.einnahmen), tägliche Medikamente im Speicher „medikamente".
import { alle, lege, ladeEinstellung, speichereEinstellung } from '../db.js';
import { aktivAm, gruppiereNachZeit, mitVorlage, favoritenZuerst, schalteInListe, tagesSchluessel, STANDARD_VORLAGEN } from '../logik.js';
import { erinnerungsKalender } from '../kalender.js';

const HAKEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';
const STERN = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/></svg>';
const GLOCKE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/></svg>';

function el(tag, klasse, text) {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function initMedikamente(speichern, melde) {
  const $ = (id) => document.getElementById(id);
  let tag = { datum: '' };
  let medikamente = [];
  let vorlagen = [...STANDARD_VORLAGEN];
  let favoriten = [];
  let vorlagenNotizen = {}; // Name → Notiz, erscheint im Knopf und wird bei der Einnahme mit eingetragen
  let bearbeiten = false;
  let offen = null; // id der aufgeklappten zusätzlichen Einnahme

  const einnahmen = () => tag.einnahmen || [];

  function setzeEinnahmen(liste) {
    if (liste.length) tag.einnahmen = liste; else delete tag.einnahmen;
    zeichne();
    return speichern();
  }

  async function sicher(aktion) {
    try {
      await aktion();
    } catch (fehler) {
      console.error(fehler);
      melde('Speichern fehlgeschlagen. Bitte noch einmal versuchen.', true);
    }
  }

  function merkeVorlage(name) {
    const neu = mitVorlage(vorlagen, name);
    if (neu === vorlagen) return;
    vorlagen = neu;
    sicher(() => speichereEinstellung('vorlagen', vorlagen));
  }

  function hauptKnopf(name, klein, an) {
    const b = el('button', `haupt${an ? ' an' : ''}`);
    const haken = el('span', 'haken');
    haken.innerHTML = HAKEN;
    const text = el('span', 'text', name);
    if (klein) text.appendChild(el('small', '', klein));
    b.append(haken, text);
    return b;
  }

  function zeichneTaeglich() {
    const box = $('taeglich');
    box.textContent = '';
    const aktive = medikamente.filter((m) => aktivAm(m, tag.datum));
    for (const gruppe of gruppiereNachZeit(aktive)) {
      const kopf = el('div', 'zeit-kopf');
      kopf.appendChild(el('span', '', gruppe.zeit));
      if (gruppe.medikamente.some((m) => m.erinnern)) {
        const glocke = el('span');
        glocke.innerHTML = GLOCKE;
        const anzahl = gruppe.medikamente.filter((m) => m.erinnern).length;
        kopf.append(glocke, el('small', '', anzahl > 1 ? `eine Erinnerung für ${anzahl} Medikamente` : 'mit Erinnerung'));
      }
      box.appendChild(kopf);
      for (const m of gruppe.medikamente) {
        const genommen = einnahmen().some((e) => e.medId === m.id);
        const zeile = el('div', 'eintrag');
        const knopf = hauptKnopf(m.name, m.notiz || undefined, genommen);
        knopf.setAttribute('aria-pressed', genommen);
        knopf.addEventListener('click', () => {
          setzeEinnahmen(genommen
            ? einnahmen().filter((e) => e.medId !== m.id)
            : [...einnahmen(), { id: crypto.randomUUID(), medId: m.id, name: m.name, zeit: m.zeit, art: 'taeglich' }]);
        });
        zeile.appendChild(knopf);
        if (bearbeiten) {
          const weg = el('button', 'weg', '×');
          weg.setAttribute('aria-label', `${m.name} um ${m.zeit} ab diesem Tag entfernen`);
          weg.addEventListener('click', () => sicher(async () => {
            m.bis = tag.datum;
            await lege('medikamente', m);
            zeichne();
          }));
          zeile.appendChild(weg);
        }
        box.appendChild(zeile);
        if (bearbeiten) {
          // Die Notiz steht sonst als Text unter dem Namen; hier lässt sie sich ändern. Sie gilt an allen Tagen.
          const notiz = el('input', 'unterzeile');
          notiz.type = 'text';
          notiz.placeholder = 'Notiz, z. B. nach dem Essen';
          notiz.setAttribute('aria-label', `Notiz zu ${m.name}`);
          notiz.value = m.notiz || '';
          notiz.addEventListener('change', () => sicher(async () => {
            m.notiz = notiz.value.trim();
            await lege('medikamente', m);
            const text = knopf.querySelector('.text');
            text.textContent = m.name;
            if (m.notiz) text.appendChild(el('small', '', m.notiz));
            melde('Gespeichert');
          }));
          box.appendChild(notiz);
        }
      }
    }
    if (!aktive.length) box.appendChild(el('p', '', 'Noch keine täglichen Medikamente. Über „Bearbeiten" anlegen.'));
  }

  function zeichneSpontan() {
    const box = $('spontan');
    box.textContent = '';
    const liste = einnahmen().filter((e) => e.art === 'spontan');
    for (const e of liste) {
      const klein = [e.zeit, e.notiz].filter(Boolean).join(' · ');
      const knopf = hauptKnopf(e.name, klein || undefined, true);
      knopf.setAttribute('aria-expanded', offen === e.id);
      knopf.addEventListener('click', () => { offen = offen === e.id ? null : e.id; zeichne(); });
      const zeile = el('div', 'eintrag');
      zeile.appendChild(knopf);
      box.appendChild(zeile);
      if (offen !== e.id) continue;

      const feld = el('div', 'feld');
      const zeitZeile = el('label', 'zeile mitte', 'Uhrzeit (optional) ');
      const zeit = el('input');
      zeit.type = 'time';
      zeit.value = e.zeit || '';
      zeit.addEventListener('change', () => { e.zeit = zeit.value; setzeEinnahmen([...einnahmen()]); });
      zeitZeile.appendChild(zeit);
      const notiz = el('input');
      notiz.type = 'text';
      notiz.placeholder = 'Notiz (optional)';
      notiz.setAttribute('aria-label', `Notiz zu ${e.name}`);
      notiz.value = e.notiz || '';
      notiz.addEventListener('change', () => {
        e.notiz = notiz.value.trim();
        // Die Notiz wandert auch in den Knopf des Medikaments und gilt für künftige Einnahmen.
        if (vorlagen.includes(e.name)) {
          vorlagenNotizen = { ...vorlagenNotizen, [e.name]: e.notiz };
          sicher(() => speichereEinstellung('vorlagenNotizen', vorlagenNotizen));
        }
        setzeEinnahmen([...einnahmen()]);
      });
      const weg = el('button', 'breit', 'Einnahme entfernen');
      weg.addEventListener('click', () => { offen = null; setzeEinnahmen(einnahmen().filter((x) => x.id !== e.id)); });
      feld.append(zeitZeile, notiz, weg);
      box.appendChild(feld);
    }
    $('spontan-leer').hidden = liste.length > 0;
    $('spontan-titel').textContent = tag.datum === tagesSchluessel(new Date()) ? 'Heute zusätzlich' : 'Zusätzlich an diesem Tag';
  }

  function zeichneVorlagen() {
    const taeglich = $('vorlagen-taeglich');
    const spontan = $('vorlagen-spontan');
    taeglich.textContent = '';
    spontan.textContent = '';
    for (const name of favoritenZuerst(vorlagen, favoriten)) {
      const a = el('button', '', name);
      if (vorlagenNotizen[name]) a.appendChild(el('small', '', vorlagenNotizen[name]));
      a.addEventListener('click', () => { $('neu-name').value = name; $('neu-notiz').value = vorlagenNotizen[name] || ''; });
      taeglich.appendChild(a);

      // Zusätzliche Einnahme: Name trägt ein, Stern merkt als Favorit (Favoriten stehen oben).
      const istFavorit = favoriten.includes(name);
      const paar = el('span', `paar${istFavorit ? ' favorit' : ''}`);
      const b = el('button', 'name', name);
      if (vorlagenNotizen[name]) b.appendChild(el('small', '', vorlagenNotizen[name]));
      b.addEventListener('click', () => trageSpontanEin(name));
      const stern = el('button', 'stern');
      if (bearbeiten) {
        // Im Bearbeiten-Modus löscht das × das Medikament aus der Liste.
        stern.textContent = '×';
        stern.classList.add('loeschen');
        stern.setAttribute('aria-label', `${name} aus der Liste löschen`);
        stern.addEventListener('click', () => {
          vorlagen = vorlagen.filter((v) => v !== name);
          favoriten = favoriten.filter((v) => v !== name);
          zeichneVorlagen();
          sicher(async () => {
            await speichereEinstellung('vorlagen', vorlagen);
            await speichereEinstellung('favoriten', favoriten);
          });
        });
      } else {
        stern.innerHTML = STERN;
        stern.setAttribute('aria-pressed', istFavorit);
        stern.setAttribute('aria-label', `${name} als Favorit ${istFavorit ? 'entfernen' : 'merken'}`);
        stern.addEventListener('click', () => {
          favoriten = schalteInListe(favoriten, name);
          zeichneVorlagen();
          sicher(() => speichereEinstellung('favoriten', favoriten));
        });
      }
      paar.append(b, stern);
      spontan.appendChild(paar);
    }
  }

  function zeichne() {
    zeichneTaeglich();
    zeichneSpontan();
    zeichneVorlagen();
    $('taeglich-neu').hidden = !bearbeiten;
    $('vorlagen-hinweis').hidden = !bearbeiten;
    if (bearbeiten) { $('spontan-neu').hidden = false; $('spontan-auf').setAttribute('aria-expanded', true); }
    $('medi-edit').textContent = bearbeiten ? 'Fertig' : 'Bearbeiten';
    $('medi-edit').classList.toggle('an', bearbeiten);
    $('medi-edit').setAttribute('aria-pressed', bearbeiten);
    $('kalender-ok').hidden = !medikamente.some((m) => m.erinnern && aktivAm(m, tagesSchluessel(new Date())));
  }

  function trageSpontanEin(name) {
    return setzeEinnahmen([...einnahmen(), { id: crypto.randomUUID(), medId: null, name, zeit: '', notiz: vorlagenNotizen[name] || '', art: 'spontan' }]);
  }

  $('medi-edit').addEventListener('click', () => { bearbeiten = !bearbeiten; zeichne(); });

  $('neu-ok').addEventListener('click', () => sicher(async () => {
    const name = $('neu-name').value.trim();
    if (!name) { $('neu-name').focus(); return; }
    const neu = {
      id: crypto.randomUUID(), name, zeit: $('neu-zeit').value || '08:00',
      erinnern: $('neu-wecker').checked, notiz: $('neu-notiz').value.trim(), von: tag.datum, bis: null,
    };
    await lege('medikamente', neu);
    medikamente.push(neu);
    merkeVorlage(name);
    $('neu-name').value = '';
    $('neu-notiz').value = '';
    zeichne();
  }));

  $('spontan-auf').addEventListener('click', () => {
    const feld = $('spontan-neu');
    feld.hidden = !feld.hidden;
    $('spontan-auf').setAttribute('aria-expanded', !feld.hidden);
  });

  $('sp-ok').addEventListener('click', () => {
    const name = $('sp-name').value.trim();
    if (!name) { $('sp-name').focus(); return; }
    merkeVorlage(name);
    $('sp-name').value = '';
    trageSpontanEin(name);
  });

  $('kalender-ok').addEventListener('click', async () => {
    const heute = new Date();
    const aktive = medikamente.filter((m) => aktivAm(m, tagesSchluessel(heute)));
    const datei = new File([erinnerungsKalender(aktive, heute)], 'mensi-erinnerungen.ics', { type: 'text/calendar' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [datei] })) {
        await navigator.share({ files: [datei] });
      } else {
        const adresse = URL.createObjectURL(datei);
        const link = el('a');
        link.href = adresse;
        link.download = datei.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(adresse), 1000);
      }
    } catch (fehler) {
      if (fehler.name !== 'AbortError') {
        console.error(fehler);
        melde('Kalenderdatei konnte nicht geteilt werden.', true);
      }
    }
  });

  return {
    async zeige(neuerTag) {
      tag = neuerTag;
      offen = null;
      try {
        medikamente = await alle('medikamente');
        vorlagen = (await ladeEinstellung('vorlagen')) || [...STANDARD_VORLAGEN];
        favoriten = (await ladeEinstellung('favoriten')) || [];
        vorlagenNotizen = (await ladeEinstellung('vorlagenNotizen')) || {};
      } catch (fehler) {
        console.error(fehler);
        melde('Medikamente konnten nicht geladen werden.', true);
      }
      zeichne();
    },
  };
}
