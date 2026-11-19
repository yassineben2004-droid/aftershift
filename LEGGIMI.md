# AfterShift — store (worldwide, inglese, USD)

Stesso motore di PijamaMania: sito statico + checkout Stripe sul nostro dominio + email di conferma dalla Gmail.

## File
| File | Cosa fa |
|---|---|
| `catalogo.js` | **Prezzi, prodotti, sconti bundle, email dello store.** Unica fonte di verità (sito + server) |
| `strumenti/genera-pagine.js` | Testi delle pagine. Dopo ogni modifica: `node strumenti/genera-pagine.js` |
| `index.html`, `heated-ankle-massager.html` | Generate dallo script (non modificarle a mano) |
| `checkout.html` / `thank-you.html` | Checkout con Stripe Payment Element, pagina di conferma |
| `api/create-payment-intent.js` | Calcola il prezzo sul server e crea il pagamento (USD) |
| `api/conferma-ordine.js` | Email di conferma al cliente + copia dell'ordine a te |
| `terms.html`, `privacy.html`, `shipping.html`, `contact.html` | Pagine legali in inglese |

## Prezzi attuali
1 paio $49.99 · 2 paia $84.98 (-15%) · 3 paia $115.48 (-23%) · spedizione gratis.

## Variabili d'ambiente su Vercel
- `STRIPE_SECRET_KEY` — la `sk_live_` dello stesso account Stripe di PijamaMania
- `GMAIL_USER` — l'email Gmail dello store AfterShift
- `GMAIL_APP_PASSWORD` — password per le app di Google (16 caratteri, senza spazi)
- `CODICE_TEST` (facoltativa) — almeno 8 caratteri: con `checkout.html?codice=<valore>` l'ordine costa $0.50

## Prima di mandare traffico
- [ ] Email vera in `catalogo.js` (`email`) + nelle pagine legali, poi rigenera
- [ ] Dominio: aggiornare `SITO` in `strumenti/genera-pagine.js` e `api/conferma-ordine.js`
- [ ] Stripe: Apple Pay / Google Pay → registrare il dominio in Payment method domains
- [ ] Confermare col fornitore: livelli di calore, ricarica/batteria, cosa c'è nella scatola, tempi reali worldwide
- [ ] Ordine di prova con `?codice=` e controllo email
