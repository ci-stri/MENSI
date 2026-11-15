// Datenhaltung in IndexedDB. Alle Daten bleiben auf dem Gerät.
// Speicher: tage (ein Dokument pro Tag, inklusive Einnahmen), medikamente, symptome, einstellungen.

const NAME = 'mensi';
const VERSION = 1;
let offen;

function oeffne() {
  if (!offen) {
    offen = new Promise((fertig, fehler) => {
      const anfrage = indexedDB.open(NAME, VERSION);
      anfrage.onupgradeneeded = () => {
        const db = anfrage.result;
        db.createObjectStore('tage', { keyPath: 'datum' });
        db.createObjectStore('medikamente', { keyPath: 'id' });
        db.createObjectStore('symptome', { keyPath: 'id' });
        db.createObjectStore('einstellungen', { keyPath: 'schluessel' });
      };
      anfrage.onsuccess = () => fertig(anfrage.result);
      anfrage.onerror = () => fehler(anfrage.error);
    });
  }
  return offen;
}

function vorgang(speicher, modus, aktion) {
  return oeffne().then((db) => new Promise((fertig, fehler) => {
    const t = db.transaction(speicher, modus);
    const anfrage = aktion(t.objectStore(speicher));
    t.oncomplete = () => fertig(anfrage ? anfrage.result : undefined);
    t.onerror = () => fehler(t.error);
    t.onabort = () => fehler(t.error);
  }));
}

export function ladeTag(datum) {
  return vorgang('tage', 'readonly', (s) => s.get(datum)).then((tag) => tag || { datum });
}

export function speichereTag(tag) {
  return vorgang('tage', 'readwrite', (s) => s.put({ ...tag, geaendert: new Date().toISOString() }));
}

// Bittet den Browser, die Daten nicht von sich aus zu löschen.
export function bitteUmDauerhaftenSpeicher() {
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

export function alle(speicher) {
  return vorgang(speicher, 'readonly', (s) => s.getAll());
}

export function lege(speicher, eintrag) {
  return vorgang(speicher, 'readwrite', (s) => s.put(eintrag));
}

export function ladeEinstellung(schluessel) {
  return vorgang('einstellungen', 'readonly', (s) => s.get(schluessel)).then((e) => (e ? e.wert : undefined));
}

export function speichereEinstellung(schluessel, wert) {
  return vorgang('einstellungen', 'readwrite', (s) => s.put({ schluessel, wert }));
}
