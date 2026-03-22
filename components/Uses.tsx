import React from 'react';
import { Camera, Projector, Coffee } from 'lucide-react';
import Reveal from './Reveal';

const GraphPaperPanel: React.FC = () => (
  <div
    className="rounded-sm overflow-hidden py-14 md:py-20 px-5 md:px-10"
    style={{
      backgroundColor: '#f4f6f9',
      backgroundImage: `
        linear-gradient(to right, rgba(59, 130, 246, 0.14) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(59, 130, 246, 0.14) 1px, transparent 1px)
      `,
      backgroundSize: '28px 28px',
    }}
  >
    <Reveal>
      <h3 className="font-sans text-center text-base sm:text-lg md:text-2xl font-black uppercase tracking-bauhaus text-gray-700 mb-12 md:mb-16 px-2">
        Flexible space, intentional experiences
      </h3>
    </Reveal>

    <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
      {/* Photoshoot studio */}
      <Reveal delay={80}>
        <div className="bg-black text-white p-8 md:p-10 flex flex-col items-center text-center min-h-[320px] md:min-h-[340px]">
          <div className="w-28 h-24 mb-8 flex items-center justify-center" aria-hidden>
            <svg viewBox="0 0 120 100" className="w-full h-full" fill="none">
              <defs>
                <pattern id="halftone" width="6" height="6" patternUnits="userSpaceOnUse">
                  <circle cx="3" cy="3" r="1.2" fill="white" opacity="0.35" />
                </pattern>
              </defs>
              <rect x="8" y="28" width="104" height="64" rx="4" fill="url(#halftone)" />
              <rect x="8" y="28" width="104" height="64" rx="4" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
              <rect x="42" y="18" width="36" height="14" rx="2" fill="white" fillOpacity="0.25" />
              <rect x="48" y="12" width="24" height="10" rx="2" fill="#ffcd00" />
              <circle cx="60" cy="58" r="22" stroke="white" strokeOpacity="0.6" strokeWidth="2" />
              <circle cx="60" cy="58" r="14" stroke="#ffcd00" strokeWidth="3" />
              <circle cx="60" cy="58" r="8" fill="#1a1a1a" />
            </svg>
          </div>
          <h4 className="font-sans text-sm md:text-base font-black uppercase tracking-bauhaus text-bauhaus-yellow mb-6 leading-tight">
            Photoshoot studio
          </h4>
          <ul className="space-y-3 text-[10px] md:text-[11px] font-bold uppercase tracking-architect text-white/95 leading-relaxed">
            <li>Portrait and lifestyle shoots</li>
            <li>Product and brand photography</li>
            <li>Creative and conceptual content</li>
          </ul>
        </div>
      </Reveal>

      {/* Interactive projection */}
      <Reveal delay={160}>
        <div className="bg-black text-white p-8 md:p-10 flex flex-col items-center text-center min-h-[320px] md:min-h-[340px]">
          <div className="w-28 h-24 mb-8 flex items-center justify-center" aria-hidden>
            <svg viewBox="0 0 120 100" className="w-full h-full">
              <defs>
                <linearGradient id="meshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <path
                  key={i}
                  d={`M ${10 + i * 4} ${15 + Math.sin(i) * 6} Q 60 ${35 + i * 8} 110 ${20 + i * 5}`}
                  stroke="url(#meshGrad)"
                  strokeWidth="1.2"
                  fill="none"
                  opacity={0.85 - i * 0.08}
                />
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map((j) => (
                <path
                  key={`v-${j}`}
                  d={`M ${15 + j * 14} ${10 + Math.cos(j * 0.7) * 5} Q ${30 + j * 10} 55 ${20 + j * 15} 92`}
                  stroke="url(#meshGrad)"
                  strokeWidth="1"
                  fill="none"
                  opacity={0.7}
                />
              ))}
            </svg>
          </div>
          <h4 className="font-sans text-sm md:text-base font-black uppercase tracking-bauhaus text-[#f97316] mb-6 leading-tight">
            Interactive projection experience
          </h4>
          <ul className="space-y-3 text-[10px] md:text-[11px] font-bold uppercase tracking-architect text-white/95 leading-relaxed">
            <li>Dynamic presentations</li>
            <li>Immersive visual backdrops</li>
            <li>Suitable for presentations, content creation, and experimental visual work.</li>
          </ul>
        </div>
      </Reveal>

      {/* Events */}
      <Reveal delay={240}>
        <div className="bg-black text-white p-8 md:p-10 flex flex-col items-center text-center min-h-[320px] md:min-h-[340px]">
          <div className="w-28 h-24 mb-8 flex items-center justify-center" aria-hidden>
            <svg viewBox="0 0 120 100" className="w-full h-full">
              <rect x="18" y="16" width="84" height="72" rx="4" fill="white" />
              <rect x="18" y="16" width="84" height="18" rx="4" fill="#df2020" />
              {[0, 1, 2, 3, 4].map((i) => (
                <circle key={i} cx={28 + i * 16} cy="25" r="4" fill="#005eb8" />
              ))}
              <text x="60" y="48" textAnchor="middle" fill="#000" fontWeight="800" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                EVENTS
              </text>
              <g fill="#9ca3af">
                {[0, 1, 2, 3].flatMap((r) =>
                  [0, 1, 2, 3].map((c) => (
                    <rect key={`${r}-${c}`} x={26 + c * 16} y={54 + r * 10} width="12" height="8" rx="1" />
                  ))
                )}
              </g>
              <path d="M80 76l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5z" fill="#df2020" />
              <path d="M92 84 L108 84 L108 68 Z" fill="#005eb8" />
            </svg>
          </div>
          <h4 className="font-sans text-sm md:text-base font-black uppercase tracking-bauhaus text-bauhaus-blue mb-6 leading-tight">
            Small gathering &amp; events
          </h4>
          <ul className="space-y-3 text-[10px] md:text-[11px] font-bold uppercase tracking-architect text-white/95 leading-relaxed">
            <li>Real estate open houses and property previews</li>
            <li>Best for curated events that value movement, visuals, and a focused atmosphere.</li>
          </ul>
        </div>
      </Reveal>
    </div>
  </div>
);

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

        <div className="mt-24 md:mt-32">
          <Reveal>
            <h2 className="font-sans text-4xl md:text-6xl font-black uppercase tracking-bauhaus leading-[0.85] mb-10 md:mb-14">
              Other avenues
            </h2>
          </Reveal>
          <GraphPaperPanel />
        </div>
      </div>
    </section>
  );
};

export default Uses;