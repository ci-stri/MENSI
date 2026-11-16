// Einmalige Übernahme aus dem Export der Health-App (Export.xml), ohne Browser-Abhängigkeit.
// Die Datei ist groß (über 100 MB), deshalb wird sie stückweise gelesen und nie als Ganzes gehalten.

const BLUTUNG = {
  HKCategoryValueVaginalBleedingLight: 'leicht',
  HKCategoryValueVaginalBleedingMedium: 'mittel',
  HKCategoryValueVaginalBleedingHeavy: 'stark',
  HKCategoryValueVaginalBleedingUnspecified: 'unbekannt',
};
const RANG = ['unbekannt', 'schmier', 'leicht', 'mittel', 'stark'];
const SYMPTOME = {
  Headache: 'Kopfschmerzen',
  Nausea: 'Übelkeit',
  AbdominalCramps: 'Bauchkrämpfe',
  AppetiteChanges: 'Appetitveränderung',
  SleepChanges: 'Schlafveränderung',
  MoodChanges: 'Stimmungsschwankung',
  Bloating: 'Blähbauch',
  BreastPain: 'Brustschmerzen',
  LowerBackPain: 'Rückenschmerzen unten',
  Fatigue: 'Erschöpfung',
  Acne: 'Akne',
  Diarrhea: 'Durchfall',
  Constipation: 'Verstopfung',
  Dizziness: 'Schwindel',
  HotFlashes: 'Hitzewallungen',
};
const NICHT_VORHANDEN = ['HKCategoryValueSeverityNotPresent', 'HKCategoryValuePresenceNotPresent', 'HKCategoryValueAppetiteChangesNoChange'];
const EINTRAG = /<Record type="HKCategoryTypeIdentifier(\w+)"[^>]*?startDate="(\d{4}-\d{2}-\d{2})[^"]*"[^>]*?value="(\w+)"/g;

// Liefert einen Leser: fuettere(text) beliebig oft, danach ergebnis() → Map Datum → { blutung?, schmerz?, symptome[] }.
export function neuerHealthLeser() {
  const tage = new Map();
  let rest = '';
  const tag = (datum) => {
    if (!tage.has(datum)) tage.set(datum, { symptome: [] });
    return tage.get(datum);
  };
  function lies(text) {
    for (const [, art, datum, wert] of text.matchAll(EINTRAG)) {
      if (art === 'MenstrualFlow') {
        const staerke = BLUTUNG[wert];
        if (!staerke) continue; // „keine Blutung" ist in MENSI der Normalfall und wird nicht gespeichert
        const t = tag(datum);
        if (!t.blutung || RANG.indexOf(staerke) > RANG.indexOf(t.blutung)) t.blutung = staerke;
      } else if (art === 'PelvicPain') {
        if (!NICHT_VORHANDEN.includes(wert)) tag(datum).schmerz = true;
      } else if (SYMPTOME[art] && !NICHT_VORHANDEN.includes(wert)) {
        const t = tag(datum);
        if (!t.symptome.includes(SYMPTOME[art])) t.symptome.push(SYMPTOME[art]);
      }
    }
  }
  return {
    fuettere(text) {
      const alles = rest + text;
      const schnitt = alles.lastIndexOf('\n');
      if (schnitt < 0) { rest = alles; return; }
      lies(alles.slice(0, schnitt));
      rest = alles.slice(schnitt);
    },
    ergebnis() {
      lies(rest);
      rest = '';
      return tage;
    },
  };
}

// Trägt die Health-Angaben in ein Tagesdokument ein, ohne vorhandene MENSI-Einträge zu überschreiben.
// Gibt das neue Dokument zurück oder null, wenn sich nichts ändert.
export function uebernimm(tag, health, leererSchmerz) {
  const neu = { ...tag };
  let geaendert = false;
  if (health.blutung && !tag.blutung) { neu.blutung = health.blutung; geaendert = true; }
  if (health.schmerz && !tag.schmerz) { neu.schmerz = { ...leererSchmerz(), ohneStaerke: true }; geaendert = true; }
  const fehlend = health.symptome.filter((s) => !(tag.symptome || []).includes(s));
  if (fehlend.length) { neu.symptome = [...(tag.symptome || []), ...fehlend]; geaendert = true; }
  return geaendert ? neu : null;
}

export function zaehle(tage) {
  let blutung = 0, schmerz = 0, symptome = 0;
  for (const t of tage.values()) {
    if (t.blutung) blutung++;
    if (t.schmerz) schmerz++;
    if (t.symptome.length) symptome++;
  }
  return { tage: tage.size, blutung, schmerz, symptome };
}
