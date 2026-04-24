'use client';

import { motion } from 'framer-motion';
import { Wallet, CreditCard } from 'lucide-react';
import Button from '../ui/Button';

export default function Payments() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <section className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeIn}>
            <h2 className="text-4xl font-bold mb-8">Transparent Payments. <br />Your Choice.</h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                  <Wallet size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Cash on Delivery</h3>
                  <p className="text-text-muted leading-relaxed">Pay only when you have the produce in your hands. We believe in building trust through physical verification.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <CreditCard size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Secure Digital Payments</h3>
                  <p className="text-text-muted leading-relaxed">Fast, secure checkout via local payment gateways. Fully encrypted and protected for your peace of mind.</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div {...fadeIn} className="p-12 bg-bg-warm rounded-[3rem] border border-primary/5 shadow-inner">
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                 <span className="font-bold">Organic Tomatoes (1kg)</span>
                 <span className="text-primary font-bold">$2.50</span>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between opacity-60">
                 <span className="font-bold">Fresh Carrots (1kg)</span>
                 <span className="text-primary font-bold">$1.80</span>
               </div>
               <div className="pt-6 border-t border-slate-200">
                 <div className="flex justify-between items-center mb-6">
                   <span className="text-xl font-bold">Total</span>
                   <span className="text-2xl font-bold text-primary">$4.30</span>
                 </div>
                 <Button variant="primary" className="w-full">Complete Payment</Button>
                 <p className="text-center text-xs text-text-muted mt-4">100% Secure Checkout Guarantee</p>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
