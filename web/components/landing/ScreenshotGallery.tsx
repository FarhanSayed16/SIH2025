'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/* ─── Image data ─────────────────────────────────────────────── */

interface GalleryItem {
  src: string;
  label: string;
}

const webScreenshots: GalleryItem[] = [
  { src: '/gallery/web/teacher-1.png', label: 'Teacher — Dashboard' },
  { src: '/gallery/web/teacher-2.png', label: 'Teacher — My Classes' },
  { src: '/gallery/web/teacher-3.png', label: 'Teacher — Class Details' },
  { src: '/gallery/web/teacher-4.png', label: 'Teacher — Scenarios' },
  { src: '/gallery/web/teacher-5.png', label: 'Teacher — Analytics' },
  { src: '/gallery/web/teacher-6.png', label: 'Teacher — Drill Management' },
  { src: '/gallery/web/teacher-7.png', label: 'Teacher — Reports' },
  { src: '/gallery/web/teacher-8.png', label: 'Teacher — Drills' },
  { src: '/gallery/web/teacher-9.png', label: 'Teacher — Scenario Builder' },
  { src: '/gallery/web/teacher-10.png', label: 'Teacher — Alerts' },
  { src: '/gallery/web/teacher-11.png', label: 'Teacher — AI Scenario' },
  { src: '/gallery/web/teacher-12.png', label: 'Teacher — Broadcast' },
  { src: '/gallery/web/admin-16.png', label: 'Admin — Dashboard' },
  { src: '/gallery/web/admin-17.png', label: 'Admin — Charts' },
  { src: '/gallery/web/admin-18.png', label: 'Admin — IoT Devices' },
  { src: '/gallery/web/admin-19.png', label: 'Admin — Analytics' },
  { src: '/gallery/web/parent-14.png', label: 'Parent — Verify Student' },
  { src: '/gallery/web/parent-15.png', label: 'Parent — Dashboard' },
];

const mobileScreenshots: GalleryItem[] = [
  { src: '/gallery/mobile/student-1.jpg', label: 'Student — Home' },
  { src: '/gallery/mobile/student-2.jpg', label: 'Student — Quick Actions' },
  { src: '/gallery/mobile/student-3.jpg', label: 'Student — Learning' },
  { src: '/gallery/mobile/student-4.jpg', label: 'Student — AI Games' },
  { src: '/gallery/mobile/student-5.jpg', label: 'Student — Ask Kavach' },
  { src: '/gallery/mobile/student-6.jpg', label: 'Student — Safety Tools' },
  { src: '/gallery/mobile/student-7.jpg', label: 'Student — Modules' },
  { src: '/gallery/mobile/student-8.jpg', label: 'Student — NDMA Modules' },
  { src: '/gallery/mobile/student-9.jpg', label: 'Student — Sign Language' },
  { src: '/gallery/mobile/student-login.jpg', label: 'Student — Login' },
  { src: '/gallery/mobile/parent-1.jpg', label: 'Parent — Mobile' },
  { src: '/gallery/mobile/parent-2.jpg', label: 'Parent — Notifications' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── Marquee row ────────────────────────────────────────────── */

function MarqueeRow({
  items,
  direction,
  kind,
  onImageClick,
}: {
  items: GalleryItem[];
  direction: 'left' | 'right';
  kind: 'web' | 'mobile';
  onImageClick: (item: GalleryItem, allItems: GalleryItem[]) => void;
}) {
  // Duplicate items for seamless infinite loop
  const doubled = [...items, ...items];
  const animClass = direction === 'left' ? 'k-marquee-left' : 'k-marquee-right';

  return (
    <div className="k-gallery-marquee-wrapper">
      <div className={`k-gallery-marquee-track ${animClass}`}>
        {doubled.map((item, idx) => (
          <div
            key={`${item.src}-${idx}`}
            className="k-gallery-item"
            onClick={() => onImageClick(item, items)}
          >
            {kind === 'web' ? (
              /* Browser frame */
              <div className="k-gallery-browser">
                <div className="k-gallery-browser-chrome">
                  <span className="k-gallery-dot" style={{ background: '#f87171' }} />
                  <span className="k-gallery-dot" style={{ background: '#fbbf24' }} />
                  <span className="k-gallery-dot" style={{ background: '#34d399' }} />
                  <span className="k-gallery-url-pill">kavach.app</span>
                </div>
                <div className="k-gallery-browser-body">
                  <img src={item.src} alt={item.label} loading="lazy" draggable={false} />
                </div>
              </div>
            ) : (
              /* Phone frame */
              <div className="k-gallery-phone">
                <img src={item.src} alt={item.label} loading="lazy" draggable={false} />
              </div>
            )}
            <p className="k-gallery-label">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Lightbox Modal ─────────────────────────────────────────── */

function Lightbox({
  activeItem,
  allItems,
  onClose,
  onChange,
}: {
  activeItem: GalleryItem;
  allItems: GalleryItem[];
  onClose: () => void;
  onChange: (item: GalleryItem) => void;
}) {
  const currentIndex = allItems.findIndex((i) => i.src === activeItem.src);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        const next = currentIndex < allItems.length - 1 ? currentIndex + 1 : 0;
        onChange(allItems[next]);
      }
      if (e.key === 'ArrowLeft') {
        const prev = currentIndex > 0 ? currentIndex - 1 : allItems.length - 1;
        onChange(allItems[prev]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [currentIndex, allItems, onClose, onChange]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = currentIndex < allItems.length - 1 ? currentIndex + 1 : 0;
    onChange(allItems[next]);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = currentIndex > 0 ? currentIndex - 1 : allItems.length - 1;
    onChange(allItems[prev]);
  };

  const isWeb = activeItem.src.includes('/web/');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl md:p-10"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:right-8 md:top-8"
      >
        <X className="h-6 w-6" />
      </button>

      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 text-white/50 transition-colors hover:bg-white/10 hover:text-white md:left-8 md:p-4"
      >
        <ChevronLeft className="h-8 w-8 md:h-10 md:w-10" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 text-white/50 transition-colors hover:bg-white/10 hover:text-white md:right-8 md:p-4"
      >
        <ChevronRight className="h-8 w-8 md:h-10 md:w-10" />
      </button>

      <div
        className="relative flex max-h-full max-w-full flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.img
          key={activeItem.src}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          src={activeItem.src}
          alt={activeItem.label}
          className={`max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl md:max-w-[80vw] ${
            isWeb ? 'object-contain' : 'w-auto max-w-[400px] object-cover'
          }`}
        />
        <motion.div
          key={`${activeItem.src}-label`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/10 px-6 py-2 text-[15px] font-medium text-white backdrop-blur-md"
        >
          {activeItem.label}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */

export default function ScreenshotGallery() {
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);
  const [activeContext, setActiveContext] = useState<GalleryItem[]>([]);

  const handleImageClick = (item: GalleryItem, allItems: GalleryItem[]) => {
    setActiveImage(item);
    setActiveContext(allItems);
  };

  return (
    <>
      <section className="k-gallery-section relative overflow-hidden">
        {/* Noise overlay */}
        <div className="k-noise pointer-events-none absolute inset-0 z-10 opacity-[0.03]" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative z-20"
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="landing-container mb-12">
            <p className="k-tag k-tag-dark">The system</p>
            <h2 className="landing-h2 text-white">See every surface in action</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-400">
              From the web console to the Android app — browse real screens across all three
              platforms: Teacher, Admin, and Student.
            </p>
          </motion.div>

          {/* Web row */}
          <motion.div variants={fadeUp}>
            <div className="mb-5 px-6 md:px-10">
              <span className="k-gallery-row-tag">
                <span className="k-gallery-row-dot" style={{ background: '#3b82f6' }} />
                Web Console
              </span>
            </div>
            <MarqueeRow
              items={webScreenshots}
              direction="left"
              kind="web"
              onImageClick={handleImageClick}
            />
          </motion.div>

          {/* Mobile row */}
          <motion.div variants={fadeUp} className="mt-12">
            <div className="mb-5 px-6 md:px-10">
              <span className="k-gallery-row-tag">
                <span className="k-gallery-row-dot" style={{ background: '#10b981' }} />
                Android App
              </span>
            </div>
            <MarqueeRow
              items={mobileScreenshots}
              direction="right"
              kind="mobile"
              onImageClick={handleImageClick}
            />
          </motion.div>
        </motion.div>
      </section>

      <AnimatePresence>
        {activeImage && (
          <Lightbox
            activeItem={activeImage}
            allItems={activeContext}
            onClose={() => setActiveImage(null)}
            onChange={setActiveImage}
          />
        )}
      </AnimatePresence>
    </>
  );
}
