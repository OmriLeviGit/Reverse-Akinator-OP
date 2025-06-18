// src/pages/CharacterManagement.tsx
import React, { useState } from "react";
import Header from "../components/Header";
import NavigationHeader from "../components/NavigationHeader";
import { useGameContext } from "../contexts/GameContext";
import { CharacterFilters } from "../components/character-management/CharacterFilters";
import { CharacterCard } from "../components/character-management/CharacterCard";
import { useCharacterFiltering } from "../hooks/useCharacterFiltering";
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from "../types/characterManagement";

const CharacterManagement: React.FC = () => {
  const {
    allCharacters,
    characterRatings,
    setCharacterRating,
    toggleIgnoreCharacter, // Changed from addToIgnoredCharacters/removeFromIgnoredCharacters
    isLoadingCharacters,
    characterError,
  } = useGameContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [ignoreFilter, setIgnoreFilter] = useState<IgnoreFilter>("all");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [includeNonTVContent, setIncludeNonTVContent] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("alphabetical-az");

  const cycleIgnoreFilter = () => {
    setIgnoreFilter((prev) => {
      switch (prev) {
        case "ignored-only":
          return "not-ignored-only";
        case "not-ignored-only":
          return "all";
        case "all":
          return "ignored-only";
      }
    });
  };

  const cycleContentFilter = () => {
    setContentFilter((prev) => {
      const newValue = (() => {
        switch (prev) {
          case "all":
            return "canon-only";
          case "canon-only":
            return "fillers-only";
          case "fillers-only":
            return "all";
        }
      })();

      if (newValue === "canon-only") {
        setIncludeNonTVContent(false);
      }

      return newValue;
    });
  };

  const cycleRatingFilter = () => {
    setRatingFilter((prev) => {
      switch (prev) {
        case "rated-only":
          return "unrated-only";
        case "unrated-only":
          return "all";
        case "all":
          return "rated-only";
      }
    });
  };

  const handleNonTVContentChange = (checked: boolean | "indeterminate") => {
    setIncludeNonTVContent(checked === true);
  };

  const handleRatingChange = (characterId: string, rating: number) => {
    setCharacterRating(characterId, rating);
  };

  const handleIgnoreToggle = (characterId: string, isCurrentlyIgnored: boolean) => {
    toggleIgnoreCharacter(characterId);
  };

  // Create ignoredCharacters Set directly from character data for filtering hook
  const ignoredCharacters = React.useMemo(() => {
    const ignored = new Set<string>();
    allCharacters.forEach((character) => {
      if (character.isIgnored) {
        ignored.add(character.name);
      }
    });
    return ignored;
  }, [allCharacters]);

  const filteredAndSortedCharacters = useCharacterFiltering({
    allCharacters,
    ignoreFilter,
    contentFilter,
    ratingFilter,
    includeNonTVContent,
    searchTerm,
    sortOption,
    ignoredCharacters,
    characterRatings,
  });

  if (characterError) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 ocean-gradient"></div>
        <div className="relative z-10 min-h-screen flex flex-col">
          <Header />
          <NavigationHeader />
          <main className="flex-1 container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-8 ship-shadow border border-red-500/20">
                  <p className="text-red-400 text-lg mb-2">Failed to load characters</p>
                  <p className="text-red-300/70">Please try refreshing the page.</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ocean Background */}
      <div className="absolute inset-0 ocean-gradient">
        <div className="absolute inset-0">
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent"></div>
        </div>
      </div>

      {/* Single Scrollable Container */}
      <div className="relative z-10 h-screen overflow-y-auto">
        {/* Scrollable Header Section */}
        <Header />

        {/* Sticky Title and Filters Section */}
        <div className="sticky top-0 z-40 border-white/10 ">
          <NavigationHeader />
          <div className="container mx-auto px-4 py-6">
            <div className="max-w-6xl mx-auto">
              {/* Page Header */}
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold pirate-text mb-2">Character Management</h2>
                <p className="text-white/80">Manage character difficulty ratings and ignore settings</p>
              </div>

              {/* Filters - only show when not loading */}
              {!isLoadingCharacters && (
                <CharacterFilters
                  ignoreFilter={ignoreFilter}
                  contentFilter={contentFilter}
                  ratingFilter={ratingFilter}
                  includeNonTVContent={includeNonTVContent}
                  searchTerm={searchTerm}
                  sortOption={sortOption}
                  onIgnoreFilterCycle={cycleIgnoreFilter}
                  onContentFilterCycle={cycleContentFilter}
                  onRatingFilterCycle={cycleRatingFilter}
                  onNonTVContentChange={handleNonTVContentChange}
                  onSearchChange={setSearchTerm}
                  onSortChange={setSortOption}
                />
              )}
            </div>
          </div>
        </div>

        {/* Character List Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-[70rem] mx-auto">
            {/* Loading State */}
            {isLoadingCharacters && (
              <div className="text-center py-12">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 ship-shadow border border-white/20">
                  <p className="text-white/70 text-lg">Loading characters...</p>
                </div>
              </div>
            )}

            {!isLoadingCharacters && (
              <>
                {/* Characters List */}
                <div className="space-y-4">
                  {filteredAndSortedCharacters.map((character) => {
                    const currentRating = characterRatings[character.name];
                    const isIgnored = character.isIgnored;
                    return (
                      <CharacterCard
                        key={character.name}
                        character={character}
                        currentRating={currentRating}
                        isIgnored={isIgnored}
                        onRatingChange={handleRatingChange}
                        onIgnoreToggle={handleIgnoreToggle}
                      />
                    );
                  })}
                </div>

                {filteredAndSortedCharacters.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 ship-shadow border border-white/20">
                      <p className="text-white/70 text-lg mb-2">No characters found with current filters.</p>
                      <p className="text-white/50">Try adjusting your filters or search terms.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterManagement;
