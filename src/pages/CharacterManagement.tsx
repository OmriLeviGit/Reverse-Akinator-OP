import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from '../components/Header';
import NavigationHeader from '../components/NavigationHeader';
import { useGameContext } from '../contexts/GameContext';
import { fuzzySearch } from '../utils/fuzzySearch';

type IgnoreFilter = 'ignored-only' | 'not-ignored-only' | 'show-both';
type ContentFilter = 'canon-only' | 'canon-and-fillers' | 'fillers-only';
type RatingFilter = 'rated-only' | 'unrated-only' | 'show-both';
type SortOption = 'alphabetical-az' | 'alphabetical-za' | 'difficulty-easy-hard' | 'difficulty-hard-easy';

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

  const ratingLabels = {
    0: 'No Score',
    1: 'Very Easy',
    2: 'Easy', 
    3: 'Medium',
    4: 'Hard',
    5: 'Really Hard'
  };

  const getIgnoreFilterLabel = (filter: IgnoreFilter) => {
    switch (filter) {
      case 'ignored-only': return 'Ignored Only';
      case 'not-ignored-only': return 'Not Ignored Only';
      case 'show-both': return 'Show Both';
    }
  };

  const getContentFilterLabel = (filter: ContentFilter) => {
    switch (filter) {
      case 'canon-only': return 'Canon Only';
      case 'canon-and-fillers': return 'Canon + Fillers';
      case 'fillers-only': return 'Fillers Only';
    }
  };

  const getRatingFilterLabel = (filter: RatingFilter) => {
    switch (filter) {
      case 'rated-only': return 'Rated Only';
      case 'unrated-only': return 'Unrated Only';
      case 'show-both': return 'Show Both';
    }
  };

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

  const filteredAndSortedCharacters = useMemo(() => {
    let filtered = allCharacters;

    // Apply ignore filter
    if (ignoreFilter === 'ignored-only') {
      filtered = filtered.filter(char => ignoredCharacters.has(char.name));
    } else if (ignoreFilter === 'not-ignored-only') {
      filtered = filtered.filter(char => !ignoredCharacters.has(char.name));
    }

    // Apply content filter
    if (contentFilter === 'canon-only') {
      filtered = filtered.filter(char => char.firstAppeared.type === 'canon');
    } else if (contentFilter === 'fillers-only') {
      filtered = filtered.filter(char => char.firstAppeared.type === 'filler');
    }
    // For canon-and-fillers, show all

    // Apply rating filter
    if (ratingFilter === 'rated-only') {
      filtered = filtered.filter(char => characterRatings[char.name] && characterRatings[char.name] > 0);
    } else if (ratingFilter === 'unrated-only') {
      filtered = filtered.filter(char => !characterRatings[char.name] || characterRatings[char.name] === 0);
    }

    // Apply search
    if (searchTerm.trim()) {
      const searchResults = fuzzySearch(searchTerm, filtered.map(char => char.name));
      filtered = searchResults.map(name => filtered.find(char => char.name === name)!).filter(Boolean);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'alphabetical-az':
          return a.name.localeCompare(b.name);
        case 'alphabetical-za':
          return b.name.localeCompare(a.name);
        case 'difficulty-easy-hard':
          const ratingA = characterRatings[a.name] || 0;
          const ratingB = characterRatings[b.name] || 0;
          return ratingA - ratingB;
        case 'difficulty-hard-easy':
          const ratingA2 = characterRatings[a.name] || 0;
          const ratingB2 = characterRatings[b.name] || 0;
          return ratingB2 - ratingA2;
        default:
          return 0;
      }
    });

    return filtered;
  }, [allCharacters, ignoreFilter, contentFilter, ratingFilter, includeNonTVContent, searchTerm, sortOption, ignoredCharacters, characterRatings]);

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

  const handleNonTVContentChange = (checked: boolean | "indeterminate") => {
    setIncludeNonTVContent(checked === true);
  };

  const showNonTVCheckbox = contentFilter === 'canon-and-fillers' || contentFilter === 'fillers-only';

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
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 ship-shadow border border-white/20">
              {/* Top Row: Triple Toggle Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-white/90 text-sm font-medium">Ignore Status</label>
                  <Button
                    onClick={cycleIgnoreFilter}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    {getIgnoreFilterLabel(ignoreFilter)}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-white/90 text-sm font-medium">Content Type</label>
                  <Button
                    onClick={cycleContentFilter}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  >
                    {getContentFilterLabel(contentFilter)}
                  </Button>
                  {showNonTVCheckbox && (
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        id="include-non-tv"
                        checked={includeNonTVContent}
                        onCheckedChange={handleNonTVContentChange}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <label htmlFor="include-non-tv" className="text-white/80 text-sm">
                        Include Non-TV Content
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-white/90 text-sm font-medium">Rating Status</label>
                  <Button
                    onClick={cycleRatingFilter}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  >
                    {getRatingFilterLabel(ratingFilter)}
                  </Button>
                </div>
              </div>

              {/* Bottom Row: Search and Sort */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white/90 text-sm font-medium">Search Characters</label>
                  <Input
                    type="text"
                    placeholder="Search characters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white/90 text-sm font-medium">Sort By</label>
                  <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                    <SelectTrigger className="bg-white/20 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="alphabetical-az" className="text-white hover:bg-gray-700">Alphabetical (A-Z)</SelectItem>
                      <SelectItem value="alphabetical-za" className="text-white hover:bg-gray-700">Alphabetical (Z-A)</SelectItem>
                      <SelectItem value="difficulty-easy-hard" className="text-white hover:bg-gray-700">Difficulty (Easy to Hard)</SelectItem>
                      <SelectItem value="difficulty-hard-easy" className="text-white hover:bg-gray-700">Difficulty (Hard to Easy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Characters List */}
            <div className="space-y-4">
              {filteredAndSortedCharacters.map((character) => {
                const currentRating = characterRatings[character.name] || 0;
                const isIgnored = ignoredCharacters.has(character.name);
                
                return (
                  <div 
                    key={character.name} 
                    className={`backdrop-blur-lg rounded-2xl p-6 ship-shadow border border-white/20 transition-all duration-200 ${
                      isIgnored 
                        ? 'bg-white/5 opacity-75' 
                        : 'bg-white/10 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Character Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                          <img
                            src={character.image}
                            alt={character.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold mb-1 ${isIgnored ? 'text-white/60' : 'text-white'}`}>
                            {character.name}
                          </h3>
                          <a
                            href={character.wikiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-300 hover:text-blue-200 underline transition-colors text-sm"
                          >
                            View on One Piece Wiki
                          </a>
                          {character.firstAppeared.type === 'filler' && (
                            <div className="text-purple-300 text-xs mt-1">Filler Character</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Difficulty Rating */}
                        <div className="space-y-2">
                          <div className="text-white/90 text-sm font-medium text-center">Difficulty Rating</div>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {Object.entries(ratingLabels).map(([rating, label]) => (
                              <Button
                                key={rating}
                                onClick={() => handleRatingChange(character.name, parseInt(rating))}
                                variant={currentRating === parseInt(rating) ? 'default' : 'outline'}
                                size="sm"
                                className={currentRating === parseInt(rating) 
                                  ? (parseInt(rating) === 0 
                                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs px-2 py-1'
                                    : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1')
                                  : 'bg-white/10 text-white border-white/30 hover:bg-white/20 text-xs px-2 py-1'
                                }
                              >
                                {label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Ignore Toggle */}
                        <div className="space-y-2">
                          <div className="text-white/90 text-sm font-medium text-center">Ignore Status</div>
                          <Button
                            onClick={() => handleIgnoreToggle(character.name, isIgnored)}
                            className={isIgnored
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-2'
                              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-6 py-2'
                            }
                          >
                            {isIgnored ? 'Unignore' : 'Ignore'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
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
