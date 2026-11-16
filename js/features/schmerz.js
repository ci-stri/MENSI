// Schmerzeingabe: Stärke als Spanne, Schmerzfrei, Tageszeiten, Gesamtdauer, Schmerzort.
import {
  leererSchmerz, waehleStaerke, schalteSchmerzfrei, schalteInListe, aendereDauer,
  istLeer, staerkeText, dauerText,
} from '../logik.js';

const SVG = 'http://www.w3.org/2000/svg';

// Körperschaubild: eine Figur als Umriss, darin farbige Felder mit geschwungenen Grenzen.
// Der Umriss schneidet die Felder zu. Rechts und links meinen immer die Körperseite der Person.
const KOPF = ['ellipse', { cx: 70, cy: 22, rx: 13, ry: 16 }];
// Rechte Bildhälfte der Figur (Hals, Schulter, Arm mit Hand, Rumpf, Bein mit Fuß); gespiegelt ergibt sie die linke.
const HAELFTE = 'M69.5,32 L76,32 L76,42 C76,47 84,49 94,51 C101,52 105,57 106,65 C108,82 110,98 112,114 '
  + 'C114,128 116,140 117,152 C118,160 120,166 119,172 C118,177 112,177 110,172 C109,166 108,160 107,152 '
  + 'C105,138 102,126 100,114 C98,100 96,86 95,74 C95,88 90,100 89,112 C88,126 96,138 98,152 '
  + 'C100,172 95,200 91,220 C93,236 92,256 85,280 L89,290 C90,294 87,295 83,295 L77,295 C75,290 76,285 76,280 '
  + 'C77,258 76,238 74,220 C74,200 72,178 70,162 L69.5,162 Z';
const UMRISS = [
  KOPF,
  ['path', { d: HAELFTE }],
  ['path', { d: HAELFTE, transform: 'matrix(-1 0 0 1 140 0)' }],
];
// Feld zwischen zwei Bögen: oben bei y1, unten bei y2; b1/b2 = wie weit sich der Bogen in der Mitte nach unten wölbt.
function feld(y1, b1, y2, b2, x1 = 43, x2 = 97) {
  const m = (x1 + x2) / 2;
  return ['path', { d: `M${x1},${y1} Q${m},${y1 + 2 * b1} ${x2},${y1} L${x2},${y2} Q${m},${y2 + 2 * b2} ${x1},${y2} Z` }];
}
const UNTERBAUCH = feld(112, 3, 147, 9);
// Felder mit teil zeigen nur den Ausschnitt ihrer Grundform zwischen zwei x-Werten (rechts / Mitte / links).
const paar = (id, name, farbe, basis, erst, zweit) => [
  { id: `${id}-${erst}`, name: `${name} ${erst}`, farbe, basis, teil: [0, 70] },
  { id: `${id}-${zweit}`, name: `${name} ${zweit}`, farbe, basis, teil: [70, 140] },
];
const REGIONEN = {
  // Vorderansicht: die rechte Körperseite liegt im Bild links.
  vorne: [
    { id: 'kopf', name: 'Kopf', farbe: 'salbei', formen: [feld(0, 0, 44, 0)] },
    { id: 'brust', name: 'Brust', farbe: 'blau', formen: [feld(44, 0, 88, -5)] },
    { id: 'oberbauch', name: 'Oberbauch', farbe: 'gelb', formen: [feld(88, -5, 112, 3)] },
    { id: 'unterbauch-rechts', name: 'Unterbauch rechts', farbe: 'rosa', basis: UNTERBAUCH, teil: [0, 62] },
    { id: 'unterbauch-mitte', name: 'Unterbauch Mitte', farbe: 'rosa-hell', basis: UNTERBAUCH, teil: [62, 78] },
    { id: 'unterbauch-links', name: 'Unterbauch links', farbe: 'rosa', basis: UNTERBAUCH, teil: [78, 140] },
    { id: 'leiste', name: 'Leiste / Becken', farbe: 'salbei', formen: [feld(147, 9, 168, 3, 38, 102)] },
    ...paar('oberschenkel-vorne', 'Oberschenkel vorne', 'blau', feld(168, 3, 212, 0, 38, 102), 'rechts', 'links'),
    ...paar('knie', 'Knie', 'gelb', feld(212, 0, 234, 0, 38, 102), 'rechts', 'links'),
    ...paar('unterschenkel-vorne', 'Unterschenkel vorne', 'salbei', feld(234, 0, 281, 0, 38, 102), 'rechts', 'links'),
  ],
  // Rückansicht: die linke Körperseite liegt im Bild links.
  hinten: [
    { id: 'nacken', name: 'Hinterkopf / Nacken', farbe: 'salbei', formen: [feld(0, 0, 48, 2)] },
    { id: 'ruecken-oben', name: 'Oberer Rücken', farbe: 'blau', formen: [feld(48, 2, 88, 3)] },
    { id: 'ruecken-mitte', name: 'Mittlerer Rücken', farbe: 'gelb', formen: [feld(88, 3, 112, 3)] },
    { id: 'ruecken-unten', name: 'Unterer Rücken', farbe: 'rosa', formen: [feld(112, 3, 136, -3)] },
    { id: 'gesaess', name: 'Gesäß', farbe: 'salbei', formen: [feld(136, -3, 172, 4, 38, 102)] },
    { id: 'kreuzbein', name: 'Kreuzbein / Steiß', farbe: 'rosa-hell', formen: [['path', { d: 'M59,128 Q70,122 81,128 Q80,146 70,154 Q60,146 59,128 Z' }]] },
    ...paar('oberschenkel-hinten', 'Oberschenkel hinten', 'blau', feld(172, 4, 214, 0, 38, 102), 'links', 'rechts'),
    ...paar('kniekehle', 'Kniekehle', 'gelb', feld(214, 0, 234, 0, 38, 102), 'links', 'rechts'),
    ...paar('wade', 'Wade', 'salbei', feld(234, 0, 281, 0, 38, 102), 'links', 'rechts'),
  ],
};
// Namen für Anzeige und Export. Die letzten sechs stammen aus einer früheren Fassung ohne Seitenangabe.
export const ORT_NAMEN = {
  ...Object.fromEntries([...REGIONEN.vorne, ...REGIONEN.hinten].map((r) => [r.id, r.name])),
  'oberschenkel-vorne': 'Oberschenkel vorne', knie: 'Knie', 'unterschenkel-vorne': 'Unterschenkel vorne',
  'oberschenkel-hinten': 'Oberschenkel hinten', kniekehle: 'Kniekehle', wade: 'Wade',
};
const NAMEN = ORT_NAMEN;

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
    const schnitt = (id, formen) => {
      const c = document.createElementNS(SVG, 'clipPath');
      c.id = id;
      formen.forEach((f) => c.appendChild(form(f, '')));
      svg.appendChild(c);
    };
    schnitt(`umriss-${seite}`, UMRISS);
    UMRISS.forEach((f) => svg.appendChild(form(f, 'stumm')));
    for (const region of REGIONEN[seite]) {
      const g = document.createElementNS(SVG, 'g');
      g.dataset.ort = region.id;
      g.setAttribute('clip-path', `url(#umriss-${seite})`);
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', region.name);
      g.style.setProperty('--f', `var(--${region.farbe})`);
      if (region.teil) {
        // Drittel des Unterbauchs: derselbe Bogen, seitlich beschnitten.
        const [xa, xb] = region.teil;
        schnitt(`teil-${region.id}`, [['rect', { x: xa, y: 0, width: xb - xa, height: 300 }]]);
        const innen = document.createElementNS(SVG, 'g');
        innen.setAttribute('clip-path', `url(#teil-${region.id})`);
        innen.appendChild(form(region.basis, 'region'));
        g.appendChild(innen);
      } else {
        region.formen.forEach((f) => g.appendChild(form(f, 'region')));
      }
      svg.appendChild(g);
    }
    if (seite === 'vorne') {
      // Trennlinien zwischen den Dritteln des Unterbauchs.
      schnitt('unterbauch-form', [UNTERBAUCH]);
      const naehte = document.createElementNS(SVG, 'g');
      naehte.setAttribute('clip-path', 'url(#unterbauch-form)');
      for (const x of [62, 78]) naehte.appendChild(form(['line', { x1: x, y1: 100, x2: x, y2: 170 }], 'naht'));
      svg.appendChild(naehte);
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
      for (const f of g.querySelectorAll('.region')) f.classList.toggle('an', an);
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
