import express from 'express';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_sandbox', {
  apiVersion: '2023-10-16' as any,
});

app.use(express.json());

// 0. Interactive Preview UI for Build Lab
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stripe Client Workflow — Build Lab Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#050811] text-gray-200 min-h-screen p-6 font-sans">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between border-b border-gray-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-lg">
          SCW
        </div>
        <div>
          <h1 class="text-lg font-bold text-white tracking-tight">Stripe Client Workflow Integration</h1>
          <p class="text-xs text-gray-400 font-mono">Port: ${port} • Automated Onboarding & Checkout</p>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        ONLINE
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="p-5 rounded-2xl bg-[#0a0e1a] border border-gray-800 space-y-3 shadow-xl">
        <h2 class="text-sm font-bold text-white">Create Client Checkout Session</h2>
        <p class="text-xs text-gray-400">Initiate subscription onboarding flow.</p>
        <div class="space-y-2">
          <input id="email" type="email" value="client@partner.com" class="w-full bg-black/60 border border-gray-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
          <button onclick="createSession()" class="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition shadow-md">
            Generate Session (POST /api/checkout/create-session)
          </button>
        </div>
        <div id="sessionResult" class="p-2.5 rounded-lg bg-black/40 border border-gray-900 text-xs font-mono text-indigo-300 truncate hidden"></div>
      </div>

      <div class="p-5 rounded-2xl bg-[#0a0e1a] border border-gray-800 space-y-3 shadow-xl">
        <h2 class="text-sm font-bold text-white">Webhook Pipeline Trigger</h2>
        <p class="text-xs text-gray-400">Dispatch simulated post-payment workflow.</p>
        <div class="space-y-2">
          <button onclick="dispatchWebhook()" class="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition shadow-md">
            Trigger Webhook (POST /api/webhooks)
          </button>
        </div>
        <div id="webhookResult" class="p-2.5 rounded-lg bg-black/40 border border-gray-900 text-xs font-mono text-emerald-400 truncate hidden"></div>
      </div>
    </div>

    <div class="p-5 rounded-2xl bg-[#0a0e1a] border border-gray-800 space-y-2 shadow-xl">
      <div class="flex items-center justify-between text-xs font-mono text-gray-400 font-bold uppercase">
        <span>Workflow Live Console</span>
        <span class="text-[10px] text-gray-500">Express + Stripe</span>
      </div>
      <div id="logs" class="p-3 rounded-xl bg-black/80 border border-gray-900 font-mono text-xs text-gray-300 space-y-1 max-h-48 overflow-y-auto">
        <div class="text-gray-500">[System] Stripe Client Workflow listening on port ${port}</div>
      </div>
    </div>
  </div>

  <script>
    function addLog(msg, ok = true) {
      const logs = document.getElementById('logs');
      const div = document.createElement('div');
      div.className = ok ? 'text-emerald-400' : 'text-amber-400';
      div.innerText = '[' + new Date().toLocaleTimeString() + '] ' + msg;
      logs.appendChild(div);
      logs.scrollTop = logs.scrollHeight;
    }

    async function createSession() {
      const email = document.getElementById('email').value;
      addLog('Initiating session for ' + email + '...');
      try {
        const res = await fetch('/api/checkout/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId: 'price_test_123', clientEmail: email, successUrl: 'http://localhost/success', cancelUrl: 'http://localhost/cancel' })
        });
        const data = await res.json();
        const el = document.getElementById('sessionResult');
        el.classList.remove('hidden');
        el.innerText = JSON.stringify(data);
        addLog('Session created: ' + (data.sessionId || JSON.stringify(data)));
      } catch (err) {
        addLog('Session error: ' + err.message, false);
      }
    }

    async function dispatchWebhook() {
      addLog('Dispatching checkout.session.completed event...');
      try {
        const res = await fetch('/api/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'checkout.session.completed',
            data: { object: { id: 'cs_test_live', customer_email: 'client@partner.com' } }
          })
        });
        const data = await res.json();
        const el = document.getElementById('webhookResult');
        el.classList.remove('hidden');
        el.innerText = JSON.stringify(data);
        addLog('Webhook response: ' + JSON.stringify(data));
      } catch (err) {
        addLog('Webhook error: ' + err.message, false);
      }
    }
  </script>
</body>
</html>`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'stripe-client-workflow', status: 'ONLINE', port });
});

// Endpoint to initiate Stripe Checkout Session for client onboarding
app.post('/api/checkout/create-session', async (req, res) => {
  const { priceId, clientEmail, successUrl, cancelUrl } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || 'price_default_123',
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: clientEmail,
      success_url: successUrl || 'http://localhost/success',
      cancel_url: cancelUrl || 'http://localhost/cancel',
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    // If running in local sandbox without active Stripe API credentials, return simulated session
    res.status(200).json({
      sessionId: `cs_simulated_${Date.now()}`,
      url: 'https://checkout.stripe.com/pay/simulated_session',
      simulated: true,
      originalNote: error.message
    });
  }
});

// Stripe Webhook endpoint to handle post-payment client workflow automation
app.post('/api/webhooks', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret && sig && typeof req.body === 'string') {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err: any) {
    event = req.body;
  }

  // Handle the checkout.session.completed event
  if (event && event.type === 'checkout.session.completed') {
    const session = event.data?.object as Stripe.Checkout.Session;
    console.log(`Payment successful for customer: ${session?.customer_email || 'client'}`);
  }

  res.json({ received: true, eventType: event?.type });
});

app.listen(port, () => {
  console.log(`[stripe-client-workflow] Supervised server running on port ${port}`);
});