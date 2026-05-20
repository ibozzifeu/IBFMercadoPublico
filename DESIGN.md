---
name: IBF Tech & Ops Design System
colors:
  ibf-white-executive: '#FFFFFF'
  ibf-white-snow: '#F7FAFC'
  ibf-charcoal-core: '#1A202C'
  ibf-midnight-boardroom: '#0A1128'
  ibf-titanium-slate: '#718096'
  ibf-precision-cobalt: '#0047AB'
  ibf-opex-emerald: '#1F7A5D'
typography:
  h1:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
spacing:
  unit: 4px
  gutter: 24px
  margin: 32px
  container-max: 1280px
---

# IBF TECH & OPS - Design System Implementation Guide

This document defines the technical implementation of the IBF Corporate Identity. All digital products, internal tools, and interfaces must adhere to these specifications.

## 1. Design Philosophy
The IBF aesthetic is governed by the fusion of two archetypes:
- **The Ruler (60%)**: Corporate weight, absolute financial control, stability.
- **The Systems Architect (40%)**: Mathematical order, scalability, structural precision.

**Visual Signature**: Clinical, transparent, structured, impeccable. Zero cognitive noise.

---

## 2. Design Tokens (CSS Variables)

Implement these tokens in the root `:root` or a global theme file. THE SYSTEM IS CLOSED. NO OTHER COLORS ARE ALLOWED.

### 2.1. Color Palette (Strict System)
```css
:root {
  /* Structure & Backgrounds */
  --ibf-white-executive: #FFFFFF; /* Master background */
  --ibf-white-snow: #F7FAFC;      /* Cards, containers, isolated sections */

  /* Typography & Anchor */
  --ibf-charcoal-core: #1A202C;   /* Body text, paragraphs, lists */
  --ibf-midnight-boardroom: #0A1128; /* H1/H2, Navbars, Footers */
  --ibf-titanium-slate: #718096;  /* Borders, dividers, metadata */

  /* Action & Data (Accents) */
  --ibf-precision-cobalt: #0047AB; /* Primary CTAs, active links, state indicators */
  --ibf-opex-emerald: #1F7A5D;    /* Success metrics, ROI, positive SLAs */
}
```

---

## 3. Typography: Inter (Google Fonts)

Only **Inter** is permitted. No alternatives.

### 3.1. Headings (C-Level Statements)
- **Font**: `Inter`
- **Weight**: Bold (700)
- **Color**: `var(--ibf-midnight-boardroom)`
- **Letter Spacing**: `-2%`

### 3.2. Body & Data
- **Font**: `Inter`
- **Weight**: Regular (400)
- **Color**: `var(--ibf-charcoal-core)`
- **Line Height**: `1.6` (160%)

---

## 4. Layout Architecture

### 4.1. Grid System
- **Swiss Grid**: 12 Columns.
- **Negative Space**: Executive White (#FFFFFF) is a functional tool. Do not saturate layouts.
- **Alignment**: **Left (Ragged Right)** only. Never justify text.
- **Container Centering**: Text blocks must be left-aligned, but the parent containers must be structured within the grid.

### 4.2. Borders & Dividers
- Use `1px` solid `var(--ibf-titanium-slate)` for tables and structural dividers.
- For isolated content containers, use `var(--ibf-white-snow)` background.
- **Border Radius**: Strictly `0px` (Sharp corners).

### 4.3. Assets Directory Structure
All multimedia files must be organized within the `assets/` directory:
- `assets/img/`: Photographic assets, logos (PNG/JPG).
- `assets/video/`: Video content and loops.
- `assets/docs/`: PDF reports and official documentation.

---

## 5. Visual Visualization (Charting)
- **Style**: Extreme minimalism.
- **Background**: Floating on `var(--ibf-white-executive)`.
- **Primary Data (Success)**: `var(--ibf-opex-emerald)`.
- **Base/Axis Information**: `var(--ibf-titanium-slate)`.
- **Typography**: Axis and legends in `var(--ibf-charcoal-core)`.
- **Shapes**: Solid lines, flat bars. No gradients or shadows.

---

## 6. Wordmark System (Logo)

The IBF identity is strictly **typographic**. No icons or symbols.

### 6.1. Horizontal Variant (Web/Official)
- **"IBF"**: Inter Bold (700), Tracking `-4%`, Color `var(--ibf-midnight-boardroom)`.
- **Vertical Divider**: `1px` solid `var(--ibf-titanium-slate)`.
- **"Tech & Ops"**: Inter Medium (500), Tracking `+10%`, Color `var(--ibf-titanium-slate)`.
- **Spacing**: Margins around divider = thickness of the "I" in IBF.

---

## 7. Prohibited Practices
- **NO** Dark Mode backgrounds (decreases corporate weight). All master backgrounds must be white.
- **NO** Overexposed stock photos.
- **NO** Full justification or center-alignment of text elements.
- **NO** Isotypes or icons in the logo signature.
- **NO** Generic Tailwind colors outside the defined tokens.
- **NO** Rounded corners (`border-radius > 0`).