import { motion } from "framer-motion";
import { MountainFlight } from "@/components/canvas/MountainFlight";
import { TopNav } from "@/components/layout/TopNav";
import { FlipWords } from "@/components/ui/flip-words";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

const FLIP_WORDS = ["go", "climb", "hike", "wander", "trek", "roam", "summit", "ascend", "ramble", "travel", "stroll", "scale"];

const SEARCH_PLACEHOLDER = "Search trails, summits, routes...";

export function LandingPage() {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("search:", e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f8f9fb] flex flex-col items-center justify-start overflow-hidden pt-36">
      {/* Drone flight animation */}
      <MountainFlight />

      <TopNav />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        <div className="inline-block max-w-full">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-extralight tracking-[-0.02em] text-zinc-700/90 leading-none flex items-center justify-center gap-x-[0.12em] whitespace-nowrap">
              <span>where do you want to</span>
              <span className="inline-flex justify-center" style={{ minWidth: "6.5ch" }}>
                <FlipWords
                  words={FLIP_WORDS}
                  duration={2600}
                  className="font-semibold italic text-zinc-900 tracking-tight"
                />
              </span>
              <span>next?</span>
            </h1>
          </motion.div>

          {/* Search bar — matches headline width */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="mt-8 w-full"
          >
            <PlaceholdersAndVanishInput
              placeholders={[SEARCH_PLACEHOLDER]}
              onChange={handleSearchChange}
              onSubmit={handleSearchSubmit}
            />
          </motion.div>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="text-xs text-zinc-400 tracking-widest uppercase"
        >
          tours · routes · trails
        </motion.p>
      </div>
    </div>
  );
}
