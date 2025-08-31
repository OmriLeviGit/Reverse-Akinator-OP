import { BasicCharacter, FullCharacter } from "./character";

export interface GameSession {
  isActive: boolean;
  gameId: string;
  characterPool: BasicCharacter[];
}

export interface GameReveal {
  character: FullCharacter;
  questionsAsked: number;
  guessesMade: number;
}
