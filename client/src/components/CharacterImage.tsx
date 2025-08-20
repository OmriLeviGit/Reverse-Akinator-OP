import React, { useState } from "react";
import { Character } from "@/types";

interface CharacterImageProps {
  character: Character;
  size?: "small" | "medium" | "large";
  className?: string;
}

export const CharacterImage: React.FC<CharacterImageProps> = ({ character, size = "small", className = "" }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-32 h-32",
    large: "w-full h-full",
  };

  // Determine image path based on size
  const imagePath = size === "large" ? `/img/lg_avatars/${character.id}.webp` : `/img/sm_avatars/${character.id}.webp`;

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg border border-border/20 overflow-hidden flex-shrink-0 relative ${className}`}
    >
      {/* Loading skeleton */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">?</span>
        </div>
      )}

      {/* Actual image */}
      <img
        src={imagePath}
        alt={character.name}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => {
          setImageLoaded(true);
          setImageError(false);
        }}
        onError={() => {
          console.log(`❌ Failed to load: ${character.name} - ${imagePath}`);
          setImageError(true);
          setImageLoaded(false);
        }}
      />
    </div>
  );
};
