/* ============================================================
   CATALOGO AFTERSHIFT — unica fonte di verità (mercato ITALIA dal 24/11/2026)
   Lo usa il SERVER (api/create-payment-intent.js) per calcolare quanto paga
   davvero il cliente, e il SITO per mostrare i prezzi.
   Prezzi in CENTESIMI di euro (6990 = 69,90 €).

   Per cambiare un prezzo: modifica qui, poi `node strumenti/genera-pagine.js`
   per rigenerare le pagine. Fatto.
   ============================================================ */
(function (root) {

const CATALOGO = {

  valuta_iso: 'eur',
  email: 'support@aftershiftstore.shop',

  // sconto bundle su tutto il carrello in base a QUANTI pezzi ci sono
  // (anche prodotti diversi). La chiave più alta vale "o più".
  sconti: { 2: 15, 3: 23 },        // 2 pezzi -15%, 3 o più -23%
  maxPezzi: 10,                     // massimo pezzi per ordine

  ordine: ['ankle'],

  prodotti: {

    ankle: {
      nome: 'Massaggiatore Riscaldato per Caviglie e Piedi',
      breve: 'Massaggiatore caviglie (paio)',
      pagina: 'massaggiatore-caviglie.html',
      prezzo: 6990,
      emoji: '🦶',
      accento: '#ff6a3d',
      unita: ['paio', 'paia'],
      foto: [1, 2, 3, 4, 5, 6, 7].map(n => 'img/ankle-' + n + '.jpg'),
      opzioni: []                     // taglia unica, cinturino regolabile
    }
  }
};

/* ---------- shared helpers (same for site and server) ---------- */

CATALOGO.fmt = c => (c / 100).toFixed(2).replace('.', ',') + ' €';

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
           dettagli: parti.length ? parti.join(', ') : '1 ' + prod.unita[0] + ' · taglia unica' };
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
