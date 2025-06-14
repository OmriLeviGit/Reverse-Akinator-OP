
import React from 'react';
import { Button } from "@/components/ui/button";
import Header from './Header';

interface CharacterRevealScreenProps {
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

const CharacterRevealScreen: React.FC<CharacterRevealScreenProps> = ({ 
  onPlayAgain, 
  onReturnHome 
}) => {
  // Placeholder character data
  const character = {
    name: "Monkey D. Luffy",
    image: "/placeholder.svg",
    description: "The main protagonist of One Piece and captain of the Straw Hat Pirates. Known for his rubber powers from the Gomu Gomu no Mi devil fruit and his unwavering determination to become the Pirate King. Luffy is characterized by his optimistic personality, love for adventure, and fierce loyalty to his friends."
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
                    src={character.image}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Character Name */}
              <h3 className="text-2xl font-bold text-center pirate-text mb-4">
                {character.name}
              </h3>

              {/* Character Description */}
              <div className="bg-white/20 rounded-xl p-4 mb-6">
                <p className="text-white leading-relaxed text-center">
                  {character.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={onPlayAgain}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Play Again
                </Button>
                <Button
                  onClick={onReturnHome}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Return to Home
                </Button>
              </div>
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
