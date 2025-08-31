import React, { useState, useRef } from "react";
import { BasicCharacter } from "@/types"; // Add this line
import { CharacterImage } from "../CharacterImage";
import { CharacterPreview } from "./CharacterPreview";

interface CharacterListItemProps {
  character: BasicCharacter;
  onSelect: (characterName: string) => void;
  disabled?: boolean;
}

export const CharacterListItem: React.FC<CharacterListItemProps> = ({ character, onSelect, disabled = false }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | undefined>();
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (disabled) return;

    // Calculate position for preview
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setPreviewPosition({
        x: rect.right + 8,
        y: rect.top + rect.height / 2,
      });
    }

    const timeout = setTimeout(() => {
      setShowPreview(true);
    }, 1000);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setShowPreview(false);
  };

  const handleClick = () => {
    if (!disabled) {
      onSelect(character.name);
    }
  };

  return (
    <div>
      <div
        ref={itemRef}
        className={`transition-all duration-200 cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
        }`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CharacterImage character={character} size="small" />
      </div>

      <CharacterPreview character={character} isVisible={showPreview} position={previewPosition} />
    </div>
  );
};
