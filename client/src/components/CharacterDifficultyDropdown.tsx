import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Character } from "@/types";
import { DIFFICULTY_OPTIONS, Difficulty, toTitleCase } from "@/utils/difficulties";

interface CharacterDifficultyDropdownProps {
  character: Character;
  onRatingChange: (characterId: string, difficulty: Difficulty) => void;
  size?: "default" | "small";
}

const CharacterDifficultyDropdown: React.FC<CharacterDifficultyDropdownProps> = ({
  character,
  onRatingChange,
  size = "default",
}) => {
  const isSmall = size === "small";

  return (
    <Select
      value={character.difficulty as string}
      onValueChange={(value) => onRatingChange(character.id, value as Difficulty)}
    >
      <SelectTrigger
        className={`w-full bg-input hover:bg-input hover:brightness-125 border-border text-foreground ${
          isSmall ? "text-xs h-8 px-2 py-1" : ""
        }`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {DIFFICULTY_OPTIONS.map((difficulty) => (
          <SelectItem
            key={difficulty}
            value={difficulty}
            className={`text-popover-foreground hover:bg-secondary ${isSmall ? "text-xs" : ""}`}
          >
            {toTitleCase(difficulty)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CharacterDifficultyDropdown;
