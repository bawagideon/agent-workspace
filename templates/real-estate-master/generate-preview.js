#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function generatePreview(configPath) {
  if (!configPath) {
    console.error('Usage: node generate-preview.js <path-to-prospect-config.json>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(configPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Config file not found at: ${resolvedPath}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${config.slug}.html`);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>${config.agency_name} — Architectural Portfolio Preview</title>
  <style>
    :root {
      --bg: #090b0e;
      --card-bg: #13171f;
      --card-border: #1f2533;
      --accent: ${config.accent_color || '#c6a87d'};
      --accent-hover: #b09164;
      --text: #f0f2f5;
      --text-muted: #9aa1b0;
      --font-main: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-main);
      line-height: 1.5;
      padding-bottom: 90px;
      -webkit-font-smoothing: antialiased;
    }

    .concept-banner {
      background: #171611;
      border-bottom: 1px solid rgba(198, 168, 125, 0.3);
      color: #ebd3a7;
      font-size: 13px;
      padding: 10px 16px;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
    .concept-badge {
      background: rgba(198, 168, 125, 0.2);
      border: 1px solid rgba(198, 168, 125, 0.4);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .container {
      max-width: 760px;
      margin: 0 auto;
      padding: 0 16px;
    }

    header.agency-hero {
      padding: 36px 0 20px 0;
      text-align: center;
    }
    .corridor-pill {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      color: var(--accent);
      background: rgba(198, 168, 125, 0.1);
      border: 1px solid rgba(198, 168, 125, 0.25);
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    h1.agency-name {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin-bottom: 6px;
    }
    p.agency-tagline {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    .agency-address {
      font-size: 13px;
      color: #b5bcc9;
    }

    .currency-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 10px 16px;
      margin: 20px 0;
    }
    .currency-label {
      font-size: 13px;
      color: var(--text-muted);
    }
    .currency-options {
      display: flex;
      gap: 6px;
    }
    .cur-btn {
      background: transparent;
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
    }
    .cur-btn.active {
      background: var(--accent);
      color: #0b0d11;
      border-color: var(--accent);
    }

    .listings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 28px 0 16px 0;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 10px;
    }
    .listings-title {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
    }
    .listings-count {
      font-size: 12px;
      color: var(--accent);
    }

    .listings-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .listing-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .listing-img-box {
      width: 100%;
      height: 220px;
      position: relative;
      background: #1c212c;
    }
    .listing-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .title-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(11, 13, 17, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(198, 168, 125, 0.4);
      color: var(--accent);
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .listing-body {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .listing-price-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .listing-price {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
    }
    .listing-ref {
      font-size: 12px;
      color: var(--text-muted);
    }
    .listing-title {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.4;
    }
    .listing-loc {
      font-size: 13px;
      color: var(--text-muted);
    }
    .specs-row {
      display: flex;
      gap: 16px;
      margin: 4px 0;
      font-size: 13px;
      color: #c4cad6;
    }
    .highlights-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .highlight-tag {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--card-border);
      font-size: 11px;
      color: #a4acb9;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .listing-footer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: flex-end;
    }
    .btn-inspect {
      background: rgba(198, 168, 125, 0.15);
      border: 1px solid rgba(198, 168, 125, 0.35);
      color: var(--accent);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-inspect:hover {
      background: var(--accent);
      color: #0b0d11;
    }

    .diaspora-trust {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      margin: 32px 0 16px 0;
    }
    .trust-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 8px;
    }
    .trust-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .sticky-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(9, 11, 14, 0.95);
      backdrop-filter: blur(12px);
      border-top: 1px solid var(--card-border);
      padding: 12px 16px;
      display: flex;
      justify-content: center;
      z-index: 999;
    }
    .sticky-bar-inner {
      max-width: 760px;
      width: 100%;
      display: flex;
      gap: 12px;
    }
    .btn-broker-wa {
      flex: 2;
      background: #25d366;
      color: #ffffff;
      padding: 12px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      text-decoration: none;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
    .btn-broker-call {
      flex: 1;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: #ffffff;
      padding: 12px;
      border-radius: 10px;
      font-weight: 500;
      font-size: 14px;
      text-align: center;
      text-decoration: none;
    }
  </style>
</head>
<body>

  <div class="concept-banner">
    <span class="concept-badge">Concept Preview</span>
    <span>Architectural Catalogue for <strong>${config.agency_name}</strong>. Not an official site.</span>
  </div>

  <div class="container">
    <header class="agency-hero">
      <span class="corridor-pill">${config.corridor || 'Prime Mandates'}</span>
      <h1 class="agency-name">${config.agency_name}</h1>
      <p class="agency-tagline">${config.tagline}</p>
      <div class="agency-address">📍 ${config.location}</div>
    </header>

    <div class="currency-bar">
      <div class="currency-label">Display Currency:</div>
      <div class="currency-options">
        <button class="cur-btn active" onclick="setCurrency('NGN')">NGN (₦)</button>
        <button class="cur-btn" onclick="setCurrency('USD')">USD ($)</button>
        <button class="cur-btn" onclick="setCurrency('GBP')">GBP (£)</button>
      </div>
    </div>

    <div class="listings-header">
      <div class="listings-title">Available Verified Properties</div>
      <div class="listings-count">${config.featured_properties.length} Active Listings</div>
    </div>

    <div class="listings-grid">
      ${config.featured_properties.map(p => {
        const waMsg = encodeURIComponent(`Hello ${config.agency_name}! I would like to schedule a private inspection for "${p.title}" (Ref: ${p.ref}) listed at ₦${p.price_ngn.toLocaleString()}. Please share inspection times.`);
        const waLink = `https://wa.me/${config.whatsapp_number}?text=${waMsg}`;
        return `
        <div class="listing-card" data-price-ngn="${p.price_ngn}">
          <div class="listing-img-box">
            <img src="${p.image_url}" alt="${p.title}" class="listing-img" loading="lazy">
            <span class="title-badge">🛡 ${p.title_doc}</span>
          </div>
          <div class="listing-body">
            <div class="listing-price-row">
              <span class="listing-price price-display" data-base="${p.price_ngn}">₦${p.price_ngn.toLocaleString()}</span>
              <span class="listing-ref">Ref: ${p.ref}</span>
            </div>
            <div class="listing-title">${p.title}</div>
            <div class="listing-loc">📍 ${p.location}</div>
            <div class="specs-row">
              ${p.beds ? `<span>🛏 ${p.beds} Beds</span>` : ''}
              ${p.baths ? `<span>🛁 ${p.baths} Baths</span>` : ''}
              <span>📜 Verified Title</span>
            </div>
            <div class="highlights-list">
              ${p.highlights.map(h => `<span class="highlight-tag">${h}</span>`).join('')}
            </div>
            <div class="listing-footer">
              <a href="${waLink}" class="btn-inspect" target="_blank">Schedule Private Inspection →</a>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="diaspora-trust">
      <div class="trust-title">🛡 Diaspora Remote Due-Diligence Protocol</div>
      <div class="trust-desc">
        Every listing under mandate is independently verified for clean registered titles, boundary surveys, and zero encumbrances. We coordinate live remote video walkthroughs, surveyor second-opinions, and structured lawyer-to-lawyer escrow transfers for our UK, US, and UAE clients.
      </div>
    </div>
  </div>

  <div class="sticky-bar">
    <div class="sticky-bar-inner">
      <a href="tel:${config.phone}" class="btn-broker-call">📞 Call Broker</a>
      <a href="https://wa.me/${config.whatsapp_number}?text=${encodeURIComponent(`Hello ${config.agency_name}! I would like to inquire about your verified properties.`)}" class="btn-broker-wa" target="_blank">
        💬 Chat on WhatsApp
      </a>
    </div>
  </div>

  <script>
    const rates = {
      NGN: { symbol: '₦', mult: 1 },
      USD: { symbol: '$', mult: 0.00065 },
      GBP: { symbol: '£', mult: 0.00051 }
    };
    let currentCur = 'NGN';

    function setCurrency(cur) {
      currentCur = cur;
      document.querySelectorAll('.cur-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.startsWith(cur));
      });
      document.querySelectorAll('.price-display').forEach(el => {
        const base = parseFloat(el.getAttribute('data-base'));
        const converted = Math.round(base * rates[cur].mult);
        el.innerText = rates[cur].symbol + converted.toLocaleString();
      });
    }
  </script>

</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`[SUCCESS] Generated private preview for "${config.agency_name}"`);
  console.log(`[OUTPUT] ${outputPath}`);
}

const targetConfig = process.argv[2] || path.join(__dirname, 'configs', 'tdos-properties.json');
generatePreview(targetConfig);
