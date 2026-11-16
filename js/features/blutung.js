// Blutung: ohne Eintrag gilt „keine Blutung". Gespeichert wird nur eine ausdrückliche Angabe.
const STUFEN = [['', 'Keine'], ['schmier', 'Schmierblutung'], ['leicht', 'Leicht'], ['mittel', 'Mittel'], ['stark', 'Stark']];

export function initBlutung(speichern) {
  const box = document.getElementById('blutung');
  const hinweis = document.getElementById('blutung-hinweis');
  let wert = '';

  for (const [stufe, name] of STUFEN) {
    const b = document.createElement('button');
    b.textContent = name;
    b.dataset.stufe = stufe;
    box.appendChild(b);
  }

  function zeichne() {
    for (const b of box.children) {
      const an = b.dataset.stufe === wert;
      b.classList.toggle('an', an);
      b.setAttribute('aria-pressed', an);
    }
    hinweis.hidden = wert !== 'unbekannt';
  }

  box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    wert = b.dataset.stufe;
    zeichne();
    speichern(wert || null);
  });

  return {
    zeige(gespeichert) {
      wert = gespeichert || '';
      zeichne();
    },
  };
}
