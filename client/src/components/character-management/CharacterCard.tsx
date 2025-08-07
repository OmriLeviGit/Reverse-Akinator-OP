// src/components/character-management/CharacterCard.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Character } from "../../types/character";
import { DifficultyRating } from "@/components/DifficultyRating";

interface CharacterCardProps {
  character: Character;
  currentRating: string | null; // ✅ Updated to match new difficulty type
  isIgnored: boolean;
  onRatingChange: (characterId: string, rating: number) => void;
  onIgnoreToggle: (characterId: string, isCurrentlyIgnored: boolean) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  currentRating, 
  isIgnored, 
  onRatingChange, 
  onIgnoreToggle 
}) => {
  // Helper function to get display text for filler status
  const getFillerStatusDisplay = (status: string) => {
    switch (status) {
      case "Canon":
        return "Canon";
      case "Filler":
        return "Filler";
      case "Filler-Non-TV":
        return "Filler (Non-TV)";
      default:
        return status;
    }
  };

  // Helper function to convert string rating to number for DifficultyRating component
  const getRatingAsNumber = (rating: string | null): number => {
    if (!rating) return 0;
    const parsed = parseFloat(rating);
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <div
      className={`backdrop-blur-lg rounded-2xl p-6 ship-shadow border border-white/20 transition-all duration-200 ${
        isIgnored ? "bg-white/5 opacity-75" : "bg-white/10 hover:bg-white/15"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Character Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
            {character.image ? (
              <img 
                src={character.image} 
                alt={character.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <span className="text-white/60 text-xs">No Image</span>
              </div>
            )}
          </div>
          <div>
            <h3 className={`text-xl font-bold mb-1 ${isIgnored ? "text-white/60" : "text-white"}`}>
              {character.name}
            </h3>
            <div className={`text-sm mb-1 ${isIgnored ? "text-white/40" : "text-white/60"}`}>
              {getFillerStatusDisplay(character.fillerStatus)}
            </div>
            {/* Show episode/chapter info if available */}
            {(character.episode || character.chapter) && (
              <div className={`text-xs mb-1 ${isIgnored ? "text-white/30" : "text-white/50"}`}>
                {character.episode && `Episode ${character.episode}`}
                {character.episode && character.chapter && " • "}
                {character.chapter && `Chapter ${character.chapter}`}
              </div>
            )}
            {character.wikiLink && (
          <a href={character.wikiLink} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline transition-colors text-sm">
            View Wiki
          </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          {/* Difficulty Rating */}
          <div className="space-y-3 text-center">
            <DifficultyRating 
              currentRating={getRatingAsNumber(currentRating)} 
              onRatingChange={(rating) => onRatingChange(character.id, rating)} // ✅ Use character.id
            />
            {/* Show current difficulty from character if available */}
            {character.difficulty && (
              <div className={`text-xs ${isIgnored ? "text-white/40" : "text-white/60"}`}>
                Base: {character.difficulty}
              </div>
            )}
          </div>

          {/* Ignore Toggle */}
          <div className="space-y-3 text-center">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={() => onIgnoreToggle(character.id, isIgnored)} // ✅ Use character.id
                variant="outline"
                size="sm"
                className={
                  isIgnored
                    ? "bg-white/20 hover:bg-white/30 text-white border border-white/40 text-xs px-2 py-1"
                    : "bg-white/10 text-white border-white/30 hover:bg-white/20 text-xs px-2 py-1"
                }
              >
                {isIgnored ? "Unignore" : "Ignore"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};