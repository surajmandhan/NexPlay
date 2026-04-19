import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { fetchPopularPeople, config } from '@/services/movieService';

export default function PopularPeople() {
  const [people, setPeople] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadPeople(1);
  }, []);

  const loadPeople = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const data = await fetchPopularPeople(pageNum);
      if (data && data.results) {
        if (pageNum === 1) {
          setPeople(data.results);
        } else {
          setPeople(prev => [...prev, ...data.results]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch popular people", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPeople(nextPage);
  };

  const handlePersonClick = (person: any) => {
    const slug = `${person.id}-${person.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    router.push(`/person/${slug}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans pb-20 pl-20 max-md:pl-0">
      <Head>
        <title>Popular People - nexplay</title>
      </Head>
      
      <Navbar />
      <Sidebar activeGenre={0} onGenreSelect={() => {}} />

      <div className="pt-24 px-[8%] pb-10">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-8 text-white">
          Popular People
        </h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-electric border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {people.map((person) => (
                <div 
                  key={person.id} 
                  className="bg-white/5 rounded-xl overflow-hidden cursor-pointer hover:bg-white/10 transition group"
                  onClick={() => handlePersonClick(person)}
                >
                  <div className="aspect-[2/3] relative overflow-hidden bg-white/5">
                    {person.profile_path ? (
                      <img 
                        src={`${config.image_base_url}/w500${person.profile_path}`} 
                        alt={person.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold truncate">{person.name}</h3>
                    <p className="text-sm text-white/50 truncate mt-1">
                      {person.known_for_department}
                    </p>
                    <p className="text-xs text-white/40 truncate mt-2">
                      {person.known_for?.map((m: any) => m.title || m.name).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 flex justify-center">
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-electric text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-electric/80 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}