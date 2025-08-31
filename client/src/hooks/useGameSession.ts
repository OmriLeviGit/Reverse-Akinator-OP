// src/hooks/useGameSession.ts
import { gameApi } from "../services/api";
import { useAppContext } from "../contexts/AppContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState, useCallback, useRef, useEffect } from "react";

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const getDefaultWelcomeMessage = (): Message => ({
  id: "welcome",
  text: "Welcome to the One Piece Character Guessing Game! I'm thinking of a character. Try to guess who it is!",
  isUser: false,
});

export const useGameSession = () => {
  const { currentGameSession, setCurrentGameSession } = useAppContext();
  const navigate = useNavigate();
  
  // Session state
  const [isValidatingSession, setIsValidatingSession] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([getDefaultWelcomeMessage()]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleInvalidSession = useCallback(() => {
    toast.error("Game session expired. Starting a new game...");
    setCurrentGameSession(null);
    setMessages([getDefaultWelcomeMessage()]);
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

  const fetchMessagesFromServer = async (gameId: string): Promise<Message[]> => {
    setIsLoadingMessages(true);
    setMessageError(null);
    
    try {
      const data = await gameApi.getChatMessages(gameId);
      return data.messages || [];
    } catch (error) {
      console.error("Error loading messages from server:", error);
      setMessageError("Failed to load chat messages");
      return [];
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // NEW: Combined validation and message loading for page loads
  const validateSessionOnPageLoad = useCallback(async (): Promise<boolean> => {
    // First check if we have a game session at all
    if (!currentGameSession?.gameId) {
      toast.error("No active game session. Please start a new game.");
      navigate("/");
      return false;
    }

    setIsValidatingSession(true);

    try {
      // Validate with server AND load messages in parallel
      const [isValid, messages] = await Promise.all([
        validateGameSession(),
        fetchMessagesFromServer(currentGameSession.gameId)
      ]);

      if (!isValid) {
        handleInvalidSession();
        return false;
      }

      // Set messages from server - append after welcome message
      setMessages([getDefaultWelcomeMessage(), ...messages]);
      console.log("✅ Session validated and messages loaded successfully");
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
      throw error;
    }
  };

  // Chat helper functions
  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const waitForMinimumDelay = async (userMessageTime: number) => {
    const elapsed = Date.now() - userMessageTime;
    const duration = 1000;
    if (elapsed < duration) {
      await new Promise((resolve) => setTimeout(resolve, duration - elapsed));
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

      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessingChat) return;

    setIsProcessingChat(true);
    const cleanedMessage = inputMessage.replace(/\n\s*\n+/g, "\n").trim();
    const userMessageTime = Date.now();
    setInputMessage("");

    // Optimistic update - add user message immediately
    addMessage(cleanedMessage, true);

    try {
      const answer = await askQuestion(cleanedMessage);

      if (answer === "") {
        return; // Session invalid, handled by useGameSession
      }

      await waitForMinimumDelay(userMessageTime);
      
      // Add AI response directly
      addMessage(answer, false);

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch (error) {
      console.error("Error processing message:", error);
      await waitForMinimumDelay(userMessageTime);
      addMessage("Sorry, there was an error processing your message. Please try again.", false);

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } finally {
      setIsProcessingChat(false);
    }
  };

  // Auto-scroll and resize effects
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  return {
    // Session management
    currentGameSession,
    isValidatingSession,
    startGame,
    askQuestion,
    makeGuess,
    revealCharacter,
    validateSessionOnPageLoad,

    // Chat management
    messages,
    inputMessage,
    setInputMessage,
    isProcessingChat,
    isLoadingMessages,
    messageError,
    handleSendMessage,
    addMessage,

    // UI refs
    textareaRef,
    messagesEndRef,
  };
};
