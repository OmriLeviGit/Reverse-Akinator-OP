import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "./contexts/AppContext";
import Index from "./pages/Index";
import GameScreen from "./pages/GameScreen";
import CharacterRevealScreen from "./pages/CharacterRevealScreen"; // Move to pages
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
            <Route path="/game" element={<GameScreen />} />
            <Route path="/reveal" element={<CharacterRevealScreen />} />
            <Route path="/character-management" element={<CharacterManagement />} />
            {/** ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE **/}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
