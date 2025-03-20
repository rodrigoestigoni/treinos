import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/common/NavBar';
import { useWorkout } from '../contexts/WorkoutContext';
import { ClockIcon, PlayIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const Workouts = () => {
  const { workouts, fetchWorkouts, deleteWorkout, loading } = useWorkout();
  const [activeTab, setActiveTab] = useState('myWorkouts');
  
  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);
  
  const myWorkouts = workouts.filter(workout => !workout.is_template);
  const templateWorkouts = workouts.filter(workout => workout.is_template);
  
  const handleDeleteWorkout = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Tem certeza que deseja excluir este treino?')) {
      await deleteWorkout(id);
    }
  };
  
  const renderWorkoutCard = (workout) => (
    <Link
      to={`/workouts/${workout.id}`}
      key={workout.id}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{workout.name}</h3>
        <div className="flex">
          {!workout.is_template && (
            <>
              <Link
                to={`/workouts/edit/${workout.id}`}
                className="text-gray-500 hover:text-primary-600 p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <PencilSquareIcon className="h-5 w-5" />
              </Link>
              <button
                onClick={(e) => handleDeleteWorkout(workout.id, e)}
                className="text-gray-500 hover:text-red-600 p-1"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
        {workout.description}
      </p>
      
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        <ClockIcon className="h-4 w-4 mr-1" />
        <span>{workout.estimated_duration} min</span>
        <span className="mx-2">•</span>
        <span>{workout.exercises?.length || 0} exercícios</span>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="flex flex-wrap gap-1">
          <span className={`px-2 py-1 text-xs rounded-full ${
            workout.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : 
            workout.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {workout.difficulty === 'beginner' ? 'Iniciante' : 
             workout.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
          </span>
        </div>
        
        <Link
          to={`/workouts/active/${workout.id}`}
          className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          <PlayIcon className="h-4 w-4 mr-1" />
          Iniciar
        </Link>
      </div>
    </Link>
  );
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Meus Treinos</h1>
          <Link
            to="/workouts/create"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Novo Treino
          </Link>
        </div>
        
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'myWorkouts'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('myWorkouts')}
              >
                Meus Treinos
              </button>
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'templates'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('templates')}
              >
                Templates
              </button>
            </nav>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : activeTab === 'myWorkouts' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myWorkouts.length > 0 ? (
              myWorkouts.map(renderWorkoutCard)
            ) : (
              <div className="col-span-full py-10 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Você ainda não criou nenhum treino.
                </p>
                <Link
                  to="/workouts/create"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Criar meu primeiro treino
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templateWorkouts.length > 0 ? (
              templateWorkouts.map(renderWorkoutCard)
            ) : (
              <div className="col-span-full py-10 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum template disponível no momento.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Workouts;