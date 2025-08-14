// src/types/character.ts
export interface Character {
  id: string;
  name: string;

  description: string | null;

  arc: string | null;
  chapter: number | null;
  episode: number | null;

  fillerStatus: "Canon" | "Filler" | "Filler-Non-TV";
  source: string | null;

  difficulty: string | null;
  isIgnored: boolean;

  wikiLink: string | null;
}
