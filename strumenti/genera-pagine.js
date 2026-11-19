#!/usr/bin/env node
/* Builds the homepage (index.html) and the product pages from
   catalogo.js (prices, photos) + the copy below.
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
    titolo: 'Heated Ankle & Foot Massager — AfterShift',
    meta: 'Heat, air compression and vibration for tired feet after a long shift. Made for nurses, hairstylists, chefs, warehouse and retail crews. Free worldwide shipping.',
    og: 'img/ankle-1.jpg',
    badge: 'MADE FOR 12-HOUR SHIFTS 🦶',
    sub: "Slip it on after your shift and put your feet up. Two air chambers gently squeeze the top of the foot and the ankle, warm pads heat the sides of the foot and the heel, and vibration points work along the sole. Ten minutes on the couch and you feel human again.",
    chips: ['🔥 Soothing heat', '🫧 Air compression', '〰️ Vibration points', '🎁 The gift they\'ll actually use'],
    blocchi: [
      ['img/ankle-4.jpg', '', 'Heat, squeeze and vibration — all at once',
       "Inside the wrap there are two air chambers — one over the top of the foot, one on the ankle — that inflate and release in a slow rhythm. Warm pads sit along the side of the foot and the heel, and small vibration points run along the sole. You just sit back."],
      ['img/ankle-3.jpg', '', 'One button, digital display',
       "The control unit sits on the outside of the ankle, so you never have to bend down and dig for it. Press, pick your setting on the display, done. Works on the couch, in bed before sleep, or on your break."],
      ['img/ankle-2.jpg', '', 'Slips on in seconds',
       "A soft neoprene wrap around the heel and ankle, toes free, with an elastic strap across the front of the foot. One size with an adjustable fit, so you can wear it right after you kick your work shoes off."],
      ['img/ankle-6.jpg', 'center 35%', 'For the ones who never sit down',
       "Nurses, hairstylists, chefs, warehouse pickers, retail and restaurant crews: if you spend 10+ hours on your feet, this is the part of the day you'll start looking forward to. And it makes a gift that gets used every single night."]
    ],
    faq: [
      ['Is it one massager or a pair?', 'A pair: every order of "1 pair" includes two massagers, one for each ankle.'],
      ['Does it fit my foot?', 'It\'s one size with an elastic strap and a flexible neoprene wrap, designed to fit most adult feet. The toes stay free.'],
      ['Is it a medical device?', 'No. It\'s a comfort massager for relaxing after long days on your feet, not a treatment for any condition. If you are pregnant, have diabetes, circulation problems, a pacemaker or any medical condition, ask your doctor before using it. Don\'t use it on broken or irritated skin, and don\'t fall asleep with the heat on.'],
      ['How long should I use it?', 'A session of 10-15 minutes is perfect after a shift. Take a break between sessions and always follow the instructions in the box.'],
      ['Can I send it as a gift?', 'Yes — that\'s what most people do. Enter the recipient\'s address at checkout and it ships straight to them.']
    ]
  }
};

/* same questions on every page */
const FAQ_COMUNI = [
  ['How do bundle discounts work?', `The more you add to your cart, the more you save on everything: 2 items ${S2}% off, 3 or more ${S3}% off. It applies automatically, no code needed.`],
  ['How long does shipping take?', 'Orders are processed in 1-2 business days, then delivery takes 7-12 business days. Shipping is free worldwide and you get a tracking number by email as soon as your order ships.'],
  ['Returns and refunds', 'You can return your order within 14 days of delivery. Return shipping is paid by the customer and the refund is issued once we receive and check the item. Full details in <a href="shipping.html#returns">Shipping & Returns</a>.']
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

const TOPBAR = `<div class="topbar">🚚 FREE SHIPPING · SAVE UP TO ${S3}% ON BUNDLES</div>`;

const FOOTER = `<footer>
  <div class="wrap">
    <a href="index.html">Shop all</a>
    <a href="terms.html">Terms of Sale</a>
    <a href="privacy.html">Privacy & Cookies</a>
    <a href="shipping.html">Shipping & Returns</a>
    <a href="contact.html">Contact</a>
    <div class="ragione">
      AfterShift · Email: ${C.email}<br>
      Prices in US dollars. Colors may vary slightly from the photos depending on your screen.
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
      <div class="info"><span class="nm">${esc(p.nome)}</span><span class="pr">${fmt(p.prezzo)} <small>· 2 items -${S2}%</small></span><span class="vai">Shop now →</span></div>
    </a>`;
}

function head({ titolo, meta, url, og, accento, tipo, prezzo }) {
  return `<!DOCTYPE html>
<html lang="en">
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
<meta property="og:locale" content="en_US">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(titolo)}">
<meta property="og:description" content="${esc(meta)}">
<meta property="og:image" content="${SITO}/${og}">
${prezzo ? `<meta property="product:price:amount" content="${(prezzo / 100).toFixed(2)}">
<meta property="product:price:currency" content="USD">
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
      <div class="prezzo-top">${fmt(p.prezzo)}<small>per pair · free shipping</small></div>
      <p class="sub">${t.sub}</p>

      <div class="chips">
        ${t.chips.map(c => `<div class="chip">${c}</div>`).join('\n        ')}
      </div>

      <div class="etichetta">CHOOSE YOUR BUNDLE</div>
      <div class="offerte" id="offerte"></div>
${p.opzioni.length ? `
      <div class="etichetta">CHOOSE YOUR OPTIONS</div>` : ''}
      <div id="pezzi"></div>

      <div class="natale" id="natale" hidden>🎄 <span>Order by <b id="natale-data"></b> to get it before Christmas</span></div>

      <button class="cta" id="compra" type="button">Add to cart</button>

      <div class="fiducia">
        <div><b>🚚</b>Free worldwide shipping</div>
        <div><b>↩️</b>14-day returns</div>
        <div><b>🔒</b>Secure checkout</div>
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
    <h2>Complete the bundle: 2 items -${S2}%, 3 or more -${S3}%</h2>
    <div class="griglia">
      ${altri.map(x => card(x)).join('\n      ')}
    </div>
  </div>
</section>
` : ''}
<!-- ---------- faq ---------- -->
<section class="wrap">
  <h2>FAQ</h2>
${faq.map(([q, a], i) => `  <details${i ? '' : ' open'}><summary>${q}</summary><p>${a}</p></details>`).join('\n')}
</section>

${FOOTER}

<div class="sticky" id="sticky">
  <div class="p" id="prezzoSticky">${fmt(p.prezzo)}<small>1 ${p.unita[0]}</small></div>
  <button class="cta" id="compra2" type="button">Add to cart</button>
</div>

<script src="catalogo.js"></script>
<script src="carrello.js"></script>
<script src="pagina-prodotto.js"></script>
${ANALYTICS}
</body>
</html>
`;
}

/* ---------- homepage ---------- */
function homepage() {
  const min = Math.min(...C.ordine.map(id => C.prodotti[id].prezzo));
  const etichette = { ankle: 'BEST SELLER' };
  return `${head({ titolo: 'AfterShift — Comfort for the ones who never sit down', meta: `Recovery comfort for nurses, hairstylists, chefs, warehouse and retail crews. Free worldwide shipping, 2 items ${S2}% off and 3+ ${S3}% off.`, url: SITO + '/', og: 'img/ankle-1.jpg', tipo: 'website' })}
<body>

${TOPBAR}

<header><a href="index.html"><img src="img/logo.png" alt="AfterShift"></a></header>

<section class="home-hero">
  <div class="wrap">
    <h1>Comfort for the ones who never sit down</h1>
    <p>Twelve-hour shifts, double shifts, 28,000 steps. AfterShift makes the part of the day after work feel good again — for you, or for someone who's on their feet all day.</p>
    <a class="cta" href="#shop">Shop now</a>
    <div class="bundle-box">
      <div><b>${fmt(min)}</b>from</div>
      <div><b>-${S2}%</b>on 2 items</div>
      <div><b>-${S3}%</b>on 3 or more</div>
    </div>
  </div>
</section>

<section class="wrap" id="shop">
  <h2>Shop AfterShift</h2>
  <div class="griglia">
    ${C.ordine.map(id => card(id, etichette[id])).join('\n    ')}
  </div>
</section>

<section class="altri">
  <div class="wrap">
    <h2>Why AfterShift</h2>
    <div class="vantaggi">
      <div><span class="em">🦶</span><b>Made for long shifts</b>Nurses, stylists, chefs, warehouse and retail crews: we design for people who stand all day.</div>
      <div><span class="em">🎁</span><b>2 items -${S2}%, 3+ -${S3}%</b>Bundle discounts apply automatically in your cart, no codes.</div>
      <div><span class="em">🚚</span><b>Free worldwide shipping</b>With tracking by email as soon as your order ships.</div>
      <div><span class="em">💬</span><b>Real humans</b>Write to ${C.email} and a real person gets back to you.</div>
    </div>
  </div>
</section>

<section class="wrap">
  <h2>FAQ</h2>
${FAQ_COMUNI.map(([q, a], i) => `  <details${i ? '' : ' open'}><summary>${q}</summary><p>${a}</p></details>`).join('\n')}
</section>

${FOOTER}

<script src="catalogo.js"></script>
<script src="carrello.js"></script>
${ANALYTICS}
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
console.log('Pages generated:\n  ' + scritti.join('\n  '));
