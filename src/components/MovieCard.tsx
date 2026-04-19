import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { MouseEvent } from 'react';
import { Movie } from '../types';
import { useRouter } from 'next/router';

interface MovieCardProps {
  movie: Movie;
  rank?: number;
  onClick: (movie: Movie) => void;
}

export default function MovieCard({ movie, rank, onClick, className = "w-[120px] h-[180px] md:w-[240px] md:h-[360px]" }: MovieCardProps & { className?: string }) {
  const router = useRouter();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['15deg', '-15deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-15deg', '15deg']);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleClick = () => {
    // If mobile, go directly to details page
    if (window.innerWidth < 768) {
      router.push(`/movie/${movie.type}/${movie.id}`);
    } else {
      onClick(movie);
    }
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative flex-shrink-0 rounded-2xl cursor-none group hover:z-10 ${className}`}
    >
      <div className="absolute inset-0 bg-black rounded-2xl overflow-hidden border border-white/10 transition-colors duration-300 group-hover:border-electric/50 group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8),0_0_20px_rgba(92,22,46,0.4)]">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900 via-transparent opacity-60 transition-opacity group-hover:opacity-100" />
        
        {/* New Badge (Rating) */}
        <div className="absolute top-4 left-4 bg-electric px-2 py-1 text-[10px] font-bold rounded-md shadow-lg transform translateZ(10px)">
          {movie.rating.toFixed(1)}
        </div>

        {/* Info */}
        <div className="absolute bottom-5 left-5 right-5 transform translateZ(30px) opacity-0 translate-y-2 transition-all duration-400 group-hover:opacity-100 group-hover:translate-y-0">
          <h3 className="text-lg font-bold truncate drop-shadow-md mb-1">{movie.title}</h3>
          <div className="flex gap-2 text-[10px] text-gray-300">
            <span>{movie.year}</span>
            <span>•</span>
            <span>{movie.genre}</span>
          </div>
        </div>
      </div>

      {rank && (
        <div 
          className="absolute -bottom-4 -left-6 text-[8rem] font-black leading-none pointer-events-none transform translateZ(-20px) text-midnight"
          style={{ WebkitTextStroke: '2px rgba(255,255,255,0.4)' }}
        >
          {rank}
        </div>
      )}
    </motion.div>
  );
}
