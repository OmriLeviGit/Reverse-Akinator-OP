// src/hooks/useGameChat.ts - Combined version
import { useState, useRef, useEffect } from "react";
import { useGameSession } from "./useGameSession";

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const useGameChat = (gameId?: string) => {
  const { askQuestion } = useGameSession();

  // Message storage logic (from useGameMessages)
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
        return parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
    }
    return [getDefaultWelcomeMessage()];
  };

  // State management
  const [messages, setMessages] = useState<Message[]>(() => {
    if (gameId) {
      return loadMessagesFromStorage(gameId);
    }
    return [getDefaultWelcomeMessage()];
  });

  const [currentGameId, setCurrentGameId] = useState<string | undefined>(gameId);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessingChat, setIsProcessingChat] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle gameId changes
  useEffect(() => {
    if (gameId !== currentGameId) {
      if (gameId) {
        const newMessages = loadMessagesFromStorage(gameId);
        setMessages(newMessages);
      } else {
        setMessages([getDefaultWelcomeMessage()]);
      }
      setCurrentGameId(gameId);
    }
  }, [gameId, currentGameId]);

  // Save messages to localStorage
  useEffect(() => {
    if (gameId && messages.length > 0) {
      try {
        localStorage.setItem(getStorageKey(gameId), JSON.stringify(messages));
      } catch (error) {
        console.error("Error saving messages to localStorage:", error);
      }
    }
  }, [messages, gameId]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  // Helper functions
  const waitForMinimumDelay = async (userMessageTime: number) => {
    const elapsed = Date.now() - userMessageTime;
    const duration = 1000;
    if (elapsed < duration) {
      await new Promise((resolve) => setTimeout(resolve, duration - elapsed));
    }
  };

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessingChat) return;

    setIsProcessingChat(true);
    const cleanedMessage = inputMessage.replace(/\n\s*\n+/g, "\n").trim();

    addMessage(cleanedMessage, true);
    const userMessageTime = Date.now();
    setInputMessage("");

    try {
      const answer = await askQuestion(cleanedMessage);

      if (answer === "") {
        return; // Session invalid, handled by useGameSession
      }

      await waitForMinimumDelay(userMessageTime);
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

  return {
    // Message data
    messages,
    addMessage,
    clearMessages,

    // Chat interaction
    inputMessage,
    setInputMessage,
    isProcessingChat,
    handleSendMessage,

    // Refs for UI
    textareaRef,
    messagesEndRef,
  };
};
