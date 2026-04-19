import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Bookmark, Loader2, ArrowLeft, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MovieCard from '@/components/MovieCard';
import MovieDetailModal from '@/components/MovieDetailModal';
import CustomPlayer from '@/components/CustomPlayer';
import { Movie } from '@/types';
import * as movieService from '@/services/movieService';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

export default function MyListPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [list, setList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetchWatchlist();
    } else if (isLoaded && !user) {
      router.push('/');
    }
  }, [user, isLoaded]);

  const fetchWatchlist = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('movie_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        setList(data.map((d: any) => d.movie_data));
      }
    } catch (error) {
      console.error("Watchlist error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (movie: Movie) => {
    const key = await movieService.fetchTrailer(movie.id, movie.type);
    setVideoKey(key);
    setPlaying(true);
  };

  return (
    <div className="min-h-screen bg-midnight pl-20 max-md:pl-0">
      <Head>
        <title>My List | nexplay</title>
      </Head>
      <Navbar />
      <Sidebar activeGenre={0} onGenreSelect={() => router.push('/')} />

      <main className="pt-32 px-[8%] pb-20">
        <div className="flex items-center gap-4 mb-12">
          <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight">My Cinematic List</h1>
            <p className="text-white/40 font-medium">Your curated universe of masterpieces</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-electric animate-spin" />
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Accessing your vault...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <AnimatePresence mode="popLayout">
              {list.length > 0 ? (
                list.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <MovieCard movie={movie} onClick={setSelectedMovie} />
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-40 text-center"
                >
                  <Bookmark className="w-20 h-20 text-white/5 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white/20">Your vault is currently empty</h3>
                  <button onClick={() => router.push('/')} className="mt-8 text-electric font-black uppercase tracking-[2px] text-xs hover:underline decoration-2 underline-offset-8">
                    Discover Masterpieces
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      <MovieDetailModal 
        movie={selectedMovie} 
        onClose={() => setSelectedMovie(null)} 
        onPlay={handlePlay}
        onWatchNow={handlePlay}
      />

      <AnimatePresence>
        {playing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4 lg:p-10"
          >
            <div className="relative w-full max-w-[1400px] aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              <CustomPlayer 
                videoKey={videoKey} 
                onClose={() => setPlaying(false)} 
                title={selectedMovie?.title || "Now Playing"}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
