import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import { Movie } from '../types';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  showRank?: boolean;
  onMovieClick: (movie: Movie) => void;
}

export default function MovieRow({ title, movies, showRank, onMovieClick }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) return null;

  return (
    <div className="relative z-10 py-4 md:py-8 bg-gradient-to-b from-transparent to-midnight/50">
      <div className="px-[5%] md:px-[8%] mb-3 md:mb-6 flex items-center justify-between">
        <h2 className="text-base md:text-xl font-bold tracking-wider flex items-center gap-3 md:gap-4">
          <span className="w-1 h-6 md:h-8 bg-amaranth shadow-[0_0_10px_theme(colors.amaranth)]" />
          {title}
        </h2>
      </div>

      <div className="group relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-crimson"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          ref={rowRef}
          className="flex gap-3 md:gap-8 overflow-x-auto px-[5%] md:px-[8%] py-2 md:py-8 no-scrollbar scroll-smooth"
        >
          {movies.map((movie, index) => (
            <div key={movie.id} className="flex-shrink-0">
              <MovieCard
                movie={movie}
                rank={showRank ? index + 1 : undefined}
                onClick={onMovieClick}
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-crimson"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
