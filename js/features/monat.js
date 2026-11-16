// Kalender-Ansicht: Monatsraster mit Blutung, stärkstem Schmerz und Symptomen, dazu die Zyklusübersicht.
import { alle } from '../db.js';
import { tagesSchluessel } from '../logik.js';
import { periodenStarts, zyklusLaengen, alsDatum, tageZwischen } from '../bericht.js';

export function initMonat(waehleTag) {
  const $ = (id) => document.getElementById(id);
  let monat = new Date();
  let tage = [];

  function zeichne() {
    const jahr = monat.getFullYear();
    const m = monat.getMonth();
    const heute = tagesSchluessel(new Date());
    $('monat-titel').textContent = monat.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    $('monat-vor').disabled = tagesSchluessel(new Date(jahr, m + 1, 1)) > heute;
    const nachDatum = new Map(tage.map((t) => [t.datum, t]));
    const starts = periodenStarts(tage);
    const box = $('monat');
    box.textContent = '';
    for (const w of ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']) {
      const k = document.createElement('span');
      k.className = 'wtag';
      k.textContent = w;
      box.appendChild(k);
    }
    const versatz = (new Date(jahr, m, 1).getDay() + 6) % 7;
    for (let i = 0; i < versatz; i++) box.appendChild(document.createElement('span'));
    const anzahl = new Date(jahr, m + 1, 0).getDate();
    for (let t = 1; t <= anzahl; t++) {
      const d = new Date(jahr, m, t);
      const datum = tagesSchluessel(d);
      const tag = nachDatum.get(datum);
      const b = document.createElement('button');
      b.className = 'zelle';
      b.disabled = datum > heute;
      const teile = [d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })];
      const nr = document.createElement('span');
      nr.textContent = t;
      b.appendChild(nr);
      if (datum === heute) b.classList.add('heute');
      if (starts.includes(datum)) b.classList.add('start');
      if (tag && tag.blutung) { b.classList.add(`b-${tag.blutung}`); teile.push(`Blutung ${tag.blutung === 'unbekannt' ? '' : tag.blutung}`); }
      const s = tag && tag.schmerz;
      if (s && !s.schmerzfrei) {
        const z = document.createElement('b');
        z.className = 'zahl';
        z.textContent = s.bis === null ? '•' : s.bis;
        b.appendChild(z);
        teile.push(s.bis === null ? 'Schmerz' : `Schmerz bis ${s.bis}`);
      }
      if (tag && tag.symptome && tag.symptome.length) {
        const p = document.createElement('i');
        p.className = 'punkt';
        b.appendChild(p);
        teile.push('Symptome');
      }
      // Medikamente als Punkte: rot = genommenes tägliches Medikament, blau = Bedarfsmedikament.
      const einnahmen = (tag && tag.einnahmen) || [];
      const taeglich = einnahmen.filter((e) => e.art === 'taeglich').length;
      const bedarf = einnahmen.filter((e) => e.art === 'spontan').length;
      if (taeglich || bedarf) {
        const reihe = document.createElement('span');
        reihe.className = 'medis';
        for (let i = 0; i < taeglich; i++) reihe.appendChild(Object.assign(document.createElement('i'), { className: 'm-rot' }));
        for (let i = 0; i < bedarf; i++) reihe.appendChild(Object.assign(document.createElement('i'), { className: 'm-blau' }));
        b.appendChild(reihe);
        if (taeglich) teile.push(taeglich === 1 ? '1 tägliches Medikament genommen' : `${taeglich} tägliche Medikamente genommen`);
        if (bedarf) teile.push(bedarf === 1 ? '1 Bedarfsmedikament' : `${bedarf} Bedarfsmedikamente`);
      }
      b.setAttribute('aria-label', teile.join(', '));
      b.addEventListener('click', () => waehleTag(d));
      box.appendChild(b);
    }

    const laengen = zyklusLaengen(starts);
    const letzte = laengen.slice(-6);
    const text = [];
    if (!starts.length) text.push('Noch keine Periode eingetragen.');
    else {
      const letzter = starts.at(-1);
      text.push(`Letzte Periode begann am ${alsDatum(letzter).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}, heute ist Zyklustag ${tageZwischen(letzter, heute) + 1}.`);
      if (letzte.length) {
        const mittel = Math.round(letzte.reduce((a, c) => a + c, 0) / letzte.length);
        text.push(`Zykluslänge im Mittel ${mittel} Tage (${Math.min(...letzte)} bis ${Math.max(...letzte)}), berechnet aus den letzten ${letzte.length} Zyklen.`);
      }
    }
    $('zyklus-text').textContent = text.join(' ');
    const liste = $('zyklus-liste');
    liste.textContent = '';
    starts.slice(-7).reverse().forEach((s, i, arr) => {
      const zeile = document.createElement('div');
      zeile.className = 'zeile fein';
      const links = document.createElement('span');
      links.textContent = alsDatum(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
      const rechts = document.createElement('span');
      rechts.textContent = i === 0 ? 'läuft' : `${tageZwischen(s, arr[i - 1])} Tage`;
      zeile.append(links, rechts);
      liste.appendChild(zeile);
    });
  }

  $('monat-zurueck').addEventListener('click', () => { monat = new Date(monat.getFullYear(), monat.getMonth() - 1, 1); zeichne(); });
  $('monat-vor').addEventListener('click', () => { monat = new Date(monat.getFullYear(), monat.getMonth() + 1, 1); zeichne(); });

  return {
    async zeige(datum) {
      monat = new Date(datum.getFullYear(), datum.getMonth(), 1);
      try {
        tage = await alle('tage');
      } catch (fehler) {
        console.error(fehler);
        tage = [];
      }
      zeichne();
    },
  };
}
