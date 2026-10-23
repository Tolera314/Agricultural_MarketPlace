# AgriMarket — Location-Based Agricultural Marketplace

> **A modern, full-stack agricultural marketplace built for Ethiopian agricultural commerce.**

AgriMarket connects **Farmers, Buyers, Logistics Couriers, and Wholesalers** through a unified digital marketplace designed around local agricultural commerce.

The platform brings together **real-time local market rates, intercity trade routes, transparent farm-to-doorstep distribution, and a modern responsive shopping experience** to make agricultural trade more accessible, organized, and efficient.

---

## Overview

AgriMarket is designed to create a connected agricultural ecosystem where users can discover fresh produce, explore market categories, understand current market pricing, connect across cities, and participate in a transparent farm-to-doorstep distribution process.

### Core Marketplace Ecosystem

| Role                   | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| **Farmers**            | Showcase and sell agricultural products directly        |
| **Buyers**             | Discover and purchase fresh agricultural produce        |
| **Logistics Couriers** | Support farm-to-doorstep and intercity delivery         |
| **Wholesalers**        | Participate in larger-scale agricultural commerce       |
| **Marketplace**        | Connect participants through a unified digital platform |

---

# Architecture & Technology Stack

AgriMarket follows a modern full-stack architecture designed for scalability, maintainability, and responsive user experiences.

### Frontend

- **Next.js 16+** — App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Lucide React**

### Theming

- System-aware **Dark & Light Mode**
- `localStorage` theme persistence
- Zero-flicker inline hydration script
- Responsive theme controls for desktop and mobile navigation

### Backend

- **Node.js**
- **Express**
- **TypeScript**
- **Prisma ORM**

### Database

- **PostgreSQL**
- Neon Serverless Postgres
- Local PostgreSQL support

### Logistics & Authentication

- **Telebirr / Escrow integration**
- **OTP verification**
- Agricultural logistics and delivery workflows

---

# Key Features

## 1. Dual Theme Engine — Dark & Light Mode

AgriMarket provides a complete theme system designed to deliver a consistent visual experience across the entire application.

### Dark Mode

Uses a rich forest-slate visual foundation:

```text
#0B1512
```

### Light Mode

Uses a clean warm-ivory foundation:

```text
#FAF8F5
```

### Theme Capabilities

- Instant theme switching
- Navbar theme toggle
- Mobile hamburger-menu theme toggle
- Persistent `localStorage` preference
- System-aware theme detection
- Zero-flicker early head script
- Protection against hydration mismatches

---

# 2. Professional Modular Directory Structure

The frontend is organized into isolated, reusable modules that make the application easier to maintain, extend, and scale.

## Landing Page Components

Located under:

```text
frontend/src/components/landing/
```

### `Hero.tsx`

The primary landing-page hero section featuring:

- Dynamic headline
- Today's market pricing card
- Primary call-to-action
- Secondary call-to-action

### `ShopByCategory.tsx`

Responsive agricultural category discovery featuring:

- Six marketplace categories
- High-resolution imagery
- Responsive category cards

### `HowItWorks.tsx`

A four-step explanation of the:

```text
Farm → Marketplace → Logistics → Doorstep
```

distribution process.

### `FreshAndSeasonalProducts.tsx`

Direct farm produce discovery with:

- Seasonal product listings
- Product cards
- Interactive cart integration

### `CommunityImpact.tsx`

Community and marketplace impact section featuring:

- Verified metrics
- Impact statistics
- Agricultural marketplace achievements

### `ConnectAcrossCities.tsx`

Regional marketplace connectivity featuring:

- Intercity trade
- Regional routes
- Logistics connections

### `Testimonials.tsx`

Community feedback section using:

- Customer testimonials
- Lucide-based rating icons
- Responsive testimonial layouts

### `CtaBanner.tsx`

Dedicated onboarding call-to-action for:

- Farmers
- Buyers
- Marketplace participants

---

# 3. Application Layout Components

Located under:

```text
frontend/src/components/layout/
```

### `Header.tsx`

A responsive sticky navigation system featuring:

- Desktop navigation
- Mobile navigation drawer
- Theme toggle
- Responsive layout behavior

### `Footer.tsx`

A comprehensive multi-column footer featuring:

- Navigation links
- Marketplace information
- Contact information
- Lucide contact icons

### `ThemeToggle.tsx`

Animated theme switcher using:

- Sun icon
- Moon icon
- Smooth transitions
- Dark/light state synchronization

---

# 4. Shopping Cart

Located under:

```text
frontend/src/components/cart/
```

### `CartDrawer.tsx`

A responsive sliding cart and checkout interface featuring:

- Add/remove products
- Quantity stepper
- Cart item management
- ETB currency calculations
- Sliding drawer interaction

---

# 5. Fully Responsive Across All Screens

AgriMarket is designed to provide a consistent experience across smartphones, tablets, desktops, and ultra-wide displays.

### Smartphones

```text
< 640px
```

Optimized for:

- Compact hamburger navigation
- Single-column layouts
- Touch-friendly controls
- Responsive product cards
- Mobile-first spacing

### Tablets

```text
640px – 1024px
```

Designed around:

- Balanced 2–3 column grids
- Responsive spacing
- Flexible navigation
- Optimized content density

### Desktops & Ultra-Wide Displays

```text
> 1024px
```

Provides:

- Multi-column layouts
- Expanded navigation
- Floating market cards
- Larger content areas
- Enhanced visual hierarchy

---

# 6. 100% Emoji-Free Lucide React Design

The interface follows a clean, professional visual language without relying on Unicode emojis or text-based symbols.

Instead, the application uses crisp **Lucide React SVG icons**, including:

```text
Sprout
TrendingUp
Star
MapPin
Mail
Phone
ShoppingBag
Check
```

This provides:

- Consistent iconography
- Scalable SVG graphics
- Cleaner visual hierarchy
- Professional UI presentation
- Better cross-platform consistency

---

# 7. Curated High-Definition Assets

The marketplace uses curated agricultural imagery throughout the interface.

### Asset Improvements

- High-resolution agricultural photography
- Photorealistic category imagery
- Photorealistic product imagery
- Clean visual presentation
- Removed redundant assets
- Removed duplicate assets
- Removed obsolete assets

Primary image location:

```text
frontend/public/images/
```

---

# Project Structure

```text
Agriculture_marketplace/
│
├── backend/                         # Express + Prisma Backend
│   │
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── index.ts
│   │
│   └── prisma/
│       └── schema.prisma
│
├── frontend/                        # Next.js 16 Frontend
│   │
│   ├── public/
│   │   └── images/                  # Curated HD agricultural assets
│   │
│   ├── src/
│   │   │
│   │   ├── app/
│   │   │   ├── globals.css         # Tailwind v4 theme variables
│   │   │   │                         # & @custom-variant dark
│   │   │   ├── layout.tsx          # Root layout, ThemeProvider
│   │   │   │                         # & anti-flicker script
│   │   │   └── page.tsx            # Main landing page
│   │   │
│   │   ├── components/
│   │   │   ├── cart/               # CartDrawer
│   │   │   ├── landing/            # Landing page components
│   │   │   ├── layout/             # Header, Footer, ThemeToggle
│   │   │   └── ui/                 # Reusable UI primitives
│   │   │
│   │   ├── context/
│   │   │   └── ThemeContext.tsx     # Global theme provider & hooks
│   │   │
│   │   ├── data/
│   │   │   └── marketplaceData.ts   # Produce & farmer catalog data
│   │   │
│   │   └── types.ts                # Core TypeScript data contracts
│   │
│   └── package.json
│
└── README.md
```

---

# Getting Started

Follow the steps below to run AgriMarket locally.

## Prerequisites

Make sure the following are installed:

- **Node.js 18.x or 20.x+**
- **npm**, **yarn**, or **pnpm**
- PostgreSQL / Neon PostgreSQL environment as required by the backend

---

## 1. Installation

Clone the repository and install dependencies for both applications.

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd ../backend
npm install
```

---

# 2. Running Locally

AgriMarket uses separate development processes for the frontend and backend.

## Start Frontend — Next.js

Open a terminal and run:

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

## Start Backend — Express + Prisma

Open a second terminal and run:

```bash
cd backend
npm run dev
```

Backend:

```text
http://localhost:3001
```

> **Important:** The frontend and backend should be running in separate terminals during local development.

---

# 3. Production Build

To create and run the production frontend build:

```bash
cd frontend
npm run build
npm run start
```

---

# Development Workflow

A typical local development setup consists of two running processes:

```text
┌──────────────────────────────────────┐
│              AgriMarket              │
├──────────────────────────────────────┤
│                                      │
│  Frontend                            │
│  Next.js + React + TypeScript        │
│  http://localhost:3000               │
│                                      │
│              ↕ API                   │
│                                      │
│  Backend                             │
│  Node.js + Express + Prisma          │
│  http://localhost:3001               │
│                                      │
│              ↕                       │
│                                      │
│  PostgreSQL                          │
│  Neon / Local PostgreSQL             │
│                                      │
└──────────────────────────────────────┘
```

---

# Technical Notes & Bug Fixes

## Intercept Div / Phantom Card Issue Resolution

### Problem

A duplicate statistics card appeared in the landing-page interface.

The issue was caused by the previous background image:

```text
stats_farm_bg_hd.png
```

The image had originally been cropped from a pre-rendered marketing graphic that contained a **white statistics card directly inside the image pixels**.

At the same time, the React component rendered a second dynamic HTML statistics card.

Because the positioning of the background image and HTML component could differ slightly across screen sizes, the underlying card embedded in the image became visible beneath the actual React component.

This resulted in an unwanted:

```text
"intercepting" / duplicate card
```

visual artifact.

---

## Solution

The background image was replaced with:

```text
stats_farm_bg_clean.jpg
```

The new asset is a pristine, high-resolution panoramic agricultural landscape containing:

- No pre-rendered cards
- No embedded statistics
- No text
- No marketing graphics

The statistics card is now rendered **only by React**.

This provides a cleaner and more predictable component structure while allowing the statistics card to adapt correctly to:

- Dark mode
- Light mode
- Responsive layouts
- Backdrop blur
- Grid alignment
- Different screen sizes

---

# UI & Design Principles

AgriMarket follows a design approach centered around:

### Clean Visual Hierarchy

Important marketplace information is given clear visual priority.

### Responsive Design

Layouts adapt naturally across mobile, tablet, desktop, and ultra-wide screens.

### Modular Components

UI sections are isolated into reusable components for easier maintenance.

### Consistent Iconography

Lucide React provides a unified SVG icon system throughout the interface.

### Agricultural Identity

Colors, photography, typography, and content structure reinforce the agricultural marketplace purpose.

### Accessible Interaction

Controls, navigation elements, cards, and touch targets are designed for intuitive interaction across devices.

---

# Marketplace Experience

The overall user journey is designed around a simple agricultural commerce flow:

```text
Discover
   ↓
Explore Categories
   ↓
View Fresh & Seasonal Products
   ↓
Add Products to Cart
   ↓
Review ETB Pricing
   ↓
Connect With Marketplace
   ↓
Farm-to-Doorstep Distribution
```

---

# Current Platform Focus

AgriMarket focuses on building a connected agricultural marketplace around:

- Local agricultural commerce
- Real-time market pricing
- Fresh and seasonal produce
- Farmer-to-buyer connections
- Intercity trade
- Logistics coordination
- Farm-to-doorstep distribution
- Transparent marketplace interactions
- Responsive digital commerce

---

# Technology Summary

| Layer                | Technology              |
| -------------------- | ----------------------- |
| Frontend             | Next.js 16+             |
| UI                   | React 19                |
| Language             | TypeScript              |
| Styling              | Tailwind CSS v4         |
| Icons                | Lucide React            |
| Backend              | Node.js + Express       |
| ORM                  | Prisma                  |
| Database             | PostgreSQL              |
| Database Hosting     | Neon / Local PostgreSQL |
| Authentication       | OTP Verification        |
| Payments / Logistics | Telebirr / Escrow       |
| Currency             | ETB                     |

---

# AgriMarket

**Connecting Ethiopian agriculture with modern digital commerce.**

A location-based marketplace designed to bring **farmers, buyers, wholesalers, and logistics providers** together through a unified, responsive, and transparent agricultural commerce platform.
