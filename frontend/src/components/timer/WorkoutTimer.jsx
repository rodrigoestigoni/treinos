// src/components/timer/WorkoutTimer.jsx - Componente de timer para exercícios
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, PauseIcon, ForwardIcon } from '@heroicons/react/24/solid';

const WorkoutTimer = ({ 
  exerciseDuration = 60, 
  restDuration = 60, 
  onComplete 
}) => {
  const [mode, setMode] = useState('exercise'); // 'exercise' or 'rest'
  const [timeLeft, setTimeLeft] = useState(exerciseDuration);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(100);
  
  const timerRef = useRef(null);
  const totalTime = mode === 'exercise' ? exerciseDuration : restDuration;

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            
            // Trocar modo ou finalizar
            if (mode === 'exercise') {
              setMode('rest');
              setTimeLeft(restDuration);
              setProgress(100);
              return 0;
            } else {
              setIsActive(false);
              if (onComplete) onComplete();
              return 0;
            }
          }
          
          const newTime = prevTime - 1;
          setProgress((newTime / totalTime) * 100);
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, mode, exerciseDuration, restDuration, totalTime, onComplete]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const skipToRest = () => {
    if (mode === 'exercise') {
      clearInterval(timerRef.current);
      setMode('rest');
      setTimeLeft(restDuration);
      setProgress(100);
      setIsActive(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determinar a cor com base no modo
  const bgColor = mode === 'exercise' 
    ? 'from-blue-500 to-indigo-600' 
    : 'from-green-500 to-teal-600';
  
  const textColor = mode === 'exercise' 
    ? 'text-blue-600' 
    : 'text-green-600';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-4"
          >
            <h2 className="text-xl font-bold">
              {mode === 'exercise' ? 'Exercício' : 'Descanso'}
            </h2>
          </motion.div>
        </AnimatePresence>

        <div className="relative w-64 h-64 mx-auto">
          {/* Círculo de progresso */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Círculo de fundo */}
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke="#f1f5f9" 
              strokeWidth="10" 
              strokeLinecap="round"
            />
            
            {/* Círculo de progresso */}
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke={mode === 'exercise' ? '#4f46e5' : '#14b8a6'} 
              strokeWidth="10" 
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
              transform="rotate(-90 50 50)"
            />
          </svg>
          
          {/* Tempo no centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${textColor}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="flex justify-center mt-6 space-x-4">
          <button
            onClick={toggleTimer}
            className={`p-4 rounded-full bg-gradient-to-r ${bgColor} text-white shadow-lg hover:shadow-xl transition-all`}
          >
            {isActive ? (
              <PauseIcon className="h-8 w-8" />
            ) : (
              <PlayIcon className="h-8 w-8" />
            )}
          </button>
          
          {mode === 'exercise' && (
            <button
              onClick={skipToRest}
              className="p-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-lg hover:shadow-xl transition-all"
            >
              <ForwardIcon className="h-8 w-8" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutTimer;