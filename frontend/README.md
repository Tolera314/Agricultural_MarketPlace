# AgriMarket Frontend

High-performance Next.js 16 frontend for the AgriMarket Agricultural Platform.

## Features
- **Theme Support**: Seamless Dark & Light themes with persistent preference storage and anti-flicker hydration.
- **Landing Folder Architecture**: All landing page sections are cleanly structured in `src/components/landing/`.
- **Responsive Layout**: Designed for mobile smartphones (375px+), tablets (768px+), and desktops (1024px – 1920px+).
- **Lucide React Icons**: 100% vector-based, clean SVG iconography replacing all emojis.
- **High-Definition Imagery**: Optimized photography for all 6 produce categories and featured farm goods.
- **Cart & Direct Order Drawer**: Slide-out cart with real-time ETB pricing and delivery logistics estimation.

## Available Scripts

- `npm run dev` — Starts Next.js development server on port 3000.
- `npm run build` — Compiles optimized production build with TypeScript type verification.
- `npm run start` — Runs the compiled production server.
- `npm run lint` — Runs ESLint checks.

## Folder Organization
- `src/components/landing/` — Section components (Hero, ShopByCategory, HowItWorks, FreshAndSeasonalProducts, CommunityImpact, ConnectAcrossCities, Testimonials, CtaBanner).
- `src/components/layout/` — Shared structural components (Header, Footer, ThemeToggle).
- `src/components/cart/` — CartDrawer component.
- `src/context/` — React Context providers (ThemeContext).
- `src/data/` — Marketplace mock data and location registry.
- `public/images/` — Curated agricultural photography assets.
