
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from '../components/Header';
import NavigationHeader from '../components/NavigationHeader';
import { useGameContext } from '../contexts/GameContext';
import { fuzzySearch } from '../utils/fuzzySearch';

const IgnoredCharacters: React.FC = () => {
  const { allCharacters, ignoredCharacters, removeFromIgnoredCharacters } = useGameContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFillers, setShowFillers] = useState(false);

  // Get ignored character objects
  const ignoredCharacterObjects = Array.from(ignoredCharacters)
    .map(name => allCharacters.find(char => char.name === name))
    .filter(Boolean) as typeof allCharacters;

  // Filter ignored characters based on search and filler toggle
  const filteredByFiller = ignoredCharacterObjects.filter(char => 
    showFillers || char.firstAppeared.type !== 'filler'
  );

  const filteredCharacters = fuzzySearch(
    searchTerm, 
    filteredByFiller.map(char => char.name)
  ).map(name => filteredByFiller.find(char => char.name === name)!)
   .filter(Boolean);

  const handleRemoveFromIgnored = (characterName: string) => {
    removeFromIgnoredCharacters(characterName);
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
              <h2 className="text-3xl font-bold pirate-text mb-2">Ignored Characters</h2>
              <p className="text-white/80">Manage characters you've chosen to ignore</p>
            </div>

            {/* Search Control */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 ship-shadow border border-white/20">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search ignored characters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  />
                </div>
                <Button
                  onClick={() => setShowFillers(!showFillers)}
                  className={showFillers 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                  }
                >
                  {showFillers ? 'Hide Fillers' : 'Show Fillers'}
                </Button>
              </div>
            </div>

            {/* Characters List */}
            <div className="space-y-4">
              {filteredCharacters.map((character) => (
                <div key={character.name} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 ship-shadow border border-white/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                        <img
                          src={character.image}
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{character.name}</h3>
                        <a
                          href={character.wikiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 underline transition-colors text-sm"
                        >
                          View on One Piece Wiki
                        </a>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleRemoveFromIgnored(character.name)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-2"
                    >
                      Remove from Ignore List
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {ignoredCharacters.size === 0 && (
              <div className="text-center py-12">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 ship-shadow border border-white/20">
                  <p className="text-white/70 text-lg mb-2">No characters are currently ignored.</p>
                  <p className="text-white/50">Characters you choose to ignore will appear here.</p>
                </div>
              </div>
            )}

            {ignoredCharacters.size > 0 && filteredCharacters.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-white/70 text-lg">No ignored characters found matching your search.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default IgnoredCharacters;
