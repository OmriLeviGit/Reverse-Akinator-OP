import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { useGameMessages } from "../hooks/useGameMessages";
import { useGameSession } from "../hooks/useGameSession";
import { useAppContext } from "../contexts/AppContext";
import { useCharacterSearch } from "../hooks/useCharacterSearch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalArcLimit, setGlobalArcLimit] = useState<string>("All");
  const [characterSearchTerm, setCharacterSearchTerm] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // const [isLoadingImages, setIsLoadingImages] = useState(true);

  const gameCharacters = currentGameSession.characterPool;

  // Use the character search hook with game characters
  const filteredCharacters = useCharacterSearch({
    characters: gameCharacters,
    searchTerm: characterSearchTerm,
  });

  // Initialize globalArcLimit from sessionData
  useEffect(() => {
    if (sessionData?.globalArcLimit) {
      setGlobalArcLimit(sessionData.globalArcLimit);
    }
  }, [sessionData]);

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
    if (!inputMessage.trim() || isProcessing) return;

    setIsProcessing(true);
    addMessage(inputMessage, true);
    const userInput = inputMessage;
    setInputMessage("");

    try {
      const answer = await askQuestion(userInput);
      addMessage(answer, false);
    } catch (error) {
      console.error("Error processing message:", error);
      addMessage("Sorry, there was an error processing your message. Please try again.", false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCharacterSelect = async (characterName: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    addMessage(`I guess it's ${characterName}!`, true);

    try {
      const guessResult = await makeGuess(characterName);

      if (guessResult.isCorrect) {
        // Navigate immediately to reveal - no message, no delay
        navigate("/reveal", {
          state: {
            character: guessResult.character,
            questionsAsked: guessResult.questionsAsked,
            guessesMade: guessResult.guessesMade,
            wasCorrectGuess: true, // Add flag to indicate this was a correct guess
          },
        });
      } else {
        // Frontend generates the failure message
        addMessage(
          `Sorry, that's not correct. The character is not ${characterName}. Try asking more questions!`,
          false
        );
      }
    } catch (error) {
      console.error("Error making guess:", error);
      addMessage("Sorry, there was an error processing your guess. Please try again.", false);
    } finally {
      setIsProcessing(false);
    }
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
    <div className="min-h-screen" style={{ backgroundColor: "hsl(220 15% 8% / 0.85)" }}>
      {/* Navigation */}
      <Navigation globalArcLimit={globalArcLimit} onMaxArcChange={handleMaxArcChange} availableArcs={availableArcs} />

      {/* Game Header */}
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Character Guessing Game</h1>
          </div>
        </div>
      </div>

      {/* Main Game Layout */}
      <div className="container mx-auto px-6 pb-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Chat Area */}
          <div className="flex flex-col h-[calc(100vh-16rem)]">
            <Card className="flex-1 flex flex-col border-border/40 shadow-sm">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground"></div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border/40 flex-shrink-0">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask a question about the character..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isProcessing}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={isProcessing || !inputMessage.trim()}>
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Character List Sidebar */}
          <div className="h-[calc(100vh-16rem)]">
            <Card className="h-full flex flex-col border-border/40 shadow-sm">
              <CharacterList
                characters={filteredCharacters}
                isLoading={false}
                searchTerm={characterSearchTerm}
                onSearchChange={setCharacterSearchTerm}
                onCharacterSelect={handleCharacterSelect}
                disabled={isProcessing}
              />

              {/* Footer */}
              <div className="p-4 border-t border-border/40 flex-shrink-0 space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  {filteredCharacters.length} of {gameCharacters.length} viable characters
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full" disabled={isProcessing}>
                      Reveal Character
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reveal Character?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to reveal the mystery character? This will end the current game.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRevealCharacter}>Yes, Reveal Character</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
