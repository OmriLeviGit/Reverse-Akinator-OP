export type IgnoreFilter = "ignored-only" | "not-ignored-only" | "all";
export type ContentFilter = "canon-only" | "all" | "fillers-only";
export type RatingFilter = "rated-only" | "unrated-only" | "all";
export type SortOption = "alphabetical-az" | "alphabetical-za" | "difficulty-easy-hard" | "difficulty-hard-easy";

export const ratingLabels = {
  0: "No Score",
  1: "Very Easy",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Really Hard",
};
