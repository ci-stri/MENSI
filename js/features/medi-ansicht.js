// Medikamenten-Ansicht: täglicher Plan, Verwaltung der Medikamente für einzelne Einnahmen, Verlauf.
import { alle, lege, ladeEinstellung, speichereEinstellung } from '../db.js';
import { aktivAm, gruppiereNachZeit, favoritenZuerst, schalteInListe, tagesSchluessel, plusTage, STANDARD_VORLAGEN } from '../logik.js';
import { alsDatum } from '../bericht.js';

function el(tag, klasse, text) {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function initMediAnsicht(melde) {
  const $ = (id) => document.getElementById(id);
  let medikamente = [];
  let vorlagen = [];
  let favoriten = [];
  let notizen = {};
  let tage = [];

  async function sicher(aktion) {
    try {
      await aktion();
      melde('Gespeichert');
    } catch (fehler) {
      console.error(fehler);
      melde('Speichern fehlgeschlagen. Bitte noch einmal versuchen.', true);
    }
  }

  function zeichnePlan() {
    const box = $('plan');
    box.textContent = '';
    const heute = tagesSchluessel(new Date());
    const aktive = medikamente.filter((m) => aktivAm(m, heute));
    for (const gruppe of gruppiereNachZeit(aktive)) {
      for (const m of gruppe.medikamente) {
        const zeile = el('div', 'eintrag');
        const text = el('div', 'haupt an ruhig');
        const inhalt = el('span', 'text', `${m.zeit} · ${m.name}`);
        const klein = [m.notiz, m.erinnern ? 'mit Erinnerung' : ''].filter(Boolean).join(' · ');
        if (klein) inhalt.appendChild(el('small', '', klein));
        text.appendChild(inhalt);
        const weg = el('button', 'weg', '×');
        weg.setAttribute('aria-label', `${m.name} ab heute aus dem Plan nehmen`);
        weg.addEventListener('click', () => sicher(async () => {
          m.bis = heute;
          await lege('medikamente', m);
          zeichnePlan();
        }));
        zeile.append(text, weg);
        box.appendChild(zeile);
      }
    }
    if (!aktive.length) box.appendChild(el('p', '', 'Kein tägliches Medikament eingetragen.'));
  }

  function zeichneVorlagen() {
    const box = $('vorlagen-liste');
    box.textContent = '';
    for (const name of favoritenZuerst(vorlagen, favoriten)) {
      const karte = el('div', 'vorlage');
      const kopf = el('div', 'eintrag');
      const istFavorit = favoriten.includes(name);
      const stern = el('button', `rund klein${istFavorit ? ' an' : ''}`, istFavorit ? '★' : '☆');
      stern.setAttribute('aria-pressed', istFavorit);
      stern.setAttribute('aria-label', `${name} als Favorit ${istFavorit ? 'entfernen' : 'merken'}`);
      stern.addEventListener('click', () => {
        favoriten = schalteInListe(favoriten, name);
        zeichneVorlagen();
        sicher(() => speichereEinstellung('favoriten', favoriten));
      });
      const titel = el('strong', 'text', name);
      const weg = el('button', 'weg', '×');
      weg.setAttribute('aria-label', `${name} löschen`);
      weg.addEventListener('click', () => {
        vorlagen = vorlagen.filter((v) => v !== name);
        favoriten = favoriten.filter((v) => v !== name);
        zeichneVorlagen();
        sicher(async () => {
          await speichereEinstellung('vorlagen', vorlagen);
          await speichereEinstellung('favoriten', favoriten);
        });
      });
      kopf.append(stern, titel, weg);
      const notiz = el('input');
      notiz.type = 'text';
      notiz.placeholder = 'Notiz, z. B. bei starken Krämpfen';
      notiz.setAttribute('aria-label', `Notiz zu ${name}`);
      notiz.value = notizen[name] || '';
      notiz.addEventListener('change', () => {
        notizen = { ...notizen, [name]: notiz.value.trim() };
        sicher(() => speichereEinstellung('vorlagenNotizen', notizen));
      });
      karte.append(kopf, notiz);
      box.appendChild(karte);
    }
    if (!vorlagen.length) box.appendChild(el('p', '', 'Die Liste ist leer. Neue Medikamente entstehen beim Eintragen unter „Heute".'));
  }

  function zeichneVerlauf() {
    const box = $('verlauf');
    box.textContent = '';
    const ab = tagesSchluessel(plusTage(new Date(), -30));
    const liste = tage.filter((t) => t.datum >= ab && (t.einnahmen || []).some((e) => e.art === 'spontan'))
      .sort((a, b) => b.datum.localeCompare(a.datum));
    for (const t of liste) {
      const zeile = el('div', 'zeile fein');
      zeile.append(
        el('span', '', alsDatum(t.datum).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })),
        el('span', 'rechts', t.einnahmen.filter((e) => e.art === 'spontan').map((e) => e.name + (e.zeit ? ` (${e.zeit})` : '')).join(', ')),
      );
      box.appendChild(zeile);
    }
    if (!liste.length) box.appendChild(el('p', '', 'Keine einzelnen Einnahmen in den letzten 30 Tagen.'));
  }

  return {
    async zeige() {
      try {
        medikamente = await alle('medikamente');
        tage = await alle('tage');
        vorlagen = (await ladeEinstellung('vorlagen')) || [...STANDARD_VORLAGEN];
        favoriten = (await ladeEinstellung('favoriten')) || [];
        notizen = (await ladeEinstellung('vorlagenNotizen')) || {};
      } catch (fehler) {
        console.error(fehler);
        melde('Medikamente konnten nicht geladen werden.', true);
      }
      zeichnePlan();
      zeichneVorlagen();
      zeichneVerlauf();
    },
  };
}
