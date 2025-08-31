import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { GameProvider } from "./contexts/AppContext";
import GlobalSpoilerModal from "./components/GlobalSpoilerModal";
import { useRandomBackground } from "@/hooks/useRandomBackground";
import Layout from "./components/Layout";
import { useAppContext } from "./contexts/AppContext";
import Index from "./pages/Index";
import GameScreen from "./pages/GameScreen";
import CharacterManagement from "./pages/CharacterManagement";
import CharacterRevealScreen from "./pages/CharacterRevealScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const backgroundState = useRandomBackground();
  const { globalArcLimit, updateGlobalArcLimit, availableArcs } = useAppContext();

  const handleMaxArcChange = (arcName: string) => {
    updateGlobalArcLimit(arcName);
  };

  if (backgroundState.isLoading) {
    return backgroundState.LoadingComponent;
  }

  return (
    <BrowserRouter>
      <Layout 
        backgroundImage={backgroundState.selectedBackground} 
        globalArcLimit={globalArcLimit} 
        onMaxArcChange={handleMaxArcChange} 
        availableArcs={availableArcs}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/character-management" element={<CharacterManagement />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/reveal" element={<CharacterRevealScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <GlobalSpoilerModal />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameProvider>
          <AppContent />
        </GameProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
