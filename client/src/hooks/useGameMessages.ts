import { useState, useRef, useEffect } from "react";

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const useGameMessages = (gameId?: string) => {
  const getStorageKey = (gameId: string) => `gameMessages_${gameId}`;

  const getDefaultWelcomeMessage = (): Message => ({
    id: "welcome",
    text: "Welcome to the One Piece Character Guessing Game! I'm thinking of a character. Try to guess who it is!",
    isUser: false,
    timestamp: new Date(),
  });

  const loadMessagesFromStorage = (gameId: string): Message[] => {
    try {
      const stored = localStorage.getItem(getStorageKey(gameId));
      if (stored) {
        const parsedMessages = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        return parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
    }
    // Return default welcome message if no stored messages
    return [getDefaultWelcomeMessage()];
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    // Only load from storage if gameId is available
    if (gameId) {
      return loadMessagesFromStorage(gameId);
    }
    // Default messages if no gameId yet
    return [getDefaultWelcomeMessage()];
  });

  const [currentGameId, setCurrentGameId] = useState<string | undefined>(gameId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle gameId changes (new game started or game ended)
  useEffect(() => {
    if (gameId !== currentGameId) {
      // Game ID changed - clear old messages and start fresh
      if (gameId) {
        // New game started - load messages for this game (or start with welcome)
        const newMessages = loadMessagesFromStorage(gameId);
        setMessages(newMessages);
      } else {
        // Game ended - clear messages and show default welcome
        setMessages([getDefaultWelcomeMessage()]);
      }
      setCurrentGameId(gameId);
    }
  }, [gameId, currentGameId]);

  // Save messages to localStorage whenever they change (and gameId exists)
  useEffect(() => {
    if (gameId && messages.length > 0) {
      try {
        localStorage.setItem(getStorageKey(gameId), JSON.stringify(messages));
      } catch (error) {
        console.error("Error saving messages to localStorage:", error);
      }
    }
  }, [messages, gameId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const clearMessages = () => {
    if (gameId) {
      localStorage.removeItem(getStorageKey(gameId));
    }
    setMessages([getDefaultWelcomeMessage()]);
  };

  // New method to clear messages for a specific game (useful for cleanup)
  const clearMessagesForGame = (specificGameId: string) => {
    localStorage.removeItem(getStorageKey(specificGameId));
  };

  return {
    messages,
    addMessage,
    clearMessages,
    clearMessagesForGame,
    messagesEndRef,
  };
};
