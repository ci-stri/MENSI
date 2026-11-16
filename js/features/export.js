// Export-Ansicht: Übersicht als PDF über den Druckdialog. Eine Zeile pro Tag, Orte und Einträge in Worten.
import { alle } from '../db.js';
import { tagesSchluessel } from '../logik.js';
import { berichtZeilen, kennzahlen, alsDatum } from '../bericht.js';
import { ORT_NAMEN } from './schmerz.js';

function el(tag, klasse, text) {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text !== undefined) e.textContent = text;
  return e;
}
const lang = (schluessel) => alsDatum(schluessel).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

// Baut die Druckseite: Kopf mit Kennzahlen, darunter die Tabelle.
export function baueBericht(ziel, tage, von, bis, nurEintraege) {
  ziel.textContent = '';
  const zeilen = berichtZeilen(tage, von, bis, { nurEintraege, ortNamen: ORT_NAMEN });
  const k = kennzahlen(tage, von, bis);

  const kopf = el('header', 'd-kopf');
  const links = el('div');
  links.append(el('h1', '', 'Zyklus- und Schmerztagebuch'), el('p', '', `${lang(von)} bis ${lang(bis)}`));
  const zahlen = el('dl');
  const zahl = (name, wert) => { const d = el('div'); d.append(el('dt', '', name), el('dd', '', wert)); zahlen.appendChild(d); };
  zahl('Tage mit Blutung', String(k.blutungsTage));
  zahl('Tage mit Schmerz', String(k.schmerzTage));
  zahl('Stärkster Schmerz', k.staerksterSchmerz === null ? '–' : `${k.staerksterSchmerz} / 10`);
  zahl('Zykluslänge', k.zyklusMittel === null ? '–' : `Ø ${k.zyklusMittel} Tage (${k.zyklusMin}–${k.zyklusMax})`);
  kopf.append(links, zahlen);
  ziel.appendChild(kopf);

  const tabelle = el('table');
  const thead = el('thead');
  const tr = el('tr');
  for (const [name, klasse] of [['Datum', 's-datum'], ['ZT', 's-zt'], ['Blutung', 's-blutung'], ['Schmerz', 's-schmerz'],
    ['Wann · Dauer', 's-wann'], ['Ort', 's-ort'], ['Medikamente', 's-med'], ['Symptome', 's-sym'], ['Notiz', 's-notiz']]) {
    tr.appendChild(el('th', klasse, name));
  }
  thead.appendChild(tr);
  tabelle.appendChild(thead);
  const tbody = el('tbody');
  for (const z of zeilen) {
    if (z.monatsTitel) {
      const m = el('tr', 'd-monat');
      const zelle = el('td', '', z.monatsTitel);
      zelle.colSpan = 9;
      m.appendChild(zelle);
      tbody.appendChild(m);
    }
    const r = el('tr', [z.wochenStart ? 'woche' : '', z.wochenende ? 'we' : '', z.zyklustag === 1 ? 'start' : ''].filter(Boolean).join(' '));
    r.appendChild(el('td', 's-datum', z.tagText));
    r.appendChild(el('td', 's-zt', z.zyklustag === null ? '' : String(z.zyklustag)));
    r.appendChild(el('td', `s-blutung${z.blutung ? ` b-${z.blutung}` : ''}`, z.blutungText));
    const s = el('td', 's-schmerz', z.schmerzText);
    if (z.schmerzStufe) s.style.setProperty('--stufe', z.schmerzStufe);
    if (z.schmerzText && z.schmerzStufe !== 0) s.classList.add('hat');
    r.appendChild(s);
    r.append(el('td', 's-wann', z.wann), el('td', 's-ort', z.ort), el('td', 's-med', z.medikamente),
      el('td', 's-sym', z.symptome), el('td', 's-notiz', z.notiz));
    tbody.appendChild(r);
  }
  tabelle.appendChild(tbody);
  ziel.appendChild(tabelle);
  ziel.appendChild(el('p', 'd-fuss', `ZT = Zyklustag (Tag 1 = erster Tag der Periode). Schmerz auf einer Skala von 1 bis 10, bei einer Spanne schwächster bis stärkster Wert; „ja" = Schmerz ohne Angabe der Stärke. Erstellt mit MENSI am ${lang(tagesSchluessel(new Date()))}.`));
  return zeilen.length;
}

export function initExport(melde) {
  const $ = (id) => document.getElementById(id);
  let tage = [];

  function setzeZeitraum(monate) {
    const heute = new Date();
    const bis = tagesSchluessel(heute);
    let von;
    if (monate === 0) von = tage.length ? tage.map((t) => t.datum).sort()[0] : bis;
    else von = tagesSchluessel(new Date(heute.getFullYear(), heute.getMonth() - monate, heute.getDate() + 1));
    $('pdf-von').value = von;
    $('pdf-bis').value = bis;
    for (const b of $('zeitraum').children) {
      const an = Number(b.dataset.monate) === monate;
      b.classList.toggle('an', an);
      b.setAttribute('aria-pressed', an);
    }
  }

  $('zeitraum').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) setzeZeitraum(Number(b.dataset.monate));
  });
  for (const id of ['pdf-von', 'pdf-bis']) {
    $(id).addEventListener('change', () => { for (const b of $('zeitraum').children) { b.classList.remove('an'); b.setAttribute('aria-pressed', false); } });
  }

  $('pdf-ok').addEventListener('click', () => {
    const von = $('pdf-von').value;
    const bis = $('pdf-bis').value;
    if (!von || !bis || von > bis) { $('pdf-status').textContent = 'Bitte einen gültigen Zeitraum wählen.'; return; }
    const anzahl = baueBericht($('druck'), tage, von, bis, $('pdf-nur').checked);
    if (!anzahl) { $('pdf-status').textContent = 'In diesem Zeitraum gibt es keine Einträge.'; return; }
    let format = document.getElementById('seitenformat');
    if (!format) { format = document.createElement('style'); format.id = 'seitenformat'; document.head.appendChild(format); }
    format.textContent = `@page { size: A4 ${$('pdf-quer').checked ? 'landscape' : 'portrait'}; margin: 11mm 10mm 12mm; }`;
    $('pdf-status').textContent = `${anzahl} Tage. Im Druckdialog „Als PDF sichern" wählen oder die Vorschau mit zwei Fingern aufziehen und teilen.`;
    window.print();
  });

  return {
    async zeige() {
      try {
        tage = await alle('tage');
      } catch (fehler) {
        console.error(fehler);
        tage = [];
        melde('Daten konnten nicht geladen werden.', true);
      }
      if (!$('pdf-von').value) setzeZeitraum(3);
    },
  };
}
