
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
  onRatingChange: (characterName: string, rating: number) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  currentRating,
  onRatingChange
}) => {
  return (
    <div 
      className="backdrop-blur-lg rounded-2xl p-6 ship-shadow border border-white/20 transition-all duration-200 bg-white/10 hover:bg-white/15"
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
            <h3 className="text-xl font-bold mb-1 text-white">
              {character.name}
            </h3>
            <div className="text-sm mb-1 text-white/60">
              {character.firstAppeared.type === 'filler' ? 'Filler Character' : 'Canon Character'}
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
        
        {/* Difficulty Rating */}
        <div className="space-y-3 text-center">
          <div className="text-white/90 text-sm font-bold">Difficulty Rating</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(ratingLabels).map(([rating, label]) => (
              <Button
                key={rating}
                onClick={() => onRatingChange(character.name, parseInt(rating))}
                variant={currentRating === parseInt(rating) ? 'default' : 'outline'}
                size="sm"
                className={currentRating === parseInt(rating) 
                  ? (parseInt(rating) === 0 
                    ? 'bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 border border-white/30'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-xs px-2 py-1')
                  : 'bg-white/10 text-white border-white/30 hover:bg-white/20 text-xs px-2 py-1'
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
