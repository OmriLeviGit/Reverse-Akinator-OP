import React, { useState } from "react";
import { BasicCharacter } from "../../types/character";
import { CharacterImage } from "../CharacterImage";
import CharacterDifficultyDropdown from "../CharacterDifficultyDropdown";
import CharacterIgnoreButton from "../CharacterIgnoreButton";

interface CharacterCardProps {
  character: BasicCharacter;
  onRatingChange: (characterId: string, difficulty: string | null) => void;
  onIgnoreToggle: (characterId: string) => void;
}

export const CharacterCard = ({ character, onRatingChange, onIgnoreToggle }: CharacterCardProps) => {
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
      className={`bg-card rounded-xl p-4 border border-border transition-opacity duration-100 ${
        character.isIgnored ? "opacity-60" : ""
      }`}
    >
      {/* Character Info */}
      <div className="text-center mb-3">
        {/* Character Name - Clickable - Now supports 2 lines */}
        {character.wikiLink ? (
          <a
            href={character.wikiLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            title={`View ${character.name} on wiki`}
            aria-label={`View ${character.name} on wiki`}
          >
            <h3 className="text-lg font-bold text-foreground mb-1 transition-colors leading-tight line-clamp-2 min-h-[2.5rem]">
              {character.name}
            </h3>
          </a>
        ) : (
          <h3 className="text-lg font-bold text-foreground mb-1 leading-tight line-clamp-2 min-h-[2.5rem]">
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
              title={`View ${character.name} on wiki`}
              aria-label={`View ${character.name} image on wiki`}
            >
              <CharacterImage character={character} size="medium" />
            </a>
          ) : (
            <CharacterImage character={character} size="medium" />
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
