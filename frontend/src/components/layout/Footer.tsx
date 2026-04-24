'use client';

import { Sprout } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-16">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Sprout size={20} />
            </div>
            <span className="text-xl font-bold text-primary">AgriMarket</span>
          </div>
          <p className="text-text-muted text-sm leading-relaxed mb-6">
            Building a more sustainable, direct, and fair future for agriculture.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold mb-6">Platform</h4>
          <ul className="space-y-4 text-sm text-text-muted">
            <li><a href="#" className="hover:text-primary transition-colors">Marketplace</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">For Farmers</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">For Buyers</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Delivery Fleet</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-text-muted">
            <li><a href="#" className="hover:text-primary transition-colors">Our Story</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Sustainability</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Press</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold mb-6">Support</h4>
          <ul className="space-y-4 text-sm text-text-muted">
            <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-0 mt-16 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-text-muted text-sm">© 2026 AgriMarket Inc. All rights reserved.</p>
        <div className="flex gap-6 text-text-muted">
           {/* Social icons would go here */}
        </div>
      </div>
    </footer>
  );
}
