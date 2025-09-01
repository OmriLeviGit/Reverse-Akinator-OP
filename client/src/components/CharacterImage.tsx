import React, { useState, useRef, useEffect } from "react";
import { BasicCharacter } from "@/types";

interface CharacterImageProps {
  character: BasicCharacter;
  size?: "small" | "medium" | "large";
  className?: string;
  maxWidth?: number;
}

export const CharacterImage: React.FC<CharacterImageProps> = ({
  character,
  size = "small",
  className = "",
  maxWidth,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-32 h-32",
    large: "w-full h-0 min-h-full flex items-center justify-center",
  };

  // Determine image paths based on size
  const characterImagePath =
    size === "large" ? `/img/avatars/large/${character.id}.webp` : `/img/avatars/small/${character.id}.webp`;

  const fallbackImagePath =
    size === "large" ? `/img/avatars/large/_NoPicAvailable.webp` : `/img/avatars/small/_NoPicAvailable.webp`;

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

    // For large images, calculate dimensions based on natural size and container
    if (size === "large" && imgRef.current && containerRef.current) {
      const img = imgRef.current;
      const container = containerRef.current;
      const containerHeight = container.clientHeight;

      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
  };

  // Calculate responsive dimensions for large images
  const getImageStyle = (): React.CSSProperties => {
    if (size !== "large" || !imageDimensions || !containerRef.current) {
      return {};
    }

    const container = containerRef.current;
    const containerHeight = container.clientHeight;
    const { width: naturalWidth, height: naturalHeight } = imageDimensions;
    const aspectRatio = naturalWidth / naturalHeight;

    // Use maxWidth if provided, otherwise fall back to container width
    const effectiveMaxWidth = maxWidth || container.clientWidth;

    // Calculate width based on natural aspect ratio and container height
    const calculatedWidth = containerHeight * aspectRatio;

    // If calculated width exceeds max width, constrain by width and calculate corresponding height
    if (calculatedWidth > effectiveMaxWidth) {
      const constrainedHeight = effectiveMaxWidth / aspectRatio;
      return {
        width: `${effectiveMaxWidth}px`,
        height: `${constrainedHeight}px`,
        objectFit: "cover" as const,
        objectPosition: "center top",
      };
    }

    return {
      width: `${calculatedWidth}px`,
      height: "100%",
      objectFit: "cover" as const,
      objectPosition: "center top",
    };
  };

  // Reset states when character changes
  React.useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setUsingFallback(false);
    setImageDimensions(null);
  }, [character.id]);

  return (
    <div
      ref={containerRef}
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
        ref={imgRef}
        key={`${character.id}-${usingFallback}`} // Force re-render when switching to fallback
        src={currentImagePath}
        alt={character.name}
        className={`${
          size === "large" ? "rounded-lg" : "w-full h-full object-cover rounded-lg"
        } transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        style={size === "large" ? getImageStyle() : undefined}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};
