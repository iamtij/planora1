import React from 'react';
import Reveal from './Reveal';
import Logo from './Logo';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 md:py-48 bg-white relative overflow-hidden">
      {/* Decorative architectural lines */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-black/5"></div>
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/5"></div>
      <div className="absolute left-[10%] top-0 w-[1px] h-full bg-black/[0.02]"></div>
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
          <Reveal>
            <div className="relative group">
              <div className="absolute -inset-4 bg-bauhaus-yellow/5 scale-95 group-hover:scale-100 transition-transform duration-700 -z-10"></div>
              <Logo className="w-full h-auto max-w-[400px] mx-auto lg:mx-0 drop-shadow-2xl" />
              
              <div className="mt-12 grid grid-cols-3 gap-4 max-w-[400px]">
                <div className="h-1 bg-bauhaus-red"></div>
                <div className="h-1 bg-bauhaus-blue"></div>
                <div className="h-1 bg-bauhaus-yellow"></div>
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
              <div className="space-y-8">
                <p className="text-xl font-light text-gray-500 leading-relaxed">
                  Founded at the intersection of architecture and human psychology, Planorama Studios was born from a simple observation: <span className="text-black font-medium">Humans do not live in two dimensions.</span>
                </p>
                <p className="text-lg font-light text-gray-500 leading-relaxed border-l-4 border-bauhaus-red pl-8">
                  Our mission is to democratize architectural spatial awareness. By projecting blueprints at a perfect 1:1 scale, we empower homeowners and designers to reclaim the physical connection to their future environments before a single brick is laid.
                </p>
              </div>
            </Reveal>

            <Reveal delay={400}>
              <div className="flex flex-wrap gap-12 pt-8">
                <div>
                  <div className="text-3xl font-black text-black mb-1">500m²</div>
                  <div className="text-[10px] font-bold uppercase tracking-architect text-gray-400">PROJECTION FLOOR</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-black mb-1">1:1</div>
                  <div className="text-[10px] font-bold uppercase tracking-architect text-gray-400">ACCURACY RATIO</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-black mb-1">0%</div>
                  <div className="text-[10px] font-bold uppercase tracking-architect text-gray-400">SPATIAL DOUBT</div>
                </div>
              </div>
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