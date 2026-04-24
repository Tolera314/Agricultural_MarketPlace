'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Button from '../ui/Button';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-7xl font-extrabold leading-[1.1] mb-8">
            Fresh from Farmers. <br />
            <span className="text-primary">Delivered to Your Door.</span>
          </h1>
          <p className="text-xl text-text-muted mb-10 max-w-xl leading-relaxed">
            AgriMarket connects you directly with local farmers, ensuring the freshest produce at fair prices. No middlemen, no hidden costs—just honest food.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" icon={<ArrowRight size={20} />} groupHover>
              Shop Fresh Produce
            </Button>
            <Button variant="secondary">
              Sell as a Farmer
            </Button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mockup-container"
        >
          <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white max-w-[320px] mx-auto mockup-float">
            <Image 
              src="/mobile_mockup.png" 
              alt="AgriMarket App Mockup" 
              width={320} 
              height={640}
              className="w-full h-auto"
              priority={true}
            />
          </div>
          {/* Decorative elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-2xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
