import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setStep('success');
    }, 600);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>

      <div className={`bg-white w-full max-w-xl relative transition-all duration-500 transform ${isOpen && !isClosing ? 'scale-100 translate-y-0' : 'scale-95 translate-y-12'} max-h-[90vh] overflow-y-auto`}>
        
        <div className="p-6 sm:p-10">
          <button onClick={handleClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:text-bauhaus-red transition-colors" aria-label="Close">
            <X size={24} />
          </button>

          {step === 'form' ? (
            <div className="pt-4">
              <h3 className="text-3xl font-black uppercase tracking-bauhaus mb-2">BOOK A SESSION</h3>
              <p className="text-gray-500 text-sm mb-10 font-medium tracking-wide uppercase">EXPERIENCE YOUR PROJECT AT LIFE SIZE.</p>
              
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">NAME</label>
                    <input required type="text" className="w-full border-b-2 border-black py-3 focus:border-bauhaus-red outline-none font-bold uppercase text-sm transition-all" placeholder="YOUR NAME" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">EMAIL</label>
                    <input required type="email" className="w-full border-b-2 border-black py-3 focus:border-bauhaus-blue outline-none font-bold uppercase text-sm transition-all" placeholder="EMAIL@DOMAIN.COM" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">PROJECT TYPE</label>
                  <select className="w-full border-b-2 border-black py-3 focus:border-bauhaus-yellow outline-none font-bold uppercase text-sm cursor-pointer appearance-none bg-transparent">
                    <option>RESIDENTIAL ARCHITECTURE</option>
                    <option>COMMERCIAL SPACE</option>
                    <option>INTERIOR DESIGN</option>
                  </select>
                </div>

                <div className="pt-6 sm:pt-8">
                  <button type="submit" className="w-full bg-black text-white py-6 font-bold uppercase tracking-architect text-xs hover:bg-bauhaus-red active:scale-[0.98] transition-all">
                    SUBMIT REQUEST
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 bg-bauhaus-yellow flex items-center justify-center mx-auto mb-8">
                <Check className="text-black w-8 h-8" />
              </div>
              <h4 className="text-4xl font-black uppercase tracking-bauhaus mb-4">CONFIRMED</h4>
              <p className="text-gray-500 font-medium mb-12 uppercase text-xs tracking-architect leading-loose">
                WE HAVE RECEIVED YOUR PROJECT DATA. <br /> OUR MANAGER WILL BE IN TOUCH.
              </p>
              <button onClick={handleClose} className="text-black font-bold uppercase text-[10px] tracking-architect border-b border-black pb-1 hover:text-bauhaus-red hover:border-bauhaus-red p-2">CLOSE WINDOW</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;