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

// General Management API
// src/services/api.ts
export const generalApi = {
  getInitialData: async (preferences?: {
    difficulty: string;
    preferred_arc: string;
    includeNonTVFillers: boolean;
    fillerPercentage: number;
  }) => {
    const response = await api.get("/", { params: preferences || {} });
    return response.data;
  },
};

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

  getCharacterById: async (id: string) => {
    const response = await api.get(`/characters/${id}`);
    return response.data;
  },

  searchCharacters: async (params: { query?: string; arc?: string; filler?: string; difficulty?: string }) => {
    const response = await api.get("/characters/search", { params });
    return response.data;
  },

  getIgnoredCharacters: async () => {
    const response = await api.get("/characters/ignored-characters");
    return response.data;
  },

  toggleIgnoreCharacter: async (characterId: string) => {
    const response = await api.post("/characters/toggle-ignore", { characterId });
    return response.data;
  },

  rateCharacter: async (characterId: string, difficulty: number) => {
    const response = await api.post("/characters/rate-character", { characterId, difficulty });
    return response.data;
  },
};

// Data Management API
export const dataApi = {
  getArcs: async () => {
    const response = await api.get("/data/arcs");
    console.log(response.data);
    return response.data;
  },
};

export default api;
