import { Character } from "./character";

export interface GameSession {
  gameSessionId: string;
  gameState: string;
  currentCharacter?: Character;
}

export interface GameSettings {
  arcSelection: string;
  fillerPercentage: number;
  includeNonTVFillers: boolean;
  difficultyLevel: string;
  includeUnrated: boolean;
}
