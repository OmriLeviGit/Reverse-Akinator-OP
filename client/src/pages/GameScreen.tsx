import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NavigationHeader from "../components/NavigationHeader";
import GameInput from "../components/game/GameInput";
import MessageArea from "../components/game/MessageArea";
import GameActions from "../components/game/GameActions";
import CharacterSearch from "../components/CharacterSearch";
import { useGameMessages } from "../hooks/useGameMessages";
import { useGameContext } from "../contexts/AppContext";
import { gameApi } from "../services/api"; // Add this import
import { useCharacters } from "@/hooks/useCharacters";

const GameScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentGameSession, revealCharacter } = useGameContext();
  const { allCharacters, isLoadingCharacters } = useCharacters();
  const { messages, addMessage, messagesEndRef } = useGameMessages();

  const [inputMessage, setInputMessage] = useState("");
  const [showCharacterSearch, setShowCharacterSearch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleHint = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    addMessage("Can I get a hint?", true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      addMessage(`no hits`, false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCharacterSelect = async (character: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    addMessage(`I guess it's ${character}!`, true);
    setShowCharacterSearch(false);

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

      // ✅ Navigate to reveal page instead of showing component
      navigate("/reveal");
    } catch (error) {
      console.error("❌ Failed to reveal character:", error);
    }
  };

  const handleReturnHome = () => {
    navigate("/");
  };

  // Show game screen
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ocean Background */}
      <div className="absolute inset-0 ocean-gradient">
        <div className="absolute inset-0">
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <NavigationHeader />

        <main className="flex-1 container mx-auto px-4 py-4 max-w-4xl">
          <GameInput
            inputMessage={inputMessage}
            onInputChange={setInputMessage}
            onSendMessage={handleSendMessage}
            disabled={isProcessing}
          />

          <MessageArea messages={messages} messagesEndRef={messagesEndRef} />

          <GameActions
            onHint={handleHint}
            onMakeGuess={() => setShowCharacterSearch(true)}
            onRevealCharacter={handleRevealCharacter}
            disabled={isProcessing}
          />
        </main>
      </div>

      {/* Character Search Modal */}
      {showCharacterSearch && (
        <CharacterSearch
          characters={allCharacters.map((char) => char.name)}
          onCharacterSelect={handleCharacterSelect}
          onClose={() => setShowCharacterSearch(false)}
        />
      )}
    </div>
  );
};

export default GameScreen;
