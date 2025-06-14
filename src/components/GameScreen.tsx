
import React, { useState } from 'react';
import Header from './Header';
import NavigationHeader from './NavigationHeader';
import GameInput from './game/GameInput';
import MessageArea from './game/MessageArea';
import GameActions from './game/GameActions';
import CharacterSearch from './CharacterSearch';
import { useGameContext } from '../contexts/GameContext';
import { useGameMessages } from '../hooks/useGameMessages';
import { fuzzySearch } from '../utils/fuzzySearch';

interface GameScreenProps {
  onRevealCharacter: () => void;
  onReturnHome: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ onRevealCharacter, onReturnHome }) => {
  const { currentCharacter } = useGameContext();
  const { messages, addMessage, messagesEndRef } = useGameMessages();
  const [inputMessage, setInputMessage] = useState('');
  const [showCharacterSearch, setShowCharacterSearch] = useState(false);

  const checkGuess = (guess: string): boolean => {
    if (!currentCharacter) return false;
    
    const guessLower = guess.toLowerCase().trim();
    const characterNameLower = currentCharacter.name.toLowerCase();
    
    // Exact match
    if (guessLower === characterNameLower) return true;
    
    // Fuzzy match using our utility
    const matches = fuzzySearch(guess, [currentCharacter.name]);
    return matches.length > 0;
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      addMessage(inputMessage, true);
      
      // Check if it's a correct guess
      if (checkGuess(inputMessage)) {
        setTimeout(() => {
          addMessage(`Congratulations! You guessed correctly! It was ${currentCharacter?.name}!`, false);
        }, 1000);
      } else {
        setTimeout(() => {
          addMessage('That\'s not quite right. Try asking for a hint or make another guess!', false);
        }, 1000);
      }
      
      setInputMessage('');
    }
  };

  const handleHint = () => {
    if (!currentCharacter) return;
    
    const hints = [
      `This character first appeared in chapter ${currentCharacter.firstAppeared.chapter}.`,
      'This character is known for their incredible strength and has a special connection to the sea.',
      'This character has a unique fighting style that sets them apart from others.',
      'This character is part of an important crew in the One Piece world.'
    ];
    
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    addMessage(randomHint, false);
  };

  const handleCharacterSelect = (character: string) => {
    addMessage(`I guess it's ${character}!`, true);
    setShowCharacterSearch(false);
    
    // Check if it's correct
    if (checkGuess(character)) {
      setTimeout(() => {
        addMessage(`Congratulations! You guessed correctly! It was ${currentCharacter?.name}!`, false);
      }, 1000);
    } else {
      setTimeout(() => {
        addMessage(`Good guess! ${character} is a great character, but that's not who I was thinking of. Try again!`, false);
      }, 1000);
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
          />

          <MessageArea
            messages={messages}
            messagesEndRef={messagesEndRef}
          />

          <GameActions
            onHint={handleHint}
            onMakeGuess={() => setShowCharacterSearch(true)}
            onRevealCharacter={onRevealCharacter}
          />
        </main>
      </div>

      {/* Character Search Modal */}
      {showCharacterSearch && (
        <CharacterSearch
          onCharacterSelect={handleCharacterSelect}
          onClose={() => setShowCharacterSearch(false)}
        />
      )}
    </div>
  );
};

export default GameScreen;
