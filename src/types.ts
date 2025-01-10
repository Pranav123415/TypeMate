export interface Word {
  text: string;
  status: 'pending' | 'correct' | 'incorrect';
}

export interface GameState {
  words: Word[];
  currentWordIndex: number;
  currentInput: string;
  startTime: number | null;
  endTime: number | null;
  wpm: number;
  accuracy: number;
  isGameActive: boolean;
}

export interface Room {
  id: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
}

export interface Player {
  id: string;
  name: string;
  progress: number;
  wpm: number;
}