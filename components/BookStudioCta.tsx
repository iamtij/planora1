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
    className={`inline-flex items-center justify-center bg-black text-white px-10 py-5 text-xs font-bold uppercase tracking-architect hover:bg-bauhaus-blue transition-all duration-500 active:scale-95 ${className}`}
  >
    BOOK STUDIO
  </button>
);

export default BookStudioCta;
