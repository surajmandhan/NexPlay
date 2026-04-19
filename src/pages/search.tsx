import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Search as SearchIcon, ArrowLeft, Loader2, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MovieCard from '@/components/MovieCard';
import MovieDetailModal from '@/components/MovieDetailModal';
import CustomPlayer from '@/components/CustomPlayer';
import { Movie } from '@/types';
import * as movieService from '@/services/movieService';
import { motion, AnimatePresence } from 'motion/react';

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (q) {
      setSearchTerm(q as string);
      handleSearch(q as string);
    }
  }, [q]);

  const handleSearch = async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    try {
      const TMDB_API_KEY = 'bd9d2f67ef4b822e9119b69bbcae6810';
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(term)}&language=en-US`
      );
      const data = await response.json();
      
      const mappedResults = (data.results || [])
        .filter((item: any) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path)
        .map((item: any) => ({
          id: item.id,
          type: item.media_type,
          title: item.title || item.name,
          description: item.overview,
          genre: item.media_type === 'movie' ? 'Movie' : 'TV Show',
          year: (item.release_date || item.first_air_date)?.split('-')[0] || 'N/A',
          poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          image: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'https://picsum.photos/seed/movie/1920/1080',
          rating: item.vote_average,
          mp4: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        }));
      
      setResults(mappedResults);
    } catch (error) {
      console.error("Search error:", error);
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
        <title>Search Results: {searchTerm} | nexplay</title>
      </Head>
      <Navbar />
      <Sidebar activeGenre={0} onGenreSelect={() => router.push('/')} />

      <main className="pt-32 px-[5%] md:px-[8%] pb-20">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="w-fit p-3 bg-white/5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all hidden md:block">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4 md:mb-2">Explore the Universe</h1>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchTerm.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
                }
              }}
              className="relative w-full max-w-3xl"
            >
              <input 
                type="text"
                placeholder="Search movies, tv shows, anime..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[30px] py-4 pl-14 pr-6 text-lg focus:bg-white/10 focus:border-white/30 outline-none transition-all placeholder:text-white/40 text-white shadow-2xl"
              />
              <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
            </form>
          </div>
        </div>

        {q && <p className="text-white/40 font-medium mb-8 text-sm md:text-base px-2">Results for: <span className="text-electric">{q}</span></p>}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 md:py-40 gap-4">
            <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-electric animate-spin" />
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] md:text-xs">Scanning the Universe...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-16 justify-items-center">
            <AnimatePresence mode="popLayout">
              {results.length > 0 ? (
                results.map((movie, index) => (
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
                  <SearchIcon className="w-20 h-20 text-white/5 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white/20">No matching cinematic adventures found</h3>
                  <button onClick={() => router.push('/')} className="mt-8 text-electric font-black uppercase tracking-[2px] text-xs hover:underline decoration-2 underline-offset-8">
                    Go Back Home
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
                title={selectedMovie?.title ? `Trailer: ${selectedMovie.title}` : "Now Playing Trailer"}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
