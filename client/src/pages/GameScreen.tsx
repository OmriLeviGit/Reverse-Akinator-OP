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

const GameScreen: React.FC = () => {
  const navigate = useNavigate();
  const { sessionData, availableArcs, updateGlobalArcLimit } = useAppContext();
  const { currentGameSession, askQuestion, makeGuess, revealCharacter } = useGameSession();
  const { messages, addMessage, messagesEndRef } = useGameMessages();

  const [inputMessage, setInputMessage] = useState("");
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [isProcessingGuess, setIsProcessingGuess] = useState(false);
  const [globalArcLimit, setGlobalArcLimit] = useState<string>("All");
  const [characterSearchTerm, setCharacterSearchTerm] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pendingGuess, setPendingGuess] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const gameCharacters = currentGameSession.characterPool;

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

  // Helper to ensure response waits 500ms from user message
  const waitForMinimumDelay = async (userMessageTime: number) => {
    const elapsed = Date.now() - userMessageTime;
    if (elapsed < 500) {
      await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
    }
  };

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
      // Now process the pending guess
      handleGuessExecution(pendingGuess);
      setPendingGuess(null);
    }
  }, [isProcessingChat, pendingGuess]);

  // Redirect to home if no active game session
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    if (!currentGameSession?.isActive) {
      navigate("/");
    }
  }, [currentGameSession, navigate, isInitialLoad]);

  // Don't render anything if no game session
  if (!currentGameSession?.isActive) {
    return null;
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessingChat) return;

    setIsProcessingChat(true);

    // Strip excessive newlines - replace multiple consecutive newlines with single newline
    const cleanedMessage = inputMessage.replace(/\n\s*\n+/g, "\n").trim();

    addMessage(cleanedMessage, true);
    const userMessageTime = Date.now(); // Track when user sent message
    const userInput = cleanedMessage;
    setInputMessage("");

    try {
      const answer = await askQuestion(userInput);

      // Wait at least 500ms from when user sent the message
      await waitForMinimumDelay(userMessageTime);
      addMessage(answer, false);

      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch (error) {
      console.error("Error processing message:", error);

      // Wait at least 500ms from when user sent the message
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
    const userGuessTime = Date.now(); // Track when user made guess

    try {
      const guessResult = await makeGuess(characterName);

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
        // Wait at least 500ms from when user made the guess
        await waitForMinimumDelay(userGuessTime);
        addMessage(
          `Sorry, that's not correct. The character is not ${characterName}. Try asking more questions!`,
          false
        );
      }
    } catch (error) {
      console.error("Error making guess:", error);

      // Wait at least 500ms from when user made the guess
      await waitForMinimumDelay(userGuessTime);
      addMessage("Sorry, there was an error processing your guess. Please try again.", false);
    } finally {
      setIsProcessingGuess(false);
    }
  };

  const handleCharacterSelect = async (characterName: string) => {
    if (isProcessingGuess) return; // Prevent multiple guesses

    if (isProcessingChat) {
      // If chat is processing, queue the guess
      setPendingGuess(characterName);
      return;
    }

    // If no chat processing, execute immediately
    handleGuessExecution(characterName);
  };

  const handleRevealCharacter = async () => {
    try {
      const result = await revealCharacter();
      console.log("✅ Character revealed:", result);
      navigate("/reveal", {
        state: result,
      });
    } catch (error) {
      console.error("❌ Failed to reveal character:", error);
    }
  };

  const handleMaxArcChange = (arcName: string) => {
    setGlobalArcLimit(arcName);
    localStorage.setItem("globalArcLimit", arcName);
    updateGlobalArcLimit(arcName);
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
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground"></div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {pendingGuess && (
                    <div className="flex justify-start">
                      <div className="bg-yellow-100 text-yellow-800 rounded-lg px-3 sm:px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse rounded-full h-2 w-2 bg-yellow-600"></div>
                          <span className="text-sm">Guess pending...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area - Fixed at bottom */}
              <div className="p-3 sm:p-4 border-t border-border/40 flex-shrink-0">
                <div className="flex space-x-2 items-end">
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
                    className="px-3 sm:px-4"
                  >
                    Send
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
