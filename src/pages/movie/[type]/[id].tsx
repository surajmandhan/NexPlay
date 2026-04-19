import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Share2, Star, Clock, Calendar, User, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MovieRow from '@/components/MovieRow';
import CustomPlayer from '@/components/CustomPlayer';
import { fetchFullDetails, fetchTrailer } from '@/services/movieService';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

export default function MovieDetails() {
  const router = useRouter();
  const { id, type } = router.query;
  
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const { user } = useUser();
  const [inList, setInList] = useState(false);

  const castRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && type) {
      fetchFullDetails(id as string, type as string).then(data => {
        setMovie(data);
        setLoading(false);
      });
    }
  }, [id, type]);

  useEffect(() => {
    if (user && movie) {
      supabase.from('user_watchlist').select('id').eq('user_id', user.id).eq('movie_id', movie.id).single()
        .then(({ data }) => setInList(!!data));
    }
  }, [user, movie]);

  const toggleWatchlist = async () => {
    if (!user) {
      alert("Please login to use your personal Watchlist!");
      return;
    }

    if (inList) {
      await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', movie?.id);
      setInList(false);
    } else {
      const { count } = await supabase.from('user_watchlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      if (count !== null && count >= 20) {
        alert("Aap 20 se jyada movies save nahi kar sakte hain. Nayi movie add karne ke liye pehle My List se kuch movies remove karein.");
        return;
      }
      await supabase.from('user_watchlist').insert({
        user_id: user.id,
        movie_id: movie?.id,
        movie_type: type,
        movie_data: {
          id: movie.id,
          type: type,
          title: movie.title || movie.name,
          description: movie.overview,
          poster: movie.poster,
          image: movie.image,
          rating: movie.vote_average,
          year: movie.year,
          genre: movie.genres
        }
      });
      setInList(true);
    }
  };

  const handlePlayTrailer = async () => {
    if (!movie) return;
    const key = await fetchTrailer(Number(id), type as 'movie' | 'tv');
    setVideoKey(key);
    setPlaying(true);
  };

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      ref.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-electric border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans pb-20 pl-20 max-md:pl-0">
      <Head>
        <title>{movie.title || movie.name} - nexplay</title>
      </Head>
      
      <Navbar />
      <Sidebar activeGenre={0} onGenreSelect={() => router.push('/')} />

      {/* Hero Section */}
      <div className="relative w-full min-h-[90vh] max-md:min-h-[60vh] pb-20">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent" />

        <div className="relative z-10 pt-[20vh] px-[8%] max-w-[800px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-6xl max-md:text-4xl font-black uppercase tracking-tighter mb-6 leading-tight">
              {movie.title || movie.name}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm font-bold mb-8 text-white/60">
              <div className="flex items-center gap-2 text-green-500">
                <Star className="w-4 h-4 fill-current" />
                <span>{(movie.vote_average * 10).toFixed(0)}% Match</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{movie.year}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : (movie.number_of_seasons ? `${movie.number_of_seasons} Seasons` : 'N/A')}</span>
              </div>
              <div className="px-2 py-1 bg-white/10 rounded text-[10px] tracking-widest border border-white/10">4K HDR</div>
            </div>

            <p className="text-lg text-white/70 leading-relaxed mb-10 line-clamp-4 font-medium">
              {movie.overview}
            </p>

            <div className="flex flex-wrap gap-5 items-center">
              <button onClick={handlePlayTrailer} className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform flex items-center gap-3">
                <Play className="w-4 h-4 fill-current" /> Watch Trailer
              </button>
              <button onClick={toggleWatchlist} className="bg-[#1a1a1b] border border-white/5 text-white px-5 py-4 rounded-2xl hover:bg-white/5 transition-all">
                {inList ? <Check className="w-6 h-6 text-electric" /> : <Plus className="w-6 h-6" />}
              </button>
              <button className="bg-[#1a1a1b] border border-white/5 text-white px-5 py-4 rounded-2xl hover:bg-white/5 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-[8%] -mt-20 relative z-20 flex gap-12 max-lg:flex-col">
        <div className="flex-1 space-y-16">
          <section>
            <div className="flex items-center gap-4 mb-8">
              <span className="w-1.5 h-8 bg-electric rounded-full shadow-[0_0_10px_theme(colors.electric)]" />
              <h3 className="text-2xl font-black uppercase tracking-widest">Top Cast</h3>
            </div>
            
            <div className="relative group">
              <button onClick={() => scroll(castRef, 'left')} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity hover:bg-electric flex items-center justify-center backdrop-blur-md">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              
              <div ref={castRef} className="flex gap-4 overflow-x-auto pb-6 scrollbar-none scroll-smooth px-2">
                {movie.credits?.cast?.slice(0, 15).map((person: any) => (
                  <div 
                    key={person.id} 
                    onClick={() => {
                      const slug = person.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      router.push(`/person/${person.id}-${slug}`);
                    }}
                    className="w-[140px] flex-shrink-0 group cursor-pointer"
                  >
                    <div className="h-[200px] rounded-2xl overflow-hidden border border-white/5 mb-3 bg-white/5 shadow-xl transition-transform group-hover:scale-105 duration-500">
                      {person.profile_path ? (
                        <img src={`https://image.tmdb.org/t/p/w276_and_h350_face${person.profile_path}`} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" alt={person.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900"><User className="w-10 h-10 text-white/20" /></div>
                      )}
                    </div>
                    <h4 className="font-bold text-sm truncate group-hover:text-electric transition-colors">{person.name}</h4>
                    <p className="text-xs text-white/40 truncate">{person.character}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => scroll(castRef, 'right')} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity hover:bg-electric flex items-center justify-center backdrop-blur-md">
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
          </section>
        </div>
      </div>

      {movie.recommendations?.results?.length > 0 && (
        <div className="mt-12 pb-20">
          <MovieRow 
            title={`IF YOU LIKED ${movie.title || movie.name}...`} 
            movies={movie.recommendations.results.slice(0, 15).map((rec: any) => ({
              id: rec.id,
              type: type as any,
              title: rec.title || rec.name,
              poster: `https://image.tmdb.org/t/p/w500${rec.poster_path}`,
              rating: rec.vote_average,
              year: (rec.release_date || rec.first_air_date)?.split('-')[0] || 'N/A',
              genre: 'Universe Choice',
              description: rec.overview,
              image: rec.backdrop_path ? `https://image.tmdb.org/t/p/w1280${rec.backdrop_path}` : 'https://picsum.photos/seed/movie/1920/1080'
            }))}
            onMovieClick={(m) => router.push(`/movie/${m.type}/${m.id}`)}
          />
        </div>
      )}

      <AnimatePresence>
        {playing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4 lg:p-10">
            <div className="relative w-full max-w-[1400px] aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              <CustomPlayer videoKey={videoKey} onClose={() => setPlaying(false)} title="Now Playing Trailer" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}