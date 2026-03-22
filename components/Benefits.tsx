import React from 'react';
import { Eye, Zap, ShieldCheck, Users } from 'lucide-react';
import Reveal from './Reveal';

const Benefits: React.FC = () => {
  const items = [
    { title: "CLARITY", text: "Absolute comprehension of spatial volume and relationships.", color: "text-bauhaus-blue" },
    { title: "VELOCITY", text: "Accelerate stakeholder approval cycles by weeks.", color: "text-bauhaus-red" },
    { title: "PRECISION", text: "Validate clearances with real-world physical dimensions.", color: "text-bauhaus-yellow" },
    { title: "ALIGNMENT", text: "Ensure universal project understanding across all teams.", color: "text-white" }
  ];

  return (
    <section className="bg-black text-white py-32 overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-white/5"></div>
      <div className="absolute top-0 left-2/4 w-[1px] h-full bg-white/5"></div>
      <div className="absolute top-0 left-3/4 w-[1px] h-full bg-white/5"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-0">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="lg:px-8 border-l border-white/10 lg:border-l-0">
                <h4 className={`font-black text-4xl lg:text-3xl mb-6 tracking-bauhaus uppercase ${item.color}`}>{item.title}</h4>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-architect leading-loose max-w-[200px]">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;