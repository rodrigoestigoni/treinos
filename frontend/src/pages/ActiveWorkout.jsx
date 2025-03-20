// src/pages/ActiveWorkout.jsx - Página de treino ativo
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon 
} from '@heroicons/react/24/solid';
import WorkoutTimer from '../components/timer/WorkoutTimer';
import { useWorkout } from '../contexts/WorkoutContext';

const ActiveWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { getWorkoutById, completeWorkout, updateExerciseProgress } = useWorkout();
  
  const [workout, setWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [exerciseProgress, setExerciseProgress] = useState({});
  
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const data = await getWorkoutById(workoutId);
        setWorkout(data);
        
        // Inicializar o progresso de cada exercício
        const progress = {};
        data.exercises.forEach(exercise => {
          progress[exercise.id] = {
            sets: Array(exercise.sets).fill({
              completed: false,
              actualReps: 0
            })
          };
        });
        setExerciseProgress(progress);
      } catch (error) {
        console.error('Erro ao carregar treino:', error);
      }
    };
    
    loadWorkout();
  }, [workoutId, getWorkoutById]);
  
  if (!workout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  const currentExercise = workout.exercises[currentExerciseIndex];
  const totalSets = currentExercise.sets;
  const currentSet = currentSetIndex + 1;
  const isLastSet = currentSet === totalSets;
  const isLastExercise = currentExerciseIndex === workout.exercises.length - 1;
  
  const handleExerciseComplete = () => {
    setIsResting(true);
  };
  
  const handleRestComplete = () => {
    setIsResting(false);
    
    // Atualizar progresso da série atual
    const updatedProgress = { ...exerciseProgress };
    updatedProgress[currentExercise.id].sets[currentSetIndex] = {
      completed: true,
      actualReps: currentExercise.targetReps, // Valor padrão, pode ser ajustado pelo usuário
    };
    setExerciseProgress(updatedProgress);
    
    // Salvar progresso desta série
    updateExerciseProgress(
      workoutId, 
      currentExercise.id, 
      currentSetIndex, 
      currentExercise.targetReps
    );
    
    // Verificar se deve avançar para próxima série ou próximo exercício
    if (isLastSet) {
      if (isLastExercise) {
        // Treino completo
        setShowCompletionDialog(true);
      } else {
        // Próximo exercício
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSetIndex(0);
      }
    } else {
      // Próxima série do mesmo exercício
      setCurrentSetIndex(prev => prev + 1);
    }
  };
  
  const handleCompletionConfirm = () => {
    completeWorkout(workoutId, exerciseProgress);
    navigate('/workouts/summary', { 
      state: { workoutId, exerciseProgress } 
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
      {/* Cabeçalho */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/workouts')}
          className="flex items-center text-primary-600 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Voltar aos treinos
        </button>
        <h1 className="text-2xl font-bold">{workout.name}</h1>
        <div className="mt-2 flex items-center">
          <div className="bg-gray-200 dark:bg-gray-700 h-2 flex-grow rounded-full overflow-hidden">
            <div 
              className="bg-primary-600 h-full rounded-full" 
              style={{ 
                width: `${(((currentExerciseIndex * totalSets) + currentSetIndex) / 
                        (workout.exercises.length * totalSets)) * 100}%` 
              }}
            ></div>
          </div>
          <span className="ml-3 text-sm">
            {currentExerciseIndex + 1}/{workout.exercises.length}
          </span>
        </div>
      </div>
      
      {/* Exercício atual */}
      <motion.div
        key={`${currentExerciseIndex}-${currentSetIndex}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">{currentExercise.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {currentExercise.targetReps} repetições {isLastSet ? '(última série)' : ''}
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-primary-600">
              Série {currentSet}/{totalSets}
            </span>
          </div>
        </div>
        
        {currentExercise.instructions && (
          <div className="mb-6 text-gray-700 dark:text-gray-300">
            <h3 className="font-medium mb-2">Instruções:</h3>
            <p>{currentExercise.instructions}</p>
          </div>
        )}
        
        {!isResting ? (
          <div>
            <WorkoutTimer 
              exerciseDuration={currentExercise.duration || 0} 
              restDuration={currentExercise.restDuration || 60}
              onComplete={handleExerciseComplete}
            />
            
            <div className="mt-6">
              <button
                onClick={handleExerciseComplete}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center justify-center"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Completar série
              </button>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repetições realizadas
                </label>
                <input
                  type="number"
                  min="0"
                  value={currentExercise.targetReps}
                  onChange={(e) => {
                    const updatedProgress = { ...exerciseProgress };
                    updatedProgress[currentExercise.id].sets[currentSetIndex].actualReps = 
                      parseInt(e.target.value) || 0;
                    setExerciseProgress(updatedProgress);
                  }}
                  className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-green-600">Descanse</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Prepare-se para {isLastSet && !isLastExercise ? 'o próximo exercício' : 'a próxima série'}
              </p>
            </div>
            
            <WorkoutTimer 
              mode="rest"
              exerciseDuration={0}
              restDuration={currentExercise.restDuration || 60}
              onComplete={handleRestComplete}
            />
            
            <div className="mt-6">
              <button
                onClick={handleRestComplete}
                className="w-full py-3 px-4 bg-secondary-600 hover:bg-secondary-700 text-white font-medium rounded-lg flex items-center justify-center"
              >
                <ArrowRightIcon className="h-5 w-5 mr-2" />
                {isLastSet && !isLastExercise 
                  ? 'Próximo exercício' 
                  : isLastSet && isLastExercise 
                    ? 'Finalizar treino' 
                    : 'Próxima série'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
      
      {/* Próximos exercícios */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Próximos exercícios</h3>
        <div className="space-y-3">
          {workout.exercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 4).map((exercise, idx) => (
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
                <h4 className="font-medium">{exercise.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {exercise.sets} x {exercise.targetReps} repetições
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Modal de conclusão do treino */}
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
              <h3 className="font-medium mb-2">Sua performance:</h3>
              <div className="space-y-2">
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
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleCompletionConfirm}
                className="py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
              >
                Ver resumo completo
              </button>
              <button
                onClick={() => navigate('/workouts')}
                className="py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg"
              >
                Voltar aos treinos
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ActiveWorkout;