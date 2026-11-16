// Gibt eine Datei über das Teilen-Menü weiter (iPhone: „In Dateien sichern", Kalender …), sonst als Download.
export async function teile(datei) {
  try {
    if (navigator.canShare && navigator.canShare({ files: [datei] })) {
      await navigator.share({ files: [datei] });
      return 'geteilt';
    }
  } catch (fehler) {
    if (fehler.name === 'AbortError') return 'abgebrochen';
    throw fehler;
  }
  const adresse = URL.createObjectURL(datei);
  const link = document.createElement('a');
  link.href = adresse;
  link.download = datei.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(adresse), 1000);
  return 'geladen';
}
