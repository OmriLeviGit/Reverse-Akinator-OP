// src/components/character-management/VirtualizedCharacterGrid.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { CharacterCard } from "./CharacterCard";
import { Character } from "../../types/character"; // Use the existing Character type

interface VirtualizedCharacterGridProps {
  characters: Character[];
  onRatingChange: (characterId: string, difficulty: string | null) => void;
  onIgnoreToggle: (characterId: string) => void;
  itemsPerPage?: number;
}

export const VirtualizedCharacterGrid: React.FC<VirtualizedCharacterGridProps> = ({
  characters,
  onRatingChange,
  onIgnoreToggle,
  itemsPerPage = 20,
}) => {
  const [visibleCharacters, setVisibleCharacters] = useState<Character[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset when characters change (due to filtering)
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCharacters(characters.slice(0, itemsPerPage));
  }, [characters, itemsPerPage]);

  // Load more characters
  const loadMore = useCallback(() => {
    if (isLoading) return;

    const nextPage = currentPage + 1;
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const newCharacters = characters.slice(startIndex, endIndex);

    if (newCharacters.length > 0) {
      setIsLoading(true);
      setTimeout(() => {
        setVisibleCharacters((prev) => [...prev, ...newCharacters]);
        setCurrentPage(nextPage);
        setIsLoading(false);
      }, 100);
    }
  }, [characters, currentPage, itemsPerPage, isLoading]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadMore, isLoading]);

  const hasMoreCharacters = visibleCharacters.length < characters.length;

  if (characters.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
        <h3 className="text-2xl font-semibold text-white mb-2">No characters found</h3>
        <p className="text-gray-300">Try adjusting your filters to see more results.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Character Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {visibleCharacters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onRatingChange={onRatingChange}
            onIgnoreToggle={onIgnoreToggle}
          />
        ))}
      </div>

      {/* Loading Indicator / Load More Trigger */}
      {hasMoreCharacters && (
        <div ref={loadMoreRef} className="mt-8 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
              <span className="text-white">Loading more characters...</span>
            </div>
          ) : (
            <div className="text-gray-300 text-sm">Scroll down to load more characters</div>
          )}
        </div>
      )}

      {/* End Indicator */}
      {!hasMoreCharacters && visibleCharacters.length > itemsPerPage && (
        <div className="mt-8 text-center text-gray-400 text-sm">All {characters.length} characters loaded</div>
      )}
    </div>
  );
};
