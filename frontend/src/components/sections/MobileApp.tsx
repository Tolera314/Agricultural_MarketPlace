'use client';

import { motion } from 'framer-motion';
import { Phone, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function MobileApp() {
  return (
    <section className="bg-primary py-24 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 border-[40px] border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 border-[40px] border-white rounded-full translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">The Market in Your Pocket</h2>
          <p className="text-white/80 text-xl max-w-2xl mx-auto mb-16">
            Designed for simplicity. Whether you're in the field or in the kitchen, AgriMarket works wherever you are.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            <div className="text-left max-w-xs">
              <div className="text-secondary mb-4"><Phone size={32} /></div>
              <h3 className="text-xl font-bold text-white mb-2">Few Taps to Order</h3>
              <p className="text-white/70">Intuitive interface designed for everyone, regardless of tech expertise.</p>
            </div>
            <div className="w-[280px] h-[560px] bg-white rounded-[3rem] p-3 shadow-2xl relative">
               <div className="w-full h-full rounded-[2.5rem] bg-bg-warm overflow-hidden">
                  <Image src="/mobile_mockup.png" alt="App Screen" width={280} height={560} className="w-full h-full object-cover" />
               </div>
            </div>
            <div className="text-left max-w-xs">
              <div className="text-secondary mb-4"><ArrowRight size={32} /></div>
              <h3 className="text-xl font-bold text-white mb-2">Easy Navigation</h3>
              <p className="text-white/70">Smart search and categories help you find exactly what you need in seconds.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
