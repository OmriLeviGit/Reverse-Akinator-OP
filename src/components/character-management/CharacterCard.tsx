
import React from 'react';
import { Button } from "@/components/ui/button";
import { ratingLabels } from '../../types/characterManagement';

interface Character {
  name: string;
  image: string;
  wikiUrl: string;
  firstAppeared: {
    type: string;
  };
}

interface CharacterCardProps {
  character: Character;
  currentRating: number;
  isIgnored: boolean;
  onRatingChange: (characterName: string, rating: number) => void;
  onIgnoreToggle: (characterName: string, isCurrentlyIgnored: boolean) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  currentRating,
  isIgnored,
  onRatingChange,
  onIgnoreToggle
}) => {
  return (
    <div 
      className={`backdrop-blur-lg rounded-2xl p-6 ship-shadow border border-white/20 transition-all duration-200 ${
        isIgnored 
          ? 'bg-white/5 opacity-75' 
          : 'bg-white/10 hover:bg-white/15'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Character Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
            <img
              src={character.image}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className={`text-xl font-bold mb-1 ${isIgnored ? 'text-white/60' : 'text-white'}`}>
              {character.name}
            </h3>
            <div className="flex items-center gap-3 mb-2">
              <div className={`text-xs px-2 py-1 rounded-full ${
                character.firstAppeared.type === 'filler' 
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30' 
                  : 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
              }`}>
                {character.firstAppeared.type === 'filler' ? 'Filler' : 'Canon'}
              </div>
              <a
                href={character.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 underline transition-colors text-sm"
              >
                View Wiki
              </a>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Difficulty Rating */}
          <div className="space-y-2">
            <div className="text-white/90 text-sm font-medium text-center">Difficulty Rating</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(ratingLabels).map(([rating, label]) => (
                <Button
                  key={rating}
                  onClick={() => onRatingChange(character.name, parseInt(rating))}
                  variant={currentRating === parseInt(rating) ? 'default' : 'outline'}
                  size="sm"
                  className={currentRating === parseInt(rating) 
                    ? (parseInt(rating) === 0 
                      ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs px-2 py-1'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1')
                    : 'bg-white/10 text-white border-white/30 hover:bg-white/20 text-xs px-2 py-1'
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Ignore Toggle */}
          <div className="space-y-2">
            <div className="text-white/90 text-sm font-medium text-center">Ignore Status</div>
            <Button
              onClick={() => onIgnoreToggle(character.name, isIgnored)}
              className={isIgnored
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-2'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-6 py-2'
              }
            >
              {isIgnored ? 'Unignore' : 'Ignore'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
