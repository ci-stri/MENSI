// Auswertung für Kalender und PDF: Zyklen und Tabellenzeilen. Ohne Browser-Abhängigkeit.
import { staerkeText, dauerText, tagesSchluessel, plusTage } from './logik.js';

export const BLUTUNG_NAMEN = { schmier: 'Schmierblutung', leicht: 'leicht', mittel: 'mittel', stark: 'stark', unbekannt: 'ja' };
const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function alsDatum(schluessel) {
  const [j, m, t] = schluessel.split('-').map(Number);
  return new Date(j, m - 1, t);
}
export const tageZwischen = (a, b) => Math.round((alsDatum(b) - alsDatum(a)) / 86400000);

// Eine Periode beginnt an einem Blutungstag, wenn die letzte Blutung mehr als 10 Tage zurückliegt.
// Schmierblutungen allein zählen nicht als Beginn.
export function periodenStarts(tage) {
  const blutung = tage.filter((t) => t.blutung && t.blutung !== 'schmier').map((t) => t.datum).sort();
  const starts = [];
  let davor = null;
  for (const d of blutung) {
    if (davor === null || tageZwischen(davor, d) > 10) starts.push(d);
    davor = d;
  }
  return starts;
}

export function zyklusLaengen(starts) {
  return starts.slice(1).map((d, i) => tageZwischen(starts[i], d));
}

export function hatEintrag(tag) {
  return Boolean(tag && (tag.blutung || tag.schmerz || (tag.einnahmen && tag.einnahmen.length)
    || (tag.symptome && tag.symptome.length) || tag.notiz));
}

// Eine Zeile pro Tag von „von" bis „bis" (einschließlich), neueste zuletzt.
export function berichtZeilen(tage, von, bis, { nurEintraege = false, ortNamen = {} } = {}) {
  const nachDatum = new Map(tage.map((t) => [t.datum, t]));
  const starts = periodenStarts(tage);
  const zeilen = [];
  let monatDavor = null;
  for (let d = alsDatum(von); tagesSchluessel(d) <= bis; d = plusTage(d, 1)) {
    const datum = tagesSchluessel(d);
    const tag = nachDatum.get(datum);
    if (nurEintraege && !hatEintrag(tag)) continue;
    const start = starts.filter((s) => s <= datum).at(-1);
    const s = tag && tag.schmerz;
    const monat = datum.slice(0, 7);
    zeilen.push({
      datum,
      tagText: `${WOCHENTAGE[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`,
      monatsTitel: monat !== monatDavor ? d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : null,
      wochenStart: d.getDay() === 1,
      wochenende: d.getDay() === 0 || d.getDay() === 6,
      zyklustag: start ? tageZwischen(start, datum) + 1 : null,
      blutung: tag && tag.blutung ? tag.blutung : null,
      blutungText: tag && tag.blutung ? BLUTUNG_NAMEN[tag.blutung] || tag.blutung : '',
      schmerzStufe: s ? (s.schmerzfrei ? 0 : s.bis) : null,
      schmerzText: s ? (s.schmerzfrei ? 'frei' : s.von === null ? 'ja' : staerkeText(s)) : '',
      wann: s ? [s.tageszeiten.join(', '), s.dauerStunden ? dauerText(s.dauerStunden) : ''].filter(Boolean).join(' · ') : '',
      ort: s ? s.orte.map((o) => ortNamen[o] || o).join(', ') : '',
      medikamente: tag && tag.einnahmen ? tag.einnahmen.map((e) => e.name + (e.art === 'spontan' && e.zeit ? ` (${e.zeit})` : '')).join(', ') : '',
      symptome: tag && tag.symptome ? tag.symptome.join(', ') : '',
      notiz: (tag && tag.notiz) || '',
    });
    monatDavor = monat;
  }
  return zeilen;
}

export function kennzahlen(tage, von, bis) {
  const imZeitraum = tage.filter((t) => t.datum >= von && t.datum <= bis);
  const laengen = zyklusLaengen(periodenStarts(tage).filter((s) => s >= von && s <= bis));
  const staerken = imZeitraum.filter((t) => t.schmerz && t.schmerz.bis !== null).map((t) => t.schmerz.bis);
  return {
    blutungsTage: imZeitraum.filter((t) => t.blutung && t.blutung !== 'schmier').length,
    schmerzTage: imZeitraum.filter((t) => t.schmerz && !t.schmerz.schmerzfrei).length,
    zyklen: laengen.length,
    zyklusMittel: laengen.length ? Math.round(laengen.reduce((a, b) => a + b, 0) / laengen.length) : null,
    zyklusMin: laengen.length ? Math.min(...laengen) : null,
    zyklusMax: laengen.length ? Math.max(...laengen) : null,
    staerksterSchmerz: staerken.length ? Math.max(...staerken) : null,
  };
}
