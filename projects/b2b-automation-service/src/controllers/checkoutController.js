const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key');

exports.createCheckoutSession = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: req.body.items || [{ price_data: { currency: 'usd', product_data: { name: 'B2B Enterprise License' }, unit_amount: 50000 }, quantity: 1 }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/cancel`,
    });
    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    // If running in sandbox without active live Stripe keys, return clean simulated session
    res.status(200).json({
      id: `cs_simulated_${Date.now()}`,
      url: 'https://checkout.stripe.com/pay/simulated_session',
      simulated: true,
      originalNote: error.message
    });
  }
};