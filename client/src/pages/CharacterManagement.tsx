// src/pages/CharacterManagement.tsx
import React, { useState, useMemo } from "react";
import Header from "../components/Header";
import NavigationHeader from "../components/NavigationHeader";
import { useAppContext } from "../contexts/AppContext";
import { useCharacterRatings } from "@/hooks/useCharacterRatings";
import { useCharacterFiltering } from "../hooks/useCharacterFiltering";
import { CharacterFilters } from "../components/character-management/CharacterFilters";
import { VirtualizedCharacterGrid } from "../components/character-management/VirtualizedCharacterGrid";
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from "../types/characterManagement";

const CharacterManagement: React.FC = () => {
  const { characters, isLoading } = useAppContext();
  const { setCharacterRating, toggleIgnoreCharacter } = useCharacterRatings();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [ignoreFilter, setIgnoreFilter] = useState<IgnoreFilter>("all");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [includeNonTVContent, setIncludeNonTVContent] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>("alphabetical-az");

  // Create character ratings lookup
  const characterRatings = useMemo(() => {
    const ratings: Record<string, string | null> = {};
    characters.forEach((character) => {
      ratings[character.name] = character.difficulty;
    });
    return ratings;
  }, [characters]);

  // Create ignored characters set
  const ignoredCharacters = useMemo(() => {
    const ignored = new Set<string>();
    characters.forEach((character) => {
      if (character.isIgnored) {
        ignored.add(character.name);
      }
    });
    return ignored;
  }, [characters]);

  // Use your existing filtering hook
  const filteredAndSortedCharacters = useCharacterFiltering({
    allCharacters: characters,
    ignoreFilter,
    contentFilter,
    ratingFilter,
    includeNonTVContent,
    searchTerm,
    sortOption,
    ignoredCharacters,
    characterRatings,
  });

  const handleToggleIgnore = async (id: string) => {
    try {
      toggleIgnoreCharacter(id);
    } catch (error) {
      console.error("Failed to update character ignore status:", error);
    }
  };

  const handleUpdateDifficulty = async (id: string, difficulty: string | null) => {
    try {
      setCharacterRating(id, difficulty || "");
    } catch (error) {
      console.error("Failed to update character difficulty:", error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 ocean-gradient"></div>
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-xl">Loading characters...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ocean Background */}
      <div className="absolute inset-0 ocean-gradient"></div>

      {/* Single Scrollable Container */}
      <div className="relative z-10 h-screen overflow-y-auto">
        {/* Header */}
        <Header />

        {/* Sticky Navigation */}
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/20">
          <NavigationHeader />
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
              {/* Filter Panel */}
              <aside className="lg:sticky lg:top-20 lg:h-fit">
                <CharacterFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  ignoreFilter={ignoreFilter}
                  onIgnoreFilterChange={setIgnoreFilter}
                  contentFilter={contentFilter}
                  onContentFilterChange={setContentFilter}
                  ratingFilter={ratingFilter}
                  onRatingFilterChange={setRatingFilter}
                  includeNonTVContent={includeNonTVContent}
                  onIncludeNonTVContentChange={setIncludeNonTVContent}
                  sortOption={sortOption}
                  onSortOptionChange={setSortOption}
                  filteredCount={filteredAndSortedCharacters.length}
                  totalCount={characters.length}
                />
              </aside>

              {/* Character Grid */}
              <main>
                <VirtualizedCharacterGrid
                  characters={filteredAndSortedCharacters}
                  onRatingChange={handleUpdateDifficulty}
                  onIgnoreToggle={handleToggleIgnore}
                  itemsPerPage={24}
                />
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterManagement;
