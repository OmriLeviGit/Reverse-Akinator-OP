import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionApi } from "../services/api"; // Updated import
import { sessionService } from "../services/sessionService";
import { SessionData, UserPreferences, Arc } from "../types";

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
      return sessionApi.getSessionData(); // Use new session API
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (initialData) {
      console.log("Initial data received:", initialData);
      setSessionData(initialData.sessionData);
      setAvailableArcs(initialData.availableArcs);
      sessionService.saveSessionData(initialData.sessionData);
      sessionService.saveAvailableArcs(initialData.availableArcs);
      console.log("Data saved to cookies");
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData && !initialDataLoading) {
      console.log("Attempting to load from cookies...");
      const savedSessionData = sessionService.loadSessionDataFromCookie();
      const savedArcs = sessionService.loadAvailableArcsFromCookie();
      if (savedSessionData) {
        setSessionData(savedSessionData);
      }
      if (savedArcs.length > 0) {
        setAvailableArcs(savedArcs);
      }
      console.log("Cookie loading complete");
    }
  }, [initialData, initialDataLoading]);

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    if (!sessionData) return;
    const updatedPreferences = {
      ...sessionData.userPreferences,
      ...newPreferences,
    };
    const updatedSessionData = {
      ...sessionData,
      userPreferences: updatedPreferences,
    };
    setSessionData(updatedSessionData);
    sessionService.saveSessionData(updatedSessionData);
    console.log("Preferences updated:", updatedPreferences);
  };

  const updateGlobalArcLimit = async (arcLimit: string) => {
    if (!sessionData) return;

    try {
      // Update server session
      const response = await sessionApi.updateGlobalArcLimit(arcLimit);

      console.log("@@@@@", response.sessionData);

      // Update local state with server response
      setSessionData(response.sessionData);
      setAvailableArcs(response.availableArcs);
      sessionService.saveSessionData(response.sessionData);
      sessionService.saveAvailableArcs(response.availableArcs);

      // Invalidate characters cache so they refetch with new arc limit
      queryClient.invalidateQueries({ queryKey: ["allCharacters"] });

      console.log("Global arc limit updated on server and client:", arcLimit);
    } catch (error) {
      console.error("Failed to update global arc limit:", error);
    }
  };

  return {
    sessionData,
    availableArcs,
    isLoading: initialDataLoading,
    updatePreferences,
    updateGlobalArcLimit,
    refreshInitialData: refetch,
  };
};
