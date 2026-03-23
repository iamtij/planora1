import React from 'react';

interface BookStudioCtaProps {
  onOpenBooking: () => void;
  className?: string;
}

/** Shared primary CTA used across sections */
const BookStudioCta: React.FC<BookStudioCtaProps> = ({ onOpenBooking, className = '' }) => (
  <button
    type="button"
    onClick={onOpenBooking}
    className={`inline-flex items-center justify-center bg-bauhaus-red text-white px-10 py-5 text-xs font-bold uppercase tracking-architect shadow-md shadow-bauhaus-red/25 transition-all duration-500 hover:brightness-90 active:scale-95 active:brightness-[0.85] ${className}`}
  >
    BOOK STUDIO
  </button>
);

export default BookStudioCta;
