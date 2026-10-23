import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgriMarket — Location-Based Agricultural Marketplace',
  description:
    'Discover fresh agricultural products, buy directly from verified local farmers, and enjoy reliable community delivery from farm to doorstep.',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${outfit.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
