import { Movie, Genre, AppConfig } from '../types';

// @ts-ignore
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || 'bd9d2f67ef4b822e9119b69bbcae6810';
const BASE_URL = 'https://api.themoviedb.org/3';

export const config: AppConfig = {
  base_url: BASE_URL,
  image_base_url: 'https://image.tmdb.org/t/p',
  language: 'en-US',
  sizes: {
    poster: '/w500',
    thumb: '/original'
  }
};

const INDIAN_KEYWORDS = [
  "bollywood", "tollywood", "kollywood", "sandalwood", "mollywood",
  "tamil", "telugu", "hindi", "kannada", "malayalam", "bengali",
  "marathi", "punjabi", "mumbai", "delhi", "chennai", "hyderabad",
  "bangalore", "kolkata", "kerala", "veeran", "maadu", "pidi",
  "varisu", "thunivu", "vikram", "ponniyin", "salaar", "kalki",
  "pushpa", "kantara", "kgf", "rrr", "jailer", "leo", "beast",
  "don", "doctor", "master", "bigil", "mersal", "sarkar", "theri",
  "kaththi", "thuppakki", "devara", "kanguva", "kapoor", "khan"
];

const INDIAN_LANGS = ["hi", "te", "ta", "ml", "kn", "bn", "pa", "mr", "gu", "ur", "as", "or"];

function isIndianContent(item: any): boolean {
  const searchableText = ((item.title || item.name || "") + " " + (item.overview || "")).toLowerCase();
  return (
    INDIAN_KEYWORDS.some(keyword => searchableText.includes(keyword)) ||
    INDIAN_LANGS.includes(item.original_language)
  );
}

export async function fetchGenres(): Promise<Record<number, string>> {
  const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=${config.language}`);
  const data = await response.json();
  const map: Record<number, string> = {};
  data.genres.forEach((g: Genre) => {
    map[g.id] = g.name;
  });
  return map;
}

export async function fetchMovies(endpoint: string, type: 'movie' | 'tv' = 'movie', genreMap: Record<number, string>): Promise<Movie[]> {
  const response = await fetch(`${BASE_URL}${endpoint}&api_key=${API_KEY}&language=${config.language}`);
  const data = await response.json();
  
  return (data.results || [])
    .filter((item: any) => !!item.poster_path)
    .map((item: any) => ({
      id: item.id,
      type,
      title: type === 'movie' ? item.title : item.name,
      description: item.overview,
      genre: item.genre_ids
        ? item.genre_ids.map((id: number) => genreMap[id] || 'Unknown').slice(0, 2).join(', ')
        : 'Unknown',
      year: (type === 'movie' ? item.release_date : item.first_air_date)?.split('-')[0] || 'N/A',
      poster: `${config.image_base_url}${config.sizes.poster}${item.poster_path}`,
      image: item.backdrop_path
        ? `${config.image_base_url}${config.sizes.thumb}${item.backdrop_path}`
        : 'https://picsum.photos/seed/movie/1920/1080',
      rating: item.vote_average,
      mp4: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    }));
}

export async function fetchTrailer(id: number, type: 'movie' | 'tv'): Promise<string | null> {
  const response = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=${config.language}`);
  const data = await response.json();
  const ytVideos = (data.results || []).filter((v: any) => v.site === 'YouTube');
  const trailer = ytVideos.find((v: any) => v.type === 'Trailer') || ytVideos.find((v: any) => v.type === 'Teaser');
  return trailer ? trailer.key : null;
}

export async function fetchFullDetails(id: string, type: string) {
  const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits,videos,recommendations,similar,keywords,external_ids`);
  const data = await response.json();
  
  // Format the data to match our Movie type if needed, but we might want more detailed fields here
  return {
    ...data,
    poster: `${config.image_base_url}/original${data.poster_path}`,
    image: `${config.image_base_url}/original${data.backdrop_path}`,
    title: type === 'movie' ? data.title : data.name,
    year: (type === 'movie' ? data.release_date : data.first_air_date)?.split('-')[0] || 'N/A',
    genres: data.genres?.map((g: any) => g.name).join(', '),
  };
}

export async function fetchPersonDetails(id: string) {
  const response = await fetch(`${BASE_URL}/person/${id}?api_key=${API_KEY}&append_to_response=combined_credits,external_ids,images`);
  const data = await response.json();
  return data;
}

export async function fetchPopularPeople(page: number = 1) {
  const response = await fetch(`${BASE_URL}/person/popular?api_key=${API_KEY}&language=${config.language}&page=${page}`);
  const data = await response.json();
  return data;
}
