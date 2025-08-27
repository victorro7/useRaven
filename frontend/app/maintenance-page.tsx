// app/maintenance-page.tsx
'use client'
import { TypewriterEffectSmooth } from "./(components)/ui/typewriter-effect";
import { BackgroundBeams } from "./(components)/ui/background-beams";

export default function MaintenancePage() {
  const words = [
    {
      text: "Under",
      className: "text-2xl sm:text-4xl font-medium text-transparent text-white"
    },
    {
      text: "Maintenance",
      className: "text-2xl sm:text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6ee1fc] to-[#fc5efc]"
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-[40rem] text-white relative">
      <TypewriterEffectSmooth className="text-white" words={words} />
      <div className="mt-6 text-lg text-gray-300">We&apos;ll be back. Thank you for your patience!</div>
      <div className="hidden lg:block absolute inset-0 -z-10">
        <BackgroundBeams />
      </div>
    </div>
  );
}
