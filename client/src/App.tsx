// App.tsx
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { GameProvider } from "./contexts/AppContext";
import { useRandomBackground } from "./hooks/useRandomBackground";
import GlobalSpoilerModal from "./components/GlobalSpoilerModal";
import Index from "./pages/Index";
import GameScreen from "./pages/GameScreen";
import CharacterManagement from "./pages/CharacterManagement";
import CharacterRevealScreen from "./pages/CharacterRevealScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { imageLoaded, selectedBackground } = useRandomBackground();

  if (!imageLoaded) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#000",
          color: "white",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundImage: `url(${selectedBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <GameProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/character-management" element={<CharacterManagement />} />
                <Route path="/game" element={<GameScreen />} />
                <Route path="/reveal" element={<CharacterRevealScreen />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <GlobalSpoilerModal />
              <Toaster position="top-right" />
            </BrowserRouter>
          </GameProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
