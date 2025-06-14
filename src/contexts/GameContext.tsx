
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CharacterData {
  name: string;
  description: string;
  image: string;
  firstAppeared: {
    chapter: number;
    type: 'canon' | 'filler';
  };
  wikiUrl: string;
}

interface GameContextType {
  currentCharacter: CharacterData | null;
  setCurrentCharacter: (character: CharacterData | null) => void;
  characterRatings: Record<string, number>;
  setCharacterRating: (characterName: string, rating: number) => void;
  ignoredCharacters: string[];
  addToIgnoredCharacters: (characterName: string) => void;
  removeFromIgnoredCharacters: (characterName: string) => void;
  allCharacters: CharacterData[];
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Sample character data
const sampleCharacters: CharacterData[] = [
  {
    name: "Monkey D. Luffy",
    description: "The main protagonist of One Piece and captain of the Straw Hat Pirates. Known for his rubber powers from the Gomu Gomu no Mi devil fruit and his unwavering determination to become the Pirate King.",
    image: "/placeholder.svg",
    firstAppeared: { chapter: 1, type: 'canon' },
    wikiUrl: "https://onepiece.fandom.com/wiki/Monkey_D._Luffy"
  },
  {
    name: "Roronoa Zoro",
    description: "The swordsman of the Straw Hat Pirates, known for his three-sword fighting style and his dream to become the world's greatest swordsman.",
    image: "/placeholder.svg",
    firstAppeared: { chapter: 3, type: 'canon' },
    wikiUrl: "https://onepiece.fandom.com/wiki/Roronoa_Zoro"
  },
  {
    name: "Nami",
    description: "The navigator of the Straw Hat Pirates, known for her exceptional skills in navigation and weather prediction.",
    image: "/placeholder.svg",
    firstAppeared: { chapter: 8, type: 'canon' },
    wikiUrl: "https://onepiece.fandom.com/wiki/Nami"
  },
  {
    name: "Usopp",
    description: "The sniper of the Straw Hat Pirates, known for his incredible marksmanship and his dream to become a brave warrior of the sea.",
    image: "/placeholder.svg",
    firstAppeared: { chapter: 23, type: 'canon' },
    wikiUrl: "https://onepiece.fandom.com/wiki/Usopp"
  },
  {
    name: "Sanji",
    description: "The cook of the Straw Hat Pirates, known for his powerful kicks and his dream to find the All Blue.",
    image: "/placeholder.svg",
    firstAppeared: { chapter: 43, type: 'canon' },
    wikiUrl: "https://onepiece.fandom.com/wiki/Sanji"
  }
];

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentCharacter, setCurrentCharacter] = useState<CharacterData | null>(null);
  const [characterRatings, setCharacterRatings] = useState<Record<string, number>>({});
  const [ignoredCharacters, setIgnoredCharacters] = useState<string[]>([]);

  const setCharacterRating = (characterName: string, rating: number) => {
    setCharacterRatings(prev => ({ ...prev, [characterName]: rating }));
  };

  const addToIgnoredCharacters = (characterName: string) => {
    setIgnoredCharacters(prev => [...prev, characterName]);
  };

  const removeFromIgnoredCharacters = (characterName: string) => {
    setIgnoredCharacters(prev => prev.filter(name => name !== characterName));
  };

  return (
    <GameContext.Provider value={{
      currentCharacter,
      setCurrentCharacter,
      characterRatings,
      setCharacterRating,
      ignoredCharacters,
      addToIgnoredCharacters,
      removeFromIgnoredCharacters,
      allCharacters: sampleCharacters
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
