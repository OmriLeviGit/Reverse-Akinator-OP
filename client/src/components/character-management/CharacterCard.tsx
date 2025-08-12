// src/components/character-management/CharacterCard.tsx
import React from "react";
import { Character } from "../../types/character";

interface CharacterCardProps {
  character: Character;
  onRatingChange: (characterId: string, difficulty: string | null) => void;
  onIgnoreToggle: (characterId: string) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onRatingChange, onIgnoreToggle }) => {
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

  return (
    <div
      className={`bg-white/10 rounded-xl p-4 border border-white/20 transition-all duration-200 ${
        character.isIgnored ? "opacity-60" : "hover:bg-white/15"
      }`}
    >
      {/* Character Info */}
      <div className="text-center mb-3">
        {/* Character Name - Clickable - Now supports 2 lines */}
        {character.wikiLink ? (
          <a href={character.wikiLink} target="_blank" rel="noopener noreferrer" className="block">
            <h3
              className="text-lg font-bold text-white mb-1 hover:text-white/80 transition-colors leading-tight"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: "2.5rem", // Ensures consistent height for 2 lines
                lineHeight: "1.25rem",
              }}
              title={character.name}
            >
              {character.name}
            </h3>
          </a>
        ) : (
          <h3
            className="text-lg font-bold text-white mb-1 leading-tight"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.5rem", // Ensures consistent height for 2 lines
              lineHeight: "1.25rem",
            }}
            title={character.name}
          >
            {character.name}
          </h3>
        )}
        {/* Character Image - Clickable */}
        <div className="w-16 h-12 rounded-lg overflow-hidden border-2 border-white/30 mb-3 mx-auto bg-white/20">
          {character.wikiLink ? (
            <a
              href={character.wikiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full hover:opacity-80 transition-opacity"
            >
              {character.image ? (
                <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white/60 text-xs">N/A</span>
                </div>
              )}
            </a>
          ) : (
            <>
              {character.image ? (
                <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white/60 text-xs">N/A</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Episode/Chapter/Status - Fixed height container */}
        <div className="h-4 mb-2 flex items-center justify-center">
          <div className="text-xs text-gray-400 truncate flex items-center gap-1">
            {getFillerStatusDisplay(character.fillerStatus)}
            {(character.episode || character.chapter) && " • "}
            {character.episode && `Ep ${character.episode}`}
            {character.episode && character.chapter && " • "}
            {character.chapter && `Ch ${character.chapter}`}
          </div>
        </div>
      </div>

      {/* Actions - Fixed position */}
      <div className="space-y-2">
        {/* Difficulty */}
        <div>
          <select
            value={character.difficulty || ""}
            onChange={(e) => onRatingChange(character.id, e.target.value || null)}
            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
          >
            <option value="" className="bg-white text-gray-800">
              Unrated
            </option>
            <option value="very-easy" className="bg-white text-gray-800">
              Very Easy
            </option>
            <option value="easy" className="bg-white text-gray-800">
              Easy
            </option>
            <option value="medium" className="bg-white text-gray-800">
              Medium
            </option>
            <option value="hard" className="bg-white text-gray-800">
              Hard
            </option>
            <option value="really-hard" className="bg-white text-gray-800">
              Really Hard
            </option>
          </select>
        </div>

        {/* Ignore Button */}
        <button
          onClick={() => onIgnoreToggle(character.id)}
          className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
            character.isIgnored
              ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
              : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
          }`}
        >
          {character.isIgnored ? "Unignore" : "Ignore"}
        </button>
      </div>
    </div>
  );
};
