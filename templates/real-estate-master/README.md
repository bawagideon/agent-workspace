# Real Estate & Boutique Short-Let Master Preview Template Engine
**Architecture:** `BASE PROMPT + NICHE MODULE + PROSPECT CONFIG = PRIVATE PREVIEW`  
**Target Niche:** Real Estate Brokerages, Boutique Short-Let Operators, Land & Villa Developers, Diaspora Property Desks

---

## Overview
This engine generates high-trust, architectural property showcase previews for real estate agencies and short-let operators in **under 60 seconds**.

The generated preview features:
1. **Curated Property Catalog:** Architectural listing cards with bedroom/bathroom counts, square meters/footage, verified legal title badges (e.g. *"Governor's Consent"*, *"Deed of Assignment"*), and verified pricing.
2. **Multi-Currency Toggle:** Real-time client-side switching between **NGN (₦)**, **USD (\$)**, and **GBP (£)**, tailored specifically for diaspora and foreign buyers.
3. **Friction-Free Inspection Funnel:** 1-tap WhatsApp inspection scheduling that pre-populates the exact property title, listing reference, and client inquiry.
4. **Ethical Safeguard Banner:**
   `"Concept Preview — Created specifically for {Business Name}. Not an official site. Private demonstration only."` with `noindex, nofollow`.

---

## Usage

### 1. Create or edit a prospect config
Create a JSON file inside `configs/` following the schema in `configs/tdos-properties.json`.

### 2. Run the Generator
```bash
node generate-preview.js configs/tdos-properties.json
```

The compiled preview will be generated in `output/{slug}.html`.

### 3. Deploy or Preview
Open the generated HTML directly in a browser or upload to Netlify/Vercel with password protection or private link sharing.
