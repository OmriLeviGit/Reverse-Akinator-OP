export interface GameSession {
  gameId: string;
  isActive: boolean;
}

export interface GameSettings {
  arcSelection: string;
  fillerPercentage: number;
  includeNonTVFillers: boolean;
  difficultyLevel: string;
  includeUnrated: boolean;
}
