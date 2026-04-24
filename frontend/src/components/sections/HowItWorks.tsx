'use client';

import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    { step: '01', title: 'Farmers List', desc: 'Farmers take photos and list their fresh harvest directly on the app.' },
    { step: '02', title: 'Customers Order', desc: 'Buyers browse local stock and place orders with a few simple taps.' },
    { step: '03', title: 'Local Delivery', desc: 'Our dedicated workers fulfill and deliver orders to your doorstep.' }
  ];

  return (
    <section id="how-it-works" className="bg-bg-warm relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-bold mb-6">Simple, Efficient, Direct</h2>
          <p className="text-text-muted text-lg">A three-step system designed for the speed of modern life.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-24 left-[15%] right-[15%] h-0.5 bg-primary/10 -z-0" />
          
          {steps.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="relative z-10 text-center group"
            >
              <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-8 shadow-xl shadow-primary/20 ring-8 ring-bg-warm step-number">
                {item.step}
              </div>
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-text-muted leading-relaxed max-w-[280px] mx-auto">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
