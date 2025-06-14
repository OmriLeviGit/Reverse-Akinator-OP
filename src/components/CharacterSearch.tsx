
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CharacterSearchProps {
  onCharacterSelect: (character: string) => void;
  onClose: () => void;
}

const CharacterSearch: React.FC<CharacterSearchProps> = ({ onCharacterSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Placeholder character data
  const characters = [
    'Monkey D. Luffy',
    'Roronoa Zoro',
    'Nami',
    'Usopp',
    'Sanji',
    'Tony Tony Chopper',
    'Nico Robin',
    'Franky',
    'Brook',
    'Jinbe',
    'Portgas D. Ace',
    'Sabo',
    'Trafalgar Law',
    'Eustass Kid',
    'Boa Hancock'
  ];

  const filteredCharacters = characters.filter(character =>
    character.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      </div>
    </div>
  );
};

export default CharacterSearch;
