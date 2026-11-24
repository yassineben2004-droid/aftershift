// Manda la mail di conferma al cliente (e una copia dell'ordine a te)
// dalla tua Gmail, senza usare le ricevute di Stripe.
//
// La chiama grazie.html dopo il pagamento. Prima di spedire qualsiasi cosa
// chiede a Stripe se il pagamento è davvero riuscito, e segna l'ordine come
// "email inviata" così ricaricare la pagina non manda la mail due volte.
//
// Variabili d'ambiente su Vercel:
//   STRIPE_SECRET_KEY   (c'è già)
//   GMAIL_USER          l'email Gmail dello store AfterShift
//   GMAIL_APP_PASSWORD  password per le app di Google (16 caratteri)

const Stripe = require('stripe');
const nodemailer = require('nodemailer');
const EMAIL_STORE = require('../catalogo.js').email;   // indirizzo pubblico (alias del dominio)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SITO = 'https://aftershiftstore.shop';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
  c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const euro = require('../catalogo.js').fmt;   // 69,90 €

function mailCliente({ numero, nome, prodotto, variante, qta, totale, indirizzo, articoli }){
  const riga = (a, b) => `<tr><td style="padding:8px 0;color:#5b6b82">${a}</td><td style="padding:8px 0;text-align:right;color:#0b1b33;font-weight:600">${b}</td></tr>`;
  const html = `
<div style="background:#eef3f9;padding:24px 12px;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden">
    <div style="background:#07152e;padding:22px;text-align:center">
      <img src="${SITO}/img/logo.png" alt="AfterShift" height="32" style="height:32px;width:auto">
    </div>
    <div style="padding:28px 24px">
      <h1 style="margin:0 0 10px;font-size:22px;color:#0b1b33">Grazie${nome ? ' ' + esc(nome) : ''}! Il tuo ordine è confermato 🎉</h1>
      <p style="margin:0 0 20px;color:#5b6b82;font-size:15px;line-height:1.5">
        Abbiamo ricevuto il pagamento. Appena il pacco parte ti scriviamo di nuovo con il numero di tracciamento.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14.5px;border-top:1px solid #e3e9f1;border-bottom:1px solid #e3e9f1">
        ${riga('Numero ordine', esc(numero))}
        ${articoli.length
          ? articoli.map((a, i) => riga(articoli.length > 1 ? 'Articolo ' + (i + 1) : 'Articolo', esc(a))).join('')
          : riga('Prodotto', esc(prodotto)) + riga('Dettagli', esc(variante))}
        ${riga('Quantità', esc(qta))}
        ${riga('Spedizione', 'Gratuita')}
        ${riga('<b style="color:#0b1b33">Totale pagato</b>', '<b>' + esc(totale) + '</b>')}
      </table>
      <p style="margin:20px 0 4px;font-size:13px;color:#5b6b82;font-weight:700;letter-spacing:.5px">SPEDIZIONE A</p>
      <p style="margin:0;font-size:14.5px;color:#0b1b33;line-height:1.5">${indirizzo.map(esc).join('<br>')}</p>
      <p style="margin:24px 0 0;font-size:13.5px;color:#5b6b82;line-height:1.5">
        Domande o qualcosa da correggere? Rispondi a questa email: la legge una persona vera.
      </p>
    </div>
  </div>
  <p style="text-align:center;font-size:12px;color:#8a99ad;margin:16px 0 0">AfterShift · ${esc(EMAIL_STORE)}</p>
</div>`;
  const text =
`Grazie${nome ? ' ' + nome : ''}! Il tuo ordine è confermato.

Numero ordine: ${numero}
${articoli.length ? articoli.map((a, i) => '- ' + a).join('\n') : 'Prodotto: ' + prodotto + '\nDettagli: ' + variante}
Quantità: ${qta}
Spedizione: gratuita
Totale pagato: ${totale}

Spedizione a:
${indirizzo.join('\n')}

Appena il pacco parte ti mandiamo il numero di tracciamento.
Domande? Rispondi pure a questa email.

AfterShift`;
  return { html, text };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ errore: 'Metodo non consentito' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const id = String(body.id || '');
  if (!/^pi_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ errore: 'Ordine non valido' });

  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(id);
  } catch (err) {
    return res.status(404).json({ errore: 'Ordine non trovato' });
  }

  if (pi.status !== 'succeeded') return res.status(200).json({ inviata: false, motivo: 'pagamento non riuscito' });
  if (pi.metadata && pi.metadata.email_inviata === 'si') return res.status(200).json({ inviata: true, gia: true });
  if (!pi.receipt_email) return res.status(200).json({ inviata: false, motivo: 'email cliente mancante' });

  // segno subito l'ordine, così due richieste ravvicinate non mandano due mail
  await stripe.paymentIntents.update(id, { metadata: { email_inviata: 'si' } });

  const m = pi.metadata || {};
  const s = pi.shipping || {};
  const a = s.address || {};
  const dati = {
    numero: 'AS-' + id.slice(-8).toUpperCase(),
    nome: (s.name || '').split(' ')[0],
    prodotto: m.prodotto || 'AfterShift',
    variante: m.taglia_nome || '',
    qta: m.qta || '1',
    articoli: Object.keys(m).filter(k => /^articolo_\d+$/.test(k))
      .sort((a, b) => +a.split('_')[1] - +b.split('_')[1]).map(k => m[k]),
    totale: euro(pi.amount),
    indirizzo: [s.name, a.line1, a.line2, [a.city, a.state, a.postal_code].filter(Boolean).join(', '), a.country, s.phone ? 'Tel. ' + s.phone : '']
      .filter(Boolean)
  };

  const posta = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
  });

  try {
    const { html, text } = mailCliente(dati);
    await posta.sendMail({
      from: `"AfterShift" <${process.env.GMAIL_USER}>`,
      to: pi.receipt_email,
      replyTo: EMAIL_STORE,
      subject: `Ordine ${dati.numero} confermato 🎉`,
      html, text
    });

    // copia per te, con tutto quello che serve per evadere l'ordine
    await posta.sendMail({
      from: `"AfterShift Ordini" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: pi.receipt_email,
      subject: `🛒 Nuovo ordine ${dati.numero} — ${dati.qta} pz — ${dati.totale}`,
      text:
`Nuovo ordine ${dati.numero}

${dati.articoli.length ? dati.articoli.map(a => '- ' + a).join('\n') : dati.prodotto + '\nTaglia: ' + dati.variante}
Quantità: ${dati.qta}
Sconto: ${m.sconto_applicato || '0%'}
Totale incassato: ${dati.totale}

Cliente: ${pi.receipt_email}
Spedire a:
${dati.indirizzo.join('\n')}

Pagamento Stripe: ${id}`
    });

    return res.status(200).json({ inviata: true });
  } catch (err) {
    console.error('Errore invio email:', err);
    // tolgo il segno, così ricaricando la pagina si può riprovare
    await stripe.paymentIntents.update(id, { metadata: { email_inviata: '' } }).catch(() => {});
    return res.status(500).json({ inviata: false, motivo: 'invio non riuscito' });
  }
};
