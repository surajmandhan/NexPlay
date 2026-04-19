import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="min-h-screen bg-[#110e1b] flex flex-col items-center justify-center text-white font-sans p-6 text-center">
      <h1 className="text-9xl font-black text-[#ff2b6d] drop-shadow-[0_0_30px_rgba(255,43,109,0.5)] mb-4">404</h1>
      <h2 className="text-3xl font-bold uppercase tracking-[4px] mb-8">Lost in the Universe</h2>
      <p className="text-white/50 max-w-md mb-12">
        The cinematic masterpiece you're looking for was either removed or lost in a black hole.
      </p>
      <Link href="/" className="bg-[#ff2b6d] px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,43,109,0.4)] hover:scale-105 transition-all">
        Return to Earth
      </Link>
    </div>
  );
}
