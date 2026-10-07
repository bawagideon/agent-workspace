const http = require('http');
const fs = require('fs');
const path = require('path');
const { createCheckoutSession } = require('./controllers/checkoutController');
const { handleStripeWebhook } = require('./controllers/webhookController');

const PORT = parseInt(process.env.PORT || '4102', 10);

const HTML_PREVIEW = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>B2B Automation Service — Build Lab Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#050811] text-gray-200 min-h-screen p-6 font-sans">
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-gray-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center font-black text-white text-lg shadow-lg">
          B2B
        </div>
        <div>
          <h1 class="text-lg font-bold text-white tracking-tight">B2B Workflow Automation Service</h1>
          <p class="text-xs text-gray-400 font-mono">Governed Port: ${PORT} • High-Margin Autonomous Pipe</p>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        ONLINE
      </span>
    </div>

    <!-- Interactive Test Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Checkout Creator -->
      <div class="p-5 rounded-2xl bg-[#0a0e1a] border border-gray-800 space-y-3 shadow-xl">
        <h2 class="text-sm font-bold text-white flex items-center gap-2">
          <span>Stripe Checkout Generator</span>
        </h2>
        <p class="text-xs text-gray-400">Initiate an automated B2B client onboarding checkout session.</p>
        <div class="space-y-2">
          <input id="clientEmail" type="email" placeholder="client@enterprise.com" value="procurement@acmecorp.com" class="w-full bg-black/60 border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono" />
          <button onclick="triggerCheckout()" class="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition shadow-md">
            Generate Checkout Session (POST /checkout)
          </button>
        </div>
        <div id="checkoutResult" class="p-2.5 rounded-lg bg-black/40 border border-gray-900 text-xs font-mono text-gray-400 truncate hidden"></div>
      </div>

      <!-- Webhook Dispatcher -->
      <div class="p-5 rounded-2xl bg-[#0a0e1a] border border-gray-800 space-y-3 shadow-xl">
        <h2 class="text-sm font-bold text-white flex items-center gap-2">
          <span>Webhook Simulation</span>
        </h2>
        <p class="text-xs text-gray-400">Simulate Stripe checkout.session.completed event.</p>
        <div class="space-y-2">
          <button onclick="triggerWebhook()" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shadow-md">
            Simulate Webhook Delivery (POST /webhook)
          </button>
        </div>
        <div id="webhookResult" class="p-2.5 rounded-lg bg-black/40 border border-gray-900 text-xs font-mono text-emerald-400 truncate hidden"></div>
      </div>
    </div>

    <!-- Live Event Stream Log -->
    <div class="p-5 rounded-2xl bg-[#0a0e1a] border border-gray-800 space-y-2 shadow-xl">
      <div class="flex items-center justify-between text-xs font-mono text-gray-400 font-bold uppercase">
        <span>Service Event Log Stream</span>
        <span class="text-[10px] text-gray-500">Node.js HTTP Server</span>
      </div>
      <div id="eventLogs" class="p-3 rounded-xl bg-black/80 border border-gray-900 font-mono text-xs text-gray-300 space-y-1 max-h-48 overflow-y-auto">
        <div class="text-gray-500">[System] B2B Automation Service initialized on port ${PORT}</div>
        <div class="text-gray-500">[System] Handlers registered: /checkout, /webhook, /health</div>
      </div>
    </div>
  </div>

  <script>
    function logEvent(msg, isSuccess = true) {
      const logs = document.getElementById('eventLogs');
      const div = document.createElement('div');
      div.className = isSuccess ? 'text-emerald-400' : 'text-amber-400';
      div.innerText = '[' + new Date().toLocaleTimeString() + '] ' + msg;
      logs.appendChild(div);
      logs.scrollTop = logs.scrollHeight;
    }

    async function triggerCheckout() {
      const email = document.getElementById('clientEmail').value;
      logEvent('Triggering checkout session creation for ' + email + '...');
      try {
        const res = await fetch('/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ price_data: { currency: 'usd', product_data: { name: 'B2B Enterprise License' }, unit_amount: 50000 }, quantity: 1 }]
          })
        });
        const data = await res.json();
        const resEl = document.getElementById('checkoutResult');
        resEl.classList.remove('hidden');
        resEl.innerText = JSON.stringify(data);
        logEvent('Checkout result: ' + (data.id ? 'Session ID ' + data.id : (data.error || 'Response received')));
      } catch (err) {
        logEvent('Checkout error: ' + err.message, false);
      }
    }

    async function triggerWebhook() {
      logEvent('Sending simulated checkout.session.completed webhook payload...');
      try {
        const res = await fetch('/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'checkout.session.completed',
            data: { object: { id: 'cs_test_' + Date.now(), customer_email: 'buyer@enterprise.com' } }
          })
        });
        const data = await res.json();
        const resEl = document.getElementById('webhookResult');
        resEl.classList.remove('hidden');
        resEl.innerText = JSON.stringify(data);
        logEvent('Webhook handled successfully: ' + JSON.stringify(data));
      } catch (err) {
        logEvent('Webhook error: ' + err.message, false);
      }
    }
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Interactive Preview UI at root
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML_PREVIEW);
    return;
  }

  // 2. Health endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'b2b-automation-service',
      status: 'ONLINE',
      port: PORT,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Helper response mock for controllers
  const mockRes = {
    status(code) {
      this._code = code;
      return this;
    },
    json(data) {
      res.writeHead(this._code || 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    },
    send(data) {
      res.writeHead(this._code || 200, { 'Content-Type': 'text/plain' });
      res.end(data);
    }
  };

  // 3. Checkout endpoint
  if (req.url === '/checkout' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }
      try {
        await createCheckoutSession(req, mockRes);
      } catch (err) {
        // Fallback simulated session if live Stripe keys are not provisioned
        mockRes.json({
          id: `cs_simulated_${Date.now()}`,
          url: 'https://checkout.stripe.com/pay/simulated_session',
          note: 'Simulation mode (Stripe test environment)'
        });
      }
    });
    return;
  }

  // 4. Webhook endpoint
  if (req.url === '/webhook' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = body;
      }
      try {
        await handleStripeWebhook(req, mockRes);
      } catch (err) {
        mockRes.json({ received: true, simulated: true });
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint Not Found' }));
});

server.listen(PORT, () => {
  console.log(`[b2b-automation-service] Supervised Dev Server listening on port ${PORT}`);
});
