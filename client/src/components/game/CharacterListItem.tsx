import React, { useState, useRef } from "react";
import { Character } from "@/types"; // Add this line
import { CharacterImage } from "../CharacterImage";
import { CharacterPreview } from "./CharacterPreview";

interface CharacterListItemProps {
  character: Character;
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
    }, 1000); // 2 seconds delay
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
        className={`bg-card rounded-xl p-3 border border-border transition-all duration-200 cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary hover:border-secondary-hover"
        }`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center space-x-3 w-full">
          <CharacterImage character={character} size="medium" />
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-tight">{character.name}</p>
          </div>
        </div>
      </div>

      <CharacterPreview character={character} isVisible={showPreview} position={previewPosition} />
    </div>
  );
};
