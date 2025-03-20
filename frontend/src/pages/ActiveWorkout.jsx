// src/pages/ActiveWorkout.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ArrowLeftIcon, 
  XMarkIcon,
  FireIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/solid';
import WorkoutTimer from '../components/timer/WorkoutTimer';
import { useWorkout } from '../contexts/WorkoutContext';
import { useToast } from '../contexts/ToastContext';
import NavBar from '../components/common/NavBar';

const ActiveWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { getWorkoutById, completeWorkout, updateExerciseProgress } = useWorkout();
  const { errorToast, successToast } = useToast();
  
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
  
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        setLoading(true);
        const data = await getWorkoutById(workoutId);
        setWorkout(data);
        
        // Initialize exercise progress
        const progress = {};
        data.exercises.forEach(exercise => {
          progress[exercise.id] = {
            sets: Array(exercise.sets).fill({
              completed: false,
              actualReps: exercise.target_reps
            })
          };
        });
        setExerciseProgress(progress);
      } catch (error) {
        console.error('Error loading workout:', error);
        errorToast('Erro ao carregar treino');
      } finally {
        setLoading(false);
      }
    };
    
    loadWorkout();
  }, [workoutId, getWorkoutById, errorToast]);
  
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
  
  const currentExercise = workout.exercises[currentExerciseIndex];
  const totalSets = currentExercise.sets;
  const currentSet = currentSetIndex + 1;
  const isLastSet = currentSet === totalSets;
  const isLastExercise = currentExerciseIndex === workout.exercises.length - 1;
  
  const handleExerciseComplete = () => {
    // Play success sound
    const audio = new Audio('/exercise-complete.mp3');
    audio.play().catch(e => console.log("Erro ao tocar audio:", e));
    
    setIsResting(true);
  };
  
  const handleRestComplete = () => {
    setIsResting(false);
    
    // Update progress for this set
    const updatedProgress = { ...exerciseProgress };
    updatedProgress[currentExercise.id].sets[currentSetIndex] = {
      completed: true,
      actualReps: updatedProgress[currentExercise.id].sets[currentSetIndex].actualReps
    };
    setExerciseProgress(updatedProgress);
    
    // Save progress to API
    updateExerciseProgress(
      workoutId, 
      currentExercise.id, 
      currentSetIndex + 1, // API expects 1-indexed set numbers
      updatedProgress[currentExercise.id].sets[currentSetIndex].actualReps
    );
    
    // Show success toast
    successToast(`Série ${currentSet} concluída!`);
    
    // Check if we should move to next set or exercise
    if (isLastSet) {
      if (isLastExercise) {
        // Workout complete
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
    updatedProgress[exercise.id].sets[setIndex] = {
      ...updatedProgress[exercise.id].sets[setIndex],
      actualReps: newValue
    };
    setExerciseProgress(updatedProgress);
  };
  
  const handleCompletionConfirm = async () => {
    try {
      await completeWorkout(workoutId);
      
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
            
            <div className="flex items-center space-x-1">
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
                {currentExerciseIndex + 1}/{workout.exercises.length}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-1 bg-gray-200 dark:bg-gray-700">
            <div 
              className="h-full bg-primary-600"
              style={{ 
                width: `${(((currentExerciseIndex * totalSets) + currentSetIndex) / 
                      (workout.exercises.length * totalSets)) * 100}%` 
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
                    <h2 className="text-xl font-semibold">{currentExercise.exercise_detail?.name || currentExercise.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isResting ? 'Descansando' : `Série ${currentSet} de ${totalSets}`}
                    </p>
                  </div>
                  
                  {!isResting && (
                    <div className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">
                      {currentExercise.target_reps} reps
                    </div>
                  )}
                </div>
                
                {/* Timer component */}
                <WorkoutTimer 
                  exerciseName={currentExercise.exercise_detail?.name || currentExercise.name}
                  setNumber={currentSet}
                  totalSets={totalSets}
                  mode={isResting ? 'rest' : 'exercise'}
                  exerciseDuration={0} // Using manual completion mode
                  restDuration={currentExercise.rest_duration || 60}
                  onComplete={isResting ? handleRestComplete : handleExerciseComplete}
                />
                
                {!isResting && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Repetições realizadas</h3>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleUpdateReps(
                          currentExercise, 
                          currentSetIndex, 
                          Math.max(0, exerciseProgress[currentExercise.id].sets[currentSetIndex].actualReps - 1)
                        )}
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <ArrowDownIcon className="h-5 w-5" />
                      </button>
                      
                      <input
                        type="number"
                        min="0"
                        value={exerciseProgress[currentExercise.id].sets[currentSetIndex].actualReps}
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
                          exerciseProgress[currentExercise.id].sets[currentSetIndex].actualReps + 1
                        )}
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <ArrowUpIcon className="h-5 w-5" />
                      </button>
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
                
                {currentExercise.instructions && !isResting && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium mb-2">Instruções:</h3>
                    <p className="text-gray-600 dark:text-gray-400">{currentExercise.instructions}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            {/* Next exercises */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Próximos exercícios</h3>
              <div className="space-y-3">
                {workout.exercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 4).map((exercise, idx) => (
                  <div 
                    key={exercise.id || idx} 
                    className="flex items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm"
                  >
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      <span className="text-sm font-medium">
                        {currentExerciseIndex + idx + 2}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{exercise.exercise_detail?.name || exercise.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {exercise.sets} x {exercise.target_reps} repetições
                      </p>
                    </div>
                  </div>
                ))}
                
                {workout.exercises.slice(currentExerciseIndex + 1).length === 0 && (
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
                    <span className="font-semibold">{workout.exercises.length}/{workout.exercises.length}</span>
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