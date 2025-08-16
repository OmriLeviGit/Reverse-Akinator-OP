import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { characterApi } from "../services/api";
import { Character } from "../types/character";
import { useEffect } from "react";

export const useCharacters = () => {
  const {
    data: charactersData,
    isLoading: isLoadingCharacters,
    error: characterError,
  } = useQuery({
    queryKey: ["allCharacters"],
    queryFn: characterApi.getAllCharacters, // Keep your existing API call
    staleTime: 5 * 60 * 1000, // Add stale time for consistency
  });

  const allCharacters = charactersData?.characters || [];
  const charactersLoaded = !isLoadingCharacters && allCharacters.length > 0;

  // Add logging like in the original AppContext
  useEffect(() => {
    if (isLoadingCharacters) {
      console.log("🔄 Loading characters in background...");
    } else if (allCharacters.length > 0) {
      console.log("✅ Characters loaded:", allCharacters.length, "characters available");
    }
  }, [isLoadingCharacters, allCharacters.length]);

  return {
    allCharacters,
    characters: allCharacters, // Add alias for compatibility
    isLoadingCharacters,
    charactersLoaded, // Add this for the AppContext
    characterError: characterError as Error | null,
  };
};

export const useCharacterRatings = () => {
  const queryClient = useQueryClient();

  const ratingMutation = useMutation({
    mutationFn: ({ characterId, difficulty }: { characterId: string; difficulty: string }) =>
      characterApi.rateCharacter(characterId, difficulty),
    onMutate: async ({ characterId, difficulty }) => {
      await queryClient.cancelQueries({ queryKey: ["allCharacters"] });
      const previousCharacters = queryClient.getQueryData(["allCharacters"]);
      queryClient.setQueryData(["allCharacters"], (old: any) => {
        if (!old || !old.characters) return old;
        return {
          ...old,
          characters: old.characters.map((char: Character) =>
            char.name === characterId ? { ...char, difficulty } : char
          ),
        };
      });
      return { previousCharacters };
    },
    onError: (err, variables, context) => {
      if (context?.previousCharacters) {
        queryClient.setQueryData(["allCharacters"], context.previousCharacters);
      }
    },
  });

  const toggleIgnoreMutation = useMutation({
    mutationFn: characterApi.toggleIgnoreCharacter,
    onMutate: async (characterId: string) => {
      await queryClient.cancelQueries({ queryKey: ["allCharacters"] });
      const previousCharacters = queryClient.getQueryData(["allCharacters"]);
      queryClient.setQueryData(["allCharacters"], (old: any) => {
        if (!old || !old.characters) return old;
        return {
          ...old,
          characters: old.characters.map((char: Character) =>
            char.name === characterId ? { ...char, isIgnored: !char.isIgnored } : char
          ),
        };
      });
      return { previousCharacters };
    },
    onError: (err, variables, context) => {
      if (context?.previousCharacters) {
        queryClient.setQueryData(["allCharacters"], context.previousCharacters);
      }
    },
  });

  return {
    setCharacterRating: (characterId: string, difficulty: string) => {
      ratingMutation.mutate({ characterId, difficulty });
    },
    isUpdatingRating: ratingMutation.isPending,
    toggleIgnoreCharacter: (characterId: string) => {
      toggleIgnoreMutation.mutate(characterId);
    },
    isUpdatingIgnoreList: toggleIgnoreMutation.isPending,
  };
};
