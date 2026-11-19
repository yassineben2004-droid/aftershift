/* ============================================================
   AFTERSHIFT CATALOG — single source of truth
   Used by the SERVER (api/create-payment-intent.js) to compute what
   the customer really pays, and by the SITE to show prices.
   Prices in CENTS, US dollars (4999 = $49.99).

   To change a price: edit here, then run `node strumenti/genera-pagine.js`
   to rebuild the product pages. Done.
   ============================================================ */
(function (root) {

const CATALOGO = {

  valuta_iso: 'usd',
  email: 'aftershift.store@gmail.com',     // ⚠️ conferma l'email vera dello store

  // bundle discount on the whole cart, based on HOW MANY items are in it
  // (any mix of products). The highest key means "or more".
  sconti: { 2: 15, 3: 23 },        // 2 items -15%, 3 or more -23%
  maxPezzi: 10,                     // max items per order

  ordine: ['ankle'],

  prodotti: {

    ankle: {
      nome: 'Heated Ankle & Foot Massager',
      breve: 'Ankle Massager (pair)',
      pagina: 'heated-ankle-massager.html',
      prezzo: 4999,
      emoji: '🦶',
      accento: '#ff6a3d',
      unita: ['pair', 'pairs'],
      foto: [1, 2, 3, 4, 5, 6, 7].map(n => 'img/ankle-' + n + '.jpg'),
      opzioni: []                     // one size, adjustable strap
    }
  }
};

/* ---------- shared helpers (same for site and server) ---------- */

CATALOGO.fmt = c => '$' + (c / 100).toFixed(2);

// discount percentage for N items
CATALOGO.scontoPer = function (n) {
  let pct = 0;
  Object.keys(CATALOGO.sconti).map(Number).sort((a, b) => a - b)
    .forEach(k => { if (n >= k) pct = CATALOGO.sconti[k]; });
  return pct;
};

// checks an item {p, ...options} and returns its price and description.
// Returns null if anything is wrong (unknown product or option).
CATALOGO.valuta = function (art) {
  const prod = art && CATALOGO.prodotti[art.p];
  if (!prod) return null;
  let prezzo = prod.prezzo;
  const parti = [];
  const scelte = {};
  for (const o of prod.opzioni) {
    const v = o.valori.find(x => x.id === String(art[o.id] == null ? o.predef : art[o.id]));
    if (!v) return null;
    scelte[o.id] = v.id;
    prezzo += v.piu || 0;
    parti.push(o.nome.toLowerCase() + ' ' + v.nome);
  }
  return { p: art.p, scelte, prezzo, nome: prod.nome, breve: prod.breve,
           dettagli: parti.length ? parti.join(', ') : '1 ' + prod.unita[0] + ' · one size' };
};

// cart total: [{p, ...options}, ...]
CATALOGO.totale = function (articoli) {
  const righe = articoli.map(CATALOGO.valuta);
  if (righe.some(r => !r)) return null;
  const pieno = righe.reduce((s, r) => s + r.prezzo, 0);
  const pct = CATALOGO.scontoPer(righe.length);
  const importo = Math.round(pieno * (100 - pct) / 100);
  return { righe, pieno, pct, importo, sconto: pieno - importo };
};

if (typeof module !== 'undefined' && module.exports) module.exports = CATALOGO;
else root.CATALOGO = CATALOGO;

})(typeof window !== 'undefined' ? window : this);
