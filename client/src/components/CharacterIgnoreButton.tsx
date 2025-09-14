import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface CharacterIgnoreButtonProps {
  character: {
    id: string;
    isIgnored: boolean;
  };
  onIgnoreToggle: (characterId: string) => void;
  variant?: "full" | "compact";
}

const CharacterIgnoreButton = ({
  character,
  onIgnoreToggle,
  variant = "full",
}: CharacterIgnoreButtonProps) => {
  const isCompact = variant === "compact";

  return (
    <Button
      onClick={() => onIgnoreToggle(character.id)}
      variant="outline"
      className={`w-full transition-all duration-200 ease-in-out ${isCompact ? "text-xs h-8 px-2 py-1" : ""} ${
        character.isIgnored
          ? "bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:text-green-100 border-green-500/50"
          : "bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-100 border-red-500/50"
      }`}
    >
      {character.isIgnored ? (
        <>
          <Eye className={`${isCompact ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"} transition-all duration-200`} />
          {isCompact ? "Remove from Ignored" : "Remove from Ignore List"}
        </>
      ) : (
        <>
          <EyeOff className={`${isCompact ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"} transition-all duration-200`} />
          {isCompact ? "Add to Ignored" : "Add to Ignore List"}
        </>
      )}
    </Button>
  );
};

export default CharacterIgnoreButton;
