// Schmerzeingabe: Stärke als Spanne, Schmerzfrei, Tageszeiten, Gesamtdauer, Schmerzort.
import {
  leererSchmerz, waehleStaerke, schalteSchmerzfrei, schalteInListe, aendereDauer,
  istLeer, staerkeText, dauerText,
} from '../logik.js';

const SVG = 'http://www.w3.org/2000/svg';

// Regionen des Körperschaubilds. „rechts"/„links" meint die Körperseite der Person.
const REGIONEN = {
  vorne: [
    { id: 'kopf', name: 'Kopf', formen: [['circle', { cx: 60, cy: 22, r: 16 }]] },
    { id: 'brust', name: 'Brust', formen: [['rect', { x: 34, y: 44, width: 52, height: 40, rx: 14 }]] },
    { id: 'oberbauch', name: 'Oberbauch', formen: [['rect', { x: 36, y: 86, width: 48, height: 26, rx: 8 }]] },
    { id: 'unterbauch-rechts', name: 'Unterbauch rechts', formen: [['rect', { x: 36, y: 114, width: 15, height: 28, rx: 6 }]] },
    { id: 'unterbauch-mitte', name: 'Unterbauch Mitte', formen: [['rect', { x: 52, y: 114, width: 16, height: 28, rx: 6 }]] },
    { id: 'unterbauch-links', name: 'Unterbauch links', formen: [['rect', { x: 69, y: 114, width: 15, height: 28, rx: 6 }]] },
    { id: 'leiste', name: 'Leiste / Becken', formen: [['rect', { x: 36, y: 144, width: 48, height: 18, rx: 8 }]] },
    { id: 'oberschenkel-vorne', name: 'Oberschenkel vorne', formen: [['rect', { x: 36, y: 164, width: 22, height: 50, rx: 10 }], ['rect', { x: 62, y: 164, width: 22, height: 50, rx: 10 }]] },
  ],
  hinten: [
    { id: 'nacken', name: 'Hinterkopf / Nacken', formen: [['circle', { cx: 60, cy: 22, r: 16 }]] },
    { id: 'ruecken-oben', name: 'Oberer Rücken', formen: [['rect', { x: 34, y: 44, width: 52, height: 40, rx: 14 }]] },
    { id: 'ruecken-mitte', name: 'Mittlerer Rücken', formen: [['rect', { x: 36, y: 86, width: 48, height: 26, rx: 8 }]] },
    { id: 'ruecken-unten', name: 'Unterer Rücken', formen: [['rect', { x: 36, y: 114, width: 48, height: 28, rx: 8 }]] },
    { id: 'gesaess', name: 'Gesäß', formen: [['rect', { x: 36, y: 144, width: 48, height: 18, rx: 8 }]] },
    { id: 'kreuzbein', name: 'Kreuzbein / Steiß', formen: [['rect', { x: 51, y: 140, width: 18, height: 18, rx: 7 }]] },
    { id: 'oberschenkel-hinten', name: 'Oberschenkel hinten', formen: [['rect', { x: 36, y: 164, width: 22, height: 50, rx: 10 }], ['rect', { x: 62, y: 164, width: 22, height: 50, rx: 10 }]] },
  ],
};
const STUMM = [
  ['rect', { x: 18, y: 46, width: 12, height: 72, rx: 6 }],
  ['rect', { x: 90, y: 46, width: 12, height: 72, rx: 6 }],
  ['rect', { x: 38, y: 216, width: 18, height: 40, rx: 8 }],
  ['rect', { x: 64, y: 216, width: 18, height: 40, rx: 8 }],
];
const NAMEN = Object.fromEntries([...REGIONEN.vorne, ...REGIONEN.hinten].map((r) => [r.id, r.name]));

function form([tag, attribute], klasse) {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attribute)) e.setAttribute(k, v);
  e.setAttribute('class', klasse);
  return e;
}

export function initSchmerz(speichern) {
  const $ = (id) => document.getElementById(id);
  const skala = $('skala');
  let s = leererSchmerz();

  for (let n = 1; n <= 10; n++) {
    const b = document.createElement('button');
    b.textContent = n;
    b.dataset.n = n;
    b.setAttribute('aria-label', `Stärke ${n}`);
    skala.appendChild(b);
  }

  for (const [seite, svgId] of [['vorne', 'koerper-vorne'], ['hinten', 'koerper-hinten']]) {
    const svg = $(svgId);
    STUMM.forEach((f) => svg.appendChild(form(f, 'stumm')));
    for (const region of REGIONEN[seite]) {
      const g = document.createElementNS(SVG, 'g');
      g.dataset.ort = region.id;
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', region.name);
      region.formen.forEach((f) => g.appendChild(form(f, 'region')));
      svg.appendChild(g);
    }
  }

  function zeichne() {
    for (const b of skala.children) {
      const n = Number(b.dataset.n);
      const drin = s.von !== null && n >= s.von && n <= s.bis;
      b.classList.toggle('an', drin);
      b.classList.toggle('rand', drin && (n === s.von || n === s.bis));
      b.setAttribute('aria-pressed', drin);
    }
    $('schmerzfrei').classList.toggle('an', s.schmerzfrei);
    $('schmerzfrei').setAttribute('aria-pressed', s.schmerzfrei);
    $('schmerz-wert').textContent = staerkeText(s);
    $('schmerz-details').hidden = s.schmerzfrei;
    for (const b of $('tageszeiten').children) {
      const an = s.tageszeiten.includes(b.dataset.zeit);
      b.classList.toggle('an', an);
      b.setAttribute('aria-pressed', an);
    }
    $('dauer').textContent = dauerText(s.dauerStunden);
    for (const g of document.querySelectorAll('[data-ort]')) {
      const an = s.orte.includes(g.dataset.ort);
      g.setAttribute('aria-pressed', an);
      for (const f of g.children) f.classList.toggle('an', an);
    }
    $('ort-text').textContent = s.orte.length ? s.orte.map((o) => NAMEN[o] || o).join(', ') : 'optional';
  }

  function setze(neu) {
    s = neu;
    zeichne();
    speichern(istLeer(s) ? null : s);
  }

  skala.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) setze(waehleStaerke(s, Number(b.dataset.n)));
  });
  $('schmerzfrei').addEventListener('click', () => setze(schalteSchmerzfrei(s)));
  $('tageszeiten').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) setze({ ...s, tageszeiten: schalteInListe(s.tageszeiten, b.dataset.zeit) });
  });
  $('dauer-plus').addEventListener('click', () => setze({ ...s, dauerStunden: aendereDauer(s.dauerStunden, 1) }));
  $('dauer-minus').addEventListener('click', () => setze({ ...s, dauerStunden: aendereDauer(s.dauerStunden, -1) }));

  const waehleOrt = (e) => {
    const g = e.target.closest('[data-ort]');
    if (g) setze({ ...s, orte: schalteInListe(s.orte, g.dataset.ort) });
  };
  for (const id of ['koerper-vorne', 'koerper-hinten']) {
    $(id).addEventListener('click', waehleOrt);
    $(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); waehleOrt(e); }
    });
  }

  return {
    // Zeigt den gespeicherten Stand eines Tages an, ohne zu speichern.
    zeige(gespeichert) {
      s = { ...leererSchmerz(), ...(gespeichert || {}) };
      zeichne();
    },
  };
}
