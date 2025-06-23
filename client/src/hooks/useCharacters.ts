// src/hooks/useCharacters.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { characterApi } from "../services/api";
import { Character } from "../types/character";

export const useCharacters = () => {
  const {
    data: charactersData,
    isLoading: isLoadingCharacters,
    error: characterError,
  } = useQuery({
    queryKey: ["allCharacters"],
    queryFn: characterApi.getCharacters,
  });

  return {
    allCharacters: charactersData?.characters || [],
    isLoadingCharacters,
    characterError: characterError as Error | null,
  };
};

export const useCharacterRatings = () => {
  const queryClient = useQueryClient();

  const ratingMutation = useMutation({
    mutationFn: ({ characterId, difficulty }: { characterId: string; difficulty: number }) =>
      characterApi.rateCharacter(characterId, difficulty),
    onMutate: async ({ characterId, difficulty }) => {
      await queryClient.cancelQueries({ queryKey: ["allCharacters"] });
      const previousCharacters = queryClient.getQueryData(["allCharacters"]);

      queryClient.setQueryData(["allCharacters"], (old: any) => {
        if (!old || !old.characters) return old;
        return {
          ...old,
          characters: old.characters.map((char: Character) => (char.name === characterId ? { ...char, difficulty } : char)),
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
          characters: old.characters.map((char: Character) => (char.name === characterId ? { ...char, isIgnored: !char.isIgnored } : char)),
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
    setCharacterRating: (characterId: string, difficulty: number) => {
      ratingMutation.mutate({ characterId, difficulty });
    },
    isUpdatingRating: ratingMutation.isPending,
    toggleIgnoreCharacter: (characterId: string) => {
      toggleIgnoreMutation.mutate(characterId);
    },
    isUpdatingIgnoreList: toggleIgnoreMutation.isPending,
  };
};
