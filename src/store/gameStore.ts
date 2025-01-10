import { create } from 'zustand';
import { GameState, Word } from '../types';
import { generateText } from '../utils/gemini';

interface GameStore extends GameState {
  initGame: (duration: number) => Promise<void>;
  updateInput: (input: string) => void;
  resetGame: () => void;
  wpmHistory: { time: number; wpm: number }[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  words: [],
  currentWordIndex: 0,
  currentInput: '',
  startTime: null,
  endTime: null,
  wpm: 0,
  accuracy: 0,
  isGameActive: false,
  duration: 30,
  wpmHistory: [],

  initGame: async (duration: number) => {
    const words = await generateText();
    set({
      words: words.map(text => ({ text, status: 'pending' })),
      currentWordIndex: 0,
      currentInput: '',
      startTime: Date.now(),
      endTime: null,
      wpm: 0,
      accuracy: 0,
      isGameActive: true,
      duration,
      wpmHistory: []
    });

    // Update WPM every second
    const interval = setInterval(() => {
      const state = get();
      if (state.isGameActive && state.startTime) {
        const timeElapsed = (Date.now() - state.startTime) / 1000 / 60;
        const correctWords = state.words.filter(w => w.status === 'correct').length;
        const currentWPM = Math.round((correctWords / timeElapsed) || 0);
        
        set(state => ({
          wpmHistory: [...state.wpmHistory, {
            time: Math.round(timeElapsed * 60),
            wpm: currentWPM
          }]
        }));
      }
    }, 1000);

    // Set timer to end game
    setTimeout(() => {
      clearInterval(interval);
      const state = get();
      if (state.isGameActive) {
        const endTime = Date.now();
        const timeElapsed = (endTime - (state.startTime || 0)) / 1000 / 60;
        const correctWords = state.words.filter(w => w.status === 'correct').length;
        const wpm = Math.round((correctWords / timeElapsed) || 0);
        const accuracy = Math.round((correctWords / state.currentWordIndex) * 100);

        set({
          endTime,
          wpm,
          accuracy,
          isGameActive: false
        });
      }
    }, duration * 1000);
  },

  updateInput: (input: string) => {
    const state = get();
    if (!state.isGameActive) return;

    set({ currentInput: input });

    if (input.endsWith(' ')) {
      const wordToCheck = input.trim();
      const currentWord = state.words[state.currentWordIndex];

      const newWords = [...state.words];
      newWords[state.currentWordIndex] = {
        ...currentWord,
        status: wordToCheck === currentWord.text ? 'correct' : 'incorrect'
      };

      set({
        words: newWords,
        currentWordIndex: state.currentWordIndex + 1,
        currentInput: ''
      });
    }
  },

  resetGame: () => {
    set({
      words: [],
      currentWordIndex: 0,
      currentInput: '',
      startTime: null,
      endTime: null,
      wpm: 0,
      accuracy: 0,
      isGameActive: false,
      duration: 30,
      wpmHistory: []
    });
  }
}));