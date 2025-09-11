import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionApi } from "../services/api";
import { sessionService } from "../services/sessionService";
import { SessionData, Arc } from "../types";

export const useSessionData = () => {
  const queryClient = useQueryClient();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [availableArcs, setAvailableArcs] = useState<Arc[]>([]);

  const {
    data: initialData,
    isLoading: initialDataLoading,
    refetch,
  } = useQuery({
    queryKey: ["initialData"],
    queryFn: async () => {
      const arcLimit = localStorage.getItem("globalArcLimit") || "All";
      return sessionApi.getSessionData(arcLimit);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (initialData) {
      setSessionData(initialData.sessionData);
      setAvailableArcs(initialData.availableArcs);
      sessionService.saveSessionData(initialData.sessionData);
      sessionService.saveAvailableArcs(initialData.availableArcs);
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData && !initialDataLoading) {
      const savedSessionData = sessionService.loadSessionDataFromCookie();
      const savedArcs = sessionService.loadAvailableArcsFromCookie();

      if (savedSessionData) {
        setSessionData(savedSessionData);
      }
      if (savedArcs.length > 0) {
        setAvailableArcs(savedArcs);
      }
    }
  }, [initialData, initialDataLoading]);

  const updateGlobalArcLimit = async (arcLimit: string) => {
    if (!sessionData) return;

    try {
      // Update server session
      const response = await sessionApi.updateGlobalArcLimit(arcLimit);

      // Update local state with server response
      setSessionData(response.sessionData);
      setAvailableArcs(response.availableArcs);
      sessionService.saveSessionData(response.sessionData);
      sessionService.saveAvailableArcs(response.availableArcs);
    } catch (error) {
      console.error("Failed to update global arc limit:", error);
    }
  };

  return {
    sessionData,
    availableArcs,
    isLoading: initialDataLoading,
    updateGlobalArcLimit,
    refreshInitialData: refetch,
  };
};
