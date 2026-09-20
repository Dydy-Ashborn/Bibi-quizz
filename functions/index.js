/* Bibi Quizz — webhook Stripe.
 *
 * Unique fonction serveur du projet (même principe que Bibi Love et Attention à
 * l'escalier) : un paiement ne peut pas être vérifié côté navigateur, et les règles
 * Firestore interdisent d'écrire `hosts/{uid}` depuis le client. L'Admin SDK utilisé
 * ici les contourne.
 *
 * Déploiement :
 *   cd functions && npm install
 *   firebase functions:secrets:set STRIPE_SECRET_KEY
 *   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
 *   firebase deploy --only functions
 * Puis Stripe → Développeurs → Webhooks : URL de la fonction, événement
 * `checkout.session.completed`. Endpoints et secrets sont DISTINCTS en test et en live.
 */
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

const STRIPE_SECRET  = defineSecret('STRIPE_SECRET_KEY');
const WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

const { eligibleSession } = require('./payment');
admin.initializeApp();

exports.stripeWebhook = onRequest(
  { region: 'europe-west1', secrets: [STRIPE_SECRET, WEBHOOK_SECRET], cors: false },
  async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('POST requis');
    const stripe = require('stripe')(STRIPE_SECRET.value());

    let event;
    try {
      // `req.rawBody` obligatoire : la signature porte sur les octets bruts.
      event = stripe.webhooks.constructEvent(
        req.rawBody, req.headers['stripe-signature'], WEBHOOK_SECRET.value());
    } catch (err) {
      console.error('Signature Stripe invalide :', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
      return res.status(200).send('ignoré');       // 200 : sinon Stripe réessaie en boucle
    }

    const session = event.data.object;
    const uid = session.client_reference_id;
    if (!session.payment_link) return res.status(200).send('sans lien de paiement');

    try {
      const paymentLink = await stripe.paymentLinks.retrieve(session.payment_link);
      if (!eligibleSession(session, paymentLink)) return res.status(200).send('non éligible');
      const db = admin.firestore();
      const receipt = db.doc(`stripeReceipts/${session.id}`);
      await db.runTransaction(async tx => {
        if ((await tx.get(receipt)).exists) return;
        tx.set(db.doc(`hosts/${uid}`), {
          premium: true,
          achatLe: admin.firestore.FieldValue.serverTimestamp(),
          stripeSessionId: session.id,
          montant: session.amount_total,
          devise: session.currency
        }, { merge: true });
        tx.set(receipt, { uid, eventId: event.id, at: admin.firestore.FieldValue.serverTimestamp() });
      });
      console.log('Premium accordé à', uid);
      return res.status(200).send('ok');
    } catch (err) {
      // 500 pour que Stripe REJOUE : une panne Firestore passagère ne doit pas
      // faire perdre un achat déjà encaissé.
      console.error('Écriture Firestore impossible pour', uid, err);
      return res.status(500).send('retry');
    }
  }
);
