import React from "react";
import { BasicCharacter } from "@/types";
import { CharacterImage } from "../CharacterImage";

interface CharacterPreviewProps {
  character: BasicCharacter;
  isVisible: boolean;
  position?: { x: number; y: number };
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({ character, isVisible, position }) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: position?.x ? `${position.x}px` : "calc(100% + 8px)",
        top: position?.y ? `${position.y}px` : "50%",
        transform: position?.y ? "none" : "translateY(-50%)",
      }}
    >
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
        <CharacterImage character={character} size="medium" />
        <p className="text-sm font-medium text-foreground text-center mt-2 break-words w-32">{character.name}</p>
      </div>
    </div>
  );
};
