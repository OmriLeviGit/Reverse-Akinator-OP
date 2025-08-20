// src/types/character.ts
export interface Character {
  id: string;
  name: string;
  description: string | null;
  chapter: number | null;
  episode: number | null;
  fillerStatus: string;
  difficulty: string | null;
  isIgnored: boolean;
  wikiLink: string | null;
}
