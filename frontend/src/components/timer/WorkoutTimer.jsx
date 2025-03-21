// WorkoutTimer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  PauseIcon, 
  ForwardIcon, 
  ArrowPathIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/solid';
import { playSound as playSoundUtil } from '../../utils/sounds';

const WorkoutTimer = ({ 
  exerciseDuration = 0, 
  restDuration = 60, 
  onComplete,
  exerciseName,
  setNumber,
  totalSets,
  mode,
  playSound = true
}) => {
  const [timeLeft, setTimeLeft] = useState(mode === 'exercise' ? (exerciseDuration > 0 ? exerciseDuration : 0) : restDuration);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isMuted, setIsMuted] = useState(!playSound);
  const [countdownValue, setCountdownValue] = useState(3);
  
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const totalTime = mode === 'exercise' ? exerciseDuration : restDuration;
  
  // Limpar os timers quando o componente desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);
  
  // Atualizar estado mudo quando a prop playSound mudar
  useEffect(() => {
    setIsMuted(!playSound);
  }, [playSound]);
  
  // Reiniciar timer quando o modo mudar
  useEffect(() => {
    setTimeLeft(mode === 'exercise' ? (exerciseDuration > 0 ? exerciseDuration : 0) : restDuration);
    setProgress(100);
    setIsActive(false);
  }, [mode, exerciseDuration, restDuration]);
  
  // Efeito principal do timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            
            // Tocar som de notificação
            if (!isMuted) {
              playSoundUtil('notification');
            }
            
            // Vibrar o dispositivo
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
            
            // Quando o timer chega a zero, chamamos onComplete
            if (onComplete) {
              onComplete();
            }
            
            return 0;
          }
          
          const newTime = prevTime - 1;
          setProgress((newTime / totalTime) * 100);
          
          // Tocar sons nos últimos 3 segundos
          if (newTime <= 3 && !isMuted) {
            if (newTime === 0) {
              playSoundUtil('finalTick');
            } else {
              playSoundUtil('tick');
            }
            
            // Vibrar o dispositivo a cada segundo nos últimos 3 segundos
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
  
    return () => clearInterval(timerRef.current);
  }, [isActive, totalTime, onComplete, isMuted]);
  
  const startCountdown = () => {
    setShowCountdown(true);
    setCountdownValue(3);
    
    countdownRef.current = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setShowCountdown(false);
          setIsActive(true);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const toggleTimer = () => {
    if (!isActive) {
      startCountdown();
    } else {
      setIsActive(false);
    }
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
    clearInterval(timerRef.current);
    if (onComplete) onComplete();
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
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
  
  const pulseAnimation = timeLeft <= 3 ? 'animate-pulse' : '';

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
              className={pulseAnimation}
            />
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {showCountdown ? (
              <motion.div
                key="countdown"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className={`text-5xl font-bold ${textColor}`}
              >
                {countdownValue}
              </motion.div>
            ) : (
              <span className={`text-4xl font-bold ${textColor} ${pulseAnimation}`}>
                {formatTime(timeLeft)}
              </span>
            )}
            
            {showControls && mode !== 'complete' && !showCountdown && (
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
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMute}
                  className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg text-gray-700 dark:text-gray-300"
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="h-6 w-6" />
                  ) : (
                    <SpeakerWaveIcon className="h-6 w-6" />
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col space-y-4">
          {mode === 'exercise' && !isActive && !showCountdown && (
            <button
              onClick={skipToRest}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center justify-center"
            >
              Completar Exercício
            </button>
          )}
          
          {mode === 'rest' && !isActive && !showCountdown && (
            <button
              onClick={onComplete}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center"
            >
              Próximo Exercício
            </button>
          )}
          
          {!isActive && !showCountdown && (
            <button
              onClick={startCountdown}
              className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg flex items-center justify-center"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Iniciar Timer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutTimer;