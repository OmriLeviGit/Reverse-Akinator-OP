import React, { useState } from "react";
import { toast } from "sonner";
import Header from "./Header";
import NavigationHeader from "./NavigationHeader";
import GameInput from "./game/GameInput";
import MessageArea from "./game/MessageArea";
import GameActions from "./game/GameActions";
import CharacterSearch from "./CharacterSearch";
import { useGameMessages } from "../hooks/useGameMessages";

interface GameScreenProps {
  gameSessionId: string;
  allCharacters: string[]; // Add this
  onRevealCharacter: () => void;
  onReturnHome: () => void;
}

const API_BASE_URL = "http://localhost:3001/api"; // Adjust to your server URL

const GameScreen: React.FC<GameScreenProps> = ({
  gameSessionId,
  allCharacters, // Add this parameter
  onRevealCharacter,
}) => {
  const { messages, addMessage, messagesEndRef } = useGameMessages();
  const [inputMessage, setInputMessage] = useState("");
  const [showCharacterSearch, setShowCharacterSearch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const askQuestion = async (question: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/game/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_session_id: gameSessionId,
          question_text: question,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error("Error asking question:", error);
      throw error;
    }
  };

  const getHint = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/game/hint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_session_id: gameSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.hint;
    } catch (error) {
      console.error("Error getting hint:", error);
      throw error;
    }
  };

  const makeGuess = async (guess: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/game/guess`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_session_id: gameSessionId,
          guessed_character: guess,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
      // The input bar should ONLY be for yes/no questions
      const answer = await askQuestion(userInput);
      addMessage(answer, false);

      // Check if the game ended
      if (answer.toLowerCase().includes("congratulations") || answer.toLowerCase().includes("character was")) {
        setTimeout(() => {
          onRevealCharacter();
        }, 2000);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      addMessage("Sorry, there was an error processing your message. Please try again.", false);
      toast.error("Failed to process message");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHint = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    addMessage("Can I get a hint?", true);

    try {
      const hint = await getHint();
      addMessage(`Hint: ${hint}`, false);
    } catch (error) {
      console.error("Error getting hint:", error);
      addMessage("Sorry, I couldn't get a hint right now. Please try again.", false);
      toast.error("Failed to get hint");
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
          onRevealCharacter();
        }, 2000);
      } else {
        addMessage(guessResult.message, false);
      }
    } catch (error) {
      console.error("Error making guess:", error);
      addMessage("Sorry, there was an error processing your guess. Please try again.", false);
      toast.error("Failed to process guess");
    } finally {
      setIsProcessing(false);
    }
  };

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
            onRevealCharacter={onRevealCharacter}
            disabled={isProcessing}
          />
        </main>
      </div>

      {/* Character Search Modal */}
      {showCharacterSearch && (
        <CharacterSearch
          characters={allCharacters} // Pass the cached characters
          onCharacterSelect={handleCharacterSelect}
          onClose={() => setShowCharacterSearch(false)}
        />
      )}
    </div>
  );
};

export default GameScreen;
