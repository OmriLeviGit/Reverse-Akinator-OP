export interface UserPreferences {
  difficulty: string;
  preferredArc: string;
  includeNonTVFillers: boolean;
  fillerPercentage: number;
  includeUnrated: boolean;
}

export interface SessionData {
  global_arc_limit: string;
  user_preferences: UserPreferences;
  session_created: string;
  last_activity: string;
}
