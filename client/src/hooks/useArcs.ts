// src/hooks/useArcs.ts
import { useQuery } from "@tanstack/react-query";
import { dataApi } from "../services/api";

export const useArcs = () => {
  const { data: arcList } = useQuery({
    queryKey: ["arcList"],
    queryFn: dataApi.getArcs,
  });

  return { arcList: arcList || {} };
};
