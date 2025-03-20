import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import NavBar from '../components/common/NavBar';
import { useWorkout } from '../contexts/WorkoutContext';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeftIcon, PlayIcon, ClockIcon } from '@heroicons/react/24/outline';

const WorkoutDetail = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { getWorkoutById, startWorkout, loading: contextLoading } = useWorkout();
  const { errorToast } = useToast();
  const [workout, setWorkout] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  // Usar uma referência para rastrear se já tentamos carregar
  const loadAttemptedRef = useRef(false);
  
  useEffect(() => {
    // Se não temos ID ou já tentamos carregar, não faz nada
    if (!workoutId || loadAttemptedRef.current) {
      return;
    }
    
    // Marcar que já tentamos carregar para evitar ciclos
    loadAttemptedRef.current = true;
    
    const fetchWorkout = async () => {
      try {
        setLocalLoading(true);
        const data = await getWorkoutById(workoutId);
        
        if (data) {
          setWorkout(data);
        } else {
          setLoadError(true);
          errorToast('Não foi possível carregar os detalhes do treino');
        }
      } catch (error) {
        console.error('Erro ao carregar treino:', error);
        setLoadError(true);
        errorToast('Erro ao carregar treino. Tente novamente mais tarde.');
      } finally {
        setLocalLoading(false);
      }
    };
    
    fetchWorkout();
  }, [workoutId, errorToast]); // REMOVIDO getWorkoutById das dependências para evitar loop!
  
  const handleStartWorkout = async () => {
    try {
      const session = await startWorkout(workoutId);
      if (session) {
        navigate(`/workouts/active/${workoutId}`);
      }
    } catch (error) {
      errorToast('Erro ao iniciar treino');
      console.error(error);
    }
  };
  
  if (loadError) {
    return (
      <>
        <NavBar />
        <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Treino não encontrado</h2>
            <p className="mb-4">O treino que você está procurando não existe ou foi removido.</p>
            <Link 
              to="/workouts" 
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Voltar para Treinos
            </Link>
          </div>
        </div>
      </>
    );
  }
  
  // Mostra loading enquanto estiver carregando localmente OU no contexto
  if (localLoading || contextLoading || !workout) {
    return (
      <>
        <NavBar />
        <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <Link to="/workouts" className="inline-flex items-center text-primary-600 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Voltar para treinos
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{workout.name}</h1>
            <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{workout.estimated_duration} minutos</span>
              <span className="mx-2">•</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                workout.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : 
                workout.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
              }`}>
                {workout.difficulty === 'beginner' ? 'Iniciante' : 
                 workout.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleStartWorkout}
            className="mt-4 md:mt-0 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
          >
            <PlayIcon className="h-5 w-5 mr-2" />
            Iniciar Treino
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Descrição</h2>
          <p className="text-gray-700 dark:text-gray-300">{workout.description || "Sem descrição"}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Exercícios</h2>
          
          <div className="space-y-4">
            {workout.workout_exercises && workout.workout_exercises.map((exercise, index) => (
              <div 
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between">
                  <div>
                    <span className="inline-block w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-center leading-8 mr-3">
                      {index + 1}
                    </span>
                    <h3 className="inline-block text-lg font-medium">
                      {exercise.exercise_detail?.name}
                    </h3>
                  </div>
                </div>
                
                <div className="ml-11 mt-2">
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{exercise.sets} séries</span>
                    <span>•</span>
                    <span>{exercise.target_reps} repetições</span>
                    <span>•</span>
                    <span>{exercise.rest_duration}s descanso</span>
                  </div>
                  
                  {exercise.notes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Observações:</span> {exercise.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkoutDetail;