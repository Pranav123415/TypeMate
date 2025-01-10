import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Keyboard, Timer, RotateCcw, Clock3, Clock6, Clock9 } from 'lucide-react';
import { WPMChart } from './WPMChart';

export const TypingTest = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const {
    words,
    currentWordIndex,
    currentInput,
    startTime,
    endTime,
    wpm,
    accuracy,
    isGameActive,
    duration,
    wpmHistory,
    initGame,
    updateInput,
    resetGame
  } = useGameStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleStart = async () => {
    await initGame(selectedDuration);
    inputRef.current?.focus();
  };

  const timeLeft = isGameActive && startTime 
    ? Math.max(0, duration - Math.floor((Date.now() - startTime) / 1000))
    : duration;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-emerald-400 mb-4 flex items-center justify-center gap-2">
          <Keyboard className="w-8 h-8" />
          Test Your Speed
        </h2>
        {!isGameActive && !endTime && (
          <div className="space-y-4">
            <p className="text-gray-300">Select duration and press start when ready</p>
            <div className="flex justify-center gap-4">
              {[15, 30, 60].map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedDuration(time)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                    selectedDuration === time
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {time === 15 && <Clock3 className="w-4 h-4" />}
                  {time === 30 && <Clock6 className="w-4 h-4" />}
                  {time === 60 && <Clock9 className="w-4 h-4" />}
                  {time}s
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl p-8 mb-6 border border-gray-700/50">
        {!isGameActive && !endTime ? (
          <button
            onClick={handleStart}
            className="w-full py-4 px-6 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors text-lg font-semibold"
          >
            Start Test
          </button>
        ) : (
          <>
            <div className="mb-6 text-lg leading-relaxed">
              {words.map((word, index) => (
                <span
                  key={index}
                  className={`mr-2 ${
                    index === currentWordIndex
                      ? 'bg-gray-700/50 p-1 rounded'
                      : word.status === 'correct'
                      ? 'text-emerald-400'
                      : word.status === 'incorrect'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  {word.text}
                </span>
              ))}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => updateInput(e.target.value)}
              className="w-full p-4 bg-gray-900/50 border-2 border-gray-700/50 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-100"
              placeholder="Type here..."
              disabled={!isGameActive}
            />
          </>
        )}
      </div>

      {endTime && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl p-8 border border-gray-700/50">
            <h3 className="text-2xl font-bold text-center mb-6 text-emerald-400">Results</h3>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <p className="text-gray-400 mb-2">WPM</p>
                <p className="text-4xl font-bold text-emerald-400">{wpm}</p>
              </div>
              <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <p className="text-gray-400 mb-2">Accuracy</p>
                <p className="text-4xl font-bold text-emerald-400">{accuracy}%</p>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-emerald-400 mb-4">Performance Chart</h4>
              <WPMChart wpmData={wpmHistory} />
            </div>
            <button
              onClick={resetGame}
              className="w-full py-3 px-6 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {isGameActive && (
        <div className="fixed top-4 right-4 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-emerald-400" />
            <span className="text-xl font-semibold text-emerald-400">
              {timeLeft}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};