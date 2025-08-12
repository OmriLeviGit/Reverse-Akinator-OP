// src/contexts/AppContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { gameApi, generalApi, characterApi } from "../services/api";
import { Character } from "../types/character";
import { cookieUtils } from "../utils/cookies";

interface GameSession {
  gameSessionId: string;
  gameState: string;
  currentCharacter?: Character;
}

interface SessionData {
  global_arc_limit: string;
  user_preferences: {
    difficulty: string;
    preferred_arc: string;
    includeNonTVFillers: boolean;
    fillerPercentage: number;
  };
  session_created: string;
  last_activity: string;
}

interface UserPreferences {
  difficulty: string;
  preferred_arc: string;
  includeNonTVFillers: boolean;
  fillerPercentage: number;
}

interface AppContextType {
  // Game Session State
  currentGameSession: GameSession | null;
  currentCharacter: Character | null;

  // Server data
  sessionData: SessionData | null;
  availableArcs: any[];
  characters: Character[];
  isLoading: boolean;

  // Game Actions
  startGame: (settings: GameSettings) => Promise<void>;
  askQuestion: (question: string) => Promise<any>;
  revealCharacter: () => Promise<any>;
  makeGuess: (guess: string) => Promise<any>;

  // Preference Actions
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  refreshInitialData: () => void;
}

interface GameSettings {
  arcSelection: string;
  fillerPercentage: number;
  includeNonTVFillers: boolean;
  difficultyLevel: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentGameSession, setCurrentGameSession] = useState<GameSession | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [availableArcs, setAvailableArcs] = useState<any[]>([]);

  // Load saved preferences from cookie on mount
  const loadSavedPreferences = (): UserPreferences => {
    const savedSessionData = cookieUtils.getCookie("sessionData");
    if (savedSessionData) {
      try {
        const parsed = JSON.parse(savedSessionData);
        return parsed.user_preferences;
      } catch (error) {
        console.error("Failed to parse saved preferences:", error);
      }
    }

    // Default preferences if nothing saved
    return {
      difficulty: "easy",
      preferred_arc: "All",
      includeNonTVFillers: false,
      fillerPercentage: 0,
    };
  };

  // Fetch initial data from server with saved preferences
  const {
    data: initialData,
    isLoading: initialDataLoading,
    refetch,
  } = useQuery({
    queryKey: ["initialData"],
    queryFn: async () => {
      const savedPreferences = loadSavedPreferences();
      // Send preferences to server to get relevant data
      return generalApi.getInitialData(savedPreferences);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Separate query for characters using your existing endpoint
  const { data: charactersData, isLoading: charactersLoading } = useQuery({
    queryKey: ["allCharacters"],
    queryFn: () => characterApi.getAllCharacters(),
    staleTime: 5 * 60 * 1000,
  });

  // Extract characters from the response
  const characters = charactersData?.characters || [];

  // Combine loading states
  const isLoading = initialDataLoading || charactersLoading;

  // Update state when initial data is fetched
  useEffect(() => {
    if (initialData) {
      console.log("Initial data received:", initialData);

      setSessionData(initialData.session_data);
      setAvailableArcs(initialData.available_arcs);

      // Save to cookie (without characters)
      cookieUtils.setCookie("sessionData", JSON.stringify(initialData.session_data));
      cookieUtils.setCookie("availableArcs", JSON.stringify(initialData.available_arcs));

      console.log("Data saved to cookies (without characters)");
    }
  }, [initialData]);

  // Load from cookie on mount ONLY if no server data yet
  useEffect(() => {
    if (!initialData && !initialDataLoading) {
      console.log("Attempting to load from cookies...");

      const savedSessionData = cookieUtils.getCookie("sessionData");
      const savedArcs = cookieUtils.getCookie("availableArcs");

      console.log("Raw cookie data:");
      console.log("sessionData cookie:", savedSessionData);
      console.log("arcs cookie:", savedArcs);

      if (savedSessionData) {
        console.log("Parsing session data...");
        const parsedSessionData = JSON.parse(savedSessionData);
        setSessionData(parsedSessionData);
      }

      if (savedArcs) {
        console.log("Parsing arcs...");
        const parsedArcs = JSON.parse(savedArcs);
        setAvailableArcs(parsedArcs);
      }

      console.log("Cookie loading complete (characters will load from server)");
    }
  }, [initialData, initialDataLoading]);

  // Function to update preferences locally and in cookies
  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    if (!sessionData) return;

    const updatedPreferences = {
      ...sessionData.user_preferences,
      ...newPreferences,
    };

    const updatedSessionData = {
      ...sessionData,
      user_preferences: updatedPreferences,
    };

    // Update local state
    setSessionData(updatedSessionData);

    // Save to cookie
    cookieUtils.setCookie("sessionData", JSON.stringify(updatedSessionData));

    console.log("Preferences updated:", updatedPreferences);
  };

  // Existing mutations...
  const questionMutation = useMutation({
    mutationFn: (questionText: string) => gameApi.askQuestion(currentGameSession!.gameSessionId, questionText),
  });

  const startGameMutation = useMutation({
    mutationFn: gameApi.startGame,
    onSuccess: (data) => {
      setCurrentGameSession({
        gameSessionId: data.gameSessionId,
        gameState: data.gameState,
      });
    },
  });

  const revealMutation = useMutation({
    mutationFn: () => gameApi.revealCharacter(currentGameSession!.gameSessionId),
    onSuccess: (data) => {
      setCurrentGameSession((prev) =>
        prev
          ? {
              ...prev,
              currentCharacter: data.character,
              gameState: data.gameState,
            }
          : null
      );
    },
  });

  const guessMutation = useMutation({
    mutationFn: (guess: string) => gameApi.makeGuess(currentGameSession!.gameSessionId, guess),
  });

  const startGame = async (settings: GameSettings) => {
    await startGameMutation.mutateAsync(settings);
  };

  const askQuestion = async (question: string) => {
    if (!currentGameSession) throw new Error("No active game session");
    return await questionMutation.mutateAsync(question);
  };

  const revealCharacter = async () => {
    if (!currentGameSession) throw new Error("No active game session");
    return await revealMutation.mutateAsync();
  };

  const makeGuess = async (guess: string) => {
    if (!currentGameSession) throw new Error("No active game session");
    return await guessMutation.mutateAsync(guess);
  };

  const refreshInitialData = () => {
    refetch();
  };

  const currentCharacter = currentGameSession?.currentCharacter || null;

  return (
    <AppContext.Provider
      value={{
        currentGameSession,
        currentCharacter,
        sessionData,
        availableArcs,
        characters,
        isLoading,
        startGame,
        askQuestion,
        revealCharacter,
        makeGuess,
        updatePreferences,
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
