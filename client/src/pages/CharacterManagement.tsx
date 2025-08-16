import React, { useState, useMemo } from "react";
import Navigation from "../components/Navigation";
import { useAppContext } from "../contexts/AppContext";
import { useCharacterRatings } from "@/hooks/useCharacterRatings";
import { useCharacterFiltering } from "../hooks/useCharacterFiltering";
import { CharacterFilters } from "../components/character-management/CharacterFilters";
import { VirtualizedCharacterGrid } from "../components/character-management/VirtualizedCharacterGrid";
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from "../types/characterManagement";

const CharacterManagement: React.FC = () => {
  const { characters, isLoading, sessionData, availableArcs, updateGlobalArcLimit } = useAppContext();
  const { setCharacterRating, toggleIgnoreCharacter } = useCharacterRatings();

  // Spoiler protection state (for Navigation component)
  const [maxArcSeen, setMaxArcSeen] = useState<string>("All");

  // Initialize maxArcSeen from sessionData
  React.useEffect(() => {
    if (sessionData?.global_arc_limit) {
      setMaxArcSeen(sessionData.global_arc_limit);
    }
  }, [sessionData]);

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

  // Spoiler protection handler
  const handleMaxArcChange = (arcName: string) => {
    setMaxArcSeen(arcName);
    localStorage.setItem("maxArcSeen", arcName);
    updateGlobalArcLimit(arcName);
  };

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
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground text-xl">Loading characters...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation maxArcSeen={maxArcSeen} onMaxArcChange={handleMaxArcChange} availableArcs={availableArcs} />

      {/* Main Content */}
      <div className="h-[calc(100vh-theme(spacing.16))] overflow-y-auto">
        {" "}
        {/* Adjust height to account for navigation */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
              {/* Filter Panel */}
              <aside className="lg:sticky lg:top-8 lg:h-fit">
                {" "}
                {/* Reduced top spacing since no header */}
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

      {/* Background decorative elements (same as Index page) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent opacity-5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default CharacterManagement;
