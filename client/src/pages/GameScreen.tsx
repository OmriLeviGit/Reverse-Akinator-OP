// src/pages/GameScreen.tsx - Updated with new hook structure
import React, { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import { useGameSession } from "../hooks/useGameSession";
import { useGameGuess } from "../hooks/useGameGuess";
import { ChatArea } from "../components/game/ChatArea";
import { CharacterSidebar } from "../components/game/CharacterSidebar";

const GameScreen = () => {
  const { sessionData, availableArcs, updateGlobalArcLimit } = useAppContext();

  // Use the combined useGameSession hook that includes chat
  const {
    currentGameSession,
    validateSessionOnPageLoad,
    isValidatingSession,
    messages,
    inputMessage,
    setInputMessage,
    isProcessingChat,
    isLoadingMessages,
    messageError,
    handleSendMessage,
    addMessage,
    textareaRef,
    messagesEndRef,
  } = useGameSession();

  // Pass addMessage to useGameGuess
  const { isProcessingGuess, handleCharacterSelect } = useGameGuess(addMessage);

  const [globalArcLimit, setGlobalArcLimit] = useState<string>("All");
  const [hasValidated, setHasValidated] = useState(false);

  const gameCharacters = currentGameSession?.characterPool || [];

  // Initial validation
  useEffect(() => {
    const validate = async () => {
      if (hasValidated) return;

      const isValid = await validateSessionOnPageLoad();
      if (isValid) {
        setHasValidated(true);
      }
    };

    validate();
  }, [validateSessionOnPageLoad, hasValidated]);

  // Initialize global arc limit
  useEffect(() => {
    if (sessionData?.globalArcLimit) {
      setGlobalArcLimit(sessionData.globalArcLimit);
    }
  }, [sessionData]);

  // Show loading while validating or loading messages
  if (isValidatingSession || isLoadingMessages) {
    const loadingText = isValidatingSession ? "Validating game session..." : "Loading chat messages...";
    return (
      <>
        <div className="container mx-auto px-6 py-4 max-w-7xl flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">{loadingText}</span>
        </div>
      </>
    );
  }

  // Don't render if no valid session
  if (!currentGameSession?.isActive) {
    return null;
  }

  return (
    <div className="container mx-auto px-6 pt-4 pb-12 max-w-8xl h-full flex flex-col">
      {/* Title Section */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Character Guessing Game</h1>
        </div>
      </div>

      {/* Error Message */}
      {messageError && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex-shrink-0">
          <p className="text-destructive text-sm">{messageError}</p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-10 gap-6 flex-1 min-h-0 h-0">
        {/* Chat Area - Takes 70% of the width */}
        <div className="col-span-7 flex flex-col">
          <ChatArea
            messages={messages}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            isProcessingChat={isProcessingChat}
            isProcessingGuess={isProcessingGuess}
            handleSendMessage={handleSendMessage}
            textareaRef={textareaRef}
            messagesEndRef={messagesEndRef}
          />
        </div>

        {/* Sidebar - Takes 30% of the width */}
        <div className="col-span-3 flex flex-col overflow-hidden">
          <CharacterSidebar
            gameCharacters={gameCharacters}
            onCharacterSelect={(name) => handleCharacterSelect(name, isProcessingChat)}
          />
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
