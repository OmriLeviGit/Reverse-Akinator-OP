import { useQuery } from "@tanstack/react-query";
import { characterApi } from "../services/api";
import { useEffect } from "react";

export const useCharacters = (sessionArcLimit: string | null) => {
  const {
    data: charactersData,
    isLoading: isLoadingCharacters,
    error: characterError,
  } = useQuery({
    queryKey: ["allCharacters", sessionArcLimit],
    queryFn: characterApi.getCharacters,
    staleTime: 5 * 60 * 1000,
    enabled: sessionArcLimit !== null,
  });

  const allCharacters = charactersData?.characters || [];
  const charactersLoaded = !isLoadingCharacters && allCharacters.length > 0;

  useEffect(() => {
    if (isLoadingCharacters) {
    } else if (allCharacters.length > 0) {
      console.log(
        `✅ Characters loaded: ${allCharacters.length} characters available (up to arc: ${
          charactersData?.arc || "unknown"
        })`
      );
    }
  }, [isLoadingCharacters, allCharacters.length, charactersData?.arc]);

  return {
    allCharacters,
    characters: allCharacters,
    isLoadingCharacters,
    charactersLoaded,
    characterError: characterError as Error | null,
    currentArcLimit: charactersData?.arc,
  };
};
