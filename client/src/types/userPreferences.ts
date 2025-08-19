export interface UserPreferences {
  difficulty: "easy" | "medium" | "hard";
  preferredArc: string;
  includeNonTVFillers: boolean;
  fillerPercentage: number;
  includeUnrated: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  difficulty: "easy",
  preferredArc: "All",
  includeNonTVFillers: false,
  fillerPercentage: 0,
  includeUnrated: false,
};
