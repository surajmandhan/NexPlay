import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Also check for 'clickable' class or standard focusable elements
      const clickable = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) || 
                        target.closest('.clickable') || 
                        target.closest('button') || 
                        target.style.cursor === 'pointer';
      setIsHovering(!!clickable);
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {/* Inner Dot */}
      <motion.div
        className="absolute w-1.5 h-1.5 bg-electric rounded-full shadow-[0_0_10px_theme(colors.electric)]"
        animate={{ 
          x: mousePos.x - 3, 
          y: mousePos.y - 3,
          scale: isClicked ? 0.8 : 1
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.1 }}
      />
      
      {/* Outer Ring */}
      <motion.div
        className="absolute border border-electric/30 rounded-full"
        animate={{
          x: mousePos.x - (isHovering ? 25 : 15),
          y: mousePos.y - (isHovering ? 25 : 15),
          width: isHovering ? 50 : 30,
          height: isHovering ? 50 : 30,
          backgroundColor: isHovering ? 'rgba(255, 43, 109, 0.1)' : 'rgba(255, 43, 109, 0)',
          borderColor: isHovering ? '#ff2b6d' : 'rgba(255, 43, 109, 0.3)',
          scale: isClicked ? 0.9 : 1
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, mass: 0.6 }}
      />

      {/* Trailing Glow */}
      <motion.div
        className="absolute w-40 h-40 bg-crimson/10 rounded-full blur-[60px]"
        animate={{
          x: mousePos.x - 80,
          y: mousePos.y - 80,
        }}
        transition={{ type: 'spring', damping: 40, stiffness: 100, mass: 1 }}
      />

      {/* Click Ripples */}
      <AnimatePresence>
        {isClicked && (
          <motion.div
            initial={{ opacity: 0.5, scale: 0 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            className="absolute border-2 border-electric rounded-full"
            style={{ 
              left: mousePos.x - 20, 
              top: mousePos.y - 20,
              width: 40,
              height: 40
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
