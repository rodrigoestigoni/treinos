// WorkoutTimer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  PauseIcon, 
  ArrowPathIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  CheckIcon
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
  playSound = true,
  onTimeUpdate = () => {},
  autoStart = false
}) => {
  const [timeLeft, setTimeLeft] = useState(mode === 'exercise' ? 0 : restDuration);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isMuted, setIsMuted] = useState(!playSound);
  const [countdownValue, setCountdownValue] = useState(3);
  const [autoStartNext, setAutoStartNext] = useState(false);
  
  // Referências para os temporizadores
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  
  // Referências para timestamps de início e fim
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const pausedAtRef = useRef(null); // Timestamp quando foi pausado
  const pausedTimeElapsedRef = useRef(null); // Tempo decorrido quando pausado
  
  // Referências para controle de sons
  const lastTickRef = useRef(-1);
  const finalTickPlayedRef = useRef(false);
  
  // Determinar se estamos no modo cronômetro (para exercícios)
  const isStopwatch = mode === 'exercise' && exerciseDuration === 0;
  
  // Atualizar mudo quando a prop playSound mudar
  useEffect(() => {
    setIsMuted(!playSound);
  }, [playSound]);

  useEffect(() => {
    // Se autoStart for verdadeiro, inicie o timer imediatamente
    if (autoStart && mode === 'exercise' && !isActive && !showCountdown) {
      console.log('Auto-iniciando timer via prop autoStart');
      startTimer();
    }
  }, [autoStart]);
  
  // Limpar temporizadores na desmontagem do componente
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Detectar quando o modo muda para resetar o timer
  useEffect(() => {
    // Reiniciar timer quando o modo mudar
    setTimeLeft(mode === 'exercise' ? 0 : restDuration);
    setProgress(100);
    setIsActive(false);
    finalTickPlayedRef.current = false;
    lastTickRef.current = -1;
    pausedAtRef.current = null;
    pausedTimeElapsedRef.current = null;
    
    // Auto-iniciar para modo de descanso
    if (mode === 'rest') {
      startTimer();
    }
    
    // Se acabamos de mudar para exercício e autoStartNext está ativo,
    // iniciar automaticamente o timer com contagem regressiva
    if (mode === 'exercise' && autoStartNext) {
      setAutoStartNext(false);
      // Pequeno delay para garantir que a interface tenha tempo de atualizar
      setTimeout(() => {
        startTimer();
      }, 100);
    }
  }, [mode, exerciseDuration, restDuration, autoStartNext]);
  
  // Quando timeLeft mudar, informar o componente pai
  useEffect(() => {
    onTimeUpdate(timeLeft);
  }, [timeLeft, onTimeUpdate]);
  
  // Lógica principal do timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        
        if (isStopwatch) {
          // Para cronômetro (exercício): contagem crescente
          const elapsed = Math.floor((now - startTimeRef.current) / 1000);
          setTimeLeft(elapsed);
        } else {
          // Para modo de contagem regressiva (descanso ou exercício com duração)
          const remaining = Math.ceil((endTimeRef.current - now) / 1000);
          setTimeLeft(remaining);
          
          // Calcular progresso apenas para contagem regressiva
          const totalTime = mode === 'exercise' ? exerciseDuration : restDuration;
          setProgress(Math.max(0, (remaining / totalTime) * 100));
          
          // Reproduzir sons de tick apenas quando o segundo mudar 
          // e apenas nos últimos 3 segundos (apenas para contagens positivas)
          if (remaining <= 3 && remaining > 0 && !isMuted) {
            if (lastTickRef.current !== remaining) {
              playSoundUtil('tick');
              lastTickRef.current = remaining;
              
              // Vibrar o dispositivo a cada segundo nos últimos 3 segundos
              if (navigator.vibrate) {
                navigator.vibrate(100);
              }
            }
          }
          
          // Som de finalização quando chega a zero (apenas uma vez)
          if (remaining === 0 && !finalTickPlayedRef.current && !isMuted) {
            playSoundUtil('finalTick');
            finalTickPlayedRef.current = true;
            
            // Vibrar o dispositivo
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
          }
          
          // Para exercício com duração, completar automaticamente
          if (remaining <= 0 && mode === 'exercise' && exerciseDuration > 0) {
            clearInterval(timerRef.current);
            if (onComplete) onComplete();
          }
        }
      }, 100); // Usar intervalo menor para mais precisão visual
    } else {
      clearInterval(timerRef.current);
    }
  
    return () => clearInterval(timerRef.current);
  }, [isActive, isStopwatch, exerciseDuration, restDuration, mode, onComplete, isMuted]);
  
  // Função para iniciar o timer (sempre com contagem regressiva para exercícios)
  const startTimer = () => {
    // Resetar referências de controle de som
    finalTickPlayedRef.current = false;
    lastTickRef.current = -1;
    
    // Para exercício, fazer contagem regressiva antes de iniciar
    if (mode === 'exercise') {
      setShowCountdown(true);
      setCountdownValue(3);
      
      // Tocar som imediatamente para o valor 3
      if (!isMuted) {
        playSoundUtil('countdown');
      }
      
      // Esconder o relógio normal durante o countdown para evitar sobreposição
      setTimeLeft(0); // Reset para zero para garantir que comece do zero após o countdown
      
      countdownRef.current = setInterval(() => {
        setCountdownValue(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            setShowCountdown(false);
            
            // Inicializar timestamps apenas APÓS o countdown
            const now = Date.now();
            startTimeRef.current = now; // Iniciar a contagem do zero após o countdown
            if (!isStopwatch) {
              endTimeRef.current = now + (exerciseDuration * 1000);
            }
            
            setIsActive(true);
            return 3;
          }
          
          // Decrementar primeiro
          const newValue = prev - 1;
          
          // Tocar som para o próximo valor
          if (!isMuted) {
            playSoundUtil('countdown');
          }
          
          return newValue;
        });
      }, 1000);
    } else {
      // Para descanso, iniciar imediatamente
      const now = Date.now();
      startTimeRef.current = now;
      endTimeRef.current = now + (restDuration * 1000);
      setIsActive(true);
    }
  };

  // Pausar/retomar o timer
  const toggleTimer = () => {
    if (!isActive) {
      // RETOMAR o timer após pausa
      const now = Date.now();
      
      if (isStopwatch) {
        // Se temos o tempo exato quando foi pausado e o tempo decorrido até então
        if (pausedTimeElapsedRef.current !== null) {
          // Ajustar o startTime para manter a contagem consistente
          startTimeRef.current = now - (pausedTimeElapsedRef.current * 1000);
          setTimeLeft(pausedTimeElapsedRef.current);
        } else {
          // Fallback - usamos o timeLeft atual
          startTimeRef.current = now - (timeLeft * 1000);
        }
      } else {
        // Para contagem regressiva
        endTimeRef.current = now + (timeLeft * 1000);
      }
      
      setIsActive(true);
      pausedAtRef.current = null;
      pausedTimeElapsedRef.current = null;
    } else {
      // PAUSAR o timer - registrar quando foi pausado e o tempo decorrido
      pausedAtRef.current = Date.now();
      pausedTimeElapsedRef.current = timeLeft;
      setIsActive(false);
    }
  };

  // Resetar o timer
  const resetTimer = () => {
    clearInterval(timerRef.current);
    clearInterval(countdownRef.current);
    
    setShowCountdown(false);
    
    if (mode === 'exercise') {
      setTimeLeft(0);
    } else {
      setTimeLeft(restDuration);
    }
    
    setProgress(100);
    setIsActive(false);
    finalTickPlayedRef.current = false;
    lastTickRef.current = -1;
    pausedAtRef.current = null;
    pausedTimeElapsedRef.current = null;
  };

  // Pular para descanso (apenas para modo de exercício)
  const completeExercise = () => {
    if (mode === 'exercise' && onComplete) {
      clearInterval(timerRef.current);
      clearInterval(countdownRef.current);
      setShowCountdown(false);
      onComplete();
    }
  };
  
  // Iniciar próxima série (com flag para auto-iniciar)
  const startNextSeries = () => {
    setAutoStartNext(true);
    if (onComplete) onComplete();
  };
  
  // Ativar/desativar o som
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Formatar o tempo para exibição (incluindo valores negativos para descanso)
  const formatTime = (seconds) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    return isNegative ? `-${formattedTime}` : formattedTime;
  };

  // Cores baseadas no modo
  const bgColor = mode === 'exercise' 
    ? 'from-blue-500 to-indigo-600' 
    : mode === 'rest'
      ? 'from-green-500 to-teal-600'
      : 'from-amber-500 to-orange-600';
  
  // Cores do texto
  const getTextColor = () => {
    if (mode === 'rest' && timeLeft < 0) {
      return 'text-red-600 dark:text-red-400';
    }
    
    if (mode === 'exercise') {
      return 'text-blue-600 dark:text-blue-400';
    } else if (mode === 'rest') {
      return 'text-green-600 dark:text-green-400';
    } else {
      return 'text-orange-600 dark:text-orange-400';
    }
  };
  
  const textColor = getTextColor();
  const pulseAnimation = (mode === 'rest' && timeLeft <= 3) || (mode === 'rest' && timeLeft < 0) ? 'animate-pulse' : '';

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
            {mode === 'rest' && timeLeft < 0 && (
              <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                Tempo extra: {formatTime(timeLeft).substring(1)}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="relative w-64 h-64 mx-auto">
          {/* Contagem regressiva (sobreposta ao timer) */}
          {showCountdown && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900 bg-opacity-70 rounded-full">
              <motion.div
                key="countdown"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-6xl font-bold text-white"
              >
                {countdownValue}
              </motion.div>
            </div>
          )}
          
          {/* Círculo de progresso para contagens regressivas */}
          {!isStopwatch && (
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
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
                stroke={mode === 'exercise' ? '#4f46e5' : mode === 'rest' ? (timeLeft < 0 ? '#ef4444' : '#14b8a6') : '#f59e0b'} 
                strokeWidth="10" 
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress) / 100}
                transform="rotate(-90 50 50)"
                className={pulseAnimation}
              />
            </svg>
          )}
          
          {/* Cronômetro simples para modo de exercício */}
          {isStopwatch && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-52 h-52 rounded-full border-8 border-blue-500 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${textColor}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Cronômetro
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tempo restante/decorrido - só exibir quando não estiver no countdown */}
          {!isStopwatch && !showCountdown && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-4xl font-bold ${textColor} ${pulseAnimation}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
            
          {/* Controles do timer - mostrar apenas para modo de exercício e não durante countdown */}
          {showControls && mode === 'exercise' && !showCountdown && (
            <div className="absolute bottom-4 flex space-x-4 justify-center w-full">
              {!isActive ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={pausedTimeElapsedRef.current !== null ? toggleTimer : startTimer}
                  className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg text-green-500"
                  title={pausedTimeElapsedRef.current !== null ? "Continuar timer" : "Iniciar timer com contagem"}
                >
                  <PlayIcon className="h-6 w-6" />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleTimer}
                  className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg text-red-500"
                  title="Pausar timer"
                >
                  <PauseIcon className="h-6 w-6" />
                </motion.button>
              )}
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={resetTimer}
                className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg text-gray-700 dark:text-gray-300"
                title="Zerar timer"
              >
                <ArrowPathIcon className="h-6 w-6" />
              </motion.button>
              
              {mode === 'exercise' && isActive && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={completeExercise}
                  className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg text-green-500"
                  title="Completar exercício"
                >
                  <CheckIcon className="h-6 w-6" />
                </motion.button>
              )}
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg text-gray-700 dark:text-gray-300"
                title={isMuted ? "Ativar som" : "Desativar som"}
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

        {/* Botões de ação abaixo do timer */}
        <div className="mt-6 flex flex-col space-y-4">
          {/* Botão para completar exercício */}
          {mode === 'exercise' && !showCountdown && (
            <button
              onClick={completeExercise}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center justify-center"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Completar Exercício
            </button>
          )}
          
          {/* Botão para iniciar próxima série durante descanso (sempre visível) */}
          {mode === 'rest' && (
            <button
              onClick={startNextSeries}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Iniciar Próxima Série
            </button>
          )}
          
          {/* Botão para iniciar o timer */}
          {mode === 'exercise' && !isActive && !showCountdown && (
            <button
              onClick={pausedTimeElapsedRef.current !== null ? toggleTimer : startTimer}
              className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg flex items-center justify-center"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {pausedTimeElapsedRef.current !== null ? "Continuar Timer" : "Iniciar Timer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutTimer;