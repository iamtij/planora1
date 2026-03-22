import React from 'react';
import Reveal from './Reveal';

const Solution: React.FC = () => {
  const steps = [
    { 
      id: "01",
      title: "Bring Your Plans", 
      label: "to Life",
      desc: "Upload your CAD drawings and/or 3D models. We prepare your project for full-scale projection.",
      color: "bg-bauhaus-blue",
      accent: "text-bauhaus-blue",
      symbol: "◤"
    },
    { 
      id: "02",
      title: "Walk Through", 
      label: "Your Space",
      desc: "Experience your design at near life-size. Understand proportions, layouts, and flow—just like in real life.",
      color: "bg-bauhaus-red",
      accent: "text-bauhaus-red",
      symbol: "◢"
    },
    { 
      id: "03",
      title: "Build with", 
      label: "Certainty",
      desc: "Finalize decisions with clarity, minimizing risks, errors, and redesign costs.",
      color: "bg-bauhaus-yellow",
      accent: "text-bauhaus-yellow",
      symbol: "◥"
    }
  ];

  return (
    <section id="solution" className="py-32 md:py-56 bg-white text-black scroll-mt-24 relative overflow-hidden">
      {/* Subtle architectural depth */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] architectural-grid"></div>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-black/5"></div>
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/5"></div>

      <div className="max-w-7xl mx-auto px-6 mb-24 md:mb-32">
        <Reveal>
          <div className="relative inline-block">
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-bauhaus leading-[0.85] mb-6">
              3 STEPS <br />
              <span className="text-bauhaus-red italic">TO CERTAINTY</span>
            </h2>
            <div className="absolute -right-12 top-0 text-bauhaus-blue font-mono text-xl">●</div>
          </div>
        </Reveal>
        
        <Reveal delay={200}>
          <div className="mt-12 flex items-center gap-8">
            <div className="w-24 h-[1px] bg-black/20"></div>
            <p className="text-[10px] font-mono font-bold tracking-[0.4em] uppercase opacity-40">
              THE_HUMAN_EXPERIENCE // ARCHITECTURAL_JOURNEY
            </p>
          </div>
        </Reveal>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-3 gap-8 md:gap-4 lg:gap-0 border-y border-black/10">
        {steps.map((step, i) => (
          <Reveal key={step.id} delay={i * 200} className="lg:border-r border-black/10 last:border-0 h-full">
            <div className="group relative h-full min-h-[500px] flex flex-col p-12 md:p-16 transition-all duration-700 hover:bg-black overflow-hidden cursor-pointer">
              
              {/* Massive Background Number */}
              <div className="absolute -bottom-10 -right-10 text-[250px] font-black leading-none opacity-[0.03] group-hover:opacity-10 group-hover:text-white transition-all duration-700 select-none">
                {step.id}
              </div>

              {/* Gentle Light Sweep Animation (Less 'Laser', More 'Searchlight') */}
              <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 animate-light-sweep z-20 pointer-events-none"></div>

              {/* Symbol */}
              <div className={`text-4xl mb-12 transition-transform duration-700 group-hover:scale-125 ${step.accent}`}>
                {step.symbol}
              </div>

              <div className="relative z-10 flex-1">
                <span className="inline-block text-[10px] font-mono font-bold tracking-[0.5em] text-gray-400 group-hover:text-white/40 mb-4 uppercase transition-colors">
                  MOMENT_0{i+1}
                </span>
                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-bauhaus leading-none mb-8 group-hover:text-white transition-colors">
                  {step.title} <br />
                  <span className={`italic transition-colors ${step.accent} group-hover:text-white`}>
                    {step.label}
                  </span>
                </h3>
                <p className="text-lg font-light text-gray-500 group-hover:text-white/60 leading-relaxed transition-colors duration-500 max-w-sm">
                  {step.desc}
                </p>
              </div>

              {/* Bottom Interactive Element */}
              <div className="mt-16 relative z-10">
                <div className={`h-1 w-12 transition-all duration-700 group-hover:w-full group-hover:bg-white ${step.color}`}></div>
                <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <span className="text-[10px] font-mono text-white tracking-widest uppercase">BEGIN_THE_EXPERIENCE</span>
                  <span className="text-white text-xs">→</span>
                </div>
              </div>

              {/* Hover Geometric Accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-20 transition-all duration-700 scale-0 group-hover:scale-150 rounded-full -mr-16 -mt-16 ${step.color}`}></div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Decorative Human-Centric Detail */}
      <div className="max-w-7xl mx-auto px-6 mt-12 flex justify-between items-end opacity-20 hidden md:flex">
        <div className="font-mono text-[8px] space-y-1 uppercase tracking-widest">
          <div>Scale: 1:1 Actual Size</div>
          <div>Human Centric Design</div>
          <div>Location: Berlin Studio</div>
        </div>
        <div className="flex gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-bauhaus-red"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-bauhaus-blue"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-bauhaus-yellow"></div>
        </div>
      </div>

      <style>{`
        @keyframes light-sweep {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(400%); opacity: 0; }
        }
        .animate-light-sweep {
          animation: light-sweep 4s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </section>
  );
};

export default Solution;