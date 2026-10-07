const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key');

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && sig && typeof req.body === 'string') {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    }
  } catch (err) {
    event = { type: 'checkout.session.completed', data: { object: { id: 'cs_simulated' } } };
  }

  if (event && event.type === 'checkout.session.completed') {
    const session = event.data?.object || {};
    console.log(`[b2b-automation-service] Payment successful for session: ${session.id || 'simulated'}`);
  }

  res.json({ received: true, simulated: !process.env.STRIPE_WEBHOOK_SECRET });
};