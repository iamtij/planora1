import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-8" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 400 350" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
        {/* Grid-based composition based on the image */}
        {/* Row 1 */}
        <rect x="100" y="50" width="100" height="50" fill="black" />
        <rect x="200" y="50" width="50" height="50" fill="#005eb8" />
        <circle cx="310" cy="75" r="30" fill="#df2020" />
        
        {/* Row 2 */}
        <circle cx="75" cy="140" r="25" fill="#005eb8" />
        <rect x="100" y="100" width="50" height="100" fill="#df2020" />
        <rect x="150" y="100" width="50" height="50" fill="white" />
        <rect x="200" y="100" width="50" height="50" fill="black" />
        <rect x="250" y="100" width="100" height="50" fill="#ffcd00" />
        
        {/* Row 3 */}
        <rect x="100" y="200" width="50" height="100" fill="#005eb8" />
        <rect x="150" y="150" width="50" height="100" fill="#ffcd00" />
        <circle cx="225" cy="230" r="25" fill="black" />
        <rect x="250" y="150" width="50" height="100" fill="#005eb8" />
        
        {/* Text */}
        <text x="162" y="300" fill="black" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="30" letterSpacing="0.05em">PLANORAMA</text>
      </svg>
    </div>
  );
};

export default Logo;