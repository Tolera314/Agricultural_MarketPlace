'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Button from '../ui/Button';

export default function UserGroups() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <section id="farmers" className="py-24">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-24">
        {/* Farmers */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeIn} className="order-2 lg:order-1">
            <Image src="/farmer.png" alt="Farmer" width={600} height={400} className="rounded-[2.5rem] shadow-2xl" priority />
          </motion.div>
          <motion.div {...fadeIn} className="order-1 lg:order-2">
            <span className="text-secondary font-bold uppercase tracking-widest text-sm mb-4 block">For Farmers</span>
            <h2 className="text-5xl font-bold mb-8">Sell your produce easily, keep more profit.</h2>
            <ul className="space-y-6 mb-10">
              {[
                'Zero listing fees for local farmers',
                'Direct contact with your customer base',
                'Weekly payouts and detailed sales analytics',
                'Simplified logistics through our delivery network'
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-lg text-text-muted">{text}</span>
                </li>
              ))}
            </ul>
            <Button variant="primary">Become a Seller</Button>
          </motion.div>
        </div>

        {/* Buyers */}
        <div id="buyers" className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeIn}>
            <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">For Buyers</span>
            <h2 className="text-5xl font-bold mb-8">Buy fresh, local products with confidence.</h2>
            <p className="text-xl text-text-muted mb-10 leading-relaxed">
              Experience the taste of produce that hasn't spent weeks in cold storage. Support your local community while eating healthier, fresher food.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                <h4 className="font-bold mb-2">Organic Quality</h4>
                <p className="text-text-muted text-sm">Verified local growers with high standards.</p>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                <h4 className="font-bold mb-2">Fair Value</h4>
                <p className="text-text-muted text-sm">Prices that reflect the real value of hard work.</p>
              </div>
            </div>
            <Button variant="primary">Browse Marketplace</Button>
          </motion.div>
          <motion.div {...fadeIn}>
            <Image src="/produce.png" alt="Fresh Produce" width={600} height={400} className="rounded-[2.5rem] shadow-2xl" priority />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
