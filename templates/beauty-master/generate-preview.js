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
  <title>${config.business_name} — Concept Website Preview</title>
  <style>
    :root {
      --bg: #0d0f12;
      --card-bg: #16191f;
      --card-border: #242933;
      --accent: ${config.accent_color || '#d4af37'};
      --accent-hover: #b89326;
      --text: #f0f2f5;
      --text-muted: #9ba1ad;
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
      background: #1e1b10;
      border-bottom: 1px solid rgba(212, 175, 55, 0.3);
      color: #ffd875;
      font-size: 13px;
      padding: 10px 16px;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
    .concept-badge {
      background: rgba(212, 175, 55, 0.2);
      border: 1px solid rgba(212, 175, 55, 0.4);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .container {
      max-width: 680px;
      margin: 0 auto;
      padding: 0 16px;
    }

    header.hero {
      padding: 36px 0 24px 0;
      text-align: center;
    }
    .rating-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      padding: 6px 14px;
      border-radius: 30px;
      font-size: 13px;
      color: #ffd700;
      margin-bottom: 16px;
    }
    h1.business-name {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      color: #ffffff;
    }
    p.tagline {
      font-size: 15px;
      color: var(--text-muted);
      margin-bottom: 14px;
    }
    .location-info {
      font-size: 13px;
      color: #c0c6d4;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 6px;
    }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 24px 0;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 14px;
      border-radius: 12px;
      text-align: center;
    }
    .stat-val {
      font-size: 16px;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 2px;
    }
    .stat-lbl {
      font-size: 12px;
      color: var(--text-muted);
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin: 32px 0 16px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 10px;
    }
    .section-badge {
      font-size: 12px;
      color: var(--accent);
      font-weight: 500;
    }

    .service-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .service-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.2s;
    }
    .service-card:hover {
      border-color: rgba(212, 175, 55, 0.4);
    }
    .service-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .service-name {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
    }
    .service-price {
      font-size: 16px;
      font-weight: 700;
      color: var(--accent);
      white-space: nowrap;
    }
    .service-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .service-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
    }
    .service-duration {
      font-size: 12px;
      color: #8c93a3;
    }
    .btn-select {
      background: rgba(212, 175, 55, 0.15);
      border: 1px solid rgba(212, 175, 55, 0.3);
      color: var(--accent);
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-select:hover {
      background: var(--accent);
      color: #000000;
    }

    .review-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .review-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
    }
    .review-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 13px;
    }
    .review-author {
      font-weight: 600;
      color: #ffffff;
    }
    .review-stars {
      color: #ffd700;
      font-size: 12px;
    }
    .review-text {
      font-size: 13px;
      color: #b0b7c6;
      font-style: italic;
      line-height: 1.4;
    }

    .sticky-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(13, 15, 18, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-top: 1px solid var(--card-border);
      padding: 12px 16px;
      display: flex;
      justify-content: center;
      z-index: 999;
    }
    .sticky-bar-inner {
      max-width: 680px;
      width: 100%;
      display: flex;
      gap: 12px;
    }
    .btn-action-primary {
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
    .btn-action-secondary {
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
    <span>Created for <strong>${config.business_name}</strong>. Not an official site.</span>
  </div>

  <div class="container">
    <header class="hero">
      <div class="rating-badge">
        <span>★ ${config.rating || '4.8'} / 5.0</span>
        <span style="opacity: 0.5;">•</span>
        <span>${config.review_count || 100}+ Verified Reviews</span>
      </div>
      <h1 class="business-name">${config.business_name}</h1>
      <p class="tagline">${config.tagline}</p>
      <div class="location-info">
        <span>📍 ${config.location}</span>
      </div>
    </header>

    <div class="quick-stats">
      <div class="stat-card">
        <div class="stat-val">Fast Booking</div>
        <div class="stat-lbl">1-Tap WhatsApp Request</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">Working Hours</div>
        <div class="stat-lbl">${config.operating_hours || 'Mon-Sat 9AM - 8PM'}</div>
      </div>
    </div>

    <div class="section-title">
      <span>Service & Treatment Menu</span>
      <span class="section-badge">Verified Pricing</span>
    </div>

    <div class="service-list">
      ${config.services.map(s => {
        const waMsg = encodeURIComponent(`Hello ${config.business_name}! I would like to book "${s.name}" (${config.currency_symbol || '₦'}${s.price}). Please let me know your available slots.`);
        const waLink = `https://wa.me/${config.whatsapp_number}?text=${waMsg}`;
        return `
        <div class="service-card">
          <div class="service-top">
            <div class="service-name">${s.name}</div>
            <div class="service-price">${config.currency_symbol || '₦'}${s.price}</div>
          </div>
          <div class="service-desc">${s.description || ''}</div>
          <div class="service-meta">
            <span class="service-duration">⏱ ${s.duration}</span>
            <a href="${waLink}" class="btn-select" target="_blank">Book Service →</a>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="section-title">
      <span>Verified Client Reviews</span>
      <span class="section-badge">Google Verified</span>
    </div>

    <div class="review-grid">
      ${config.reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <span class="review-author">${r.author}</span>
          <span class="review-stars">${'★'.repeat(r.rating)}</span>
        </div>
        <p class="review-text">"${r.text}"</p>
      </div>`).join('')}
    </div>
  </div>

  <div class="sticky-bar">
    <div class="sticky-bar-inner">
      <a href="tel:${config.phone}" class="btn-action-secondary">📞 Call Studio</a>
      <a href="https://wa.me/${config.whatsapp_number}?text=${encodeURIComponent(`Hello ${config.business_name}! I want to book an appointment.`)}" class="btn-action-primary" target="_blank">
        💬 Book on WhatsApp
      </a>
    </div>
  </div>

</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`[SUCCESS] Generated private preview for "${config.business_name}"`);
  console.log(`[OUTPUT] ${outputPath}`);
}

const targetConfig = process.argv[2] || path.join(__dirname, 'configs', 'tej-salon.json');
generatePreview(targetConfig);
