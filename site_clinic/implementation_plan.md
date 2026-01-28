# Design Document & Technical Setup - OB/GYN Specialist Site (Lead Gen Focus)

This document outlines the visual design, content structure, and technical implementation for the website of **Dr. Yuval Oz**, following a **Lead Generation (Lead Collection)** strategy.

## Strategic Shift: Lead Collection

The primary objective of the site is to capture potential client interest, specifically their **phone number**, to facilitate personal medical coordination.

### Key Changes
- **Removed**: Multi-step booking accordion.
- **Added**: Fixed/Sticky sidebar contact form (always visible while scrolling).
- **Responsive-First**: Optimized for seamless transitions between Desktop (Sidebar layout) and Mobile (Integrated/Stacked layout).

## Design System

### Visual Language
- **Design Reference**: Structural principles from **Material Design** and **Chakra UI** (consistent spacing, elevation, and card-based organization).
- **Aesthetics**: Clean, medical, and trustworthy.
- **Images**: High-quality professional medical photography for each section.

### Color Palette (CSS Variables)
- **Primary (Professional Navy)**: Authority and stability.
- **Secondary (Kind Teal)**: Health and kindness.
- **Background (Soft Pearl)**: Warm and safe space.

---

## Detailed Section Design

### 1. Fixed Lead Sidebar
- **Behavior**: Sticks to the top/side on desktop as the user scrolls.
- **Fields**: Name, Phone (Required), Message.
- **Goal**: High conversion rate via minimal friction and constant visibility.

### 2. Hero Section
- **Image**: Professional portrait of **ד"ר יובל עוז**.
- **Content**: Strong H1 focusing on "Personal Excellence in OB/GYN Service".

### 3. Specialties Grid
- **Visuals**: Individual cards for Ultrasound, Fertility, and Obstetrics.
- **Each card**: High-quality imagery + brief professional description.

### 4. Professional Experience
- **Layout**: Material-style cards listing roles at Tzfat, Ichilov, MEIR Institute, etc.

---

## Technical Audit
- [x] Responsive Media Queries (Mobile vs PC).
- [x] Build settled (npm run build).
- [x] Generated image integration.

## Routing Implementation (Refactor)
### Architecture
- **Router**: React Router DOM (Browser History).
- **Structure**:
    - `Layout.tsx`: Shared Header and Footer.
    - `HomePage.tsx`: Hero, Specialties, Experience, Lead Form.
    - `ArticlePage.tsx`: Dynamic route `/articles/:id`.
- **Navigation**:
    - Update `Articles.tsx` to use `<Link to="...">` instead of onClick state.
    - Add `ScrollToTop` utility for proper navigation behavior.

### Hosting Compatibility (FTP)
- Since this is a Client-Side Router on static hosting, navigating to a sub-page and refreshing will cause a 404 error without server config.
- **Solution**: Add `.htaccess` to `public/` folder to rewrite all requests to `index.html`.
