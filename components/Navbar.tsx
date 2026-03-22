import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

interface NavbarProps {
  onOpenBooking: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenBooking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { name: 'PROBLEM', href: '#problem' },
    { name: 'PROCESS', href: '#solution' },
    { name: 'STUDIO', href: '#uses' },
    { name: 'ABOUT', href: '#about' },
    { name: 'FAQ', href: '#faq' },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    closeMenu();
  };

  return (
    <nav
      className={`fixed w-full z-[100] transition-all duration-500 border-b ${
        scrolled || isOpen
          ? 'bg-white py-4 border-black/10 shadow-sm'
          : 'bg-transparent py-8 border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-10">
          <a 
            href="#top" 
            onClick={(e) => scrollToSection(e, '#top')}
            className="hover:opacity-70 transition-opacity p-1 relative z-[110]"
          >
            <Logo className="h-6 md:h-7" />
          </a>

          {/* Desktop Menu */}
          <div className="hidden lg:flex space-x-10 items-center">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:text-bauhaus-red transition-colors"
              >
                [{link.name}]
              </a>
            ))}
            <button
              onClick={onOpenBooking}
              className="bg-black text-white px-8 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.3em] hover:bg-bauhaus-blue transition-all active:scale-95 ml-4"
            >
              BOOK_STUDIO
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden relative z-[110]">
            <button 
              onClick={toggleMenu} 
              className="text-black p-3 -mr-2 outline-none" 
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X size={28} strokeWidth={2.5} /> : <Menu size={28} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 z-[105] bg-white transition-all duration-500 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full justify-center px-10 pb-20">
          <div className="space-y-6">
            {navLinks.map((link, index) => (
              <a 
                key={link.href} 
                href={link.href} 
                onClick={(e) => scrollToSection(e, link.href)} 
                className={`block text-5xl font-black uppercase tracking-bauhaus hover:text-bauhaus-blue transition-all duration-500 transform ${
                  isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {link.name}
              </a>
            ))}
          </div>
          
          <div 
            className={`mt-12 transition-all duration-700 transform ${
              isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
            style={{ transitionDelay: `${navLinks.length * 100}ms` }}
          >
            <button 
              onClick={() => { closeMenu(); onOpenBooking(); }} 
              className="w-full bg-bauhaus-red text-white py-6 font-bold uppercase tracking-[0.3em] text-xs font-mono active:scale-[0.98] transition-all shadow-lg shadow-bauhaus-red/20"
            >
              BOOK_STUDIO
            </button>
            <p className="mt-8 text-[10px] font-bold text-gray-300 tracking-architect uppercase text-center">
              PLANORAMA STUDIOS / LIFE SIZE 1:1
            </p>
          </div>
        </div>
        
        {/* Architectural grid background for the menu */}
        <div className="absolute inset-0 architectural-grid opacity-[0.03] pointer-events-none"></div>
      </div>
    </nav>
  );
};

export default Navbar;