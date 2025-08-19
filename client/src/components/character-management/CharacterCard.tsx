import React, { useState } from "react";
import { Character } from "../../types/character";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CharacterImage } from "../CharacterImage";
import CharacterDifficultyDropdown from "../CharacterDifficultyDropdown";
import CharacterIgnoreButton from "../CharacterIgnoreButton";

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

  return (
    <div
      className={`bg-card rounded-xl p-4 border border-border transition-all duration-200 ${
        character.isIgnored ? "opacity-60" : ""
      }`}
    >
      {/* Character Info */}
      <div className="text-center mb-3">
        {/* Character Name - Clickable - Now supports 2 lines */}
        {character.wikiLink ? (
          <a href={character.wikiLink} target="_blank" rel="noopener noreferrer" className="block">
            <h3
              className="text-lg font-bold text-foreground mb-1 transition-colors leading-tight"
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
        <div className="mb-3 mx-auto flex justify-center">
          {character.wikiLink ? (
            <a
              href={character.wikiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity"
            >
              <CharacterImage character={character} size="large" />
            </a>
          ) : (
            <CharacterImage character={character} size="large" />
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
        <CharacterDifficultyDropdown character={character} onRatingChange={onRatingChange} size="small" />
        <CharacterIgnoreButton character={character} onIgnoreToggle={onIgnoreToggle} variant="compact" />
      </div>
    </div>
  );
};
