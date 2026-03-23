import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import Reveal from './Reveal';
import BookStudioCta from './BookStudioCta';

interface FAQProps {
  onOpenBooking: () => void;
}

const FAQ: React.FC<FAQProps> = ({ onOpenBooking }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const questions = [
    {
      q: "WE HAVE 3D RENDERS. IS THIS DIFFERENT?",
      a: "Crucially. Renders show you what a room looks like; they don't show you how it functions. 1:1 projection reveals spatial flow, ergonomics, and physical clearances that a computer screen simply cannot communicate. It's the difference between looking at a photo of a car and sitting in the driver's seat.",
      color: "text-bauhaus-blue"
    },
    {
      q: "CAN WE BRING OUR ARCHITECT OR BUILDER?",
      a: "We highly recommend it. Our studio becomes a neutral, high-fidelity workshop where architects can validate their visions and builders can identify structural complexities before they arrive on-site. It's a platform for real-time collaboration that often cuts weeks off the design approval process.",
      color: "text-bauhaus-red"
    },
    {
      q: "WHEN IS THE BEST TIME TO VISIT?",
      a: "The earlier, the better. Catching a spatial error during the conceptual phase costs nothing. Catching that same error once the concrete is poured or the framing is up is catastrophic. Most clients visit once during initial layout and again when refining interior joinery.",
      color: "text-bauhaus-yellow"
    },
    {
      q: "WHERE IS THE STUDIO?",
      a: "We're in Quezon City at 10B Don Alfredo Egea St. Sessions are by appointment—book a visit and we'll share directions, parking, and what to bring for your project files.",
      color: "text-bauhaus-red"
    },
    {
      q: "WHAT DATA DO YOU NEED FROM US?",
      a: "We work with standard architectural files—PDFs, CAD drawings, or Revit models. Once received, our technicians calibrate your plans for the floor, ensuring that every millimeter in your drawing matches every millimeter on our studio floor.",
      color: "text-black"
    }
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-24 md:py-40 bg-white scroll-mt-24">
      <Reveal variant="fade" className="absolute top-0 left-0 w-full pointer-events-none z-10">
        <div className="h-px w-full bg-black/5" />
      </Reveal>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* Header Section */}
          <div className="lg:col-span-4">
            <Reveal>
              <h2 className="font-sans text-5xl md:text-7xl font-black uppercase tracking-bauhaus leading-[0.85] mb-8">
                FREQUENT <br /> <span className="text-bauhaus-red">INQUIRIES.</span>
              </h2>
              <p className="text-gray-400 font-medium text-sm uppercase tracking-architect leading-relaxed max-w-xs">
                Clarifying the bridge between your blueprints and your reality.
              </p>
            </Reveal>
          </div>

          {/* Accordion Section */}
          <div className="lg:col-span-8">
            <div className="border-t border-black">
              {questions.map((item, i) => (
                <Reveal key={i} delay={i * 70}>
                  <div className="border-b border-black/10">
                    <button 
                      onClick={() => toggle(i)}
                      className="w-full flex items-start justify-between py-10 text-left group transition-all"
                    >
                      <div className="flex gap-8 md:gap-12 items-start">
                        <span className={`text-xs font-mono font-bold mt-2 ${item.color}`}>
                          0{i + 1}_
                        </span>
                        <h3 className={`font-sans text-xl md:text-2xl font-black uppercase tracking-bauhaus transition-colors duration-300 ${openIndex === i ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>
                          {item.q}
                        </h3>
                      </div>
                      <div className={`mt-1 p-2 transition-transform duration-500 ${openIndex === i ? 'rotate-180' : 'rotate-0'}`}>
                        {openIndex === i ? <Minus size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                      </div>
                    </button>
                    
                    <div 
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        openIndex === i ? 'max-h-96 pb-12' : 'max-h-0'
                      }`}
                    >
                      <div className="pl-16 md:pl-24 max-w-2xl">
                        <p className="text-gray-600 text-lg font-light leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Bottom Contact Hint */}
            <Reveal delay={400} className="mt-16">
              <div className="bg-bauhaus-beige p-8 md:p-12 border border-black/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div>
                  <h4 className="font-black uppercase tracking-architect mb-2">Still have questions?</h4>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Our spatial consultants are available for a call.</p>
                </div>
                <BookStudioCta onOpenBooking={onOpenBooking} className="w-full sm:w-auto shrink-0" />
              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FAQ;