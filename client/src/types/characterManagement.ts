export type IgnoreFilter = "ignored-only" | "not-ignored-only" | "all";
export type ContentFilter = "canon-only" | "all" | "fillers-only";
export type RatingFilter =
  | "rated-only"
  | "unrated-only"
  | "all"
  | "very-easy"
  | "easy"
  | "medium"
  | "hard"
  | "really-hard";
export type SortOption = "alphabetical-az" | "alphabetical-za" | "difficulty-easy-hard" | "difficulty-hard-easy";

export const ratingLabels = {
  "": "No Score",
  "very-easy": "Very Easy",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  "really-hard": "Really Hard",
};
