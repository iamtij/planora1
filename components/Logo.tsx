import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = 'h-8 w-auto' }) => {
  return (
    <img
      src="/planoramaph.png"
      alt="Planorama"
      className={`block object-contain ${className}`}
      decoding="async"
    />
  );
};

export default Logo;
