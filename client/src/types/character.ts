// src/types/character.ts
export interface Character {
  name: string;
  name: string;

  description: string | null;
  image: string | null;

  arc: string | null;
  chapter: number | null;
  episode: number | null;

  fillerStatus: "canon" | "filler" | "filler-non-tv";
  source: string | null;

  difficulty: number;
  isIgnored: boolean | null;

  wikiLink: string | null;
}
