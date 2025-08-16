import React, { useState } from "react";
import { Character } from "../../types/character";

interface CharacterCardProps {
  character: Character;
  onRatingChange: (characterId: string, difficulty: string | null) => void;
  onIgnoreToggle: (characterId: string) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onRatingChange, onIgnoreToggle }) => {
  const [imageError, setImageError] = useState(false);

  const getFillerStatusDisplay = (status: string) => {
    switch (status) {
      case "Canon":
        return "Canon";
      case "Filler":
        return "Filler";
      default:
        return status;
    }
  };

  // Function to determine what additional info to show
  const getAdditionalInfo = () => {
    const fillerStatus = character.fillerStatus;

    // Only show episode/chapter for TV content (Canon and Filler)
    if (fillerStatus === "Canon" || fillerStatus === "Filler") {
      const parts = [];
      if (character.episode) parts.push(`Ep ${character.episode}`);
      if (character.chapter) parts.push(`Ch ${character.chapter}`);
      return parts.join(" • ");
    }

    // For everything else (Non-TV), don't show episode/chapter
    return "";
  };

  const imageContent =
    character.id && !imageError ? (
      <img
        src={`/assets/sm_avatars/${character.id}.webp`}
        alt={character.name}
        className="w-full h-full object-cover"
        onError={() => {
          console.log(`❌ Failed to load: ${character.name} - /assets/sm_avatars/${character.id}.webp`);
          setImageError(true);
        }}
        onLoad={() => setImageError(false)}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-muted-foreground text-xs">N/A</span>
      </div>
    );

  return (
    <div
      className={`bg-card rounded-xl p-4 border border-border transition-all duration-200 ${
        character.isIgnored ? "opacity-60" : "hover:bg-card/80"
      }`}
    >
      {/* Character Info */}
      <div className="text-center mb-3">
        {/* Character Name - Clickable - Now supports 2 lines */}
        {character.wikiLink ? (
          <a href={character.wikiLink} target="_blank" rel="noopener noreferrer" className="block">
            <h3
              className="text-lg font-bold text-foreground mb-1 hover:text-primary transition-colors leading-tight"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: "2.5rem",
                lineHeight: "1.25rem",
              }}
              title={character.name}
            >
              {character.name}
            </h3>
          </a>
        ) : (
          <h3
            className="text-lg font-bold text-foreground mb-1 leading-tight"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.5rem",
              lineHeight: "1.25rem",
            }}
            title={character.name}
          >
            {character.name}
          </h3>
        )}

        {/* Character Image - Clickable */}
        <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-border mb-3 mx-auto bg-muted">
          {character.wikiLink ? (
            <a
              href={character.wikiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full hover:opacity-80 transition-opacity"
            >
              {imageContent}
            </a>
          ) : (
            imageContent
          )}
        </div>

        {/* Episode/Chapter/Status - Fixed height container */}
        <div className="h-4 mb-2 flex items-center justify-center">
          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
            {getFillerStatusDisplay(character.fillerStatus)}
            {getAdditionalInfo() && " • "}
            {getAdditionalInfo()}
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
            className="w-full px-2 py-1 bg-input border border-border rounded text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="" className="bg-popover text-popover-foreground">
              Unrated
            </option>
            <option value="very-easy" className="bg-popover text-popover-foreground">
              Very Easy
            </option>
            <option value="easy" className="bg-popover text-popover-foreground">
              Easy
            </option>
            <option value="medium" className="bg-popover text-popover-foreground">
              Medium
            </option>
            <option value="hard" className="bg-popover text-popover-foreground">
              Hard
            </option>
            <option value="really-hard" className="bg-popover text-popover-foreground">
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
