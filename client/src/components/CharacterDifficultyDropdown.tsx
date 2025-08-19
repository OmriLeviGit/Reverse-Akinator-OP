import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CharacterDifficultyDropdownProps {
  character: {
    id: string;
    difficulty: string | null | undefined;
  };
  onRatingChange: (characterId: string, difficulty: string | null) => void;
  size?: "default" | "small";
}

const CharacterDifficultyDropdown: React.FC<CharacterDifficultyDropdownProps> = ({
  character,
  onRatingChange,
  size = "default",
}) => {
  const getDifficultyDisplay = (difficulty: string | null | undefined) => {
    if (!difficulty || difficulty === "") return "Unrated";
    switch (difficulty) {
      case "very-easy":
        return "Very Easy";
      case "easy":
        return "Easy";
      case "medium":
        return "Medium";
      case "hard":
        return "Hard";
      case "really-hard":
        return "Really Hard";
      default:
        return "Unrated";
    }
  };

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
          {getDifficultyDisplay(character.difficulty)}
          <ChevronDown className={isSmall ? "h-3 w-3" : "h-4 w-4"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-popover border-border">
        <DropdownMenuItem
          onClick={() => onRatingChange(character.id, null)}
          className={`cursor-pointer hover:bg-secondary text-popover-foreground ${isSmall ? "text-xs" : ""}`}
        >
          Unrated
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRatingChange(character.id, "very-easy")}
          className={`cursor-pointer hover:bg-secondary text-popover-foreground ${isSmall ? "text-xs" : ""}`}
        >
          Very Easy
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRatingChange(character.id, "easy")}
          className={`cursor-pointer hover:bg-secondary text-popover-foreground ${isSmall ? "text-xs" : ""}`}
        >
          Easy
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRatingChange(character.id, "medium")}
          className={`cursor-pointer hover:bg-secondary text-popover-foreground ${isSmall ? "text-xs" : ""}`}
        >
          Medium
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRatingChange(character.id, "hard")}
          className={`cursor-pointer hover:bg-secondary text-popover-foreground ${isSmall ? "text-xs" : ""}`}
        >
          Hard
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRatingChange(character.id, "really-hard")}
          className={`cursor-pointer hover:bg-secondary text-popover-foreground ${isSmall ? "text-xs" : ""}`}
        >
          Really Hard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CharacterDifficultyDropdown;
