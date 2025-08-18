import { cookieUtils } from "../utils/cookies";
import { SessionData, UserPreferences } from "../types";

export const sessionService = {
  loadSavedPreferences: (): UserPreferences => {
    const savedSessionData = cookieUtils.getCookie("sessionData");
    if (savedSessionData) {
      try {
        const parsed = JSON.parse(savedSessionData);
        return parsed.user_preferences;
      } catch (error) {
        console.error("Failed to parse saved preferences:", error);
      }
    }

    return {
      difficulty: "easy",
      preferredArc: "All",
      includeNonTVFillers: false,
      fillerPercentage: 0,
      includeUnrated: false,
    };
  },

  saveSessionData: (sessionData: SessionData) => {
    cookieUtils.setCookie("sessionData", JSON.stringify(sessionData));
  },

  saveAvailableArcs: (arcs: any[]) => {
    cookieUtils.setCookie("availableArcs", JSON.stringify(arcs));
  },

  loadSessionDataFromCookie: (): SessionData | null => {
    const savedSessionData = cookieUtils.getCookie("sessionData");
    if (savedSessionData) {
      try {
        return JSON.parse(savedSessionData);
      } catch (error) {
        console.error("Failed to parse saved session data:", error);
      }
    }
    return null;
  },

  loadAvailableArcsFromCookie: (): any[] => {
    const savedArcs = cookieUtils.getCookie("availableArcs");
    if (savedArcs) {
      try {
        return JSON.parse(savedArcs);
      } catch (error) {
        console.error("Failed to parse saved arcs:", error);
      }
    }
    return [];
  },
};
