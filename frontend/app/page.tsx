// app/page.tsx
import Link from 'next/link';
import LogoIcon from './(components)/icons/LogoIcon';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#09090b] text-white">
      <div className="text-center mb-12">
        <LogoIcon  />
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end">
          Welcome
        </h1>
        <p className="text-gray-400 mt-3 text-base sm:text-lg">Choose your tool:</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4"> {/* Stacked on small, side-by-side on sm+ */}
      <Link href="/sign-in?redirect=/raven">
        <button className="w-64 sm:w-80 px-6 py-3 rounded-lg bg-gradient-to-r from-primary-gradient-end to-primary-purple text-white hover:from-[#82e4dd] hover:to-[#f482f4] focus:outline-none focus:ring-2 focus:bg-primary-purple text-lg sm:text-xl">
        Raven
          </button>
        </Link>
        <Link href="/klair">
          <button className="w-64 sm:w-80 px-6 py-3 rounded-lg bg-gradient-to-r from-primary-purple to-primary-gradient-start text-white hover:from-[#82e4dd] hover:to-[#f482f4] focus:outline-none focus:ring-2 focus:bg-primary-purple text-lg sm:text-xl">
            Klair
          </button>
        </Link>
      </div>
    </div>
  );
}