import React, { createContext, useContext, ReactNode } from "react";
import { useSessionData } from "../hooks/useSessionData";
import { useCharacters } from "../hooks/useCharacters";
import { useGameSession } from "../hooks/useGameSession";
import { SessionData, Arc, Character, GameSession, UserPreferences, GameSettings } from "../types";

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

  // Game Actions
  startGame: (settings: GameSettings) => Promise<void>;
  askQuestion: (question: string) => Promise<any>;
  revealCharacter: () => Promise<any>;
  makeGuess: (guess: string) => Promise<any>;

  // Preference Actions
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateGlobalArcLimit: (arcLimit: string) => void;
  refreshInitialData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { sessionData, availableArcs, isLoading, updatePreferences, updateGlobalArcLimit, refreshInitialData } =
    useSessionData();

  // Use your existing useCharacters hook
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
        startGame,
        askQuestion,
        revealCharacter,
        makeGuess,
        updatePreferences,
        updateGlobalArcLimit,
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
