// src/services/api.ts
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

// Main API instance for /api/* endpoints
const api = axios.create({
  baseURL: `${apiUrl}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Root API instance for root endpoints
const rootApi = axios.create({
  baseURL: apiUrl, // Points directly to root
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
    preferredArc: string;
    includeNonTVFillers: boolean;
    fillerPercentage: number;
  }) => {
    const response = await rootApi.get("/", { params: preferences || {} });
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

    console.log("data", response.data);
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
    console.log("🔍 About to call /api/characters/until");
    const response = await api.get("/characters/until");
    console.log("Response:", response.status, response.data);
    return response.data;
  },

  getAllCharacters: async () => {
    const response = await api.get("/characters");
    return response.data;
  },

  getCharacterById: async (id: string) => {
    const response = await api.get(`/characters/${id}`);
    return response.data;
  },

  toggleIgnoreCharacter: async (characterId: string) => {
    console.log("req", "/characters/toggle-ignore", { characterId });
    const response = await api.post("/characters/toggle-ignore", { characterId });
    console.log(characterId, response);
    return response.data;
  },

  rateCharacter: async (characterId: string, difficulty: string) => {
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
