import React, { useState } from 'react';
import Reveal from './Reveal';

const Problem: React.FC = () => {
  const [view, setView] = useState<'2D' | '3D'>('2D');
  const [imgError, setImgError] = useState(false);

  return (
    <section id="problem" className="py-24 md:py-48 bg-bauhaus-beige border-y border-black/5 scroll-mt-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <Reveal>
              <h2 className="text-5xl md:text-8xl font-black mb-12 leading-[0.85] tracking-bauhaus uppercase">
                STOP BUILDING <br />
                BY <span className="text-bauhaus-red inline-block">GUESSWORK.</span>
              </h2>
              <div className="space-y-8 text-xl font-light text-gray-600 leading-relaxed max-w-xl">
                <p>
                  Most homeowners commit to their life's biggest investment based on <span className="text-black font-bold">abstract lines</span> and static renders. 
                </p>
                <p className="border-l-2 border-bauhaus-red pl-8 italic">
                  "Will the sofa fit? Is the kitchen island too close to the wall? Does this hallway feel like a cage?"
                </p>
                <p className="text-black font-medium">
                  Blueprints are a language for builders, not a feeling for families. We bridge the gap between technical data and human intuition.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <div className="relative">
              {/* View Toggle - Bauhaus Style */}
              <div className="absolute -top-14 left-0 z-20 flex bg-white border border-black p-1 shadow-sm">
                <button 
                  onClick={() => setView('2D')}
                  className={`px-6 py-2 text-[10px] font-mono font-black transition-all ${view === '2D' ? 'bg-black text-white' : 'bg-transparent text-black hover:bg-gray-100'}`}
                >
                  2D_PLAN
                </button>
                <button 
                  onClick={() => setView('3D')}
                  className={`px-6 py-2 text-[10px] font-mono font-black transition-all ${view === '3D' ? 'bg-bauhaus-blue text-white' : 'bg-transparent text-black hover:bg-gray-100'}`}
                >
                  3D_REALITY
                </button>
              </div>

              <div className="relative aspect-square md:aspect-[4/3] bg-white border border-black shadow-2xl overflow-hidden group ring-1 ring-black/5">
                {/* Architectural Grid Background */}
                <div className="absolute inset-0 architectural-grid opacity-20"></div>
                
                {/* 2D View */}
                <div className={`absolute inset-0 p-12 flex items-center justify-center transition-all duration-700 ease-in-out ${view === '2D' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-110 rotate-3 pointer-events-none blur-sm'}`}>
                  <svg viewBox="0 0 400 500" className="w-full h-full text-black">
                    <path d="M50 50 L350 50 L350 450 L50 450 Z" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path d="M50 200 L200 200 L200 50" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M200 200 L350 200" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                    <path d="M250 200 L250 450" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M50 320 L250 320" fill="none" stroke="currentColor" strokeWidth="2" />
                    
                    <g className="text-bauhaus-red">
                      <circle cx="125" cy="125" r="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                      <text x="125" y="130" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor" className="font-mono uppercase">TOO TIGHT?</text>
                    </g>
                  </svg>
                </div>

                {/* 3D View (High-Quality Kitchen Render) */}
                <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${view === '3D' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-95 -rotate-3 pointer-events-none'}`}>
                  {!imgError ? (
                    <img 
                      src="https://images.unsplash.com/photo-1600607687940-4e2a09695d51?auto=format&fit=crop&q=80&w=1400" 
                      alt="Realistic Architectural Kitchen Model" 
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-bauhaus-beige flex items-center justify-center">
                       <div className="text-center font-mono space-y-4">
                          <div className="text-[10px] text-gray-400 uppercase tracking-[0.5em] animate-pulse">RECONSTRUCTING_VOLUMES</div>
                          <div className="w-32 h-32 border border-black/10 mx-auto relative flex items-center justify-center">
                             <div className="absolute inset-0 architectural-grid opacity-10"></div>
                             <div className="w-12 h-12 bg-bauhaus-blue/20"></div>
                          </div>
                       </div>
                    </div>
                  )}
                  {/* Digital Overlay Effect */}
                  <div className="absolute inset-0 bg-bauhaus-blue/5 mix-blend-multiply"></div>
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
                </div>

                {/* Meta Information Overlays */}
                <div className={`absolute top-0 right-0 text-white px-4 py-2 text-[10px] font-mono font-bold tracking-widest uppercase z-10 transition-colors duration-500 ${view === '3D' ? 'bg-bauhaus-blue' : 'bg-black'}`}>
                  {view === '2D' ? 'DATA_MODE' : 'SPATIAL_MODE'}
                </div>

                <div className="absolute bottom-6 left-6 flex flex-col gap-1 z-10">
                  <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">LAYER_VISIBILITY: 100%</span>
                  <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">OBJECT_NAME: KITCHEN_UNIT_01</span>
                </div>

                {/* Red Uncertainty Stamp - Only for 2D */}
                <div className={`absolute bottom-6 right-6 border-2 border-bauhaus-red p-3 rotate-12 transition-all duration-700 ${view === '2D' ? 'opacity-100 scale-100' : 'opacity-0 scale-150 rotate-[45deg]'}`}>
                  <div className="text-bauhaus-red font-black text-[10px] uppercase tracking-architect leading-none">
                    AMBIGUOUS <br /> DIMENSION
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default Problem;