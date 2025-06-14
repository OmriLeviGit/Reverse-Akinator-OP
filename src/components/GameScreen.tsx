
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from './Header';
import NavigationHeader from './NavigationHeader';
import MessageBubble from './MessageBubble';
import CharacterSearch from './CharacterSearch';
import { useGameContext } from '../contexts/GameContext';
import { fuzzySearch } from '../utils/fuzzySearch';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface GameScreenProps {
  onRevealCharacter: () => void;
  onReturnHome: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ onRevealCharacter, onReturnHome }) => {
  const { currentCharacter, allCharacters } = useGameContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to the One Piece Character Guessing Game! I\'m thinking of a character. Try to guess who it is!',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [showCharacterSearch, setShowCharacterSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToTop();
  }, [messages]);

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date()
    };
    setMessages(prev => [newMessage, ...prev]);
  };

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
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
          {/* Input Bar */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-4 ship-shadow border border-white/20">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Type your message or guess..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6"
              >
                Send
              </Button>
            </div>
          </div>

          {/* Messages Area - Hidden scrollbar */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-4 ship-shadow border border-white/20 h-64 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div ref={messagesEndRef} />
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message.text}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={handleHint}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-6 py-3"
            >
              Get Hint
            </Button>
            <Button
              onClick={() => setShowCharacterSearch(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-3"
            >
              Make Guess
            </Button>
            <Button
              onClick={onRevealCharacter}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-6 py-3"
            >
              Reveal Character
            </Button>
          </div>
        </main>
      </div>

      {/* Character Search Modal */}
      {showCharacterSearch && (
        <CharacterSearch
          onCharacterSelect={handleCharacterSelect}
          onClose={() => setShowCharacterSearch(false)}
        />
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default GameScreen;
