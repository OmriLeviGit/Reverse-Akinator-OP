// src/services/api.ts
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

// API instance for /api/* endpoints
const api = axios.create({
  baseURL: `${apiUrl}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Add this if missing
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const sessionApi = {
  getSessionData: async (arcLimit: string) => {
    const response = await api.post("/session/", { arcLimit });
    return response.data;
  },

  updateGlobalArcLimit: async (arcLimit: string) => {
    const response = await api.post("/session/update-arc-limit", { arcLimit });
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
    includeUnrated: boolean;
  }) => {
    console.log("🎮 Starting game with settings:", settings);
    const response = await api.post("/game/start", settings);
    console.log("🎮 Game start response:", response.data);
    return response.data;
  },

  validateGameSession: async (gameId: string) => {
    const response = await api.post("/game/validate", { gameId });
    return response.data;
  },

  askQuestion: async (gameId: string, question: string) => {
    const response = await api.post("/game/question", { gameId, question });
    return response.data;
  },

  makeGuess: async (gameId: string, characterName: string) => {
    const response = await api.post("/game/guess", { gameId, characterName });
    return response.data;
  },

  revealCharacter: async (gameId: string) => {
    const response = await api.post("/game/reveal", { gameId });
    return response.data;
  },

  getChatMessages: async (gameId: string) => {
    const response = await api.post("/game/messages", { gameId });
    return response.data;
  },
};

// Character Data API
export const characterApi = {
  getCharacters: async () => {
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

export default api;
