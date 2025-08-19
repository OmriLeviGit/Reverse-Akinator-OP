import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { useGameMessages } from "../hooks/useGameMessages";
import { useAppContext } from "../contexts/AppContext";
import { gameApi } from "../services/api";
import { useCharacters } from "@/hooks/useCharacters";
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
  const { currentGameSession, revealCharacter, sessionData, availableArcs, updateGlobalArcLimit } = useAppContext();
  const { allCharacters, isLoadingCharacters } = useCharacters();
  const { messages, addMessage, messagesEndRef } = useGameMessages();

  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalArcLimit, setGlobalArcLimit] = useState<string>("All");
  const [characterSearchTerm, setCharacterSearchTerm] = useState("");

  // Use the character search hook
  const filteredCharacters = useCharacterSearch({
    characters: allCharacters,
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
    if (!currentGameSession) {
      navigate("/");
    }
  }, [currentGameSession, navigate]);

  // Don't render anything if no game session
  if (!currentGameSession) {
    return null;
  }

  const askQuestion = async (question: string) => {
    try {
      const data = await gameApi.askQuestion(currentGameSession.gameSessionId, question);
      return data.answer;
    } catch (error) {
      console.error("Error asking question:", error);
      throw error;
    }
  };

  const makeGuess = async (guess: string) => {
    try {
      const data = await gameApi.makeGuess(currentGameSession.gameSessionId, guess);
      return data;
    } catch (error) {
      console.error("Error making guess:", error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    setIsProcessing(true);
    addMessage(inputMessage, true);
    const userInput = inputMessage;
    setInputMessage("");

    try {
      const answer = await askQuestion(userInput);
      addMessage(answer, false);

      if (answer.toLowerCase().includes("congratulations") || answer.toLowerCase().includes("character was")) {
        setTimeout(() => {
          handleRevealCharacter();
        }, 2000);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      addMessage("Sorry, there was an error processing your message. Please try again.", false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCharacterSelect = async (character: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    addMessage(`I guess it's ${character}!`, true);

    try {
      const guessResult = await makeGuess(character);

      if (guessResult.is_correct) {
        addMessage(guessResult.message, false);
        setTimeout(() => {
          handleRevealCharacter();
        }, 2000);
      } else {
        addMessage(guessResult.message, false);
      }
    } catch (error) {
      console.error("Error making guess:", error);
      addMessage("Sorry, there was an error processing your guess. Please try again.", false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevealCharacter = async () => {
    console.log("🎭 handleRevealCharacter called");

    try {
      const result = await revealCharacter();
      console.log("✅ Character revealed:", result);
      navigate("/reveal");
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation globalArcLimit={globalArcLimit} onMaxArcChange={handleMaxArcChange} availableArcs={availableArcs} />

      {/* Game Header */}
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Character Guessing Game</h1>
            {/* <p className="text-muted-foreground">Ask questions to guess the mystery character</p> */}
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
                isLoading={isLoadingCharacters}
                searchTerm={characterSearchTerm}
                onSearchChange={setCharacterSearchTerm}
                onCharacterSelect={handleCharacterSelect}
                disabled={isProcessing}
              />

              {/* Footer */}
              <div className="p-4 border-t border-border/40 flex-shrink-0 space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  {filteredCharacters.length} of {allCharacters.length} characters
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

      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent opacity-5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default GameScreen;
