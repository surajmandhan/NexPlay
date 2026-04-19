import { Info, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Movie } from '../types';

interface HeroProps {
  movie: Movie | null;
  onMoreInfo: (movie: Movie) => void;
}

export default function Hero({ movie, onMoreInfo }: HeroProps) {
  if (!movie) return <div className="h-screen bg-midnight" />;

  return (
    <div className="relative h-screen w-full flex items-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{ 
              backgroundImage: `url(${movie.image})`,
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/80 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 pl-[8%] max-w-[700px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full inline-block text-[10px] uppercase tracking-[2px] mb-6"
        >
          #1 Trending Content
        </motion.div>

        <h1 className="text-7xl font-extrabold tracking-tighter leading-[0.9] uppercase bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent drop-shadow-2xl mb-6 min-h-[140px] max-md:text-5xl">
          {movie.title}
        </h1>

        <p className="text-lg text-white/80 leading-relaxed mb-10 line-clamp-3 drop-shadow-md">
          {movie.description}
        </p>

        <div className="flex gap-4">
          <button 
            onClick={() => onMoreInfo(movie)}
            className="btn-primary shine-effect flex items-center gap-2"
          >
            <Info className="w-5 h-5" /> More Info
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Plus className="w-5 h-5" /> My List
          </button>
        </div>
      </div>
    </div>
  );
}
