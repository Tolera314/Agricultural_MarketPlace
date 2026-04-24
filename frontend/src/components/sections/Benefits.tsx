'use client';

import { motion } from 'framer-motion';
import { Users, ShoppingCart, Truck, ShieldCheck } from 'lucide-react';
import Card from '../ui/Card';

export default function Benefits() {
  const benefits = [
    { title: 'Direct from Farmers', desc: 'Eliminating middlemen to ensure farmers earn more and you pay less.', icon: <Users className="text-primary" /> },
    { title: 'Fair Pricing', desc: 'Transparent market rates calculated to be fair for both growers and buyers.', icon: <ShoppingCart className="text-secondary" /> },
    { title: 'Fast Local Delivery', desc: 'Harvested today, delivered tomorrow through our local fulfillment network.', icon: <Truck className="text-accent" /> },
    { title: 'Secure Payments', desc: 'Choose between digital payments or trust-based Cash on Delivery.', icon: <ShieldCheck className="text-primary" /> }
  ];

  return (
    <section className="bg-white border-y border-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold mb-6">Built on Transparency and Trust</h2>
          <p className="text-text-muted text-lg">We've removed the complexity from agricultural trade, focusing on what matters: quality and fairness.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((item, i) => (
            <Card key={i} delay={i * 0.1}>
              <div className="w-14 h-14 bg-bg-warm rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-text-muted leading-relaxed">{item.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
