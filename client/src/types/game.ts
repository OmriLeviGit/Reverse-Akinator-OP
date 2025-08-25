import { Character } from "./character";

export interface GameSession {
  isActive: boolean;
  gameId: string;
  characterPool: Character[];
}
