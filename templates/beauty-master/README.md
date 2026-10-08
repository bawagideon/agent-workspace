# Beauty Master Preview Template Engine
**Architecture:** `BASE PROMPT + NICHE MODULE + PROSPECT CONFIG = PRIVATE PREVIEW`  
**Target Niche:** Hair Salons, Spas, Wellness Studios, Aesthetics & Grooming Lounges

---

## Overview
This engine enables Gideon Software Systems to generate a complete, high-converting, mobile-first private preview website for any beauty or wellness business in **under 60 seconds**.

The generated preview is:
1. **100% Standalone:** Single-file HTML/CSS/JS with zero external runtime dependencies.
2. **Mobile-First:** Tailored for 9:16 smartphone viewport browsing (common across Lagos & diaspora social traffic).
3. **Conversion Engineered:** Features 1-click WhatsApp booking routing with pre-populated message templates, verified review carousel, and service category tabs.
4. **Ethically Safeguarded:** Features the mandatory disclaimer banner:
   `"Concept Preview — Created specifically for {Business Name}. Not an official site. Private demonstration only."` with `noindex, nofollow`.

---

## Usage

### 1. Create or edit a prospect config
Create a JSON file inside `configs/` following the schema in `configs/tej-salon.json`.

### 2. Run the Generator
```bash
node generate-preview.js configs/tej-salon.json
```

The compiled preview will be generated in `output/{slug}.html`.

### 3. Deploy or Preview
Open the generated HTML directly in a browser or upload to Netlify/Vercel with password protection or private link sharing.
