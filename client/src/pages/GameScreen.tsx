import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useGameMessages } from "../hooks/useGameMessages";
import { useGameSession } from "../hooks/useGameSession";
import { useAppContext } from "../contexts/AppContext";
import { useCharacterSearch } from "../hooks/useCharacterSearch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CharacterList } from "../components/game/CharacterList";
import { ArrowUp } from "lucide-react";
import { toast } from "sonner";

const GameScreen: React.FC = () => {
  const navigate = useNavigate();
  const { sessionData, availableArcs, updateGlobalArcLimit } = useAppContext();
  const {
    currentGameSession,
    askQuestion,
    makeGuess,
    revealCharacter,
    validateSessionOnPageLoad,
    isValidatingSession,
  } = useGameSession();
  const { messages, addMessage, messagesEndRef } = useGameMessages(currentGameSession?.gameId);

  const [inputMessage, setInputMessage] = useState("");
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [isProcessingGuess, setIsProcessingGuess] = useState(false);
  const [globalArcLimit, setGlobalArcLimit] = useState<string>("All");
  const [characterSearchTerm, setCharacterSearchTerm] = useState("");
  const [pendingGuess, setPendingGuess] = useState<string | null>(null);
  const [hasValidated, setHasValidated] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use optional chaining to handle when currentGameSession might be null
  const gameCharacters = currentGameSession?.characterPool || [];

  // Use the character search hook with game characters
  const filteredCharacters = useCharacterSearch({
    characters: gameCharacters,
    searchTerm: characterSearchTerm,
  });

  // Function to auto-resize the textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  // Helper to ensure response waits from user message
  const waitForMinimumDelay = async (userMessageTime: number) => {
    const elapsed = Date.now() - userMessageTime;
    const duration = 1000;
    if (elapsed < duration) {
      await new Promise((resolve) => setTimeout(resolve, duration - elapsed));
    }
  };

  const handleMaxArcChange = (arcName: string) => {
    setGlobalArcLimit(arcName);
    localStorage.setItem("globalArcLimit", arcName);
    updateGlobalArcLimit(arcName);
  };

  // VALIDATION - Only runs ONCE on initial mount
  useEffect(() => {
    const validate = async () => {
      if (hasValidated) return;

      const isValid = await validateSessionOnPageLoad();
      if (isValid) {
        setHasValidated(true);
      }
      // If invalid, validateSessionOnPageLoad already handled navigation/toast
    };

    validate();
  }, []); // Empty dependency array

  // Separate effect to handle when currentGameSession changes (like when it becomes null)
  useEffect(() => {
    if (!currentGameSession?.gameId && !isValidatingSession) {
      toast.error("No active game session. Please start a new game.");
      navigate("/");
    }
  }, [currentGameSession?.gameId, isValidatingSession, navigate]);

  // Initialize globalArcLimit from sessionData
  useEffect(() => {
    if (sessionData?.globalArcLimit) {
      setGlobalArcLimit(sessionData.globalArcLimit);
    }
  }, [sessionData]);

  // Adjust textarea height when inputMessage changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  // Handle pending guess after chat processing completes
  useEffect(() => {
    if (!isProcessingChat && pendingGuess) {
      handleGuessExecution(pendingGuess);
      setPendingGuess(null);
    }
  }, [isProcessingChat, pendingGuess]);

  // Show loading while validating
  if (isValidatingSession) {
    return (
      <Layout globalArcLimit={globalArcLimit} onMaxArcChange={handleMaxArcChange} availableArcs={availableArcs}>
        <div className="container mx-auto px-6 py-4 max-w-7xl flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Validating game session...</span>
        </div>
      </Layout>
    );
  }

  // Don't render if no game session after validation
  if (!currentGameSession?.isActive) {
    return null;
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessingChat) return;

    setIsProcessingChat(true);

    // Strip excessive newlines - replace multiple consecutive newlines with single newline
    const cleanedMessage = inputMessage.replace(/\n\s*\n+/g, "\n").trim();

    addMessage(cleanedMessage, true);
    const userMessageTime = Date.now();
    const userInput = cleanedMessage;
    setInputMessage("");

    try {
      const answer = await askQuestion(userInput);

      // If askQuestion returned empty string, it means session was invalid and handled
      if (answer === "") {
        return;
      }

      // Wait at least 1000ms from when user sent the message
      await waitForMinimumDelay(userMessageTime);
      addMessage(answer, false);

      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch (error) {
      console.error("Error processing message:", error);

      // Wait at least 1000ms from when user sent the message
      await waitForMinimumDelay(userMessageTime);
      addMessage("Sorry, there was an error processing your message. Please try again.", false);

      // Also focus on error
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } finally {
      setIsProcessingChat(false);
    }
  };

  const handleGuessExecution = async (characterName: string) => {
    setIsProcessingGuess(true);
    addMessage(`I guess it's ${characterName}!`, true);
    const userGuessTime = Date.now();

    try {
      const guessResult = await makeGuess(characterName);

      // If makeGuess returned { isCorrect: false } with no other data,
      // it might mean session was invalid and handled
      if (!guessResult || (guessResult.isCorrect === false && !guessResult.character)) {
        // Check if this was due to session invalidation
        if (!currentGameSession?.gameId) {
          return; // Session was cleared, component will unmount/redirect
        }
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
        // Wait at least 1000ms from when user made the guess
        await waitForMinimumDelay(userGuessTime);
        addMessage(
          `Sorry, that's not correct. The character is not ${characterName}. Try asking more questions!`,
          false
        );
      }
    } catch (error) {
      console.error("Error making guess:", error);

      // Wait at least 1000ms from when user made the guess
      await waitForMinimumDelay(userGuessTime);
      addMessage("Sorry, there was an error processing your guess. Please try again.", false);
    } finally {
      setIsProcessingGuess(false);
    }
  };

  const handleCharacterSelect = async (characterName: string) => {
    if (isProcessingGuess) return;

    if (isProcessingChat) {
      setPendingGuess(characterName);
      return;
    }

    handleGuessExecution(characterName);
  };

  const handleRevealCharacter = async () => {
    try {
      const result = await revealCharacter();

      // If revealCharacter returned null, session was invalid and handled
      if (!result) {
        return;
      }

      console.log("✅ Character revealed:", result);
      navigate("/reveal", {
        state: result,
      });
    } catch (error) {
      console.error("❌ Failed to reveal character:", error);
    }
  };

  return (
    <Layout globalArcLimit={globalArcLimit} onMaxArcChange={handleMaxArcChange} availableArcs={availableArcs}>
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Character Guessing Game</h1>
          </div>
        </div>
      </div>
      {/* Main Game Layout */}
      <div className="container mx-auto px-4 sm:px-6 pb-4 sm:pb-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 lg:gap-6">
          {/* Chat Area */}
          <div className="flex flex-col h-[calc(100vh-12rem)] sm:h-[calc(100vh-16rem)] max-h-[600px] sm:max-h-[700px] min-h-[300px] sm:min-h-[400px]">
            <Card className="flex-1 flex flex-col border-border/40 shadow-sm overflow-hidden">
              {/* Messages Area - Fixed height with scroll */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="space-y-3 sm:space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 ${
                          message.isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  {(isProcessingChat || isProcessingGuess) && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-muted-foreground rounded-lg px-3 sm:px-4 py-2">
                        <div className="flex items-center justify-center space-x-1">
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"
                            style={{ animationDelay: "0s", animationDuration: "1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s", animationDuration: "1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s", animationDuration: "1s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area - Fixed at bottom */}
              <div className="p-3 sm:p-4 border-t border-border/40 flex-shrink-0">
                <div className="flex space-x-2 items-center">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      setTimeout(adjustTextareaHeight, 0);
                    }}
                    placeholder="Ask a question about the character..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 min-h-[40px] max-h-[100px] sm:max-h-[120px] resize-none overflow-y-auto text-sm sm:text-base"
                    style={{ fontSize: "16px" }}
                    rows={1}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isProcessingChat || !inputMessage.trim()}
                    size="sm"
                    className="w-[35px] h-[35px] p-0 flex items-center justify-center"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Character List Sidebar */}
          <div className="h-[300px] lg:h-[calc(100vh-16rem)] max-h-[600px] lg:max-h-[700px] min-h-[300px] lg:min-h-[400px]">
            <Card className="h-full flex flex-col border-border/40 shadow-sm">
              <CharacterList
                characters={filteredCharacters}
                isLoading={false}
                searchTerm={characterSearchTerm}
                onSearchChange={setCharacterSearchTerm}
                onCharacterSelect={handleCharacterSelect}
              />

              {/* Footer */}
              <div className="p-3 sm:p-4 border-t border-border/40 flex-shrink-0 space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  {filteredCharacters.length} of {gameCharacters.length} viable characters
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full">
                      Reveal Character
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reveal Character?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to reveal the mystery character? This will end the current game.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRevealCharacter} className="w-full sm:w-auto">
                        Yes, Reveal Character
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GameScreen;
