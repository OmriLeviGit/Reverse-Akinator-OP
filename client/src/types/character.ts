// src/types/character.ts
export interface Character {
  id: string;
  name: string;
  description?: string;
  image?: string;
  chapter: number | null;
  episode: number | null;
  arc?: string;

  // Content classification
  fillerStatus: "canon" | "filler"; // Use this as the single source of truth
  is_filler: boolean; // Keep for backward compatibility if needed
  is_tv: boolean;

  // External links
  wikiLink: string | null;

  // User-specific data (populated by context/API)
  isIgnored?: boolean;

  // Additional metadata
  difficulty?: string; // If you need this separate from rating
}
