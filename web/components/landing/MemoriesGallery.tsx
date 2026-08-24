'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const ROW_1_IMAGES = [
  '1787544234477.JPG',
  '1787544234795.JPG',
  '1787544235037.JPG',
  '1787544235172.JPG',
  '1787544235619.JPG',
  '1787544236172.jpg',
  '1787544236358.jpg',
  '1787544236777.jpg',
  '1787544236977.jpg',
  '1787544237057.jpg',
  '1787544237187.JPG',
  '1787544237583.jpg',
  '1787544237767.jpg',
  '1787544735626.jpg',
  '1787544735733.jpg',
  '1787544735909.jpg',
  '1787544736002.jpg',
  '1787544736203.jpg',
  '1787544736303.jpg',
  '1787544736390.jpg',
  '1787544736473.jpg'
];

const ROW_2_IMAGES = [
  '1787544736549.jpg',
  '1787544736725.jpg',
  '1787544736781.JPG',
  '1787544736926.JPG',
  '1787544737208.JPG',
  '1787544737408.JPG',
  '1787544737619.JPG',
  '20251206_112240528_iOS.jpg',
  '20251206_142440679_iOS.jpg',
  '20251209_064151803_iOS.jpg',
  '20251209_131643173_iOS.jpg',
  '20251209_133437210_iOS.jpg',
  '20251209_133454989_iOS.jpg',
  '20251209_161824199_iOS.jpg',
  '20251210_052638438_iOS.jpg',
  '20251210_052816795_iOS.jpg',
  '20251210_103531772_iOS.jpg',
  '20251211_071858066_iOS.jpg',
  'IMG-20251211-WA0049.jpg',
  'IMG-20251211-WA0081.jpg',
  'Screenshot_2025-12-07-20-00-02-713_com.microsoft.teams.jpg'
];

const MarqueeRow = ({ images, reverse }: { images: string[]; reverse?: boolean }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = () => {
    setIsPressed(true);
    if (rowRef.current) {
      rowRef.current.getAnimations().forEach((anim) => {
        anim.playbackRate = 40;
      });
    }
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    if (rowRef.current) {
      rowRef.current.getAnimations().forEach((anim) => {
        anim.playbackRate = 1;
      });
    }
  };

  return (
    <div 
      ref={rowRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`ff-cursor flex w-fit items-center gap-6 py-6 select-none transition-[opacity,filter] duration-300 ease-out ${
        isPressed ? 'opacity-70 blur-[1.5px]' : 'opacity-100 blur-0'
      }`} 
      style={{ 
        animation: `marquee ${reverse ? '130s' : '120s'} linear infinite`,
        animationDirection: reverse ? 'reverse' : 'normal'
    }}>
      {/* First set of images */}
      {images.map((src, i) => (
        <div 
          key={i} 
          className="group relative h-56 sm:h-64 flex-shrink-0 overflow-hidden rounded-2xl bg-white/5 shadow-xl ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(20,184,166,0.3)] hover:ring-teal-500/50"
        >
          <img 
            src={`/memories/${src}`} 
            alt="Team Kavach Memory" 
            loading="lazy" 
            className="h-full w-auto max-w-none transition-transform duration-500 group-hover:scale-105" 
          />
        </div>
      ))}
      
      {/* Duplicated set for seamless infinite loop */}
      {images.map((src, i) => (
        <div 
          key={`dup-${i}`} 
          className="group relative h-56 sm:h-64 flex-shrink-0 overflow-hidden rounded-2xl bg-white/5 shadow-xl ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(20,184,166,0.3)] hover:ring-teal-500/50"
        >
          <img 
            src={`/memories/${src}`} 
            alt="Team Kavach Memory" 
            loading="lazy" 
            className="h-full w-auto max-w-none transition-transform duration-500 group-hover:scale-105" 
          />
        </div>
      ))}
    </div>
  );
};

export default function MemoriesGallery() {
  return (
    <section className="relative overflow-hidden bg-[var(--k-night)] py-24 sm:py-32 border-t border-white/5">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .ff-cursor {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 2px 6px rgba(0,0,0,0.8));"><polygon points="13 19 22 12 13 5 13 19"></polygon><polygon points="2 19 11 12 2 5 2 19"></polygon></svg>') 18 18, pointer;
        }
        .ff-cursor:active {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="%2314b8a6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 2px 6px rgba(0,0,0,0.8));"><polygon points="13 19 22 12 13 5 13 19"></polygon><polygon points="2 19 11 12 2 5 2 19"></polygon></svg>') 18 18, pointer;
        }
      `}} />
      
      <div className="landing-container mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Our Journey
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            Memories from the Smart India Hackathon nodal center at Chandigarh Group of Colleges (CGC Landran), Punjab.
          </p>
        </motion.div>
      </div>

      <div className="relative mx-auto flex max-w-[100vw] flex-col gap-2 overflow-hidden py-4">
        {/* Subtle gradient masks on left/right to fade the edges of the marquee */}
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 w-32 bg-gradient-to-r from-[var(--k-night)] to-transparent" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 w-32 bg-gradient-to-l from-[var(--k-night)] to-transparent" />
        
        {/* Rows */}
        <div className="-ml-24">
          <MarqueeRow images={ROW_1_IMAGES} />
        </div>
        <div className="-ml-64">
          <MarqueeRow images={ROW_2_IMAGES} reverse />
        </div>
      </div>
    </section>
  );
}
