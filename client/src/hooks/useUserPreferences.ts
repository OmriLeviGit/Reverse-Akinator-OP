import { DEFAULT_USER_PREFERENCES, UserPreferences } from "@/types/userPreferences";
import { useState, useCallback } from "react";

const loadPreferencesFromStorage = (): UserPreferences => {
  try {
    const saved = localStorage.getItem("userPreferences");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_USER_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.warn("Failed to load preferences from localStorage:", error);
  }
  return DEFAULT_USER_PREFERENCES;
};

const savePreferencesToStorage = (preferences: UserPreferences) => {
  try {
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
    console.log("Preferences saved to localStorage:", preferences);
  } catch (error) {
    console.error("Failed to save preferences to localStorage:", error);
  }
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const loaded = loadPreferencesFromStorage();
    console.log("🚀 useUserPreferences initializing:", loaded);
    return loaded;
  });

  const updatePreferences = useCallback(
    (newPreferences: Partial<UserPreferences>) => {
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);
      savePreferencesToStorage(updatedPreferences);
    },
    [preferences]
  );

  return {
    preferences,
    updatePreferences,
  };
};
