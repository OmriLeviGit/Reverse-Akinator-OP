import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSession } from "./useGameSession";

export const useGameGuess = (addMessage: (text: string, isUser: boolean) => void) => {
  const navigate = useNavigate();
  const { makeGuess } = useGameSession();

  const [isProcessingGuess, setIsProcessingGuess] = useState(false);
  const [pendingGuess, setPendingGuess] = useState<string | null>(null);

  const waitForMinimumDelay = async (userMessageTime: number) => {
    const elapsed = Date.now() - userMessageTime;
    const duration = 1000;
    if (elapsed < duration) {
      await new Promise((resolve) => setTimeout(resolve, duration - elapsed));
    }
  };

  const executeGuess = useCallback(async (characterName: string) => {
    setIsProcessingGuess(true);
    const userGuessTime = Date.now();

    // Optimistic update - add user guess message immediately
    addMessage(`I guess it's ${characterName}!`, true);

    try {
      const guessResult = await makeGuess(characterName);

      if (!guessResult) {
        return; // Session invalid, handled by useGameSession
      }

      if (guessResult.isCorrect) {
        navigate("/reveal", {
          state: {
            character: guessResult.character,
            questionsAsked: guessResult.questionsAsked,
            guessesMade: guessResult.guessesMade,
            wasCorrectGuess: true,
          },
        });
      } else {
        // Wait for minimum delay for UX, then add incorrect response
        await waitForMinimumDelay(userGuessTime);
        addMessage(
          `Sorry, that's not correct. The character is not ${characterName}. Try asking more questions!`,
          false
        );
      }
    } catch (error) {
      console.error("Error making guess:", error);
      await waitForMinimumDelay(userGuessTime);
      addMessage("Sorry, there was an error processing your guess. Please try again.", false);
    } finally {
      setIsProcessingGuess(false);
    }
  }, [addMessage, makeGuess, navigate]);

  const handleCharacterSelect = (characterName: string, isProcessingChat: boolean) => {
    if (isProcessingGuess) return;

    if (isProcessingChat) {
      setPendingGuess(characterName);
      return;
    }

    executeGuess(characterName);
  };

  useEffect(() => {
    if (pendingGuess) {
      executeGuess(pendingGuess);
      setPendingGuess(null);
    }
  }, [pendingGuess, executeGuess]);

  return {
    isProcessingGuess,
    handleCharacterSelect,
  };
};
