import React, { useState } from "react";
import { BasicCharacter } from "@/types";

interface CharacterImageProps {
  character: BasicCharacter;
  size?: "small" | "medium" | "large";
  className?: string;
}

export const CharacterImage: React.FC<CharacterImageProps> = ({ character, size = "small", className = "" }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-32 h-32",
    large: "w-full h-full",
  };

  // Determine image paths based on size
  const characterImagePath =
    size === "large" ? `/img/lg_avatars/${character.id}.webp` : `/img/sm_avatars/${character.id}.webp`;

  const fallbackImagePath =
    size === "large" ? `/img/lg_avatars/_NoPicAvailable.webp` : `/img/sm_avatars/_NoPicAvailable.webp`;

  // Current image path based on fallback state
  const currentImagePath = usingFallback ? fallbackImagePath : characterImagePath;

  const handleImageError = () => {
    // If we're already using fallback, show error
    if (usingFallback) {
      setImageError(true);
      setImageLoaded(false);
      return;
    }

    // Switch to fallback
    setUsingFallback(true);
    setImageLoaded(false);
    setImageError(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // Reset states when character changes
  React.useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setUsingFallback(false);
  }, [character.id]);

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

      {/* Error state - only shown if even the fallback fails */}
      {imageError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">?</span>
        </div>
      )}

      {/* Actual image */}
      <img
        key={`${character.id}-${usingFallback}`} // Force re-render when switching to fallback
        src={currentImagePath}
        alt={character.name}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};
