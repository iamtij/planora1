import React from 'react';
import Reveal from './Reveal';
import Logo from './Logo';

interface FooterProps {
  onOpenBooking: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenBooking }) => {
  return (
    <footer id="contact" className="bg-bauhaus-beige pt-24 pb-12 scroll-mt-24 border-t border-black/5">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid lg:grid-cols-2 gap-20 mb-32">
          <Reveal className="w-full">
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-bauhaus leading-[0.85] mb-12 text-black">
              READY TO <br /> <span className="text-bauhaus-red italic">WALK</span> IT?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <button 
                onClick={onOpenBooking}
                className="w-full sm:w-auto bg-bauhaus-red text-white px-10 py-5 text-xs font-bold uppercase tracking-architect hover:bg-black transition-all duration-300 active:scale-95"
              >
                BOOK SESSION
              </button>
              <button 
                onClick={onOpenBooking}
                className="w-full sm:w-auto bg-transparent border-2 border-black text-black px-10 py-5 text-xs font-bold uppercase tracking-architect hover:bg-black hover:text-white transition-all duration-300 active:scale-95"
              >
                VISIT STUDIO
              </button>
            </div>
          </Reveal>

          <Reveal delay={200} className="flex flex-col justify-end">
            <div className="border-l-2 border-black pl-8">
              <p className="text-xl font-bold uppercase tracking-bauhaus text-black">
                1024 INDUSTRIAL PARK DR. <br />
                SUITE 400, BERLIN 10117
              </p>
            </div>
          </Reveal>
        </div>

        <div className="border-t border-black/10 pt-12 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-architect text-gray-400">
          <div className="flex items-center gap-6 mb-8 md:mb-0">
            <div className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
              <Logo className="h-6" />
            </div>
            <span>&copy; {new Date().getFullYear()} PLANORAMA STUDIOS</span>
          </div>
          <div className="flex gap-12">
            <a href="#!" className="hover:text-black transition-colors p-2">INSTAGRAM</a>
            <a href="#!" className="hover:text-black transition-colors p-2">LINKEDIN</a>
            <a href="#!" className="hover:text-black transition-colors p-2">PRIVACY</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;