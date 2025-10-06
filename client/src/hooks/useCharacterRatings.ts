import { characterApi } from "@/services/api";
import { BasicCharacter } from "@/types/character";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCharacterRatings = () => {
  const queryClient = useQueryClient();

  const ratingMutation = useMutation({
    mutationFn: ({ characterId, difficulty }: { characterId: string; difficulty: string }) =>
      characterApi.rateCharacter(characterId, difficulty),
    onMutate: async ({ characterId, difficulty }) => {
      await queryClient.cancelQueries({ queryKey: ["allCharacters"] });
      const previousData: any[] = [];

      // Update all matching query keys
      queryClient.getQueryCache().findAll({ queryKey: ["allCharacters"] }).forEach(query => {
        const oldData = queryClient.getQueryData(query.queryKey);
        previousData.push({ queryKey: query.queryKey, data: oldData });

        queryClient.setQueryData(query.queryKey, (old: any) => {
          if (!old || !old.characters) return old;
          return {
            ...old,
            characters: old.characters.map((char: BasicCharacter) =>
              char.id === characterId ? { ...char, difficulty } : char
            ),
          };
        });
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });

  const toggleIgnoreMutation = useMutation({
    mutationFn: characterApi.toggleIgnoreCharacter,
    onMutate: async (characterId: string) => {
      await queryClient.cancelQueries({ queryKey: ["allCharacters"] });
      const previousData: any[] = [];

      // Update all matching query keys
      queryClient.getQueryCache().findAll({ queryKey: ["allCharacters"] }).forEach(query => {
        const oldData = queryClient.getQueryData(query.queryKey);
        previousData.push({ queryKey: query.queryKey, data: oldData });

        queryClient.setQueryData(query.queryKey, (old: any) => {
          if (!old || !old.characters) return old;
          return {
            ...old,
            characters: old.characters.map((char: BasicCharacter) =>
              char.id === characterId ? { ...char, isIgnored: !char.isIgnored } : char
            ),
          };
        });
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
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
    getCharacterById: (characterId: string): BasicCharacter | undefined => {
      // Find the first matching query and get the character from it
      const queries = queryClient.getQueryCache().findAll({ queryKey: ["allCharacters"] });
      for (const query of queries) {
        const data = queryClient.getQueryData(query.queryKey) as any;
        if (data?.characters) {
          const character = data.characters.find((char: BasicCharacter) => char.id === characterId);
          if (character) return character;
        }
      }
      return undefined;
    },
  };
};
