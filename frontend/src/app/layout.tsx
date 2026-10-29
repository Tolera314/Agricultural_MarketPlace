import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { PwaRegistrar } from '@/components/pwa/PwaRegistrar';

export const metadata: Metadata = {
  title: 'AgriMarket — Location-Based Agricultural Marketplace',
  description:
    'Discover fresh agricultural products, buy directly from verified local farmers, and enjoy reliable community delivery from farm to doorstep.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgriMarket',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'AgriMarket — Location-Based Agricultural Marketplace',
    description:
      'Discover fresh agricultural products, buy directly from verified local farmers, and enjoy reliable community delivery from farm to doorstep.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgriMarket — Location-Based Agricultural Marketplace',
    description:
      'Discover fresh agricultural products, buy directly from verified local farmers, and enjoy reliable community delivery from farm to doorstep.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#075C3B' },
    { media: '(prefers-color-scheme: dark)', color: '#07130D' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* LCP Optimization: Preload above-the-fold hero background */}
        <link rel="preload" as="image" href="/images/hero_farm_bg.jpg" fetchPriority="high" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('agrimarket-theme');
                if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:text-emerald-300">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <PwaRegistrar />
              {children}
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
