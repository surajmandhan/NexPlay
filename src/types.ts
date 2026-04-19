export interface Movie {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  description: string;
  genre: string;
  year: string;
  poster: string;
  image: string;
  rating: number;
  mp4?: string;
  youtube_link?: string;
  drive_link?: string;
  category?: string;
  is_prime?: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export interface AppConfig {
  base_url: string;
  image_base_url: string;
  language: string;
  sizes: {
    poster: string;
    thumb: string;
  };
}
