import { Character } from "./character";

export interface GameSession {
  isActive: boolean;
  gameId: string;
  characterPool: Character[];
}

export interface GameSettings {
  arcSelection: string;
  fillerPercentage: number;
  includeNonTVFillers: boolean;
  difficultyLevel: string;
  includeUnrated: boolean;
}
