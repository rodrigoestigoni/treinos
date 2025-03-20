// src/components/timer/WorkoutTimer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  PauseIcon, 
  ForwardIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/solid';

const WorkoutTimer = ({ 
  exerciseDuration = 0, 
  restDuration = 60, 
  onComplete,
  exerciseName,
  setNumber,
  totalSets
}) => {
  const [mode, setMode] = useState('exercise'); // 'exercise', 'rest', or 'complete'
  const [timeLeft, setTimeLeft] = useState(exerciseDuration > 0 ? exerciseDuration : 0);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(100);
  const [showControls, setShowControls] = useState(true);
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const totalTime = mode === 'exercise' ? exerciseDuration : restDuration;

  // Criar elemento de áudio para notificações
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            
            // Tocar som de notificação
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.log("Erro ao tocar audio:", e));
            }
            
            // Trocar modo ou finalizar
            if (mode === 'exercise') {
              setMode('rest');
              setTimeLeft(restDuration);
              setProgress(100);
              return 0;
            } else {
              setMode('complete');
              setIsActive(false);
              if (onComplete) onComplete();
              return 0;
            }
          }
          
          const newTime = prevTime - 1;
          setProgress((newTime / totalTime) * 100);
          
          // Tocar som nos últimos 3 segundos
          if (newTime <= 3 && audioRef.current) {
            audioRef.current.play().catch(e => console.log("Erro ao tocar audio:", e));
          }
          
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

  const resetTimer = () => {
    clearInterval(timerRef.current);
    if (mode === 'exercise') {
      setTimeLeft(exerciseDuration);
    } else {
      setTimeLeft(restDuration);
    }
    setProgress(100);
    setIsActive(false);
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
    : mode === 'rest'
      ? 'from-green-500 to-teal-600'
      : 'from-amber-500 to-orange-600';
  
  const textColor = mode === 'exercise' 
    ? 'text-blue-600 dark:text-blue-400' 
    : mode === 'rest'
      ? 'text-green-600 dark:text-green-400'
      : 'text-orange-600 dark:text-orange-400';

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
              {mode === 'exercise' 
                ? `Exercício: ${exerciseName || ''}`
                : mode === 'rest' 
                  ? 'Descanso' 
                  : 'Completo!'}
            </h2>
            {mode === 'exercise' && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Série {setNumber} de {totalSets}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="relative w-64 h-64 mx-auto">
          {/* Background circle */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke="#f1f5f9" 
              strokeWidth="10" 
              strokeLinecap="round"
            />
            
            {/* Progress circle */}
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke={mode === 'exercise' ? '#4f46e5' : mode === 'rest' ? '#14b8a6' : '#f59e0b'} 
              strokeWidth="10" 
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
              transform="rotate(-90 50 50)"
            />
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${textColor}`}>
              {formatTime(timeLeft)}
            </span>
            {showControls && mode !== 'complete' && (
              <div className="absolute bottom-16 flex space-x-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleTimer}
                  className={`p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg
                    ${isActive ? 'text-red-500' : 'text-green-500'}`}
                >
                  {isActive ? (
                    <PauseIcon className="h-6 w-6" />
                  ) : (
                    <PlayIcon className="h-6 w-6" />
                  )}
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={resetTimer}
                  className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg text-gray-700 dark:text-gray-300"
                >
                  <ArrowPathIcon className="h-6 w-6" />
                </motion.button>
                
                {mode === 'exercise' && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={skipToRest}
                    className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg text-gray-700 dark:text-gray-300"
                  >
                    <ForwardIcon className="h-6 w-6" />
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col space-y-4">
          {mode === 'exercise' && !isActive && (
            <button
              onClick={skipToRest}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center justify-center"
            >
              Completar Exercício
            </button>
          )}
          
          {mode === 'rest' && !isActive && (
            <button
              onClick={onComplete}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center"
            >
              Próximo Exercício
            </button>
          )}
          
          {mode === 'complete' && (
            <button
              onClick={onComplete}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center justify-center"
            >
              Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutTimer;