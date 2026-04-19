import { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Save, Trash2, Home, LayoutDashboard, 
  Film, Filter, Pen, X, ChevronRight, CircleCheck, 
  CircleAlert, Crown, Globe, Zap
} from 'lucide-react';
import { fetchMovies, fetchGenres } from '@/services/movieService';
import { Movie } from '@/types';
import { supabase, CuratedMovie } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import Head from 'next/head';
import { useRouter } from 'next/router';

type AdminView = 'dashboard' | 'listings' | 'add';

const CATEGORIES = ['Bollywood', 'Hollywood', 'South Indian', 'Punjabi', 'Others'];

function AdminContent() {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [curatedList, setCuratedList] = useState<CuratedMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tmdbSearch, setTmdbSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tmdbResults, setTmdbResults] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [ytLink, setYtLink] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isPrime, setIsPrime] = useState(false);
  
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGenres().then(setGenreMap);
    loadCurated();

    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (tmdbSearch && activeView === 'add') {
        handleTmdbSearch();
      } else {
        setTmdbResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [tmdbSearch, activeView]);

  const loadCurated = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('curated_movies').select('*').order('created_at', { ascending: false });
    if (!error) setCuratedList(data || []);
    setLoading(false);
  };

  const handleTmdbSearch = async () => {
    if (!tmdbSearch) return;
    setLoading(true);
    const data = await fetchMovies(`/search/movie?query=${encodeURIComponent(tmdbSearch)}`, 'movie', genreMap);
    setTmdbResults(data);
    setShowSuggestions(true);
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedMovie(null);
    setYtLink('');
    setDriveLink('');
    setCategory(CATEGORIES[0]);
    setIsPrime(false);
    setIsEditing(false);
    setEditingId(null);
    setTmdbResults([]);
    setTmdbSearch('');
  };

  const handleSave = async () => {
    if (!selectedMovie && !isEditing) return;
    
    setLoading(true);
    const payload = {
      tmdb_id: isEditing ? undefined : selectedMovie?.id,
      title: isEditing ? undefined : selectedMovie?.title,
      type: isEditing ? undefined : selectedMovie?.type,
      youtube_link: ytLink,
      drive_link: driveLink,
      category,
      is_prime: isPrime
    };

    let error;
    if (isEditing && editingId) {
      const { error: err } = await supabase.from('curated_movies').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('curated_movies').upsert(payload, { onConflict: 'tmdb_id' });
      error = err;
    }

    if (!error) {
      alert(isEditing ? "Updated successfully!" : "Added successfully!");
      resetForm();
      setActiveView('listings');
      loadCurated();
    } else {
      console.error(error);
      alert("Error saving movie.");
    }
    setLoading(false);
  };

  const handleEdit = (item: CuratedMovie) => {
    setIsEditing(true);
    setEditingId(item.id);
    setYtLink(item.youtube_link || '');
    setDriveLink(item.drive_link || '');
    setCategory(item.category || CATEGORIES[0]);
    setIsPrime(item.is_prime || false);
    setSelectedMovie({ title: item.title } as any); // Mock for UI display
    setActiveView('add');
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this movie from listings?")) return;
    const { error } = await supabase.from('curated_movies').delete().eq('id', id);
    if (!error) loadCurated();
  };

  const filteredList = curatedList.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // @ts-ignore
  const isConfigMissing = !(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL) || !(process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.VITE_TMDB_API_KEY);

  return (
    <div className="fixed inset-0 z-[5000] bg-midnight flex text-white font-sans">
      <Head>
        <title>Admin Portal | nexplay</title>
        <link rel="icon" href="https://api.iconify.design/lucide:play-circle.svg?color=%23ff2b6d" />
      </Head>
      
      {/* CONFIG WARNING MODAL */}
      {isConfigMissing && (
        <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6">
            <CircleAlert className="w-20 h-20 text-red-500 mx-auto animate-bounce" />
            <h2 className="text-3xl font-black">CREDENTIALS MISSING</h2>
            <p className="text-white/60 leading-relaxed">
              Environment variables are missing. Please check your setup.
            </p>
            <button 
              onClick={() => router.push('/')} 
              className="btn-primary w-full py-4 uppercase font-bold tracking-widest"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
      {/* SIDEBAR */}
      <aside className="w-80 bg-violet-900/30 backdrop-blur-3xl border-r border-white/5 flex flex-col p-8">
        <div className="mb-12 flex items-center gap-3">
          <div className="w-10 h-10 bg-electric rounded-xl flex items-center justify-center shadow-neon">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter italic">ADMIN PANEL</span>
        </div>

        <nav className="space-y-4 flex-1">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeView === 'dashboard' ? 'bg-electric text-white shadow-neon' : 'hover:bg-white/5 text-white/40'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-bold">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveView('listings')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeView === 'listings' ? 'bg-electric text-white shadow-neon' : 'hover:bg-white/5 text-white/40'}`}
          >
            <Film className="w-5 h-5" />
            <span className="font-bold">Movies Library</span>
          </button>
        </nav>

        <div className="mt-auto space-y-4">
          <button 
            onClick={() => { resetForm(); setActiveView('add'); }}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4"
          >
            <Plus className="w-5 h-5" /> Add New
          </button>
          <button onClick={() => router.push('/')} className="w-full flex items-center justify-center gap-2 py-4 text-white/40 hover:text-white transition-colors">
            <Home className="w-5 h-5" /> Exit Portal
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-midnight via-midnight to-violet-900/20 p-12">
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <header>
                <h1 className="text-5xl font-black tracking-tighter mb-2">DASHBOARD OVERVIEW</h1>
                <p className="text-white/40">Real-time statistics of your curated cinema library.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card p-10 rounded-[32px] border-l-4 border-l-electric">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-widest block mb-4">Total Movies</span>
                  <div className="text-6xl font-black">{curatedList.length}</div>
                </div>
                <div className="glass-card p-10 rounded-[32px] border-l-4 border-l-amaranth">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-widest block mb-4">Prime Content</span>
                  <div className="text-6xl font-black">{curatedList.filter(m => m.is_prime).length}</div>
                </div>
                <div className="glass-card p-10 rounded-[32px] border-l-4 border-l-blue-500">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-widest block mb-4">Storage Used</span>
                  <div className="text-6xl font-black">12.4<span className="text-xl">GB</span></div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-[32px] overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-electric/10 blur-[100px] pointer-events-none" />
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-electric" /> Regional Distribution
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {CATEGORIES.map(cat => (
                    <div key={cat} className="p-6 bg-white/5 rounded-2xl">
                      <div className="text-xs text-white/40 mb-1">{cat}</div>
                      <div className="text-2xl font-bold">{curatedList.filter(m => m.category === cat).length}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'listings' && (
            <motion.div 
              key="listings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-5xl font-black tracking-tighter mb-2">MOVIES LIBRARY</h1>
                  <p className="text-white/40">Manage your existing theater listings.</p>
                </div>
                <div className="relative w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <input 
                    type="text" 
                    placeholder="Search by title or category..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-electric transition-all"
                  />
                </div>
              </header>

              <div className="grid grid-cols-1 gap-4">
                {filteredList.map(item => (
                  <div key={item.id} className="glass-card p-6 rounded-3xl flex items-center gap-8 group hover:border-electric/30 transition-all">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
                      <Film className="w-8 h-8 text-white/20" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold">{item.title}</h3>
                        {item.is_prime && <Crown className="w-4 h-4 text-yellow-400" />}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs bg-electric/10 text-electric px-3 py-1 rounded-full font-bold uppercase">{item.category}</span>
                        <span className="text-xs text-white/40 italic">Added {new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-4 rounded-2xl bg-white/5 hover:bg-electric/20 text-white/60 hover:text-electric transition-all"
                      >
                        <Pen className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-4 rounded-2xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'add' && (
            <motion.div 
              key="add"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl"
            >
              <header className="mb-12">
                <h1 className="text-5xl font-black tracking-tighter mb-2">{isEditing ? 'UPDATE MOVIE' : 'ADD TO THEATER'}</h1>
                <p className="text-white/40">Connect real links and metadata to your streaming portal.</p>
              </header>

              <div className="space-y-12">
                {!isEditing && (
                  <div className="glass-card p-10 rounded-[32px] space-y-6 relative">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                      <span className="w-2 h-2 bg-electric rounded-full animate-pulse" />
                      Step 1: Search TMDb Metadata
                    </h2>
                    <div className="relative group/search" ref={suggestionRef}>
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                          <input 
                            type="text" 
                            value={tmdbSearch}
                            onChange={e => {
                              setTmdbSearch(e.target.value);
                              setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="Type movie title for suggestions..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-electric transition-all"
                          />
                        </div>
                        <button onClick={handleTmdbSearch} className="btn-primary px-8" disabled={loading}>
                          {loading ? 'Searching...' : 'Search'}
                        </button>
                      </div>

                      <AnimatePresence>
                        {showSuggestions && tmdbResults.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            className="absolute z-[100] left-0 right-0 top-full mt-2 bg-violet-900 border border-white/10 rounded-2xl shadow-2xl max-h-[440px] overflow-y-auto no-scrollbar origin-top"
                          >
                            {tmdbResults.map(m => (
                              <div 
                                key={m.id} 
                                onClick={() => {
                                  setSelectedMovie(m);
                                  setShowSuggestions(false);
                                  setTmdbSearch(m.title);
                                }}
                                className="flex gap-4 p-4 hover:bg-electric/20 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                              >
                                <img src={m.poster} className="w-14 h-20 rounded-lg object-cover shadow-lg" alt={m.title} />
                                <div className="flex flex-col justify-center">
                                  <h4 className="font-bold text-white group-hover:text-electric transition-colors leading-tight mb-1">{m.title}</h4>
                                  <p className="text-xs text-white/40">{m.year} • {m.genre}</p>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {selectedMovie && !isEditing && (
                      <div className="flex items-center gap-4 p-4 bg-electric/10 border border-electric/30 rounded-2xl">
                        <CircleCheck className="w-5 h-5 text-electric" />
                        <span className="font-bold">Selected: {selectedMovie.title}</span>
                      </div>
                    )}
                  </div>
                )}

                {(selectedMovie || isEditing) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-10 rounded-[40px] border-electric/30"
                  >
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedMovie?.title}</h2>
                        <p className="text-white/40 text-sm">Now configuring streaming links and attributes.</p>
                      </div>
                      {!isEditing && (
                        <button onClick={resetForm} className="text-white/20 hover:text-white transition-colors">
                          <X className="w-6 h-6" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-8">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[3px] text-electric block mb-4">YouTube Full Movie</label>
                          <input 
                            type="text" 
                            value={ytLink}
                            onChange={e => setYtLink(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-electric"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[3px] text-electric block mb-4">Google Drive / File Link</label>
                          <input 
                            type="text" 
                            value={driveLink}
                            onChange={e => setDriveLink(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-electric"
                          />
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[3px] text-electric block mb-4">Content Category</label>
                          <div className="grid grid-cols-2 gap-3">
                            {CATEGORIES.map(cat => (
                              <button 
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${category === cat ? 'bg-electric border-electric' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[3px] text-electric block mb-4">Subscription Model</label>
                          <div className="flex gap-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${!isPrime ? 'border-electric bg-electric/20' : 'border-white/20'}`}>
                                {!isPrime && <div className="w-2.5 h-2.5 bg-electric rounded-full" />}
                              </div>
                              <input type="radio" checked={!isPrime} onChange={() => setIsPrime(false)} className="hidden" />
                              <span className={!isPrime ? 'text-white' : 'text-white/40'}>Free to All</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isPrime ? 'border-yellow-400 bg-yellow-400/20' : 'border-white/20'}`}>
                                {isPrime && <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />}
                              </div>
                              <input type="radio" checked={isPrime} onChange={() => setIsPrime(true)} className="hidden" />
                              <span className={isPrime ? 'text-yellow-400' : 'text-white/40'}>Prime Required</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
                      <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 btn-primary py-5 text-lg flex items-center justify-center gap-3"
                      >
                        {loading ? 'Optimizing Cinema...' : (isEditing ? 'Update Cinema Entry' : 'Finalize & Publish')}
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <button onClick={resetForm} className="px-8 btn-secondary">Discard</button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('admin_auth') === 'true') {
      setIsAuth(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('admins').select('*').eq('email', email).eq('password', password).single();
    
    if (data) {
      localStorage.setItem('admin_auth', 'true');
      setIsAuth(true);
    } else {
      alert('Invalid Admin Credentials! Check your email or password.');
    }
    setLoading(false);
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-white font-sans">
        <Head><title>Admin Login | nexplay</title></Head>
        <div className="glass-card p-10 rounded-[32px] w-full max-w-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-electric shadow-[0_0_20px_theme(colors.electric)]" />
          <h2 className="text-3xl font-black text-center mb-8 uppercase tracking-widest flex items-center justify-center gap-3">
            <Crown className="w-8 h-8 text-electric" /> Portal Access
          </h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[3px] text-white/50 mb-2 block">Admin Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-electric transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[3px] text-white/50 mb-2 block">Security Key</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-electric transition-colors" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-electric text-white py-4 rounded-xl font-black uppercase tracking-[2px] hover:scale-105 transition-transform flex justify-center items-center gap-2">
              {loading ? 'Verifying...' : 'Unlock Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminContent />
  );
}
