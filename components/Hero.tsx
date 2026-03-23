import React from 'react';
import { ArrowRight } from 'lucide-react';
import Reveal from './Reveal';
import FloorPlan3D from './FloorPlan3D';
import BookStudioCta from './BookStudioCta';

interface HeroProps {
  onOpenBooking: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOpenBooking }) => {
  const handleScrollToProcess = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('solution');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header id="top" className="relative min-h-screen flex flex-col justify-center pt-36 md:pt-32 lg:pt-20 overflow-x-hidden overflow-y-visible bg-white">
      {/* Precision Grid Background */}
      <div className="absolute inset-0 z-0 opacity-100 architectural-grid pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-16">
          <div className="max-w-3xl flex-1 w-full">
            <Reveal priority>
              <h1 className="font-sans text-5xl md:text-7xl lg:text-[90px] font-black leading-[0.88] tracking-bauhaus mb-12 text-black">
                SEE YOUR <br /> 
                <span className="text-bauhaus-blue">PLANS</span> AT <br />
                <span className="relative inline-block">
                  <span className="relative z-10 text-bauhaus-red italic">LIFE SIZE.</span>
                  <span className="absolute bottom-2 left-0 w-full h-4 md:h-8 bg-bauhaus-yellow/40 -z-0"></span>
                </span>
              </h1>
            </Reveal>

            <Reveal priority delay={140}>
              <p className="max-w-xl text-lg md:text-xl font-light text-gray-500 mb-16 leading-relaxed border-l border-black/10 pl-8">
                Turn abstract floor plans into walkable realities. Experience the flow, proportions, and light of your space before construction begins.
              </p>
            </Reveal>

            <Reveal priority delay={280} className="flex flex-col sm:flex-row flex-wrap gap-6 sm:gap-8 items-center w-full sm:w-auto">
              <BookStudioCta onOpenBooking={onOpenBooking} className="w-full sm:w-auto" />
              <a
                href="#solution"
                onClick={handleScrollToProcess}
                className="group flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-architect hover:text-bauhaus-red transition-all py-4 sm:py-0"
              >
                HOW IT WORKS <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Reveal>
          </div>

          {/* Scale keeps the isometric floor inside the frame (3D rotation paints wider than 450px layout) */}
          <div className="w-full flex-1 relative min-w-0 flex justify-center lg:justify-end px-1 sm:px-2">
            <div className="origin-center scale-[0.68] sm:scale-[0.76] md:scale-[0.82] lg:scale-[0.88] xl:scale-92 2xl:scale-95">
              <Reveal variant="image" priority delay={420}>
                <FloorPlan3D />
              </Reveal>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle Scroll Hint */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-10 hidden sm:flex">
        <div className="w-[1px] h-12 bg-black"></div>
      </div>
    </header>
  );
};

export default Hero;