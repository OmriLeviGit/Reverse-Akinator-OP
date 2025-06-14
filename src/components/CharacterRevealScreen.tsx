import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import Header from './Header';
import NavigationHeader from './NavigationHeader';
import { useGameContext } from '../contexts/GameContext';

interface CharacterRevealScreenProps {
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

const CharacterRevealScreen: React.FC<CharacterRevealScreenProps> = ({ 
  onPlayAgain, 
  onReturnHome 
}) => {
  const { currentCharacter, characterRatings, setCharacterRating, addToIgnoredCharacters } = useGameContext();
  const [showIgnoreConfirmation, setShowIgnoreConfirmation] = useState(false);

  if (!currentCharacter) {
    return <div>No character data available</div>;
  }

  const ratingLabels = {
    1: 'Very Easy',
    2: 'Easy',
    3: 'Medium',
    4: 'Hard',
    5: 'Really Hard'
  };

  const currentRating = characterRatings[currentCharacter.name];

  const handleRating = (rating: number) => {
    setCharacterRating(currentCharacter.name, rating);
  };

  const handleIgnoreCharacter = () => {
    addToIgnoredCharacters(currentCharacter.name);
    setShowIgnoreConfirmation(true);
    setTimeout(() => setShowIgnoreConfirmation(false), 3000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ocean Background without Animation */}
      <div className="absolute inset-0 ocean-gradient"></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <NavigationHeader />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Character Reveal Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 ship-shadow border border-white/20">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Character Revealed!</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
              </div>

              {/* Character Image */}
              <div className="flex justify-center mb-6">
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/30 ship-shadow">
                  <img
                    src={currentCharacter.image}
                    alt={currentCharacter.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Character Name */}
              <h3 className="text-2xl font-bold text-center pirate-text mb-4">
                {currentCharacter.name}
              </h3>

              {/* Character Description */}
              <div className="bg-white/20 rounded-xl p-4 mb-4">
                <p className="text-white leading-relaxed text-center">
                  {currentCharacter.description}
                </p>
              </div>

              {/* Current Rating Display */}
              {currentRating && (
                <div className="text-center mb-4">
                  <p className="text-white/90 text-lg">
                    Current Difficulty: <span className="font-semibold text-yellow-300">{ratingLabels[currentRating as keyof typeof ratingLabels]}</span>
                  </p>
                </div>
              )}

              {/* Character Information */}
              <div className="text-left mb-6 space-y-1">
                <p className="text-white/70 text-sm">
                  First appeared: {currentCharacter.firstAppeared.chapter}, ({currentCharacter.firstAppeared.type})
                </p>
                <a
                  href={currentCharacter.wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 underline transition-colors text-sm block"
                >
                  View on One Piece Wiki
                </a>
              </div>

              {/* Difficulty Rating System */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-white text-center mb-4">
                  How difficult was this character to guess?
                </h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(ratingLabels).map(([rating, label]) => (
                    <Button
                      key={rating}
                      onClick={() => handleRating(parseInt(rating))}
                      variant={currentRating === parseInt(rating) ? 'default' : 'outline'}
                      className={currentRating === parseInt(rating) 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
                        : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                      }
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                <Button
                  onClick={onPlayAgain}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Play Again
                </Button>
                <Button
                  onClick={onReturnHome}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Return to Home
                </Button>
                <Button
                  onClick={handleIgnoreCharacter}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Don't Show Again
                </Button>
              </div>

              {/* Confirmation Message */}
              {showIgnoreConfirmation && (
                <div className="text-center">
                  <p className="text-green-300 text-sm">Character added to ignore list!</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center">
          <p className="text-white/70 text-sm">
            Thanks for playing the One Piece Character Guessing Game!
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CharacterRevealScreen;
