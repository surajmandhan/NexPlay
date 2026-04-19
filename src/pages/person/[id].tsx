import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'motion/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MovieRow from '@/components/MovieRow';
import { fetchPersonDetails, config } from '@/services/movieService';
import { Movie } from '@/types';
import { Facebook, Instagram, Twitter, Youtube, Globe } from 'lucide-react';

export default function PersonDetails() {
  const router = useRouter();
  const { id } = router.query;
  
  const [person, setPerson] = useState<any>(null);
  const [knownFor, setKnownFor] = useState<Movie[]>([]);
  const [allCredits, setAllCredits] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('All'); // 'All', 'movie', 'tv'

  useEffect(() => {
    if (id) {
      const personId = (id as string).split('-')[0];
      fetchPersonDetails(personId).then((data) => {
        setPerson(data);
        
        if (data.combined_credits) {
          // Process known for slider
          if (data.combined_credits.cast) {
            const processedCredits = data.combined_credits.cast
              .filter((c: any) => c.poster_path)
              .sort((a: any, b: any) => b.popularity - a.popularity)
              .slice(0, 20)
              .map((c: any) => ({
                id: c.id,
                type: c.media_type || 'movie',
                title: c.title || c.name,
                description: c.overview,
                genre: 'N/A',
                year: (c.release_date || c.first_air_date || '').split('-')[0] || 'N/A',
                poster: `${config.image_base_url}/w500${c.poster_path}`,
                image: `${config.image_base_url}/original${c.backdrop_path || c.poster_path}`,
                rating: c.vote_average,
              }));
            setKnownFor(processedCredits);
          }

          // Process all credits for timeline
          const cast = (data.combined_credits.cast || []).map((c: any) => ({ ...c, department: 'Acting' }));
          const crew = data.combined_credits.crew || [];
          const combined = [...cast, ...crew].map(c => {
            const dateStr = c.release_date || c.first_air_date || '';
            return {
              id: c.id,
              credit_id: c.credit_id,
              title: c.title || c.name,
              media_type: c.media_type || 'movie',
              role: c.character || c.job || '',
              department: c.department || 'Unknown',
              year: dateStr ? parseInt(dateStr.split('-')[0]) : 0,
              episode_count: c.episode_count
            };
          });

          // Unique credits by credit_id
          const uniqueCredits = Array.from(new Map(combined.map(c => [c.credit_id, c])).values());
          uniqueCredits.sort((a, b) => b.year - a.year);
          
          setAllCredits(uniqueCredits);

          // Get unique departments
          const deps = Array.from(new Set(uniqueCredits.map(c => c.department))).sort();
          setDepartments(['All', ...deps]);
          
          // Set initial filter to known_for_department if available
          if (data.known_for_department && deps.includes(data.known_for_department)) {
            setDepartmentFilter(data.known_for_department);
          }
        }
        
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch person details", err);
        setLoading(false);
      });
    }
  }, [id]);

  const handleMovieClick = (movie: Movie | any) => {
    router.push(`/movie/${movie.media_type || movie.type}/${movie.id}`);
  };

  const calculateAge = (birthday: string, deathday?: string) => {
    if (!birthday) return '';
    const birthDate = new Date(birthday);
    const endDate = deathday ? new Date(deathday) : new Date();
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const m = endDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-electric border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center">
        <h1 className="text-2xl">Person not found</h1>
      </div>
    );
  }

  const externalIds = person.external_ids || {};
  
  // Filter and Group Credits
  const filteredCredits = allCredits.filter(c => {
    if (departmentFilter !== 'All' && c.department !== departmentFilter) return false;
    if (mediaTypeFilter !== 'All' && c.media_type !== mediaTypeFilter) return false;
    return true;
  });

  const groupedCredits = filteredCredits.reduce((acc: any, curr: any) => {
    const year = curr.year || '—';
    if (!acc[year]) acc[year] = [];
    acc[year].push(curr);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedCredits).sort((a, b) => {
    if (a === '—') return -1;
    if (b === '—') return 1;
    return parseInt(b) - parseInt(a);
  });

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans pb-20 pl-20 max-md:pl-0">
      <Head>
        <title>{person.name} - nexplay</title>
      </Head>
      
      <Navbar />
      <Sidebar activeGenre={0} onGenreSelect={() => {}} />

      <div className="pt-24 px-[8%] pb-10">
        <div className="flex flex-col md:flex-row gap-10">
          
          {/* Left Column: Profile Image & Personal Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-[300px] flex-shrink-0"
          >
            {person.profile_path ? (
              <img 
                src={`${config.image_base_url}/w500${person.profile_path}`} 
                alt={person.name}
                className="w-full rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8),0_0_20px_rgba(92,22,46,0.4)]"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-white/5 rounded-xl flex items-center justify-center text-white/30">
                No Image Available
              </div>
            )}
            
            {/* Social Icons */}
            <div className="flex gap-4 mt-6 items-center flex-wrap">
              {externalIds.facebook_id && (
                <a href={`https://facebook.com/${externalIds.facebook_id}`} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition">
                  <Facebook className="w-6 h-6" />
                </a>
              )}
              {externalIds.twitter_id && (
                <a href={`https://twitter.com/${externalIds.twitter_id}`} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition">
                  <Twitter className="w-6 h-6" />
                </a>
              )}
              {externalIds.instagram_id && (
                <a href={`https://instagram.com/${externalIds.instagram_id}`} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition">
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {externalIds.tiktok_id && (
                <a href={`https://tiktok.com/@${externalIds.tiktok_id}`} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition">
                  <Globe className="w-6 h-6" />
                </a>
              )}
              {externalIds.youtube_id && (
                <a href={`https://youtube.com/${externalIds.youtube_id}`} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition">
                  <Youtube className="w-6 h-6" />
                </a>
              )}
            </div>
            
            <div className="mt-8 space-y-6 text-sm text-white/70">
              <h3 className="text-white font-bold text-xl mb-2">Personal Info</h3>
              
              <div>
                <span className="block font-bold text-white/90">Known For</span>
                <span>{person.known_for_department}</span>
              </div>
              
              <div>
                <span className="block font-bold text-white/90">Known Credits</span>
                <span>{allCredits.length}</span>
              </div>
              
              <div>
                <span className="block font-bold text-white/90">Gender</span>
                <span>{person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : 'Not specified'}</span>
              </div>
              
              {person.birthday && (
                <div>
                  <span className="block font-bold text-white/90">Birthdate</span>
                  <span>{formatDate(person.birthday)} ({calculateAge(person.birthday, person.deathday)} years old)</span>
                </div>
              )}

              {person.deathday && (
                <div>
                  <span className="block font-bold text-white/90">Day of Death</span>
                  <span>{formatDate(person.deathday)}</span>
                </div>
              )}
              
              {person.place_of_birth && (
                <div>
                  <span className="block font-bold text-white/90">Place of Birth</span>
                  <span>{person.place_of_birth}</span>
                </div>
              )}

              {person.also_known_as && person.also_known_as.length > 0 && (
                <div>
                  <span className="block font-bold text-white/90 mb-1">Also Known As</span>
                  <div className="flex flex-col gap-1">
                    {person.also_known_as.map((name: string, index: number) => (
                      <span key={index}>{name}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="block font-bold text-white/90 mb-1">Content Score</span>
                <div className="bg-white/10 rounded-md py-1 px-3 inline-block font-bold text-white border border-white/20">
                  100
                </div>
              </div>

            </div>
          </motion.div>

          {/* Right Column: Details & Credits */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-grow max-w-[900px]"
          >
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-8">{person.name}</h1>
            
            {person.biography && (
              <div className="mb-10">
                <h3 className="text-xl font-bold mb-4">Biography</h3>
                <p className="text-white/70 leading-relaxed whitespace-pre-line text-base">
                  {person.biography}
                </p>
              </div>
            )}

            {knownFor.length > 0 && (
              <div className="-ml-[8%] mb-10 w-[100vw] md:w-auto overflow-hidden">
                <MovieRow 
                  title="Known For" 
                  movies={knownFor} 
                  onMovieClick={handleMovieClick} 
                />
              </div>
            )}

            {/* Acting/Credits Section */}
            <div className="mt-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-2xl font-bold">Acting & Credits</h3>
                
                {/* Filters */}
                <div className="flex gap-4 flex-wrap">
                  <select 
                    className="bg-black border border-white/20 text-white rounded-md px-3 py-2 outline-none focus:border-electric"
                    value={mediaTypeFilter}
                    onChange={(e) => setMediaTypeFilter(e.target.value)}
                  >
                    <option value="All">All Media</option>
                    <option value="movie">Movies</option>
                    <option value="tv">TV Shows</option>
                  </select>

                  <select 
                    className="bg-black border border-white/20 text-white rounded-md px-3 py-2 outline-none focus:border-electric"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    {departments.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Timeline Table */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-xl mb-10">
                {sortedYears.length === 0 ? (
                  <div className="p-8 text-center text-white/50">No credits found for selected filters.</div>
                ) : (
                  sortedYears.map((year, yearIndex) => (
                    <div key={year} className={`flex flex-col ${yearIndex !== 0 ? 'border-t border-white/10' : ''}`}>
                      {groupedCredits[year].map((credit: any, creditIndex: number) => (
                        <div 
                          key={credit.credit_id} 
                          className="flex items-start md:items-center p-4 hover:bg-white/10 transition group cursor-pointer"
                          onClick={() => handleMovieClick(credit)}
                        >
                          <div className="w-16 font-bold text-white/50 text-center flex-shrink-0">
                            {creditIndex === 0 ? year : ''}
                          </div>
                          
                          <div className="w-2 h-2 rounded-full bg-electric/50 mx-4 hidden md:block opacity-0 group-hover:opacity-100 transition" />
                          
                          <div className="flex-grow">
                            <span className="font-bold text-white group-hover:text-electric transition">{credit.title}</span>
                            {credit.role && (
                              <span className="text-white/50 block md:inline md:ml-2">
                                <span className="hidden md:inline mr-1">as</span> 
                                {credit.role}
                              </span>
                            )}
                            {credit.episode_count && (
                              <span className="text-white/40 text-sm block">
                                ({credit.episode_count} episode{credit.episode_count > 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}