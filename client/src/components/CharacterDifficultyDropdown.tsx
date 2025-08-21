import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-between bg-input hover:bg-secondary text-foreground hover:text-foreground border-border ${
            isSmall ? "text-xs h-8 px-2 py-1" : ""
          }`}
        >
          {toTitleCase(character.difficulty as Difficulty)}
          <ChevronDown className={isSmall ? "h-3 w-3" : "h-4 w-4"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-popover border-border">
        {DIFFICULTY_OPTIONS.map((difficulty) => (
          <DropdownMenuItem
            key={difficulty}
            onClick={() => onRatingChange(character.id, difficulty)}
            className={`cursor-pointer hover:bg-secondary text-popover-foreground ${isSmall ? "text-xs" : ""}`}
          >
            {toTitleCase(difficulty)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CharacterDifficultyDropdown;
