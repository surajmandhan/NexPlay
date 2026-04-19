import { Home, Film, Laugh, Ghost, Rocket, Clapperboard } from 'lucide-react';

const GENRES = [
  { id: 0, name: 'Home', icon: Home, tooltip: 'Return to Epicenter' },
  { id: 10001, name: 'Bollywood Movies', icon: Film, tooltip: 'Latest Bollywood' },
  { id: 18, name: 'Drama', icon: Clapperboard, tooltip: 'Witness the Emotion' },
  { id: 878, name: 'Sci-Fi', icon: Rocket, tooltip: 'Beyond the Stars' },
  { id: 27, name: 'Horror', icon: Ghost, tooltip: 'Survive the Darkness' },
  { id: 35, name: 'Comedy', icon: Laugh, tooltip: 'Prepare for Hysteria' },
];

interface SidebarProps {
  activeGenre: number;
  onGenreSelect: (id: number) => void;
}

export default function Sidebar({ activeGenre, onGenreSelect }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-[100vh] w-20 bg-midnight/95 border-r border-white/10 flex flex-col items-center pt-[120px] z-[1001] backdrop-blur-md max-md:bottom-0 max-md:top-auto max-md:w-full max-md:h-[60px] max-md:flex-row max-md:pt-0 max-md:justify-around max-md:border-r-0 max-md:border-t">
      {GENRES.map((genre) => {
        const Icon = genre.icon;
        return (
          <button
            key={genre.id}
            onClick={() => onGenreSelect(genre.id)}
            className={`
              relative w-[50px] h-[50px] rounded-xl flex items-center justify-center mb-6 max-md:mb-0 transition-all duration-300
              ${activeGenre === genre.id 
                ? 'bg-gradient-to-br from-electric to-violet-800 text-white shadow-[0_0_15px_rgba(92,22,46,0.5)]' 
                : 'text-white/40 hover:bg-white/5 hover:text-white hover:translate-x-1 max-md:hover:translate-x-0'}
            `}
            title={genre.tooltip}
          >
            <Icon className="w-6 h-6" />
            <span className="absolute left-[70px] bg-crimson px-2 py-1 rounded text-[10px] opacity-0 pointer-events-none transition-opacity whitespace-nowrap shadow-xl max-md:hidden group-hover:opacity-100">
              {genre.name}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
