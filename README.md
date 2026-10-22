# AgriMarket — Location-Based Agricultural Marketplace

A modern, full-stack agricultural marketplace platform built for Ethiopian agricultural commerce, connecting Farmers, Buyers, Logistics Couriers, and Wholesalers with real-time local market rates, intercity trade routes, and transparent farm-to-doorstep distribution.

---

## Architecture & Technology Stack

- **Frontend**: Next.js 16+ (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React
- **Theming**: System-aware Dark & Light theme engine with `localStorage` persistence and zero-flicker inline hydration script
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL (Neon Serverless Postgres / Local Postgres)
- **Logistics & Auth**: Telebirr / Escrow integration and OTP verification

---

## Key Features

1. **Dual Theme Engine (Dark & Light Mode)**:
   - Full support for both rich dark mode (`#0B1512` forest slate) and clean light mode (`#FAF8F5` warm ivory).
   - Instant theme toggle in navbar and mobile hamburger menu.
   - Zero-flicker early head script to prevent hydration mismatches.

2. **Professional Modular Directory Structure**:
   - `src/components/landing/`: High-performance, isolated landing page section modules:
     - `Hero.tsx`: Dynamic headline, real-time today market pricing card, and call-to-actions.
     - `ShopByCategory.tsx`: Responsive 6-category catalog with high-res imagery.
     - `HowItWorks.tsx`: 4-step farm-to-doorstep distribution process.
     - `FreshAndSeasonalProducts.tsx`: Direct farm produce catalog with interactive cart integration.
     - `CommunityImpact.tsx`: Verified metrics and impact statistics.
     - `ConnectAcrossCities.tsx`: Regional trade and logistics routes.
     - `Testimonials.tsx`: Community feedback with Lucide rating stars.
     - `CtaBanner.tsx`: Farmer and buyer onboarding banner.
   - `src/components/layout/`:
     - `Header.tsx`: Sticky responsive navbar with theme toggle and mobile menu drawer.
     - `Footer.tsx`: Comprehensive multi-column footer with Lucide contact icons.
     - `ThemeToggle.tsx`: Animated Sun/Moon switcher.
   - `src/components/cart/`:
     - `CartDrawer.tsx`: Sliding checkout drawer with item stepper and ETB currency calculation.

3. **Fully Responsive Across All Screens**:
   - **Smartphones** (< 640px): Optimized compact hamburger menu, single-column cards, touch targets.
   - **Tablets** (640px – 1024px): Balanced 2-3 column grids with responsive spacing.
   - **Desktops & Ultra-Wide** (> 1024px): Multi-column layouts, floating market cards, and expanded navigation.

4. **100% Emoji-Free, Pure Lucide React Design**:
   - All unicode emojis and text stars replaced with crisp `lucide-react` SVG vector icons (`Sprout`, `TrendingUp`, `Star`, `MapPin`, `Mail`, `Phone`, `ShoppingBag`, `Check`, etc.).

5. **Curated High-Definition Assets**:
   - All category and product images replaced with high-resolution, photorealistic agricultural photography.
   - Cleaned redundant, duplicate, and obsolete assets from `public/images/`.

---

## Project Structure

```text
Agriculture_marketplace/
├── backend/                  # Express + Prisma Backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── index.ts
│   └── prisma/
│       └── schema.prisma
│
├── frontend/                 # Next.js 16 Frontend
│   ├── public/
│   │   └── images/           # Curated HD agricultural assets
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css   # Tailwind v4 theme variables & @custom-variant dark
│   │   │   ├── layout.tsx    # Root layout with ThemeProvider & anti-flicker script
│   │   │   └── page.tsx      # Main landing page assembling modular sections
│   │   ├── components/
│   │   │   ├── cart/         # CartDrawer component
│   │   │   ├── landing/      # Dedicated landing page components
│   │   │   ├── layout/       # Header, Footer, ThemeToggle
│   │   │   └── ui/           # Core reusable UI primitives
│   │   ├── context/
│   │   │   └── ThemeContext.tsx # Global theme provider & hooks
│   │   ├── data/
│   │   │   └── marketplaceData.ts # Produce & farmer catalog data
│   │   └── types.ts          # Core TypeScript data contracts
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x+
- npm / yarn / pnpm

### 1. Installation
```bash
# Clone the repository and install dependencies
cd frontend
npm install

cd ../backend
npm install
```

### 2. Running Locally

**Start Frontend (Next.js):**
```bash
cd frontend
npm run dev
# Accessible at http://localhost:3000
```

**Start Backend (Express + Prisma):**
```bash
cd backend
npm run dev
# Accessible at http://localhost:3001
```

### 3. Production Build
```bash
cd frontend
npm run build
npm run start
```

---

## Technical Notes & Bug Fixes

### Intercept Div / Phantom Card Issue Resolution
- **Cause**: The previous background image (`stats_farm_bg_hd.png`) was cropped from a pre-rendered marketing graphic that had a white statistics card painted directly into its image pixels. When the React component placed a second dynamic HTML card on top of it, slight positional offsets revealed the background image's painted card underneath, producing an "intercepting" duplicate card artifact.
- **Solution**: The background was replaced with `stats_farm_bg_clean.jpg`—a pristine, high-resolution panoramic farm landscape containing no pre-rendered graphics or text. The React statistics card is now the single rendered card, perfectly styled for both dark and light modes with backdrop blur and responsive grid alignment.
