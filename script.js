// Huurtoeslag 2025 Berekening - Volledig gereconstrueerd (EP/MP + correcte toeslagdelen + afronding)

const kerncijfersUrl = './huurtoeslag-2025.json';

let kerncijfers = {};

async function laadKerncijfers() {
  const response = await fetch(kerncijfersUrl);
  const data = await response.json();
  kerncijfers = data.huurtoeslag;
}

function toonElement(id, zichtbaar) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = zichtbaar ? 'block' : 'none';
}

function berekenHuurtoeslag() {
  const huur = parseFloat(document.getElementById('rekenhuur').value);
  const inkomen = parseFloat(document.getElementById('inkomen').value);
  const partnerAanwezig = document.querySelector('input[name="toeslagpartner"]:checked')?.value === 'ja';
  const partnerInkomen = partnerAanwezig ? parseFloat(document.getElementById('partnerinkomen').value) : 0;
  const overigeInwoners = document.querySelector('input[name="extra_inwoners"]:checked')?.value === 'ja';
  const extraInkomen = overigeInwoners ? parseFloat(document.getElementById('extra_inkomen').value) : 0;
  const vermogen = parseFloat(document.getElementById('vermogen').value);
  const isJongerDan23 = document.querySelector('input[name="jonger_dan_23"]:checked')?.value === 'ja';

  const toetsingsinkomen = inkomen + partnerInkomen + extraInkomen;
  const toetsingsvermogen = vermogen;
  const isMP = partnerAanwezig || overigeInwoners;
  const vermogensgrens = isMP ? kerncijfers.vermogensgrensMP : kerncijfers.vermogensgrensEP;

  if (toetsingsvermogen > vermogensgrens) {
    toonResultaat('U heeft te veel vermogen om huurtoeslag te krijgen.');
    return;
  }

  const maximaleHuur = isJongerDan23 ? kerncijfers.jeugdHuurgrens : kerncijfers.huurgrens;
  if (huur > maximaleHuur) {
    toonResultaat('Uw huur is te hoog voor huurtoeslag.');
    return;
  }

  // Basishuur berekenen
  const minInk = isMP ? kerncijfers.minInk_MP : kerncijfers.minInk_EP;
  const basishuurMin = isMP ? kerncijfers.minBasishuur_MP : kerncijfers.minBasishuur_EP;
  const A = isMP ? kerncijfers.factorA_MP : kerncijfers.factorA_EP;
  const B = isMP ? kerncijfers.factorB_MP : kerncijfers.factorB_EP;

  let basishuur = basishuurMin;
  if (toetsingsinkomen > minInk) {
    const over = toetsingsinkomen - minInk;
    basishuur = A * over * over + B * over + basishuurMin;
  }
  basishuur += kerncijfers.taakstellingsbedrag;

  // Drempels
  const kkg = kerncijfers.kwaliteitskortingsgrens;
  const ag = isMP ? kerncijfers.aftoppingsgrensGroot : kerncijfers.aftoppingsgrensKlein;

  // Toeslagdeel A
  const grensA = Math.min(kkg, huur);
  const deelA = Math.max(0, grensA - basishuur);

  // Toeslagdeel B
  const ondergrensB = Math.max(basishuur, kkg);
  const bovengrensB = Math.min(huur, ag);
  const deelB = Math.max(0, bovengrensB - ondergrensB) * 0.65;

  // Toeslagdeel C (altijd berekenen, AOW niet van invloed)
  const deelC = Math.max(0, huur - ag) * 0.40;

  // Afronding
  const toeslag = Math.round(deelA + deelB + deelC);

  // Toon
  if (toeslag <= 0) {
    toonResultaat('U heeft geen recht op huurtoeslag.');
    return;
  }

  toonResultaat(
    `Uw geschatte huurtoeslag bedraagt <strong>€${toeslag}</strong> per maand.<br><br>` +
    `<u>Toelichting:</u><br>` +
    `Basishuur: €${basishuur.toFixed(2)}<br>` +
    `Toeslagdeel A (100%): €${deelA.toFixed(2)}<br>` +
    `Toeslagdeel B (65%): €${deelB.toFixed(2)}<br>` +
    `Toeslagdeel C (40%): €${deelC.toFixed(2)}<br>`
  );
}

function toonResultaat(html) {
  const el = document.getElementById('resultaat');
  if (el) el.innerHTML = html;
}

function setupFormLogica() {
  document.querySelectorAll('input[name="toeslagpartner"]').forEach(radio => {
    radio.checked = radio.value === 'nee';
    radio.addEventListener('change', () => {
      toonElement('partnerinkomen_wrapper', radio.value === 'ja');
    });
  });

  document.querySelectorAll('input[name="extra_inwoners"]').forEach(radio => {
    radio.checked = radio.value === 'nee';
    radio.addEventListener('change', () => {
      toonElement('extra_inkomen_wrapper', radio.value === 'ja');
    });
  });

  document.querySelectorAll('input[name="jonger_dan_23"]').forEach(radio => {
    radio.checked = radio.value === 'nee';
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  await laadKerncijfers();
  setupFormLogica();
  document.getElementById('berekenBtn').addEventListener('click', berekenHuurtoeslag);
});
