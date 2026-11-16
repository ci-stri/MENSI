// Reine Logik der Schmerzeingabe, ohne Browser-Abhängigkeit (wird in tests/ geprüft).

export const TAGESZEITEN = ['morgens', 'mittags', 'abends', 'nachts'];

// ohneStaerke: Schmerz vorhanden, Stärke unbekannt (aus Health übernommen).
export function leererSchmerz() {
  return { schmerzfrei: false, ohneStaerke: false, von: null, bis: null, tageszeiten: [], dauerStunden: null, orte: [] };
}

// Erster Tap setzt eine Stärke, zweiter Tap spannt eine Spanne auf,
// derselbe Wert noch einmal löscht, ein Tap bei bestehender Spanne beginnt neu.
export function waehleStaerke(s, n) {
  const neu = { ...s, schmerzfrei: false, ohneStaerke: false };
  if (s.von === null || s.von !== s.bis) {
    neu.von = neu.bis = n;
  } else if (n === s.von) {
    neu.von = neu.bis = null;
  } else {
    neu.von = Math.min(s.von, n);
    neu.bis = Math.max(s.bis, n);
  }
  return neu;
}

// „Schmerzfrei" schließt alle anderen Angaben aus.
export function schalteSchmerzfrei(s) {
  return s.schmerzfrei ? leererSchmerz() : { ...leererSchmerz(), schmerzfrei: true };
}

export function schalteInListe(liste, wert) {
  return liste.includes(wert) ? liste.filter((x) => x !== wert) : [...liste, wert];
}

export function aendereDauer(stunden, schritt) {
  const neu = (stunden ?? 0) + schritt;
  if (neu <= 0) return null;
  return Math.min(24, neu);
}

export function istLeer(s) {
  return !s.schmerzfrei && !s.ohneStaerke && s.von === null && s.tageszeiten.length === 0 && s.dauerStunden === null && s.orte.length === 0;
}

export function staerkeText(s) {
  if (s.schmerzfrei) return '0';
  if (s.von === null) return s.ohneStaerke ? 'ja' : '–';
  return s.von === s.bis ? String(s.von) : `${s.von}–${s.bis}`;
}

export function dauerText(stunden) {
  if (stunden === null || stunden === undefined) return 'offen';
  if (stunden >= 24) return 'ganzer Tag';
  return `${stunden} Std.`;
}

// Datum als lokaler Tagesschlüssel JJJJ-MM-TT.
export function tagesSchluessel(d) {
  const zwei = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

export function plusTage(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

// ---- Medikamente ----

export const STANDARD_VORLAGEN = [
  'Ibuprofen 200 mg', 'Ibuprofen 400 mg', 'Ibuprofen 800 mg',
  'Paracetamol 500 mg', 'Naproxen 250 mg', 'Buscopan 10 mg',
];

// Ein tägliches Medikament gilt ab „von" (einschließlich) bis „bis" (ausschließlich).
export function aktivAm(medikament, tag) {
  return medikament.von <= tag && (!medikament.bis || tag < medikament.bis);
}

// Gruppen nach Uhrzeit: pro Uhrzeit gibt es später genau eine Erinnerung.
export function gruppiereNachZeit(medikamente) {
  const gruppen = new Map();
  for (const m of medikamente) {
    if (!gruppen.has(m.zeit)) gruppen.set(m.zeit, []);
    gruppen.get(m.zeit).push(m);
  }
  return [...gruppen.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([zeit, liste]) => ({ zeit, medikamente: liste }));
}

export function mitVorlage(vorlagen, name) {
  const gesucht = name.trim().toLowerCase();
  return vorlagen.some((v) => v.toLowerCase() === gesucht) ? vorlagen : [...vorlagen, name.trim()];
}

// Favoriten zuerst, sonst bleibt die Reihenfolge erhalten.
export function favoritenZuerst(vorlagen, favoriten) {
  const istFavorit = (v) => favoriten.includes(v);
  return [...vorlagen.filter(istFavorit), ...vorlagen.filter((v) => !istFavorit(v))];
}
