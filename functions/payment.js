// Vérification métier indépendante du SDK Stripe, testable sans secret.
function eligibleSession(session, paymentLink) {
  return Boolean(paymentLink && session.payment_link === paymentLink.id
    && paymentLink.url === 'https://buy.stripe.com/aFa00j4EG4aX3PEgkr8so01'
    && session.mode === 'payment' && session.payment_status === 'paid'
    && session.currency === 'eur' && session.amount_total === 499
    && typeof session.client_reference_id === 'string'
    && /^[A-Za-z0-9_-]{1,128}$/.test(session.client_reference_id));
}
module.exports = { eligibleSession };
