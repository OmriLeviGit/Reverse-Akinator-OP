import React, { useState } from "react";
import { Character } from "@/types";

interface CharacterImageProps {
  character: Character;
  size?: "small" | "medium" | "large";
  className?: string;
}

export const CharacterImage: React.FC<CharacterImageProps> = ({ character, size = "medium", className = "" }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-16 h-16",
    large: "w-32 h-32",
  };

  return (
    <div className={`${sizeClasses[size]} rounded border border-border/20 overflow-hidden flex-shrink-0 ${className}`}>
      {imageError ? (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">?</span>
        </div>
      ) : (
        <img
          src={`/img/sm_avatars/${character.id}.webp`}
          alt={character.name}
          className="w-full h-full object-cover"
          onError={() => {
            console.log(`❌ Failed to load: ${character.name} - /img/sm_avatars/${character.id}.webp`);
            setImageError(true);
          }}
          onLoad={() => setImageError(false)}
        />
      )}
    </div>
  );
};
