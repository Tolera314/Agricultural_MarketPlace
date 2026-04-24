'use client';

import { Sprout } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full bg-bg-warm/80 backdrop-blur-xl border-b border-primary/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <Sprout size={24} />
          </div>
          <span className="text-2xl font-bold text-primary tracking-tight">AgriMarket</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
          <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
          <a href="#farmers" className="hover:text-primary transition-colors">For Farmers</a>
          <a href="#buyers" className="hover:text-primary transition-colors">For Buyers</a>
          <button className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light transition-all shadow-lg shadow-primary/20">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
