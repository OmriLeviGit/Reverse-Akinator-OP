// App.tsx
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { GameProvider } from "./contexts/AppContext";
import GlobalSpoilerModal from "./components/GlobalSpoilerModal";
import Index from "./pages/Index";
import GameScreen from "./pages/GameScreen";
import CharacterManagement from "./pages/CharacterManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/character-management" element={<CharacterManagement />} />
            <Route path="/game" element={<GameScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalSpoilerModal />
          <Toaster position="top-right" />
        </BrowserRouter>
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
