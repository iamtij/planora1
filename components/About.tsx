import React from 'react';
import Reveal from './Reveal';
import Logo from './Logo';
import BookStudioCta from './BookStudioCta';

interface AboutProps {
  onOpenBooking: () => void;
}

const About: React.FC<AboutProps> = ({ onOpenBooking }) => {
  return (
    <section id="about" className="py-24 md:py-48 bg-white relative overflow-hidden">
      {/* Decorative architectural lines */}
      <Reveal variant="fade" className="absolute top-0 left-0 w-full pointer-events-none z-10">
        <div className="h-px w-full bg-black/5" />
      </Reveal>
      <Reveal variant="fade" className="absolute bottom-0 left-0 w-full pointer-events-none z-10">
        <div className="h-px w-full bg-black/5" />
      </Reveal>
      <div className="absolute left-[10%] top-0 w-[1px] h-full bg-black/[0.02]"></div>
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
          <Reveal variant="image" className="overflow-hidden">
            <div className="relative group">
              <div className="absolute -inset-4 bg-bauhaus-yellow/5 scale-95 group-hover:scale-100 transition-transform duration-700 -z-10"></div>
              <Logo className="w-full h-auto max-w-[400px] mx-auto lg:mx-0 drop-shadow-2xl" />
              
              <div className="mt-12 grid grid-cols-3 gap-4 max-w-[400px]">
                <div className="h-1 bg-bauhaus-yellow"></div>
                <div className="h-1 bg-bauhaus-red"></div>
                <div className="h-1 bg-bauhaus-blue"></div>
              </div>
            </div>
          </Reveal>

          <div className="space-y-12">
            <Reveal delay={200}>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-bauhaus leading-[0.9] text-black">
                WE ARE <br />
                <span className="text-bauhaus-blue italic">PLANORAMA.</span>
              </h2>
            </Reveal>

            <Reveal delay={300}>
              <div className="space-y-10">
                <div>
                  <h3 className="text-[10px] font-mono font-bold tracking-[0.45em] uppercase text-black/45 mb-4">
                    Vision
                  </h3>
                  <p className="text-xl font-light text-gray-500 leading-relaxed">
                    To redefine architectural decision-making through immersive, life-size visualization that transforms drawings into real spatial experiences.
                  </p>
                </div>
                <div className="border-l-4 border-bauhaus-red pl-8">
                  <h3 className="text-[10px] font-mono font-bold tracking-[0.45em] uppercase text-black/45 mb-4">
                    Mission
                  </h3>
                  <p className="text-lg font-light text-gray-500 leading-relaxed">
                    Planorama Studios delivers accurate full-scale projection services that empower architects, designers, and clients to elevate the design process, visualize spaces clearly, streamline planning, and achieve better-built outcomes.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={400}>
              <div className="flex flex-wrap gap-12 pt-8">
                <div>
                  <div className="text-3xl font-black text-black mb-1">12m x 12m</div>
                  <div className="text-[10px] font-bold uppercase tracking-architect text-gray-400">PROJECTION FLOOR</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-black mb-1">1:1</div>
                  <div className="text-[10px] font-bold uppercase tracking-architect text-gray-400">ACCURACY RATIO</div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={500}>
              <BookStudioCta onOpenBooking={onOpenBooking} className="mt-4 w-full sm:w-auto" />
            </Reveal>
          </div>
        </div>
      </div>

      {/* Background motif */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-bauhaus-blue opacity-[0.03] rounded-full pointer-events-none"></div>
    </section>
  );
};

export default About;