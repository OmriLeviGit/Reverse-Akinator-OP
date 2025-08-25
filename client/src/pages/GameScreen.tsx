// src/pages/GameScreen.tsx - Updated with new hook structure
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAppContext } from "../contexts/AppContext";
import { useGameSession } from "../hooks/useGameSession";
import { useGameGuess } from "../hooks/useGameGuess";
import { useGameChat } from "../hooks/useGameChat";
import { ChatArea } from "../components/game/ChatArea";
import { CharacterSidebar } from "../components/game/CharacterSidebar";

const GameScreen: React.FC = () => {
  const { sessionData, availableArcs, updateGlobalArcLimit } = useAppContext();
  const { currentGameSession, validateSessionOnPageLoad, isValidatingSession } = useGameSession();

  // Use the combined useGameChat hook
  const {
    messages,
    addMessage,
    inputMessage,
    setInputMessage,
    isProcessingChat,
    handleSendMessage,
    textareaRef,
    messagesEndRef,
  } = useGameChat(currentGameSession?.gameId);

  // Pass addMessage to useGameGuess
  const { isProcessingGuess, handleCharacterSelect } = useGameGuess(addMessage);

  const [globalArcLimit, setGlobalArcLimit] = useState<string>("All");
  const [hasValidated, setHasValidated] = useState(false);

  const gameCharacters = currentGameSession?.characterPool || [];

  const handleMaxArcChange = (arcName: string) => {
    setGlobalArcLimit(arcName);
    localStorage.setItem("globalArcLimit", arcName);
    updateGlobalArcLimit(arcName);
  };

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

  // Don't render if no valid session
  if (!currentGameSession?.isActive) {
    return null;
  }

  return (
    <Layout globalArcLimit={globalArcLimit} onMaxArcChange={handleMaxArcChange} availableArcs={availableArcs}>
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Character Guessing Game</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pb-4 sm:pb-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 lg:gap-6">
          {/* Chat Area */}
          <div className="flex flex-col h-[calc(100vh-12rem)] sm:h-[calc(100vh-16rem)] max-h-[600px] sm:max-h-[700px] min-h-[300px] sm:min-h-[400px]">
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

          {/* Character Sidebar */}
          <div className="h-[300px] lg:h-[calc(100vh-16rem)] max-h-[600px] lg:max-h-[700px] min-h-[300px] lg:min-h-[400px]">
            <CharacterSidebar
              gameCharacters={gameCharacters}
              onCharacterSelect={(name) => handleCharacterSelect(name, isProcessingChat)}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GameScreen;
