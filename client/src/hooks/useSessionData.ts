import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { generalApi } from "../services/api";
import { sessionService } from "../services/sessionService";
import { SessionData, UserPreferences, Arc } from "../types";

export const useSessionData = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [availableArcs, setAvailableArcs] = useState<Arc[]>([]);

  const {
    data: initialData,
    isLoading: initialDataLoading,
    refetch,
  } = useQuery({
    queryKey: ["initialData"],
    queryFn: async () => {
      const savedPreferences = sessionService.loadSavedPreferences();
      return generalApi.getInitialData(savedPreferences);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (initialData) {
      console.log("Initial data received:", initialData);
      setSessionData(initialData.session_data);
      setAvailableArcs(initialData.available_arcs);

      sessionService.saveSessionData(initialData.session_data);
      sessionService.saveAvailableArcs(initialData.available_arcs);

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
      ...sessionData.user_preferences,
      ...newPreferences,
    };

    const updatedSessionData = {
      ...sessionData,
      user_preferences: updatedPreferences,
    };

    setSessionData(updatedSessionData);
    sessionService.saveSessionData(updatedSessionData);
    console.log("Preferences updated:", updatedPreferences);
  };

  const updateGlobalArcLimit = (arcLimit: string) => {
    if (!sessionData) return;

    const updatedSessionData = {
      ...sessionData,
      global_arc_limit: arcLimit,
    };

    setSessionData(updatedSessionData);
    sessionService.saveSessionData(updatedSessionData);
    console.log("Global arc limit updated:", arcLimit);
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
