
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from './Header';
import MessageBubble from './MessageBubble';
import CharacterSearch from './CharacterSearch';

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

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputMessage,
        isUser: true,
        timestamp: new Date()
      };
      
      // Add new message at the beginning (top) of the array
      setMessages(prev => [newMessage, ...prev]);
      setInputMessage('');
      
      // Simulate game response
      setTimeout(() => {
        const gameResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Interesting guess! Try asking for a hint or make another guess.',
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [gameResponse, ...prev]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleHint = () => {
    const hintMessage: Message = {
      id: Date.now().toString(),
      text: 'Here\'s a hint: This character is known for their incredible strength and has a special connection to the sea.',
      isUser: false,
      timestamp: new Date()
    };
    setMessages(prev => [hintMessage, ...prev]);
  };

  const handleCharacterSelect = (character: string) => {
    const guessMessage: Message = {
      id: Date.now().toString(),
      text: `I guess it's ${character}!`,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [guessMessage, ...prev]);
    setShowCharacterSearch(false);
    
    // Simulate game response
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Good guess! ${character} is a great character, but that's not who I was thinking of. Try again!`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [responseMessage, ...prev]);
    }, 1000);
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

          {/* Messages Area */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-4 ship-shadow border border-white/20 h-64 overflow-hidden">
            <div className="h-full overflow-y-auto">
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
    </div>
  );
};

export default GameScreen;
