import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CirclePlay, X, Play, Plus } from 'lucide-react';
import { Movie } from '@/types';
import * as movieService from '@/services/movieService';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MovieCard from '@/components/MovieCard';
import MovieRow from '@/components/MovieRow';
import MovieDetailModal from '@/components/MovieDetailModal';
import CustomPlayer from '@/components/CustomPlayer';
import { supabase } from '@/lib/supabase';
import { Crown } from 'lucide-react';
import Head from 'next/head';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<Movie[]>([]);
  const [anime, setAnime] = useState<Movie[]>([]);
  const [recent, setRecent] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [genreResults, setGenreResults] = useState<Movie[]>([]);
  
  const [bollywoodMovies, setBollywoodMovies] = useState<Movie[]>([]);
  const [punjabiMovies, setPunjabiMovies] = useState<Movie[]>([]);
  const [southDubbedMovies, setSouthDubbedMovies] = useState<Movie[]>([]);
  
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [activeGenre, setActiveGenre] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});

  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const [curatedMovies, setCuratedMovies] = useState<Movie[]>([]);

  useEffect(() => {
    // Safety timeout: if loading takes too long, force it off
    const timer = setTimeout(() => {
      setLoading(false);
    }, 8000);

    async function loadData() {
      try {
        console.log("nexplay: Starting data load...");
        
        // CACHE LOGIC: Check if we have data in sessionStorage
        const cachedData = sessionStorage.getItem('nexplay_home_data');
        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            setGenreMap(parsed.genreMap || {});
            setCuratedMovies(parsed.curatedMovies || []);
            setMovies(parsed.movies || []);
            setTvShows(parsed.tvShows || []);
            setAnime(parsed.anime || []);
            setRecent(parsed.recent || []);
            setUpcoming(parsed.upcoming || []);
            setBollywoodMovies(parsed.bollywoodMovies || []);
            setPunjabiMovies(parsed.punjabiMovies || []);
            setSouthDubbedMovies(parsed.southDubbedMovies || []);
            setHeroMovie(parsed.heroMovie || null);
            setLoading(false);
            clearTimeout(timer);
            return;
        }

        const genes = await movieService.fetchGenres();
        setGenreMap(genes);

        // Fetch curated from Supabase
        const { data: supabaseData, error: supError } = await supabase.from('curated_movies').select('*').order('created_at', { ascending: false });
        
        let curated: Movie[] = [];
        if (!supError && supabaseData && supabaseData.length > 0) {
          const tmdbPromises = supabaseData.map(async (item: any) => {
            const data = await movieService.fetchMovies(`/${item.type}/${item.tmdb_id}?`, item.type, genes);
            if (data[0]) {
              return {
                ...data[0],
                youtube_link: item.youtube_link,
                drive_link: item.drive_link,
                category: item.category,
                is_prime: item.is_prime
              };
            }
            return null;
          });
          curated = (await Promise.all(tmdbPromises)).filter(Boolean) as Movie[];
          setCuratedMovies(curated || []);
        } else {
          setCuratedMovies([]);
        }

        console.log("nexplay: Fetching trending/upcoming...");
        const [m_trending, t, a, r, u, bw, pb, sd] = await Promise.all([
          movieService.fetchMovies('/discover/movie?sort_by=popularity.desc', 'movie', genes),
          movieService.fetchMovies('/discover/tv?sort_by=popularity.desc', 'tv', genes),
          movieService.fetchMovies('/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc', 'tv', genes),
          movieService.fetchMovies('/discover/movie?sort_by=primary_release_date.desc', 'movie', genes),
          movieService.fetchMovies('/discover/movie?sort_by=popularity.desc&primary_release_date.gte=' + new Date().toISOString().split('T')[0], 'movie', genes),
          movieService.fetchMovies('/discover/movie?with_original_language=hi&sort_by=popularity.desc', 'movie', genes),
          movieService.fetchMovies('/discover/movie?with_original_language=pa&sort_by=popularity.desc', 'movie', genes),
          movieService.fetchMovies('/discover/movie?with_original_language=te|ta|ml|kn&sort_by=popularity.desc', 'movie', genes),
        ]);

        const moviesToUse = curated.length > 0 ? curated : m_trending;
        const randomHero = moviesToUse[Math.floor(Math.random() * Math.min(moviesToUse.length, 10))];

        setMovies(moviesToUse);
        setTvShows(t);
        setAnime(a);
        setRecent(r);
        setUpcoming(u);
        setBollywoodMovies(bw);
        setPunjabiMovies(pb);
        setSouthDubbedMovies(sd);
        setHeroMovie(randomHero);
        
        // Save to cache
        sessionStorage.setItem('nexplay_home_data', JSON.stringify({
            genreMap: genes,
            curatedMovies: curated,
            movies: moviesToUse,
            tvShows: t,
            anime: a,
            recent: r,
            upcoming: u,
            bollywoodMovies: bw,
            punjabiMovies: pb,
            southDubbedMovies: sd,
            heroMovie: randomHero
        }));

        console.log("nexplay: Load complete");
        setLoading(false);
        clearTimeout(timer);
      } catch (err) {
        console.error("nexplay: Failed to load app data", err);
        setCuratedMovies([]); // ensure it's always an array
        setLoading(false);
        clearTimeout(timer);
      }
    }
    loadData();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeGenre === 0) {
      setGenreResults([]);
      setPage(1);
    } else {
      setPage(1);
      setLoadingMore(true);
      let endpoint = `/discover/movie?with_genres=${activeGenre}&sort_by=popularity.desc&page=1`;
      if (activeGenre === 10001) {
        endpoint = '/discover/movie?with_original_language=hi&sort_by=popularity.desc&page=1';
      }
      movieService.fetchMovies(endpoint, 'movie', genreMap).then(res => {
        setGenreResults(res);
        setLoadingMore(false);
      });
    }
  }, [activeGenre, genreMap]);

  const loadMoreCategory = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    let endpoint = `/discover/movie?with_genres=${activeGenre}&sort_by=popularity.desc&page=${nextPage}`;
    if (activeGenre === 10001) {
      endpoint = `/discover/movie?with_original_language=hi&sort_by=popularity.desc&page=${nextPage}`;
    }
    movieService.fetchMovies(endpoint, 'movie', genreMap).then(res => {
      setGenreResults(prev => [...prev, ...res]);
      setPage(nextPage);
      setLoadingMore(false);
    });
  };

  const handlePlay = async (movie: Movie) => {
    const key = await movieService.fetchTrailer(movie.id, movie.type);
    setVideoKey(key);
    setPlaying(true);
  };

  const [directUrl, setDirectUrl] = useState<string | null>(null);

  const handlePlayFull = (link: string) => {
    setVideoKey(null);
    setDirectUrl(null);
    setPlaying(true);
    
    // Check if YouTube
    if (link.includes('youtube.com') || link.includes('youtu.be')) {
      let id = link;
      if (link.includes('v=')) id = link.split('v=')[1].split('&')[0];
      else if (link.includes('be/')) id = link.split('be/')[1].split('?')[0];
      setVideoKey(id.length > 20 ? null : id);
    } else {
      setDirectUrl(link);
    }
  };

  const handleDrive = (movie: Movie) => {
    if (!movie.is_prime) {
      if (movie.drive_link) handlePlayFull(movie.drive_link);
      return;
    }

    const confirmSub = confirm("📋 nexplay Prime Access Required\n\nThis high-quality stream is exclusive to Prime members. Would you like to use your Prime subscription to start the play?");
    
    if (confirmSub) {
      if (movie.drive_link) {
        handlePlayFull(movie.drive_link);
      }
    } else {
      alert("Please upgrade your account to access Prime content.");
    }
  };

  return (
    <>
      <Head>
        <title>nexplay | Stream Your World</title>
        <meta name="description" content="Ultimate destination for streaming movies and TV shows." />
        <link rel="icon" href="https://api.iconify.design/lucide:play-circle.svg?color=%23ff2b6d" />
      </Head>
      <div className="min-h-screen bg-midnight pl-20 max-md:pl-0 max-md:pb-20">
        <Sidebar activeGenre={activeGenre} onGenreSelect={setActiveGenre} />
        <Navbar />

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-midnight flex flex-col items-center justify-center"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center flex justify-center items-center"
              >
                <div className="nexplay-loader">
                  <span>N</span>
                  <span>E</span>
                  <span>X</span>
                  <span>P</span>
                  <span>L</span>
                  <span>A</span>
                  <span>Y</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="relative">
          <div 
            className="fixed inset-0 z-[-1] blur-[80px] brightness-[0.4] opacity-50 transition-all duration-1000 scale-125 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroMovie?.image})` }}
          />

          {activeGenre === 0 ? (
            <>
              <div id="homeSection">
                <Hero movie={heroMovie} onMoreInfo={setSelectedMovie} />
              </div>
              <div className="-mt-32 relative z-10 pb-20">
                {/* Curated Regional Rows */}
                {['Bollywood', 'Hollywood', 'South Indian', 'Punjabi'].map(cat => {
                  const filtered = (curatedMovies || []).filter(m => m.category === cat);
                  if (filtered.length === 0) return null;
                  return (
                    <div key={cat}>
                      <MovieRow 
                        title={`BEST OF ${cat.toUpperCase()}`} 
                        movies={filtered} 
                        onMovieClick={setSelectedMovie} 
                      />
                    </div>
                  );
                })}

                <div id="moviesSection">
                  <MovieRow title="TOP 10 TRENDING" movies={movies.slice(0, 15)} showRank onMovieClick={setSelectedMovie} />
                </div>
                <div id="recentSection">
                  <MovieRow title="JUST ARRIVED" movies={recent} onMovieClick={setSelectedMovie} />
                </div>
                <div id="tvshowsSection">
                  <MovieRow title="TRENDING TV SHOWS" movies={tvShows} onMovieClick={setSelectedMovie} />
                </div>
                <div id="animeSection">
                  <MovieRow title="TRENDING ANIME" movies={anime} onMovieClick={setSelectedMovie} />
                </div>
                <div id="upcomingSection">
                  <MovieRow title="UPCOMING MOVIES" movies={upcoming} onMovieClick={setSelectedMovie} />
                </div>
                <div id="bollywoodSection">
                  <MovieRow title="BOLLYWOOD MOVIES" movies={bollywoodMovies} onMovieClick={setSelectedMovie} />
                </div>
                <div id="punjabiSection">
                  <MovieRow title="PUNJABI MOVIES" movies={punjabiMovies} onMovieClick={setSelectedMovie} />
                </div>
                <div id="southDubbedSection">
                  <MovieRow title="SOUTH HINDI DUBBED MOVIES" movies={southDubbedMovies} onMovieClick={setSelectedMovie} />
                </div>
              </div>
            </>
          ) : (
            <div className="pt-32 pb-20 px-[5%] lg:px-[8%]">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 flex items-center gap-6"
              >
                <span className="w-1.5 h-12 bg-amaranth shadow-[0_0_15px_theme(colors.amaranth)]" />
                <div>
                  <span className="text-electric text-[10px] font-bold uppercase tracking-[4px] block mb-2">Category</span>
                  <h2 className="text-4xl lg:text-5xl font-extrabold uppercase tracking-tighter">
                    {activeGenre === 10001 ? 'Bollywood Movies' : genreMap[activeGenre]}
                  </h2>
                </div>
              </motion.div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-16 justify-items-center">
                {genreResults.map((m, idx) => (
                  <div key={`${m.id}-${idx}`}>
                    <MovieCard 
                      movie={m} 
                      onClick={setSelectedMovie} 
                    />
                  </div>
                ))}
              </div>

              {genreResults.length === 0 && !loadingMore && (
                <div className="py-20 text-center opacity-40 italic">
                  Scanning the cinematic universe for {activeGenre === 10001 ? 'Bollywood Movies' : genreMap[activeGenre]}...
                </div>
              )}

              {genreResults.length > 0 && (
                <div className="mt-16 flex justify-center">
                  <button 
                    onClick={loadMoreCategory}
                    disabled={loadingMore}
                    className="bg-electric text-white px-10 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 hover:bg-electric/80 hover:shadow-[0_0_20px_theme(colors.electric)] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    {loadingMore ? 'Loading More...' : 'Load More Movies'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        <MovieDetailModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
          onPlay={handlePlay}
          onWatchNow={handleDrive}
        />

        <AnimatePresence>
          {playing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4 lg:p-10"
            >
              <div className="relative w-full max-w-[1400px] aspect-video bg-black rounded-2xl shadow-[0_0_120px_rgba(92,22,46,0.3)] overflow-hidden">
                <CustomPlayer 
                  videoKey={videoKey} 
                  directUrl={directUrl} 
                  onClose={() => setPlaying(false)} 
                  title={selectedMovie?.title ? `NOW PLAYING: ${selectedMovie.title}` : "NOW PLAYING"}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="custom-footer-card">
          <h2>Join Our<br/>Newsletter</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email..." required />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        <footer id="footer" className="custom-footer">
          <div className="col col1">
            <h3>NexPlay</h3>
            <p>Made with <span style={{color: '#BA6573'}}>❤</span> by Suraj Mandhan</p>
            <div className="social">
              <a href="#" target="_blank" rel="noopener noreferrer" className="link"><img src="https://assets.codepen.io/9051928/codepen_1.png" alt="Codepen" /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="link"><img src="https://assets.codepen.io/9051928/x.png" alt="X" /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="link"><img src="https://assets.codepen.io/9051928/youtube_1.png" alt="Youtube" /></a>
            </div>
            <p style={{color: '#818181', fontSize: 'smaller', marginTop: '1rem'}}>2026 © All Rights Reserved</p>
          </div>
          <div className="col col2">
            <p onClick={() => document.getElementById('homeSection')?.scrollIntoView()}>Home</p>
            <p onClick={() => document.getElementById('moviesSection')?.scrollIntoView()}>Movie</p>
            <p onClick={() => document.getElementById('tvshowsSection')?.scrollIntoView()}>Tv Shows</p>
            <p>People</p>
          </div>
          <div className="col col3">
            <p>&nbsp;</p>
            <p>About us</p>
            <p>Contact us</p>
            <p>Request a movie</p>
            <p>Join Our Newsletter</p>
          </div>
          <div className="backdrop"></div>
        </footer>
      </div>
    </>
  );
}