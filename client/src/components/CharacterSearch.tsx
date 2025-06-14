
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGameContext } from '../contexts/GameContext';
import { fuzzySearch } from '../utils/fuzzySearch';

interface CharacterSearchProps {
  onCharacterSelect: (character: string) => void;
  onClose: () => void;
}

const CharacterSearch: React.FC<CharacterSearchProps> = ({ onCharacterSelect, onClose }) => {
  const { allCharacters } = useGameContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  const characterNames = allCharacters.map(char => char.name);
  const filteredCharacters = fuzzySearch(searchTerm, characterNames);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full max-h-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Select Character</h3>
          <Button onClick={onClose} variant="ghost" size="sm">×</Button>
        </div>
        
        <Input
          type="text"
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {filteredCharacters.map((character) => (
              <Button
                key={character}
                onClick={() => onCharacterSelect(character)}
                variant="ghost"
                className="w-full justify-start text-left hover:bg-blue-50"
              >
                {character}
              </Button>
            ))}
          </div>
        </ScrollArea>
        
        {filteredCharacters.length === 0 && searchTerm && (
          <div className="text-center py-4 text-gray-500">
            No characters found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterSearch;
