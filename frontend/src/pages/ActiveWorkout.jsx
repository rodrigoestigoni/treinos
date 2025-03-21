import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ArrowLeftIcon, 
  XMarkIcon,
  FireIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/solid';
import WorkoutTimer from '../components/timer/WorkoutTimer';
import { useWorkout } from '../contexts/WorkoutContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/common/NavBar';
import { loadSounds, playSound, toggleSoundEnabled, isSoundEnabled, workoutComplete } from '../utils/sounds';

const ActiveWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { getWorkoutById, startWorkout, completeWorkout, recordExerciseSet } = useWorkout();
  const { errorToast, successToast } = useToast();
  const { user } = useAuth();
  
  const [workout, setWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExerciseInstructions, setShowExerciseInstructions] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [weights, setWeights] = useState({});
  const [previousWorkoutData, setPreviousWorkoutData] = useState(null);
  
  // References for tracking initialization
  const sessionInitiatedRef = useRef(false);
  const workoutLoadedRef = useRef(false);
  
  // Vibration patterns
  const vibrationPatterns = {
    exerciseComplete: [200, 100, 200],
    restComplete: [100, 50, 100, 50, 300],
    countdown: [100],
    workoutComplete: [300, 100, 300, 100, 500]
  };
  
  // Timer for tracking total workout time
  useEffect(() => {
    if (!workoutStartTime) {
      setWorkoutStartTime(new Date());
    }
    
    const timer = setInterval(() => {
      if (workoutStartTime) {
        const elapsed = Math.floor((new Date() - workoutStartTime) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [workoutStartTime]);
  
  // Initialize sounds
  useEffect(() => {
    // Carrega sons apenas uma vez
    loadSounds();
  }, []);
  
  // Format elapsed time
  const formatElapsedTime = () => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Load workout details
  useEffect(() => {
    // Evitar carregar várias vezes
    if (workoutLoadedRef.current) return;
    
    workoutLoadedRef.current = true;
    
    const loadWorkoutDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch workout details
        const data = await getWorkoutById(workoutId);
        if (data) {
          setWorkout(data);
          
          // Initialize exercise progress
          const progress = {};
          data.workout_exercises.forEach(exercise => {
            progress[exercise.exercise_detail.id] = {
              sets: Array(exercise.sets).fill({
                completed: false,
                actualReps: exercise.target_reps,
                weight: 0
              })
            };
          });
          setExerciseProgress(progress);
        }
      } catch (error) {
        console.error('Error loading workout:', error);
        errorToast('Erro ao carregar treino');
      } finally {
        setLoading(false);
      }
    };
    
    loadWorkoutDetails();
  }, [workoutId, getWorkoutById, errorToast]);
  
  // Separate useEffect for starting the session - only after workout is loaded
  useEffect(() => {
    // Só executa quando o workout foi carregado e ainda não temos uma sessão
    if (!workout || sessionId || sessionInitiatedRef.current) return;
    
    // Marca que já tentou iniciar
    sessionInitiatedRef.current = true;
    
    const startSession = async () => {
      try {
        const session = await startWorkout(workoutId);
        if (session && session.id) {
          setSessionId(session.id);
        }
      } catch (error) {
        console.error('Error starting workout session:', error);
        errorToast('Erro ao iniciar sessão de treino');
      }
    };
    
    startSession();
  }, [workout, sessionId, workoutId, startWorkout, errorToast]);
  
  // Handle beforeunload event to warn user if they try to navigate away
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Seu treino está em andamento. Tem certeza que deseja sair?';
      return e.returnValue;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Vibrate with pattern
  const vibrate = (pattern) => {
    if (!navigator.vibrate) return;
    navigator.vibrate(pattern);
  };
  
  // Toggle sound on/off
  const toggleSound = () => {
    const enabled = toggleSoundEnabled();
    setSoundEnabled(enabled);
  };
  
  if (loading || !workout) {
    return (
      <>
        <NavBar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }
  
  const currentExercise = workout.workout_exercises[currentExerciseIndex];
  const totalSets = currentExercise.sets;
  const currentSet = currentSetIndex + 1;
  const isLastSet = currentSet === totalSets;
  const isLastExercise = currentExerciseIndex === workout.workout_exercises.length - 1;
  
  // Get previous workout data for current exercise and set
  const getPreviousSetData = () => {
    if (!previousWorkoutData) return null;
    
    const exerciseId = currentExercise.exercise_detail.id;
    if (!previousWorkoutData.exercises[exerciseId]) return null;
    
    // Get data for current set or the last set if current set index is out of bounds
    const prevSetIndex = Math.min(currentSetIndex, previousWorkoutData.exercises[exerciseId].sets.length - 1);
    return previousWorkoutData.exercises[exerciseId].sets[prevSetIndex];
  };
  
  const previousSetData = getPreviousSetData();
  
  const handleExerciseComplete = () => {
    // Play sound and vibrate
    playSound('exerciseComplete');
    vibrate(vibrationPatterns.exerciseComplete);
    
    setIsResting(true);
  };
  
  const handleRestComplete = () => {
    // Play sound and vibrate
    playSound('restComplete');
    vibrate(vibrationPatterns.restComplete);
    
    setIsResting(false);
    
    // Update progress for this set
    const updatedProgress = { ...exerciseProgress };
    updatedProgress[currentExercise.exercise_detail.id].sets[currentSetIndex] = {
      completed: true,
      actualReps: updatedProgress[currentExercise.exercise_detail.id].sets[currentSetIndex].actualReps,
      weight: weights[currentExercise.exercise_detail.id] || 0
    };
    setExerciseProgress(updatedProgress);
    
    // Save progress to API
    if (sessionId) {
      recordExerciseSet(
        sessionId, 
        currentExercise.exercise_detail.id, 
        currentSetIndex + 1, // API expects 1-indexed set numbers
        updatedProgress[currentExercise.exercise_detail.id].sets[currentSetIndex].actualReps,
        weights[currentExercise.exercise_detail.id]
      );
    }
    
    // Show success toast
    successToast(`Série ${currentSet} concluída!`);
    
    // Check if we should move to next set or exercise
    if (isLastSet) {
      if (isLastExercise) {
        // Workout complete
        playSound('workoutComplete');
        vibrate(vibrationPatterns.workoutComplete);
        setShowCompletionDialog(true);
      } else {
        // Next exercise
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSetIndex(0);
      }
    } else {
      // Next set of same exercise
      setCurrentSetIndex(prev => prev + 1);
    }
  };
  
  const handleUpdateReps = (exercise, setIndex, newValue) => {
    const updatedProgress = { ...exerciseProgress };
    updatedProgress[exercise.exercise_detail.id].sets[setIndex] = {
      ...updatedProgress[exercise.exercise_detail.id].sets[setIndex],
      actualReps: newValue
    };
    setExerciseProgress(updatedProgress);
  };
  
  const handleUpdateWeight = (exerciseId, newValue) => {
    setWeights({
      ...weights,
      [exerciseId]: newValue
    });
  };
  
  const handleCompletionConfirm = async () => {
    try {
      if (sessionId) {
        await completeWorkout(sessionId);
      }
      
      // Navigate to summary
      navigate('/workouts/summary', { 
        state: { 
          workoutId,
          exerciseProgress,
          duration: elapsedTime,
          name: workout.name
        } 
      });
    } catch (error) {
      console.error('Error completing workout:', error);
      errorToast('Erro ao finalizar treino');
    }
  };
  
  const handleExitWorkout = () => {
    setShowExitConfirm(true);
  };
  
  const confirmExit = () => {
    navigate('/workouts');
  };
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={handleExitWorkout}
                className="mr-3 text-gray-600 dark:text-gray-300 hover:text-primary-600"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold">{workout.name}</h1>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>Tempo: {formatElapsedTime()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleSound}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {soundEnabled ? (
                  <SpeakerWaveIcon className="h-5 w-5" />
                ) : (
                  <SpeakerXMarkIcon className="h-5 w-5" />
                )}
              </button>
              
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
                {currentExerciseIndex + 1}/{workout.workout_exercises.length}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-1 bg-gray-200 dark:bg-gray-700">
            <div 
              className="h-full bg-primary-600"
              style={{ 
                width: `${(((currentExerciseIndex * totalSets) + currentSetIndex) / 
                      (workout.workout_exercises.reduce((total, ex) => total + ex.sets, 0))) * 100}%` 
              }}
            ></div>
          </div>
        </div>
        
        <div className="pt-16 pb-20">
          {/* Main content */}
          <div className="max-w-3xl mx-auto px-4 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentExerciseIndex}-${currentSetIndex}-${isResting}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">{currentExercise.exercise_detail?.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isResting ? 'Descansando' : `Série ${currentSet} de ${totalSets}`}
                    </p>
                    
                    {!isResting && previousSetData && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Último treino: {previousSetData.reps} repetições 
                        {previousSetData.weight > 0 ? ` com ${previousSetData.weight}kg` : ''}</span>
                      </div>
                    )}
                  </div>
                  
                  {!isResting && (
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowExerciseInstructions(!showExerciseInstructions)}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
                      >
                        {showExerciseInstructions ? 'Ocultar' : 'Ver'} instruções
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Instructions accordion */}
                <AnimatePresence>
                  {showExerciseInstructions && !isResting && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6 overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                        <p className="text-gray-700 dark:text-gray-300">{currentExercise.exercise_detail.instructions}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Timer component */}
                <WorkoutTimer 
                  exerciseName={currentExercise.exercise_detail?.name}
                  setNumber={currentSet}
                  totalSets={totalSets}
                  mode={isResting ? 'rest' : 'exercise'}
                  exerciseDuration={0}
                  restDuration={currentExercise.rest_duration || 60}
                  onComplete={isResting ? handleRestComplete : handleExerciseComplete}
                  playSound={soundEnabled}
                />
                
                {!isResting && (
                  <div className="mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Repetições</h3>
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleUpdateReps(
                              currentExercise, 
                              currentSetIndex, 
                              Math.max(0, exerciseProgress[currentExercise.exercise_detail.id].sets[currentSetIndex].actualReps - 1)
                            )}
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <ArrowDownIcon className="h-5 w-5" />
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            value={exerciseProgress[currentExercise.exercise_detail.id].sets[currentSetIndex].actualReps}
                            onChange={(e) => handleUpdateReps(
                              currentExercise, 
                              currentSetIndex, 
                              parseInt(e.target.value) || 0
                            )}
                            className="w-20 mx-4 text-center text-3xl font-bold p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          
                          <button
                            onClick={() => handleUpdateReps(
                              currentExercise, 
                              currentSetIndex, 
                              exerciseProgress[currentExercise.exercise_detail.id].sets[currentSetIndex].actualReps + 1
                            )}
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <ArrowUpIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Peso (kg)</h3>
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleUpdateWeight(
                              currentExercise.exercise_detail.id, 
                              Math.max(0, (weights[currentExercise.exercise_detail.id] || 0) - 2.5)
                            )}
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <ArrowDownIcon className="h-5 w-5" />
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            step="2.5"
                            value={weights[currentExercise.exercise_detail.id] || 0}
                            onChange={(e) => handleUpdateWeight(
                              currentExercise.exercise_detail.id, 
                              parseFloat(e.target.value) || 0
                            )}
                            className="w-20 mx-4 text-center text-3xl font-bold p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          
                          <button
                            onClick={() => handleUpdateWeight(
                              currentExercise.exercise_detail.id, 
                              (weights[currentExercise.exercise_detail.id] || 0) + 2.5
                            )}
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <ArrowUpIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleExerciseComplete}
                      className="w-full mt-6 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center justify-center"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Completar série
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            {/* Next exercises */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Próximos exercícios</h3>
              <div className="space-y-3">
                {workout.workout_exercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 4).map((exercise, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm"
                  >
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      <span className="text-sm font-medium">
                        {currentExerciseIndex + idx + 2}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{exercise.exercise_detail?.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {exercise.sets} x {exercise.target_reps} repetições
                      </p>
                    </div>
                  </div>
                ))}
                
                {workout.workout_exercises.slice(currentExerciseIndex + 1).length === 0 && (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-3">
                    Este é o último exercício do treino!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Confirmation Dialog - Completion */}
        {showCompletionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <CheckCircleIcon className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold">Treino Concluído!</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Parabéns! Você completou "{workout.name}" com sucesso.
                </p>
              </div>
              
              <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tempo total:</span>
                    <span className="font-semibold">{formatElapsedTime()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exercícios concluídos:</span>
                    <span className="font-semibold">{workout.workout_exercises.length}/{workout.workout_exercises.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>XP ganho:</span>
                    <span className="font-semibold text-primary-600">+120 XP</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/workouts')}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg"
                >
                  Voltar aos treinos
                </button>
                <button
                  onClick={handleCompletionConfirm}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
                >
                  Ver resumo completo
                </button>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Confirmation Dialog - Exit */}
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                  <FireIcon className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold">Sair do treino?</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Seu progresso neste treino será perdido. Tem certeza que deseja sair?
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg"
                >
                  Continuar treino
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
                >
                  Sair mesmo assim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default ActiveWorkout;