export interface UserPreferences {
  difficulty: string;
  preferredArc: string;
  includeNonTVFillers: boolean;
  fillerPercentage: number;
  includeUnrated: boolean;
}

export interface SessionData {
  globalArcLimit: string;
  userPreferences: UserPreferences;
  sessionCreated: string;
  lastActivity: string;
}
