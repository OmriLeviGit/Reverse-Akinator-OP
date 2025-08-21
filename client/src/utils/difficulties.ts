// src/utils/difficulties.ts
export const DIFFICULTY_OPTIONS = ["unrated", "very easy", "easy", "medium", "hard", "really hard"] as const;

export type Difficulty = (typeof DIFFICULTY_OPTIONS)[number];

export const toTitleCase = (difficulty: Difficulty): string => {
  return difficulty.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};

// Convert difficulty strings to numeric values for sorting
export const getDifficultyNumericValue = (difficulty: string): number => {
  switch (difficulty) {
    case "unrated":
      return 0;
    case "very easy":
      return 1;
    case "easy":
      return 2;
    case "medium":
      return 3;
    case "hard":
      return 4;
    case "really hard":
      return 5;
    default:
      return 0;
  }
};
