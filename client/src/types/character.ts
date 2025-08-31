// src/types/character.ts

// Basic character used for lists, pools, and most displays
export interface BasicCharacter {
  id: string;
  name: string;
  chapter: number | null;
  episode: number | null;
  fillerStatus: string;
  difficulty: string | null;
  isIgnored: boolean;
  wikiLink: string | null;
  affiliations: string | null;
}

// Full character used for detailed views and character reveals
export interface FullCharacter extends BasicCharacter {
  description: string;
  funFact: string;
}
