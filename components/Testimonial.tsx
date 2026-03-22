import React, { useState, useEffect, useCallback } from 'react';
import Reveal from './Reveal';

const testimonials = [
  {
    quote: "WE CHANGED THE ENTIRE KITCHEN ORIENTATION AFTER <span className='text-bauhaus-blue'>5 MINUTES</span> IN THE STUDIO. IT SAVED US FROM A PERMANENT MISTAKE.",
    author: "SARAH JENKINS",
    role: "HOMEOWNER",
    accent: "bg-bauhaus-blue"
  },
  {
    quote: "MY CLIENTS FINALLY <span className='text-bauhaus-red'>UNDERSTAND VOLUME</span>. NO MORE EXPLAINING CEILING HEIGHTS WITH HAND GESTURES; THEY JUST FEEL IT.",
    author: "MARCUS THORNE",
    role: "PRINCIPAL ARCHITECT",
    accent: "bg-bauhaus-red"
  },
  {
    quote: "WALKING THROUGH OUR FUTURE HOME WAS AN <span className='text-bauhaus-yellow'>EMOTIONAL REVELATION</span>. WE REALIZED THE NURSERY WAS TOO FAR FROM OUR ROOM.",
    author: "ELENA ROSSI",
    role: "CLIENT",
    accent: "bg-bauhaus-yellow"
  }
];

const Testimonial: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextTestimonial = useCallback(() => {
    setActiveIndex((current) => (current + 1) % testimonials.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextTestimonial, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextTestimonial]);

  const handleManualSelect = (index: number) => {
    setActiveIndex(index);
    setIsAutoPlaying(false);
    // Resume autoplay after 15 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  return (
    <section className="py-24 md:py-48 bg-white text-black overflow-hidden relative border-y border-black/5">
      {/* Subtle Geometric Background Element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-bauhaus-beige -skew-x-12 translate-x-1/4 opacity-50"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="relative min-h-[400px] md:min-h-[350px]">
          {testimonials.map((t, idx) => (
            <div 
              key={idx}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                idx === activeIndex 
                  ? 'opacity-100 translate-y-0 pointer-events-auto' 
                  : 'opacity-0 translate-y-8 pointer-events-none'
              }`}
            >
              <div className="flex gap-2 mb-12">
                <div className={`w-8 h-8 ${idx === 0 ? 'bg-bauhaus-red' : 'bg-gray-100'}`}></div>
                <div className={`w-8 h-8 ${idx === 1 ? 'bg-bauhaus-blue' : 'bg-gray-100'}`}></div>
                <div className={`w-8 h-8 ${idx === 2 ? 'bg-bauhaus-yellow' : 'bg-gray-100'}`}></div>
              </div>
              
              <blockquote 
                className="font-sans text-3xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-bauhaus uppercase mb-16 max-w-5xl"
                dangerouslySetInnerHTML={{ __html: t.quote }}
              />
              
              <div className="flex items-center gap-6">
                <div className="w-12 h-[2px] bg-black"></div>
                <cite className="not-italic">
                  <span className="block font-black text-xs uppercase tracking-architect text-black">
                    {t.author}
                  </span>
                  <span className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {t.role}
                  </span>
                </cite>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Indicators */}
        <div className="mt-20 flex gap-4">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleManualSelect(idx)}
              className="group relative flex items-center justify-center p-2 outline-none"
              aria-label={`Go to testimonial ${idx + 1}`}
            >
              <div 
                className={`h-1 transition-all duration-500 ${
                  idx === activeIndex 
                    ? 'w-12 bg-black' 
                    : 'w-6 bg-gray-200 group-hover:bg-gray-400'
                }`}
              />
              {idx === activeIndex && isAutoPlaying && (
                <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-black/10 overflow-hidden">
                  <div className="h-full bg-black/40 animate-progress-bar"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Bauhaus Motif - Large Outline Circle */}
      <div className="absolute -bottom-24 -right-24 w-80 h-80 border-[1px] border-black/5 rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 -left-12 w-24 h-24 bg-bauhaus-yellow/10 rounded-full blur-2xl pointer-events-none"></div>

      <style>{`
        @keyframes progress-bar {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-progress-bar {
          animation: progress-bar 6s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default Testimonial;