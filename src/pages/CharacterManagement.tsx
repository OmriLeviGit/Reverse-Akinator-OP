
import React, { useState } from 'react';
import Header from '../components/Header';
import NavigationHeader from '../components/NavigationHeader';
import { useGameContext } from '../contexts/GameContext';
import { CharacterFilters } from '../components/character-management/CharacterFilters';
import { CharacterCard } from '../components/character-management/CharacterCard';
import { useCharacterFiltering } from '../hooks/useCharacterFiltering';
import { IgnoreFilter, ContentFilter, RatingFilter, SortOption } from '../types/characterManagement';

const CharacterManagement: React.FC = () => {
  const { 
    allCharacters, 
    characterRatings, 
    setCharacterRating, 
    ignoredCharacters, 
    addToIgnoredCharacters, 
    removeFromIgnoredCharacters 
  } = useGameContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [ignoreFilter, setIgnoreFilter] = useState<IgnoreFilter>('show-both');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('canon-only');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('show-both');
  const [includeNonTVContent, setIncludeNonTVContent] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('alphabetical-az');

  const cycleIgnoreFilter = () => {
    setIgnoreFilter(prev => {
      switch (prev) {
        case 'ignored-only': return 'not-ignored-only';
        case 'not-ignored-only': return 'show-both';
        case 'show-both': return 'ignored-only';
      }
    });
  };

  const cycleContentFilter = () => {
    setContentFilter(prev => {
      switch (prev) {
        case 'canon-only': return 'canon-and-fillers';
        case 'canon-and-fillers': return 'fillers-only';
        case 'fillers-only': return 'canon-only';
      }
    });
    // Reset non-TV content when switching away from filters that support it
    if (contentFilter === 'canon-only') {
      setIncludeNonTVContent(false);
    }
  };

  const cycleRatingFilter = () => {
    setRatingFilter(prev => {
      switch (prev) {
        case 'rated-only': return 'unrated-only';
        case 'unrated-only': return 'show-both';
        case 'show-both': return 'rated-only';
      }
    });
  };

  const handleNonTVContentChange = (checked: boolean | "indeterminate") => {
    setIncludeNonTVContent(checked === true);
  };

  const handleRatingChange = (characterName: string, rating: number) => {
    setCharacterRating(characterName, rating);
  };

  const handleIgnoreToggle = (characterName: string, isCurrentlyIgnored: boolean) => {
    if (isCurrentlyIgnored) {
      removeFromIgnoredCharacters(characterName);
    } else {
      addToIgnoredCharacters(characterName);
    }
  };

  const filteredAndSortedCharacters = useCharacterFiltering({
    allCharacters,
    ignoreFilter,
    contentFilter,
    ratingFilter,
    includeNonTVContent,
    searchTerm,
    sortOption,
    ignoredCharacters,
    characterRatings
  });

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

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <NavigationHeader />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold pirate-text mb-2">Character Management</h2>
              <p className="text-white/80">Manage character difficulty ratings and ignore settings</p>
            </div>

            {/* Filters and Controls */}
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

            {/* Characters List */}
            <div className="space-y-4">
              {filteredAndSortedCharacters.map((character) => {
                const currentRating = characterRatings[character.name] || 0;
                const isIgnored = ignoredCharacters.has(character.name);
                
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default CharacterManagement;
