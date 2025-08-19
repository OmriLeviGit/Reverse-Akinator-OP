import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useSessionData } from "../hooks/useSessionData";
import { useCharacters } from "../hooks/useCharacters";
import { useGameSession } from "../hooks/useGameSession";
import { SessionData, Arc, Character, GameSession, GameSettings } from "../types";

interface AppContextType {
  // Game Session State
  currentGameSession: GameSession | null;
  currentCharacter: Character | null;
  // Server data
  sessionData: SessionData | null;
  availableArcs: Arc[];
  characters: Character[];
  isLoading: boolean;
  charactersLoaded: boolean;
  // Global Arc Limit State
  globalArcLimit: string;
  setGlobalArcLimit: (arcLimit: string) => void;
  // Game Actions
  startGame: (settings: GameSettings) => Promise<void>;
  askQuestion: (question: string) => Promise<any>;
  revealCharacter: () => Promise<any>;
  makeGuess: (guess: string) => Promise<any>;
  // Server Actions (no more preference actions - those will be localStorage)
  updateGlobalArcLimit: (arcLimit: string) => void;
  refreshInitialData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ✅ useSessionData no longer returns updatePreferences
  const { sessionData, availableArcs, isLoading, updateGlobalArcLimit, refreshInitialData } = useSessionData();

  // Global arc limit state - prioritize localStorage
  const [globalArcLimit, setGlobalArcLimit] = useState<string>(() => {
    const saved = localStorage.getItem("globalArcLimit") || "All";
    return saved;
  });

  // Track if we've already synced to avoid infinite loops
  const [hasSynced, setHasSynced] = useState(false);

  // Sync server session with localStorage preference on startup (only once)
  useEffect(() => {
    if (hasSynced || !sessionData) return; // Prevent multiple syncs

    const savedArcLimit = localStorage.getItem("globalArcLimit");

    if (savedArcLimit && savedArcLimit !== "All") {
      updateGlobalArcLimit(savedArcLimit);
    }
    setHasSynced(true); // Mark as synced
  }, [sessionData, hasSynced, updateGlobalArcLimit]);

  // Enhanced updateGlobalArcLimit that updates both local state and localStorage
  const handleUpdateGlobalArcLimit = (arcLimit: string) => {
    setGlobalArcLimit(arcLimit);
    localStorage.setItem("globalArcLimit", arcLimit);
    updateGlobalArcLimit(arcLimit);
  };

  const { characters, charactersLoaded } = useCharacters();
  const { currentGameSession, currentCharacter, startGame, askQuestion, revealCharacter, makeGuess } = useGameSession();

  return (
    <AppContext.Provider
      value={{
        currentGameSession,
        currentCharacter,
        sessionData,
        availableArcs,
        characters,
        isLoading,
        charactersLoaded,
        globalArcLimit,
        setGlobalArcLimit,
        startGame,
        askQuestion,
        revealCharacter,
        makeGuess,
        // ✅ Removed updatePreferences - Index will handle localStorage directly
        updateGlobalArcLimit: handleUpdateGlobalArcLimit,
        refreshInitialData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within a GameProvider");
  }
  return context;
};
