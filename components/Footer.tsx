import React from 'react';
import Reveal from './Reveal';
import Logo from './Logo';
import BookStudioCta from './BookStudioCta';

interface FooterProps {
  onOpenBooking: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenBooking }) => {
  return (
    <footer id="contact" className="relative bg-bauhaus-beige pt-24 pb-12 scroll-mt-24">
      <Reveal variant="fade" className="absolute top-0 left-0 w-full pointer-events-none z-10">
        <div className="h-px w-full bg-black/5" />
      </Reveal>
      <div className="max-w-7xl mx-auto px-6">
        
        <Reveal variant="cta" className="w-full">
          <div className="grid lg:grid-cols-2 gap-20 mb-32">
            <div className="w-full">
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-bauhaus leading-[0.85] mb-12 text-black">
                READY TO <br /> <span className="text-bauhaus-red italic">WALK</span> IT?
              </h2>
              <BookStudioCta onOpenBooking={onOpenBooking} className="w-full sm:w-auto" />
            </div>

            <div className="flex flex-col justify-end">
              <div className="border-l-2 border-black pl-8">
                <p className="text-xl font-bold uppercase tracking-bauhaus text-black">
                  10B DON ALFREDO EGEA ST. <br />
                  QUEZON CITY
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="border-t border-black/10 pt-12 flex items-center text-[10px] font-bold uppercase tracking-architect text-gray-400">
          <div className="flex items-center gap-6">
            <div className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
              <Logo className="h-6" />
            </div>
            <span>&copy; {new Date().getFullYear()} PLANORAMA STUDIOS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;