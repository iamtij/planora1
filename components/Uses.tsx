import React from 'react';
import { Camera, Projector, Coffee } from 'lucide-react';
import Reveal from './Reveal';

const Uses: React.FC = () => {
  return (
    <section id="uses" className="py-24 md:py-40 bg-white scroll-mt-24 relative overflow-hidden">
      {/* Precision indicators */}
      <div className="absolute top-0 left-0 w-full h-[0.5px] bg-black/5"></div>
      <div className="absolute bottom-0 left-0 w-full h-[0.5px] bg-black/5"></div>
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12 mb-24 items-start">
          <Reveal className="flex-1">
            <h2 className="font-sans text-5xl md:text-7xl font-black uppercase tracking-bauhaus leading-[0.85]">
              YOUR SPACE, <br />
              <span className="text-bauhaus-red italic">ACTUAL SIZE.</span>
            </h2>
          </Reveal>
          <Reveal delay={100} className="flex-1 pt-4">
            <p className="text-xl font-light text-gray-500 leading-relaxed border-l border-black pl-8">
              Our 12m x 12m projection floor serves as a physical bridge between your computer screen and your future home. Experience the true volume of your project.
            </p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative z-10">
          {[
            { icon: Camera, title: "STAGING", color: "bg-bauhaus-blue", desc: "Enhance your walkthrough with physical mock-ups including doors, sofas, kitchen cabinets, and more—available upon request" },
            { icon: Projector, title: "Designed for Possibilities", color: "bg-bauhaus-red", desc: "Planorama is an immersive space for real estate presentations, interior planning, and construction coordination, while also serving as a studio for photoshoots, events, and product launches." },
            { icon: Coffee, title: "WORKSHOP", color: "bg-bauhaus-yellow", desc: "A neutral ground for architects, builders, and owners to finalize decisions collaboratively." }
          ].map((item, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="group border border-gray-100 bg-white p-10 hover:border-black transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
                <div className={`w-10 h-10 ${item.color} flex items-center justify-center mb-8 text-white group-hover:scale-110 transition-transform`}>
                  <item.icon size={18} />
                </div>
                <h3 className="font-sans text-xl font-black uppercase mb-4 tracking-architect">{item.title}</h3>
                <p className="text-sm font-medium text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Uses;