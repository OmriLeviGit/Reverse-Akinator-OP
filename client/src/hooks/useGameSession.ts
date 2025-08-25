// src/hooks/useGameSession.ts
import { gameApi } from "../services/api";
import { useAppContext } from "../contexts/AppContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";

export const useGameSession = () => {
  const { currentGameSession, setCurrentGameSession } = useAppContext();
  const navigate = useNavigate();
  const [isValidatingSession, setIsValidatingSession] = useState(false);

  const handleInvalidSession = useCallback(() => {
    toast.error("Game session expired. Starting a new game...");
    setCurrentGameSession(null);
    navigate("/");
  }, [setCurrentGameSession, navigate]);

  const validateGameSession = useCallback(async (): Promise<boolean> => {
    if (!currentGameSession?.gameId) {
      return false;
    }

    try {
      const response = await gameApi.validateGameSession(currentGameSession.gameId);
      return response.isValidGame;
    } catch (error) {
      console.error("Failed to validate game session:", error);
      return false;
    }
  }, [currentGameSession?.gameId]);

  // NEW: Initial validation method for page loads
  const validateSessionOnPageLoad = useCallback(async (): Promise<boolean> => {
    // First check if we have a game session at all
    if (!currentGameSession?.gameId) {
      toast.error("No active game session. Please start a new game.");
      navigate("/");
      return false;
    }

    setIsValidatingSession(true);

    try {
      // Validate with server
      const isValid = await validateGameSession();
      if (!isValid) {
        handleInvalidSession();
        return false;
      }
      console.log("✅ Session validated successfully");
      return true;
    } catch (error) {
      console.error("Session validation failed:", error);
      toast.error("Unable to verify game session. Please start a new game.");
      navigate("/");
      return false;
    } finally {
      setIsValidatingSession(false);
    }
  }, [currentGameSession?.gameId, validateGameSession, handleInvalidSession, navigate]);

  const startGame = async (settings: any) => {
    try {
      const response = await gameApi.startGame(settings);
      const gameSession = {
        isActive: true,
        gameId: response.gameId,
        characterPool: response.characterPool,
      };

      setCurrentGameSession(gameSession);
      return gameSession;
    } catch (error) {
      console.error("Failed to start game:", error);
      toast.error("Failed to start game. Please try again.");
      throw error;
    }
  };

  const askQuestion = async (question: string) => {
    if (!currentGameSession?.gameId) {
      handleInvalidSession();
      return "";
    }

    try {
      const response = await gameApi.askQuestion(currentGameSession.gameId, question);
      return response.answer;
    } catch (error: any) {
      console.error("Failed to ask question:", error);

      // Check for session validation errors
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.detail || "";
        if (
          errorMessage.includes("No active game") ||
          errorMessage.includes("Game ID mismatch") ||
          errorMessage.includes("Game data not found")
        ) {
          handleInvalidSession();
          return "";
        }
      }

      toast.error("Failed to ask question. Please try again.");
      throw error;
    }
  };

  const makeGuess = async (characterName: string) => {
    if (!currentGameSession?.gameId) {
      handleInvalidSession();
      return { isCorrect: false };
    }

    try {
      const response = await gameApi.makeGuess(currentGameSession.gameId, characterName);
      return response;
    } catch (error: any) {
      console.error("Failed to make guess:", error);

      // Check for session validation errors
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.detail || "";
        if (
          errorMessage.includes("No active game") ||
          errorMessage.includes("Game ID mismatch") ||
          errorMessage.includes("Game data not found")
        ) {
          handleInvalidSession();
          return { isCorrect: false };
        }
      }

      toast.error("Failed to make guess. Please try again.");
      throw error;
    }
  };

  const revealCharacter = async () => {
    if (!currentGameSession?.gameId) {
      handleInvalidSession();
      return null;
    }

    try {
      const response = await gameApi.revealCharacter(currentGameSession.gameId);
      setCurrentGameSession(null); // Clear session after reveal
      return response;
    } catch (error: any) {
      console.error("Failed to reveal character:", error);

      // Check for session validation errors
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.detail || "";
        if (
          errorMessage.includes("No active game") ||
          errorMessage.includes("Game ID mismatch") ||
          errorMessage.includes("Game data not found")
        ) {
          handleInvalidSession();
          return null;
        }
      }

      toast.error("Failed to reveal character. Please try again.");
      throw error;
    }
  };

  return {
    currentGameSession,
    isValidatingSession,
    startGame,
    askQuestion,
    makeGuess,
    revealCharacter,
    validateSessionOnPageLoad, // NEW: For initial page load validation
  };
};
