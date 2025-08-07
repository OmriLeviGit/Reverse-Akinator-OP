// src/pages/CharacterManagement.tsx
import React, { useState, useMemo } from "react";
import Header from "../components/Header";
import NavigationHeader from "../components/NavigationHeader";
import { useAppContext } from "../contexts/AppContext";
import { useCharacterRatings } from "@/hooks/useCharacterRatings";
import { useCharacterFiltering } from "../hooks/useCharacterFiltering";
import { CharacterFilters } from "../components/character-management/CharacterFilters";
import { CharacterCard } from "../components/character-management/CharacterCard";
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from "../types/characterManagement";

const CharacterManagement: React.FC = () => {
  const { characters, isLoading } = useAppContext();
  const { setCharacterRating, toggleIgnoreCharacter } = useCharacterRatings();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [ignoreFilter, setIgnoreFilter] = useState<IgnoreFilter>("all");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [includeNonTVContent, setIncludeNonTVContent] = useState(false);
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
      await toggleIgnoreCharacter(id);
    } catch (error) {
      console.error("Failed to update character ignore status:", error);
    }
  };

  const handleUpdateDifficulty = async (id: string, difficulty: string | null) => {
    try {
      if (difficulty === null || difficulty === "") {
        await setCharacterRating(id, 0);
      } else {
        const difficultyValue = parseInt(difficulty);
        await setCharacterRating(id, difficultyValue);
      }
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
      <div className="absolute inset-0 ocean-gradient">
        <div className="absolute inset-0">
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="ocean-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent"></div>
        </div>
      </div>

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
                
                {/* Character Cards */}
                {filteredAndSortedCharacters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filteredAndSortedCharacters.map((character) => (
                      <CharacterCard
                        key={character.id}
                        character={character}
                        onRatingChange={handleUpdateDifficulty}
                        onIgnoreToggle={handleToggleIgnore}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
                    <h3 className="text-2xl font-semibold text-white mb-2">No characters found</h3>
                    <p className="text-gray-300">
                      Try adjusting your filters to see more results.
                    </p>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterManagement;