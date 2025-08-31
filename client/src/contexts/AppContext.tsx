import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useSessionData } from "../hooks/useSessionData";
import { useCharacters } from "../hooks/useCharacters";
import { SessionData, Arc, BasicCharacter, GameSession } from "../types";

interface AppContextType {
  // Server data
  sessionData: SessionData | null;
  availableArcs: Arc[];
  characters: BasicCharacter[];
  isLoading: boolean;
  charactersLoaded: boolean;
  // Global Arc Limit State
  globalArcLimit: string;
  setGlobalArcLimit: (arcLimit: string) => void;
  // Game Session State
  currentGameSession: GameSession | null;
  setCurrentGameSession: (session: GameSession | null) => void;
  // Server Actions
  updateGlobalArcLimit: (arcLimit: string) => void;
  refreshInitialData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { sessionData, availableArcs, isLoading, updateGlobalArcLimit, refreshInitialData } = useSessionData();

  const [globalArcLimit, setGlobalArcLimit] = useState<string>(() => {
    const saved = localStorage.getItem("globalArcLimit") || "All";
    console.log("🚀 AppContext initializing with localStorage value:", saved);
    return saved;
  });

  // Game session state
  const [currentGameSession, setCurrentGameSession] = useState<GameSession | null>(() => {
    const saved = localStorage.getItem("currentGameSession");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem("currentGameSession");
      return null;
    }
  });

  // Enhanced updateGlobalArcLimit that updates both local state and localStorage
  const handleUpdateGlobalArcLimit = (arcLimit: string) => {
    setGlobalArcLimit(arcLimit);
    localStorage.setItem("globalArcLimit", arcLimit);
    updateGlobalArcLimit(arcLimit);
  };

  // Enhanced setCurrentGameSession that syncs with localStorage
  const handleSetCurrentGameSession = (session: GameSession | null) => {
    setCurrentGameSession(session);
    if (session) {
      localStorage.setItem("currentGameSession", JSON.stringify(session));
    } else {
      localStorage.removeItem("currentGameSession");
    }
  };

  const { characters, charactersLoaded } = useCharacters();

  return (
    <AppContext.Provider
      value={{
        sessionData,
        availableArcs,
        characters,
        isLoading,
        charactersLoaded,
        globalArcLimit,
        setGlobalArcLimit,
        currentGameSession,
        setCurrentGameSession: handleSetCurrentGameSession,
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
