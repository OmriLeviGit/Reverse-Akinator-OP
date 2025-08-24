import { useState, useRef, useEffect } from "react";

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const useGameMessages = (gameId?: string) => {
  const getStorageKey = (gameId: string) => `gameMessages_${gameId}`;

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
    return [
      {
        id: "1",
        text: "Welcome to the One Piece Character Guessing Game! I'm thinking of a character. Try to guess who it is!",
        isUser: false,
        timestamp: new Date(),
      },
    ];
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    // Only load from storage if gameId is available
    if (gameId) {
      return loadMessagesFromStorage(gameId);
    }

    // Default messages if no gameId yet
    return [
      {
        id: "1",
        text: "Welcome to the One Piece Character Guessing Game! I'm thinking of a character. Try to guess who it is!",
        isUser: false,
        timestamp: new Date(),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

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

  // Load messages when gameId becomes available or changes
  useEffect(() => {
    if (gameId) {
      const storedMessages = loadMessagesFromStorage(gameId);
      setMessages(storedMessages);
    }
  }, [gameId]);

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
    setMessages([
      {
        id: "1",
        text: "Welcome to the One Piece Character Guessing Game! I'm thinking of a character. Try to guess who it is!",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  return {
    messages,
    addMessage,
    clearMessages,
    messagesEndRef,
  };
};
