// src/services/api.ts
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Game Management API
export const gameApi = {
  startGame: async (settings: {
    arcSelection: string;
    fillerPercentage: number;
    includeNonTVFillers: boolean;
    difficultyLevel: string;
  }) => {
    const response = await api.post("/game/start", settings);
    return response.data;
  },

  askQuestion: async (gameSessionId: string, questionText: string) => {
    const response = await api.post("/game/question", {
      gameSessionId,
      questionText,
    });
    return response.data;
  },

  getHint: async (gameSessionId: string) => {
    const response = await api.post("/game/hint", { gameSessionId });
    return response.data;
  },

  revealCharacter: async (gameSessionId: string) => {
    const response = await api.post("/game/reveal", { gameSessionId });
    return response.data;
  },

  makeGuess: async (gameSessionId: string, guessedCharacter: string) => {
    const response = await api.post("/game/guess", {
      gameSessionId,
      guessedCharacter,
    });
    return response.data;
  },
};

// Character Data API
export const characterApi = {
  getCharacters: async () => {
    const response = await api.get("/characters");
    return response.data;
  },

  searchCharacters: async (params: { query?: string; arc?: string; filler?: string; difficulty?: string }) => {
    const response = await api.get("/characters/search", { params });
    return response.data;
  },

  getAvailableCharacters: async (filters: {
    arcSelection: string;
    fillerSettings: {
      fillerPercentage: number;
      includeNonTVFillers: boolean;
    };
    difficulty: string;
    ignoredCharacterIds: string[];
  }) => {
    const response = await api.post("/characters/available", filters);
    return response.data;
  },
};

// User Preferences API
export const userApi = {
  ignoreCharacter: async (characterId: string) => {
    const response = await api.post("/characters/ignore-character", { characterId });
    return response.data;
  },

  unignoreCharacter: async (characterId: string) => {
    const response = await api.delete(`/characters/unignore-character/${characterId}`);
    return response.data;
  },

  rateCharacter: async (characterId: string, rating: number | null) => {
    const response = await api.post("/characters/rate-character", { characterId, rating });
    return response.data;
  },
};

// Data Management API
export const dataApi = {
  getArcs: async () => {
    const response = await api.get("/arcs");
    return response.data;
  },
};

export default api;
