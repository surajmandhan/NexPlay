import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Plus, Crown, Info, Check } from 'lucide-react';
import { Movie } from '@/types';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  onWatchNow: (movie: Movie) => void;
  onAddToList?: (movie: Movie) => void;
}

export default function MovieDetailModal({ movie, onClose, onPlay, onWatchNow, onAddToList }: MovieDetailModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const [inList, setInList] = useState(false);

  const handleContainerClick = () => {
    if (movie) {
      router.push(`/movie/${movie.type}/${movie.id}`);
      onClose();
    }
  };

  useEffect(() => {
    if (user && movie) {
      supabase.from('user_watchlist').select('id').eq('user_id', user.id).eq('movie_id', movie.id).single()
        .then(({ data }) => setInList(!!data));
    }
  }, [user, movie]);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to use your personal Watchlist!");
      return;
    }

    if (inList) {
      await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', movie?.id);
      setInList(false);
    } else {
      // Check limit of 20 movies
      const { count } = await supabase.from('user_watchlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      if (count !== null && count >= 20) {
        alert("Aap 20 se jyada movies save nahi kar sakte hain. Nayi movie add karne ke liye pehle My List se kuch movies remove karein.");
        return;
      }
      await supabase.from('user_watchlist').insert({
        user_id: user.id,
        movie_id: movie?.id,
        movie_type: movie?.type,
        movie_data: movie
      });
      setInList(true);
    }
  };

  return (
    <AnimatePresence>
      {movie && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-[1000px] flex max-md:flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-[#0a0a0b] cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              handleContainerClick();
            }}
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-5 right-5 z-20 p-2 rounded-full bg-black/40 hover:bg-white/10 transition-colors border border-white/10"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            <div className="w-[45%] max-md:w-full h-[550px] max-md:h-[300px] relative overflow-hidden">
              <img 
                src={movie.poster} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                referrerPolicy="no-referrer"
                alt={movie.title}
              />
              <div className="absolute inset-0 bg-gradient-to-r max-md:bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent" />
            </div>

            <div className="w-[55%] max-md:w-full p-12 flex flex-col justify-center relative">
              <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-30 transition-opacity">
                <Info className="w-24 h-24" />
              </div>

              <h2 className="text-4xl max-md:text-2xl font-black uppercase tracking-tighter mb-4 text-white">
                {movie.title}
              </h2>
              
              <div className="flex items-center gap-4 text-xs font-bold mb-8 text-white/50 bg-white/5 w-fit px-4 py-2 rounded-full border border-white/5">
                <span className="text-green-500 font-black">{(movie.rating * 10).toFixed(0)}% Match</span>
                <span>{movie.year}</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-[8px] tracking-[2px]">4K HDR</span>
                <span className="text-electric">{movie.genre}</span>
              </div>

              <p className="text-white/60 leading-relaxed mb-10 text-sm line-clamp-4 font-medium italic">
                {movie.description}
              </p>

              <div className="flex flex-wrap gap-4 relative z-10">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(movie);
                  }}
                  className="bg-white text-black px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xl shadow-white/5 text-xs"
                >
                  <Play className="w-4 h-4 fill-current" /> Play Trailer
                </button>
                
                {movie.drive_link && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onWatchNow(movie);
                    }}
                    className="bg-electric px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 relative overflow-hidden group shadow-xl shadow-electric/20 text-xs"
                  >
                    <Crown className="w-4 h-4 text-white" />
                    Watch Now
                  </button>
                )}

                <button 
                  onClick={toggleWatchlist}
                  className="p-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white"
                >
                  {inList ? <Check className="w-6 h-6 text-electric" /> : <Plus className="w-6 h-6" />}
                </button>
              </div>

              <div className="mt-8 text-[9px] font-black uppercase tracking-[3px] text-white/20 italic group-hover:text-electric transition-colors">
                Click anywhere for full universe details
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
