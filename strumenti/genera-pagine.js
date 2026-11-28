#!/usr/bin/env node
/* Genera la homepage (index.html) e le pagine prodotto da
   catalogo.js (prezzi, foto) + i testi qui sotto (in italiano, mercato Italia).
   Usage:  node strumenti/genera-pagine.js
   Output is real static HTML: right title, description and social
   preview for every product (WhatsApp, Instagram, Facebook…). */

const fs = require('fs');
const path = require('path');
const C = require('../catalogo.js');

const RADICE = path.join(__dirname, '..');
const SITO = 'https://aftershiftstore.shop';
const fmt = C.fmt;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

const S2 = C.sconti[2], S3 = C.sconti[3];

/* ============================================================
   PAGE COPY (AfterShift tone: warm, direct, made for shift workers)
   No medical claims: comfort and relaxation only.
   ============================================================ */
const T = {

  ankle: {
    titolo: 'Massaggiatore Riscaldato per Caviglie e Piedi — AfterShift',
    meta: 'Calore, compressione ad aria e vibrazione per i piedi stanchi dopo un turno lungo. Pensato per infermiere, parrucchiere, cuochi, magazzinieri e commesse. Spedizione gratuita in tutta Italia.',
    og: 'img/ankle-1.jpg',
    badge: 'PENSATO PER I TURNI DA 12 ORE 🦶',
    sub: "Lo infili a fine turno e metti i piedi su. Due camere d'aria stringono dolcemente il collo del piede e la caviglia, le piastre riscaldanti scaldano i lati del piede e il tallone, e i punti di vibrazione lavorano lungo la pianta. Dieci minuti sul divano e torni a sentirti una persona.",
    chips: ['🔥 Calore avvolgente', '🫧 Compressione ad aria', '〰️ Punti di vibrazione', '🎁 Il regalo che userà davvero'],
    blocchi: [
      ['img/ankle-4.jpg', '', 'Calore, pressione e vibrazione — tutto insieme',
       "Dentro la fascia ci sono due camere d'aria — una sul collo del piede, una sulla caviglia — che si gonfiano e si sgonfiano con un ritmo lento. Le piastre riscaldanti stanno sul lato del piede e sul tallone, e piccoli punti di vibrazione corrono lungo la pianta. Tu devi solo rilassarti."],
      ['img/ankle-3.jpg', '', 'Un pulsante, display digitale',
       "Il comando sta sul lato esterno della caviglia, così non devi mai piegarti a cercarlo. Premi, scegli l'impostazione sul display, fatto. Va benissimo sul divano, a letto prima di dormire o durante la pausa."],
      ['img/ankle-2.jpg', '', 'Si mette in pochi secondi',
       "Una fascia morbida in neoprene intorno a tallone e caviglia, dita libere, con un cinturino elastico sul davanti del piede. Taglia unica regolabile: lo indossi appena ti togli le scarpe da lavoro."],
      ['img/ankle-6.jpg', 'center 35%', 'Per chi non si siede mai',
       "Infermiere, OSS, parrucchiere, cuochi, magazzinieri, commesse e camerieri: se passi più di 10 ore in piedi, questo diventa il momento della giornata che aspetti di più. Ed è un regalo che viene usato ogni singola sera."]
    ],
    faq: [
      ['È un massaggiatore singolo o un paio?', 'Un paio: ogni ordine da "1 paio" contiene due massaggiatori, uno per caviglia.'],
      ['Va bene per il mio piede?', 'È taglia unica, con cinturino elastico e fascia flessibile in neoprene, pensata per adattarsi alla maggior parte dei piedi adulti. Le dita restano libere.'],
      ['È un dispositivo medico?', "No. È un massaggiatore per il comfort e il relax dopo le giornate passate in piedi, non una cura per nessuna patologia. Se sei in gravidanza, hai il diabete, problemi di circolazione, un pacemaker o qualsiasi condizione medica, chiedi al tuo medico prima di usarlo. Non usarlo su pelle lesa o irritata e non addormentarti con il calore acceso."],
      ['Per quanto tempo lo uso?', "Una sessione da 10-15 minuti è perfetta dopo il turno. Fai una pausa tra una sessione e l'altra e segui sempre le istruzioni nella confezione."],
      ['Posso mandarlo come regalo?', "Sì, è quello che fanno quasi tutti. Al checkout inserisci l'indirizzo di chi lo riceve e lo spediamo direttamente a lui o a lei."]
    ]
  }
};

/* stesse domande su tutte le pagine */
const FAQ_COMUNI = [
  ['Come funzionano gli sconti bundle?', `Più pezzi metti nel carrello, più risparmi su tutto: 2 pezzi -${S2}%, 3 o più -${S3}%. Si applica da solo, senza codici.`],
  ['Quanto ci mette la spedizione?', "Gli ordini vengono preparati in 1-2 giorni lavorativi, poi la consegna richiede 7-12 giorni lavorativi. La spedizione è gratuita in tutta Italia e ricevi il numero di tracciamento via email appena il pacco parte."],
  ['Resi e rimborsi', 'Puoi restituire il tuo ordine entro 14 giorni dalla consegna (diritto di recesso). Le spese di restituzione sono a carico del cliente e il rimborso arriva dopo che abbiamo ricevuto e controllato il prodotto. Tutti i dettagli in <a href="shipping.html#returns">Spedizioni e resi</a>.']
];

/* ============================================================
   PAGE PARTS
   ============================================================ */
const PM_MANCA = `<script>function pmManca(i){if(!i||i.dataset.m)return;i.dataset.m=1;i.style.display='none';var d=document.createElement('div');d.className='manca';d.innerHTML='<b>📷</b>'+(i.getAttribute('src')||'');i.parentNode.appendChild(d);}</script>`;

const ICONA = 'img/favicon.png';

function chiaro(hex) {   // very light version of the accent color, for badges
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const m = x => Math.round(x + (255 - x) * 0.88);
  return '#' + [m(r), m(g), m(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

const TOPBAR = `<div class="topbar">🚚 SPEDIZIONE GRATUITA · FINO AL -${S3}% CON I BUNDLE</div>`;

const FOOTER = `<footer>
  <div class="wrap">
    <a href="index.html">Tutti i prodotti</a>
    <a href="terms.html">Termini di vendita</a>
    <a href="privacy.html">Privacy e cookie</a>
    <a href="shipping.html">Spedizioni e resi</a>
    <a href="contact.html">Contatti</a>
    <div class="ragione">
      AfterShift · Email: ${C.email}<br>
      Prezzi in euro, IVA inclusa. I colori possono variare leggermente rispetto alle foto a seconda dello schermo.
    </div>
  </div>
</footer>`;

const ANALYTICS = `<!-- Vercel Web Analytics: visits and purchases, no cookies -->
<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
<script defer src="/_vercel/insights/script.js"></script>`;

function card(id, etichetta) {
  const p = C.prodotti[id];
  return `<a class="card" href="${p.pagina}">
      <div class="shot">${etichetta ? `<span class="etq">${etichetta}</span>` : ''}<img src="${p.foto[0]}" alt="${esc(p.nome)}" loading="lazy" onerror="pmManca(this)"></div>
      <div class="info"><span class="nm">${esc(p.nome)}</span><span class="pr">${fmt(p.prezzo)} <small>· 2 pezzi -${S2}%</small></span><span class="vai">Scopri →</span></div>
    </a>`;
}

function head({ titolo, meta, url, og, accento, tipo, prezzo }) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titolo)}</title>
<meta name="description" content="${esc(meta)}">
<meta name="theme-color" content="#0b1f3d">
<link rel="canonical" href="${url}">
<link rel="icon" href="${ICONA}">
<!-- link preview on WhatsApp, Instagram, Facebook, Telegram -->
<meta property="og:type" content="${tipo}">
<meta property="og:site_name" content="AfterShift">
<meta property="og:locale" content="it_IT">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(titolo)}">
<meta property="og:description" content="${esc(meta)}">
<meta property="og:image" content="${SITO}/${og}">
${prezzo ? `<meta property="product:price:amount" content="${(prezzo / 100).toFixed(2)}">
<meta property="product:price:currency" content="EUR">
` : ''}<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="stile.css">
${accento ? `<style>:root{--accento:${accento};--accento-chiaro:${chiaro(accento)}}</style>\n` : ''}${PM_MANCA}
</head>`;
}

/* ---------- product page ---------- */
function paginaProdotto(id) {
  const p = C.prodotti[id], t = T[id];
  const url = `${SITO}/${p.pagina}`;
  const faq = [...t.faq, ...FAQ_COMUNI];
  const altri = C.ordine.filter(x => x !== id);

  return `${head({ titolo: t.titolo, meta: t.meta, url, og: t.og || p.foto[0], accento: p.accento, tipo: 'product', prezzo: p.prezzo })}
<body data-prodotto="${id}">

${TOPBAR}

<header><a href="index.html"><img src="img/logo.png" alt="AfterShift"></a></header>

<div class="wrap">
  <section class="hero">

    <div class="gallery">
      <div class="shot principale" id="principale">
        <img id="fotoMain" src="${p.foto[0]}" alt="${esc(p.nome)}" onerror="pmManca(this)">
      </div>
      <div class="dots" id="dots"></div>
      <div class="thumbs" id="thumbs"></div>
    </div>

    <div class="info">
      <span class="badge">${t.badge}</span>
      <h1>${esc(p.nome)}</h1>
      <div class="prezzo-top">${fmt(p.prezzo)}<small>al paio · spedizione gratuita</small></div>
      <p class="sub">${t.sub}</p>

      <div class="chips">
        ${t.chips.map(c => `<div class="chip">${c}</div>`).join('\n        ')}
      </div>

      <div class="etichetta">SCEGLI IL TUO BUNDLE</div>
      <div class="offerte" id="offerte"></div>
${p.opzioni.length ? `
      <div class="etichetta">SCEGLI LE OPZIONI</div>` : ''}
      <div id="pezzi"></div>

      <div class="natale" id="natale" hidden>🎄 <span>Ordina entro <b id="natale-data"></b> per riceverlo prima di Natale</span></div>

      <button class="cta" id="compra" type="button">Aggiungi al carrello</button>

      <div class="fiducia">
        <div><b>🚚</b>Spedizione gratuita</div>
        <div><b>↩️</b>Reso entro 14 giorni</div>
        <div><b>🔒</b>Pagamento sicuro</div>
      </div>
      <div class="pagamenti"><span>VISA</span><span>Mastercard</span><span>Amex</span><span>Apple Pay</span><span>G Pay</span></div>
    </div>

  </section>
</div>

<!-- ---------- description ---------- -->
<section class="desc">
  <div class="wrap">
${t.blocchi.map(([img, pos, h, testo], i) => `    <div class="blocco${i % 2 ? ' inv' : ''}">
      <div class="media"><img src="${img}"${pos ? ` style="object-position:${pos}"` : ''} alt="${esc(h)}" loading="lazy" onerror="pmManca(this)"></div>
      <div>
        <h3>${h}</h3>
        <p>${testo}</p>
      </div>
    </div>`).join('\n')}
  </div>
</section>
${altri.length ? `
<!-- ---------- other products: pushes the bundle ---------- -->
<section class="altri">
  <div class="wrap">
    <h2>Completa il bundle: 2 pezzi -${S2}%, 3 o più -${S3}%</h2>
    <div class="griglia">
      ${altri.map(x => card(x)).join('\n      ')}
    </div>
  </div>
</section>
` : ''}
<!-- ---------- faq ---------- -->
<section class="wrap">
  <h2>Domande frequenti</h2>
${faq.map(([q, a], i) => `  <details${i ? '' : ' open'}><summary>${q}</summary><p>${a}</p></details>`).join('\n')}
</section>

${FOOTER}

<div class="sticky" id="sticky">
  <div class="p" id="prezzoSticky">${fmt(p.prezzo)}<small>1 ${p.unita[0]}</small></div>
  <button class="cta" id="compra2" type="button">Aggiungi al carrello</button>
</div>

<script src="catalogo.js"></script>
<script src="carrello.js"></script>
<script src="pagina-prodotto.js"></script>
${ANALYTICS}
<script defer src="https://pijamamania.it/ct.js" data-store="aftershift"></script>
</body>
</html>
`;
}

/* ---------- homepage ---------- */
function homepage() {
  const min = Math.min(...C.ordine.map(id => C.prodotti[id].prezzo));
  const etichette = { ankle: 'IL PIÙ VENDUTO' };
  return `${head({ titolo: 'AfterShift — Relax per chi non si siede mai', meta: `Relax dopo il turno per infermiere, parrucchiere, cuochi, magazzinieri e commesse. Spedizione gratuita in tutta Italia, -${S2}% su 2 pezzi e -${S3}% da 3 in su.`, url: SITO + '/', og: 'img/ankle-1.jpg', tipo: 'website' })}
<body>

${TOPBAR}

<header><a href="index.html"><img src="img/logo.png" alt="AfterShift"></a></header>

<section class="home-hero">
  <div class="wrap">
    <h1>Relax per chi non si siede mai</h1>
    <p>Turni da 12 ore, doppi turni, notti, 28.000 passi. AfterShift rende di nuovo bello il momento dopo il lavoro — per te, o per chi sta in piedi tutto il giorno.</p>
    <a class="cta" href="#shop">Scopri ora</a>
    <div class="bundle-box">
      <div><b>${fmt(min)}</b>a partire da</div>
      <div><b>-${S2}%</b>su 2 pezzi</div>
      <div><b>-${S3}%</b>da 3 in su</div>
    </div>
  </div>
</section>

<section class="wrap" id="shop">
  <h2>I prodotti AfterShift</h2>
  <div class="griglia">
    ${C.ordine.map(id => card(id, etichette[id])).join('\n    ')}
  </div>
</section>

<section class="altri">
  <div class="wrap">
    <h2>Perché AfterShift</h2>
    <div class="vantaggi">
      <div><span class="em">🦶</span><b>Pensato per i turni lunghi</b>Infermiere, parrucchiere, cuochi, magazzinieri e commesse: progettiamo per chi sta in piedi tutto il giorno.</div>
      <div><span class="em">🎁</span><b>2 pezzi -${S2}%, 3+ -${S3}%</b>Gli sconti bundle si applicano da soli nel carrello, senza codici.</div>
      <div><span class="em">🚚</span><b>Spedizione gratuita</b>In tutta Italia, con tracciamento via email appena il pacco parte.</div>
      <div><span class="em">💬</span><b>Persone vere</b>Scrivi a ${C.email} e ti risponde una persona vera.</div>
    </div>
  </div>
</section>

<section class="wrap">
  <h2>Domande frequenti</h2>
${FAQ_COMUNI.map(([q, a], i) => `  <details${i ? '' : ' open'}><summary>${q}</summary><p>${a}</p></details>`).join('\n')}
</section>

${FOOTER}

<script src="catalogo.js"></script>
<script src="carrello.js"></script>
${ANALYTICS}
<script defer src="https://pijamamania.it/ct.js" data-store="aftershift"></script>
</body>
</html>
`;
}

/* ---------- write files ---------- */
const scritti = [];
for (const id of C.ordine) {
  const f = C.prodotti[id].pagina;
  fs.writeFileSync(path.join(RADICE, f), paginaProdotto(id));
  scritti.push(f);
}
fs.writeFileSync(path.join(RADICE, 'index.html'), homepage());
scritti.push('index.html');
console.log('Pagine generate:\n  ' + scritti.join('\n  '));
