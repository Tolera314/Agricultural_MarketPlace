'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Button from '../ui/Button';

export default function FinalCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image src="/farm_bg.png" alt="Farm Background" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-warm via-transparent to-transparent" />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-6xl font-extrabold mb-8 tracking-tight">
            Ready to support <br />
            <span className="text-primary">local agriculture?</span>
          </h2>
          <p className="text-xl text-text-muted mb-12 max-w-2xl mx-auto">
            Join thousands of neighbors who are eating fresher, living healthier, and supporting the backbone of our community.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Button variant="primary" className="px-12 py-5 text-lg">Download for iOS</Button>
            <Button variant="accent" className="px-12 py-5 text-lg">Download for Android</Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
