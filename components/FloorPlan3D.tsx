import React, { useState, useEffect, useRef } from 'react';

const FloorPlan3D: React.FC = () => {
  const [rotate, setRotate] = useState({ x: 60, y: 0, z: -45 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [humanPos, setHumanPos] = useState({ x: 120, y: 100, angle: 90 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, rawX: 0, rawY: 0 });
  
  const mouseTarget = useRef({ x: 120, y: 100 });
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);

  // Constants for scale mapping (e.g., 450px = 12.5m)
  const SCALE_X = 12.5 / 450;
  const SCALE_Y = 9.8 / 350;

  // Perspective tilt logic
  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      const xNorm = (e.clientX / window.innerWidth) - 0.5;
      const yNorm = (e.clientY / window.innerHeight) - 0.5;
      
      setRotate({
        x: 60 + (yNorm * 8),
        y: (xNorm * 8),
        z: -45 + (xNorm * 4)
      });
    };

    window.addEventListener('mousemove', handleMouseMoveGlobal);
    return () => window.removeEventListener('mousemove', handleMouseMoveGlobal);
  }, []);

  // Human movement loop
  useEffect(() => {
    const animate = () => {
      setHumanPos(prev => {
        const target = mouseTarget.current;
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Deadzone to prevent jittering when reaching target
        if (distance < 3) return prev;

        // Consistent walking pace for both following and patrol
        const speed = 1.0; 
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        
        // Calculate angle in degrees
        const targetAngle = Math.atan2(vy, vx) * (180 / Math.PI) + 90;
        
        // Smoothly interpolate angle for seamless turning
        let angleDiff = targetAngle - prev.angle;
        while (angleDiff < -180) angleDiff += 360;
        while (angleDiff > 180) angleDiff -= 360;
        const nextAngle = prev.angle + angleDiff * 0.08;

        return {
          x: prev.x + vx,
          y: prev.y + vy,
          angle: nextAngle
        };
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Default path logic when not following mouse
  useEffect(() => {
    if (isFollowing) return;

    const path = [
      { x: 80, y: 80 },
      { x: 370, y: 80 },
      { x: 370, y: 270 },
      { x: 80, y: 270 },
    ];
    let pathIdx = 0;

    const interval = setInterval(() => {
      const distToPathTarget = Math.sqrt(
        Math.pow(mouseTarget.current.x - humanPos.x, 2) + 
        Math.pow(mouseTarget.current.y - humanPos.y, 2)
      );
      
      if (distToPathTarget < 10) {
        pathIdx = (pathIdx + 1) % path.length;
        mouseTarget.current = path[pathIdx];
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isFollowing, humanPos.x, humanPos.y]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Position within the container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Offset coordinates to align with the 3D floor plan bounds (450x350)
    // Floor plan is centered in the container
    const offsetX = (rect.width - 450) / 2;
    const offsetY = (rect.height - 350) / 2;
    
    const localX = Math.max(0, Math.min(450, x - offsetX));
    const localY = Math.max(0, Math.min(350, y - offsetY));

    setCursorPos({ 
      x: localX * SCALE_X, 
      y: localY * SCALE_Y,
      rawX: x,
      rawY: y
    });

    if (isFollowing) {
      mouseTarget.current = { x: localX, y: localY };
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[500px] flex items-center justify-center perspective-[1200px] select-none overflow-visible group"
      style={{ cursor: 'none' }} // Hide native cursor to use custom architectural one
      onMouseEnter={() => setIsFollowing(true)}
      onMouseLeave={() => setIsFollowing(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Custom Architectural Cursor */}
      <div 
        className={`fixed z-[200] pointer-events-none transition-opacity duration-300 flex flex-col items-start gap-1 ${isFollowing ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: cursorPos.rawX, top: cursorPos.rawY }}
      >
        <div className="w-4 h-4 -translate-x-1/2 -translate-y-1/2 relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-bauhaus-red"></div>
          <div className="absolute left-1/2 top-0 w-[1px] h-full bg-bauhaus-red"></div>
        </div>
        <div className="bg-black text-white px-2 py-1 text-[8px] font-mono font-bold whitespace-nowrap -mt-2 ml-3 border border-white/20 shadow-xl">
          X: {cursorPos.x.toFixed(2)}m<br/>Y: {cursorPos.y.toFixed(2)}m
        </div>
      </div>

      <div 
        className="relative w-[450px] h-[350px] transition-transform duration-300 ease-out preserve-3d"
        style={{ 
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) rotateZ(${rotate.z}deg)` 
        }}
      >
        {/* Foundation / Floor */}
        <div className="absolute inset-0 border border-black/10 bg-white shadow-2xl preserve-3d pointer-events-auto">
          <div className="absolute inset-0 architectural-grid opacity-30"></div>
          
          {/* Exterior Walls */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-black"></div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black"></div>
          <div className="absolute top-0 left-0 w-[2px] h-full bg-black"></div>
          <div className="absolute top-0 right-0 w-[2px] h-full bg-black"></div>

          {/* Internal Walls */}
          <div className="absolute top-0 left-[60%] w-[2px] h-[40%] bg-black"></div>
          <div className="absolute top-[40%] left-[60%] w-[40%] h-[2px] bg-black"></div>
          <div className="absolute top-[60%] left-0 w-[45%] h-[2px] bg-black"></div>
          <div className="absolute top-[60%] left-[45%] w-[2px] h-[40%] bg-black"></div>
          <div className="absolute top-[60%] left-[45%] w-[25%] h-[2px] bg-black"></div>
          <div className="absolute top-[60%] left-[70%] w-[2px] h-[40%] bg-black"></div>

          {/* Room Labels */}
          <div className="absolute top-[15%] left-[15%] font-mono text-[9px] font-black text-black/40 uppercase tracking-widest">01_LIVING</div>
          <div className="absolute top-[15%] left-[68%] font-mono text-[9px] font-black text-bauhaus-blue uppercase tracking-widest">02_KITCHEN</div>
          <div className="absolute top-[75%] left-[10%] font-mono text-[9px] font-black text-black/40 uppercase tracking-widest">03_MASTER</div>
          <div className="absolute top-[75%] left-[50%] font-mono text-[9px] font-black text-black/40 uppercase tracking-widest">04_BATH</div>

          {/* 3D Human Figure Wrapper - Driven by State */}
          <div 
            className="absolute w-[20px] h-[63px] preserve-3d transition-none"
            style={{ 
              transform: `translate3d(${humanPos.x - 10}px, ${humanPos.y - 31}px, 0.1px) rotateZ(${humanPos.angle}deg)`,
              left: 0,
              top: 0
            }}
          >
            {/* Soft Shadow on the floor */}
            <div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-4 bg-black/10 rounded-full blur-[2px]" 
              style={{ transform: 'rotateX(90deg) translateZ(-1px)' }}
            ></div>

            {/* Standing Body Group (Rotated Upright) */}
            <div className="absolute inset-0 preserve-3d origin-bottom animate-bobbing" style={{ transform: 'rotateX(-90deg)' }}>
              
              {/* Head (A small red cube) */}
              <div className="absolute -top-[16px] left-[4px] w-[12px] h-[12px] preserve-3d">
                <div className="absolute inset-0 bg-bauhaus-red"></div>
                <div className="absolute inset-0 bg-bauhaus-red opacity-80" style={{ transform: 'rotateY(90deg)' }}></div>
                <div className="absolute inset-0 bg-bauhaus-red opacity-60" style={{ transform: 'translateZ(-12px)' }}></div>
              </div>

              {/* Torso (Volumetric Prism) */}
              <div className="absolute top-0 left-0 w-full h-[35px] preserve-3d">
                <div className="absolute inset-0 bg-black"></div>
                <div className="absolute inset-0 bg-black/80" style={{ transform: 'translateZ(-8px)' }}></div>
                <div className="absolute top-0 left-0 w-[8px] h-full bg-black/70 origin-left" style={{ transform: 'rotateY(-90deg)' }}></div>
                <div className="absolute top-0 right-0 w-[8px] h-full bg-black/70 origin-right" style={{ transform: 'rotateY(90deg)' }}></div>
                <div className="absolute top-0 left-0 w-full h-[8px] bg-black/90 origin-top" style={{ transform: 'rotateX(-90deg)' }}></div>
              </div>

              {/* Legs with rhythmic animation */}
              <div className="absolute top-[35px] left-[2px] w-[6px] h-[28px] preserve-3d animate-leg-swing">
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="absolute inset-0 bg-black/40" style={{ transform: 'translateZ(-4px)' }}></div>
              </div>

              <div className="absolute top-[35px] right-[2px] w-[6px] h-[28px] preserve-3d animate-leg-swing-alt">
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="absolute inset-0 bg-black/40" style={{ transform: 'translateZ(-4px)' }}></div>
              </div>
            </div>
          </div>

          {/* Dimension Lines */}
          <div className="absolute -top-6 left-0 w-full h-[1px] bg-black/5 flex justify-between items-center px-2">
            <span className="font-mono text-[7px] text-black/20">12.50m</span>
          </div>
          <div className="absolute -left-8 top-0 h-full w-[1px] bg-black/5 flex flex-col justify-center items-center">
            <span className="font-mono text-[7px] text-black/20 rotate-90">9.80m</span>
          </div>
        </div>

        {/* Floor Shadow Casting */}
        <div 
          className="absolute inset-0 bg-black/5 blur-xl translate-y-8 -translate-z-4 scale-105 pointer-events-none"
          style={{ transform: 'translateZ(-20px)' }}
        ></div>
      </div>

      <style>{`
        @keyframes bobbing {
          0%, 100% { transform: rotateX(-90deg) translateY(0); }
          50% { transform: rotateX(-90deg) translateY(-4px); }
        }

        @keyframes leg-swing {
          0%, 100% { transform: rotateX(-20deg); }
          50% { transform: rotateX(20deg); }
        }

        @keyframes leg-swing-alt {
          0%, 100% { transform: rotateX(20deg); }
          50% { transform: rotateX(-20deg); }
        }

        .animate-bobbing {
          animation: bobbing 0.5s infinite ease-in-out;
          transform-style: preserve-3d;
        }

        .animate-leg-swing {
          animation: leg-swing 0.5s infinite ease-in-out;
          transform-origin: top center;
        }

        .animate-leg-swing-alt {
          animation: leg-swing-alt 0.5s infinite ease-in-out;
          transform-origin: top center;
        }

        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
};

export default FloorPlan3D;