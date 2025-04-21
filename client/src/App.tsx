import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";
import { GameContextProvider } from "./contexts/GameContext";
import MainMenu from "./components/menus/MainMenu";
import LevelSelect from "./components/menus/LevelSelect";
import PlayerSetup from "./components/menus/PlayerSetup";
import Board from "./components/game/Board";
import LevelEditor from "./components/editor/LevelEditor";
import Leaderboard from "./components/menus/Leaderboard";
import { GamePhase, useGame } from "./lib/stores/useGame";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";

// Sound file paths
const SOUND_PATHS = {
  background: "/sounds/background.mp3",
  hit: "/sounds/hit.mp3",
  success: "/sounds/success.mp3"
};

function App() {
  const { phase } = useGame();
  const [appPhase, setAppPhase] = useState<GamePhase | "menu" | "level_select" | "player_setup" | "editor" | "leaderboard">("menu");
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  // Set up audio elements when the app starts
  useEffect(() => {
    const bgMusic = new Audio(SOUND_PATHS.background);
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    setBackgroundMusic(bgMusic);

    const hitSfx = new Audio(SOUND_PATHS.hit);
    setHitSound(hitSfx);

    const successSfx = new Audio(SOUND_PATHS.success);
    setSuccessSound(successSfx);
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  // Listen for game phase changes
  useEffect(() => {
    if (phase !== "ready") {
      setAppPhase(phase);
    }
  }, [phase]);

  return (
    <QueryClientProvider client={queryClient}>
      <GameContextProvider>
        <div className="min-h-screen bg-gradient-to-b from-background to-slate-900 flex flex-col">
          <main className="flex-1 container mx-auto p-4 flex flex-col">
            {appPhase === "menu" && <MainMenu onNavigate={setAppPhase} />}
            {appPhase === "level_select" && <LevelSelect onBack={() => setAppPhase("menu")} />}
            {appPhase === "player_setup" && <PlayerSetup onBack={() => setAppPhase("level_select")} />}
            {appPhase === "playing" && <Board />}
            {appPhase === "editor" && <LevelEditor onBack={() => setAppPhase("menu")} />}
            {appPhase === "leaderboard" && <Leaderboard onBack={() => setAppPhase("menu")} />}
            {appPhase === "ended" && (
              <div className="text-center mt-10">
                <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
                <button 
                  onClick={() => setAppPhase("menu")}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Back to Menu
                </button>
              </div>
            )}
          </main>
          <footer className="bg-background/50 backdrop-blur-sm border-t border-border p-2 text-center text-sm text-muted-foreground">
            LinguaPlay - Learning languages through play
          </footer>
        </div>
        <Toaster position="top-right" />
      </GameContextProvider>
    </QueryClientProvider>
  );
}

export default App;
