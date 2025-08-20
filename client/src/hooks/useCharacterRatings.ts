import { characterApi } from "@/services/api";
import { Character } from "@/types/character";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
            char.id === characterId ? { ...char, difficulty } : char
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
            char.id === characterId ? { ...char, isIgnored: !char.isIgnored } : char
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
    getCharacterById: (characterId: string): Character | undefined => {
      const data = queryClient.getQueryData(["allCharacters"]) as any;
      return data?.characters?.find((char: Character) => char.id === characterId);
    },
  };
};
