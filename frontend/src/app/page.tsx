'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Benefits from '@/components/sections/Benefits';
import dynamic from 'next/dynamic';
import { SectionSkeleton } from '@/components/ui/Skeleton';

const HowItWorks = dynamic(() => import('@/components/sections/HowItWorks'), {
  loading: () => <SectionSkeleton minHeight="min-h-[600px]" />,
  ssr: true,
});

const UserGroups = dynamic(() => import('@/components/sections/UserGroups'), {
  loading: () => <SectionSkeleton minHeight="min-h-[500px]" />,
  ssr: true,
});

const MobileApp = dynamic(() => import('@/components/sections/MobileApp'), {
  loading: () => <SectionSkeleton minHeight="min-h-[500px]" title={false} />,
  ssr: true,
});

const Payments = dynamic(() => import('@/components/sections/Payments'), {
  loading: () => <SectionSkeleton minHeight="min-h-[500px]" />,
  ssr: true,
});

const FinalCTA = dynamic(() => import('@/components/sections/FinalCTA'), {
  loading: () => <SectionSkeleton minHeight="min-h-[400px]" title={false} />,
  ssr: true,
});

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-warm selection:bg-primary/10 selection:text-primary hero-gradient">
      <Navbar />
      
      <main>
        <Hero />
        <Benefits />
        <HowItWorks />
        <UserGroups />
        <MobileApp />
        <Payments />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
