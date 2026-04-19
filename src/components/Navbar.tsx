import { CirclePlay, Search, Settings, Bookmark, Menu, X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { UserButton, useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const { isLoaded, user, isSignedIn } = useUser();

  // New state for mobile search toggle
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Update active nav based on scroll position if on home page
      if (router.pathname === '/') {
        const sections = ['homeSection', 'moviesSection', 'tvshowsSection', 'aboutSection', 'contactSection'];
        let current = '';
        sections.forEach(sectionId => {
          const section = document.getElementById(sectionId);
          if (section) {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= (sectionTop - 200)) {
              current = sectionId;
            }
          }
        });
        // You could use a state to track active link here if needed
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router.pathname]);

  // Sync Clerk User to Supabase Users table (Saves Email & Prime Status)
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const syncUser = async () => {
        const email = user.primaryEmailAddress?.emailAddress;
        if (email) {
          const { data } = await supabase.from('users').select('id').eq('id', user.id).single();
          if (!data) {
            await supabase.from('users').insert({ id: user.id, email: email, is_prime: false });
          }
        }
      };
      syncUser();
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setMobileSearchOpen(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const TMDB_API_KEY = 'bd9d2f67ef4b822e9119b69bbcae6810';
        const response = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=en-US`
        );
        const data = await response.json();
        
        const filtered = (data.results || [])
          .filter((m: any) => (m.media_type === 'movie' || m.media_type === 'tv') && m.poster_path)
          .slice(0, 5)
          .map((m: any) => ({
            id: m.id,
            title: m.title || m.name,
            genre: m.media_type === 'movie' ? 'Movie' : 'TV Show',
            thumbnail: `https://image.tmdb.org/t/p/w200${m.poster_path}`,
            type: m.media_type
          }));
          
        setSuggestions(filtered);
      } catch (error) {
        console.error("Suggestion error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
      setMobileMenuOpen(false);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 bg-midnight/90 backdrop-blur-[10px] rounded-[50px] px-[30px] py-[12px] border border-white/10 z-[2000] shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-[calc(100%-30px)] max-w-[1200px] flex items-center justify-between ml-10 max-md:ml-0 max-md:max-w-[500px] max-md:top-[15px] max-md:px-[20px] max-md:py-[10px]">
      
      {/* Left: Logo & Navigation Container */}
      <div className={`flex items-center gap-10 ${mobileSearchOpen ? 'max-md:opacity-0 max-md:pointer-events-none' : ''} transition-opacity duration-300`}>
        <Link href="/" className="text-[1.5rem] font-[800] text-white no-underline tracking-tight max-md:text-[1.3rem] flex items-center gap-2">
          <CirclePlay className="w-6 h-6 text-electric" />
          NexPlay
        </Link>
        
        <ul className={`flex list-none gap-[30px] items-center m-0 p-0 max-md:hidden`}>
          <li>
            <button 
              onClick={() => { router.push('/'); setMobileMenuOpen(false); }}
              className="text-white/80 no-underline font-[500] text-[0.95rem] transition-all duration-300 relative hover:text-white pb-1 border-b-2 border-transparent hover:border-white"
            >
              Home
            </button>
          </li>
          <li>
            <button 
              onClick={() => scrollTo('moviesSection')}
              className="text-white/80 no-underline font-[500] text-[0.95rem] transition-all duration-300 relative hover:text-white pb-1 border-b-2 border-transparent hover:border-white"
            >
              Movies
            </button>
          </li>
          <li>
            <button 
              onClick={() => scrollTo('tvshowsSection')}
              className="text-white/80 no-underline font-[500] text-[0.95rem] transition-all duration-300 relative hover:text-white pb-1 border-b-2 border-transparent hover:border-white"
            >
              Tv Shows
            </button>
          </li>
          <li>
            <button 
              onClick={() => scrollTo('aboutSection')}
              className="text-white/80 no-underline font-[500] text-[0.95rem] transition-all duration-300 relative hover:text-white pb-1 border-b-2 border-transparent hover:border-white"
            >
              About
            </button>
          </li>
          <li>
            <button 
              onClick={() => scrollTo('contactSection')}
              className="text-white/80 no-underline font-[500] text-[0.95rem] transition-all duration-300 relative hover:text-white pb-1 border-b-2 border-transparent hover:border-white"
            >
              Contact
            </button>
          </li>
        </ul>
      </div>

      {/* Right: Search & Actions */}
      <div className="flex items-center gap-[15px] max-md:hidden relative z-[2001]">
        
        {/* Search Field */}
        <div ref={searchRef} className="relative w-[200px] transition-all duration-500">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-white/5 border border-white/10 rounded-[25px] py-[6px] pl-9 pr-3 text-sm focus:bg-white/10 focus:border-white/30 outline-none transition-all placeholder:text-white/40 text-white"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-white/40 group-focus-within:text-white transition-colors pointer-events-none" />
          </form>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (searchQuery.length >= 2 || suggestions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-3 left-0 right-0 bg-midnight/95 backdrop-blur-xl border border-white/10 rounded-[15px] overflow-hidden shadow-2xl z-[2000]"
              >
                <div className="p-2">
                  {isSearching ? (
                    <div className="p-3 text-white/50 text-[10px] font-bold tracking-widest text-center">SEARCHING...</div>
                  ) : suggestions.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {suggestions.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            router.push(`/movie/${m.type}/${m.id}`);
                            setShowSuggestions(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-[10px] transition-all text-left group"
                        >
                          <img src={m.thumbnail} className="w-6 h-9 rounded object-cover" />
                          <div>
                            <div className="text-[12px] font-medium text-white/90 group-hover:text-white transition-colors line-clamp-1">{m.title}</div>
                            <div className="text-[9px] text-white/50 uppercase tracking-widest">{m.genre}</div>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                          setShowSuggestions(false);
                          setSearchQuery('');
                        }}
                        className="w-full mt-1 p-2 text-[11px] font-bold text-electric text-center hover:bg-white/5 rounded-[10px] transition-colors"
                      >
                        VIEW ALL RESULTS
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 text-[10px] text-white/50 font-bold text-center">NOT FOUND</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Auth Group */}
        <div className="flex items-center gap-3 relative z-[2001]">
          {!isLoaded ? null : !isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <span className="px-[20px] py-[8px] rounded-[25px] font-[500] text-[0.9rem] transition-all duration-300 text-white/90 border border-white/20 hover:text-white hover:border-white/40 hover:bg-white/5 whitespace-nowrap cursor-pointer z-[2002] inline-block">
                  Login
                </span>
              </SignInButton>
              <SignUpButton mode="modal">
                <span className="px-[20px] py-[8px] rounded-[25px] font-[500] text-[0.9rem] transition-all duration-300 bg-white text-black hover:bg-gray-200 hover:-translate-y-[1px] whitespace-nowrap cursor-pointer z-[2002] inline-block">
                  Sign Up
                </span>
              </SignUpButton>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/my-list" className="text-white/50 hover:text-white transition-colors">
                <Bookmark className="w-[18px] h-[18px]" />
              </Link>
              <Link href="/admin" className="text-white/50 hover:text-white transition-colors">
                <Settings className="w-[18px] h-[18px]" />
              </Link>
              <div className="relative z-[2005] pl-2 cursor-pointer pointer-events-auto">
                <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Right: Search & Actions */}
      <div className={`hidden max-md:flex items-center justify-end ${mobileSearchOpen ? 'absolute left-[20px] right-[20px]' : ''}`} ref={mobileSearchRef}>
        <AnimatePresence>
          {mobileSearchOpen && (
             <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex items-center bg-white/10 border border-white/20 rounded-[25px] w-full z-10 overflow-hidden relative"
              >
                <Search className="absolute left-3 w-[14px] h-[14px] text-white/40 pointer-events-none" />
                <form onSubmit={handleSearchSubmit} className="w-full">
                  <input 
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-transparent border-none py-[8px] pl-9 pr-3 text-sm outline-none text-white placeholder:text-white/40"
                    autoFocus
                  />
                </form>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Suggestions Dropdown */}
        <AnimatePresence>
          {mobileSearchOpen && showSuggestions && (searchQuery.length >= 2 || suggestions.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-[calc(100%+10px)] left-0 right-0 bg-midnight/95 backdrop-blur-xl border border-white/10 rounded-[15px] overflow-hidden shadow-2xl z-[2000]"
            >
              <div className="p-2">
                {isSearching ? (
                  <div className="p-3 text-white/50 text-[10px] font-bold tracking-widest text-center">SEARCHING...</div>
                ) : suggestions.length > 0 ? (
                  <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                    {suggestions.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          router.push(`/movie/${m.type}/${m.id}`);
                          setShowSuggestions(false);
                          setSearchQuery('');
                          setMobileSearchOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-[10px] transition-all text-left group"
                      >
                        <img src={m.thumbnail} className="w-6 h-9 rounded object-cover" />
                        <div>
                          <div className="text-[12px] font-medium text-white/90 group-hover:text-white transition-colors line-clamp-1">{m.title}</div>
                          <div className="text-[9px] text-white/50 uppercase tracking-widest">{m.genre}</div>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                        setShowSuggestions(false);
                        setSearchQuery('');
                        setMobileSearchOpen(false);
                      }}
                      className="w-full mt-1 p-2 text-[11px] font-bold text-electric text-center hover:bg-white/5 rounded-[10px] transition-colors"
                    >
                      VIEW ALL RESULTS
                    </button>
                  </div>
                ) : (
                  <div className="p-3 text-[10px] text-white/50 font-bold text-center">NOT FOUND</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!mobileSearchOpen && (
          <button 
            className="text-white bg-transparent border-none p-2 cursor-pointer rounded-full hover:bg-white/10"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="w-[20px] h-[20px]" />
          </button>
        )}
      </div>
    </nav>
  );
}
