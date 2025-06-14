
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from '../components/Header';
import NavigationHeader from '../components/NavigationHeader';
import { useGameContext } from '../contexts/GameContext';
import { fuzzySearch } from '../utils/fuzzySearch';

const CharacterScores: React.FC = () => {
  const { allCharacters, characterRatings, setCharacterRating } = useGameContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'high-to-low' | 'low-to-high'>('high-to-low');
  const [showFillers, setShowFillers] = useState(true);

  const ratingLabels = {
    0: 'No Score',
    1: 'Very Easy',
    2: 'Easy', 
    3: 'Medium',
    4: 'Hard',
    5: 'Really Hard'
  };

  // Filter characters based on search and filler toggle
  const characterNames = allCharacters
    .filter(char => showFillers || char.firstAppeared.type !== 'filler')
    .map(char => char.name);
  
  const filteredCharacters = fuzzySearch(searchTerm, characterNames)
    .map(name => allCharacters.find(char => char.name === name)!)
    .filter(Boolean);

  // Sort characters by rating
  const sortedCharacters = [...filteredCharacters].sort((a, b) => {
    const ratingA = characterRatings[a.name] || 0;
    const ratingB = characterRatings[b.name] || 0;
    
    if (sortOrder === 'high-to-low') {
      return ratingB - ratingA;
    } else {
      return ratingA - ratingB;
    }
  });

  const handleRatingChange = (characterName: string, rating: number) => {
    if (rating === 0) {
      // Remove rating
      setCharacterRating(characterName, 0);
    } else {
      setCharacterRating(characterName, rating);
    }
  };

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
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold pirate-text mb-2">Character Difficulty Scores</h2>
              <p className="text-white/80">View and manage character difficulty ratings</p>
            </div>

            {/* Search and Sort Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 ship-shadow border border-white/20">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search characters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSortOrder('high-to-low')}
                    variant={sortOrder === 'high-to-low' ? 'default' : 'outline'}
                    className={sortOrder === 'high-to-low' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white border-white/30'}
                  >
                    High to Low
                  </Button>
                  <Button
                    onClick={() => setSortOrder('low-to-high')}
                    variant={sortOrder === 'low-to-high' ? 'default' : 'outline'}
                    className={sortOrder === 'low-to-high' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white border-white/30'}
                  >
                    Low to High
                  </Button>
                </div>
              </div>
              
              {/* Filler Toggle */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowFillers(!showFillers)}
                  className={showFillers 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                  }
                >
                  {showFillers ? 'Hide Filler Characters' : 'Show Filler Characters'}
                </Button>
              </div>
            </div>

            {/* Characters List */}
            <div className="space-y-4">
              {sortedCharacters.map((character) => {
                const currentRating = characterRatings[character.name] || 0;
                return (
                  <div key={character.name} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 ship-shadow border border-white/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{character.name}</h3>
                        <a
                          href={character.wikiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 underline transition-colors text-sm block mb-1"
                        >
                          View on One Piece Wiki
                        </a>
                        <p className="text-white/70 text-sm">
                          First appeared: {character.firstAppeared.chapter}, ({character.firstAppeared.type})
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(ratingLabels).map(([rating, label]) => (
                          <Button
                            key={rating}
                            onClick={() => handleRatingChange(character.name, parseInt(rating))}
                            variant={currentRating === parseInt(rating) ? 'default' : 'outline'}
                            size="sm"
                            className={currentRating === parseInt(rating) 
                              ? (parseInt(rating) === 0 
                                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                                : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white')
                              : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                            }
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {sortedCharacters.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/70 text-lg">No characters found matching your search.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CharacterScores;
