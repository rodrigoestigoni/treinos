import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar from '../components/common/NavBar';
import { CheckCircleIcon, ClockIcon, HomeIcon } from '@heroicons/react/24/outline';

const WorkoutSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { workoutId, exerciseProgress } = location.state || {};
  
  // Dados simulados para o resumo - em um app real, estes dados viriam do backend
  const summaryData = {
    workoutName: "Treino Completo",
    duration: 42,
    xpGained: 120,
    exercises: [
      { name: "Flexão tradicional", completed: "4/4 séries", reps: "15, 18, 17, 15" },
      { name: "Flexão diamante", completed: "4/4 séries", reps: "12, 13, 12, 10" },
      { name: "Dips na barra paralela", completed: "4/4 séries", reps: "10, 10, 8, 8" },
      { name: "Archer push-ups", completed: "3/3 séries", reps: "10, 10, 8 por lado" },
      { name: "Pike push-ups", completed: "3/3 séries", reps: "12, 12, 10" },
      { name: "Elevação lateral", completed: "3/3 séries", reps: "15, 15, 15" }
    ],
    achievements: [
      { name: "Consistência de Ferro", description: "Complete 7 dias consecutivos de treino", xp: 50 }
    ]
  };
  
  if (!workoutId && !location.state) {
    return (
      <>
        <NavBar />
        <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
          <div className="text-center py-10">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Nenhum resumo de treino disponível.
            </p>
            <button
              onClick={() => navigate('/workouts')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
            >
              Voltar para treinos
            </button>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <CheckCircleIcon className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold">Treino Concluído!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Parabéns por completar o treino "{summaryData.workoutName}"
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Resumo</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="flex items-center text-gray-700 dark:text-gray-300">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Duração
                </span>
                <span className="font-semibold">{summaryData.duration} minutos</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-700 dark:text-gray-300">Séries completadas</span>
                <span className="font-semibold">21/21</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-700 dark:text-gray-300">XP ganho</span>
                <span className="font-semibold text-primary-600">+{summaryData.xpGained} XP</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Conquistas Desbloqueadas</h2>
            {summaryData.achievements.length > 0 ? (
              <div className="space-y-4">
                {summaryData.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-amber-100 p-2 rounded-full mr-3">
                      <TrophyIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{achievement.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </p>
                      <p className="text-sm text-primary-600 mt-1">
                        +{achievement.xp} XP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Continue treinando para desbloquear conquistas!
              </p>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Detalhes dos Exercícios</h2>
          <div className="space-y-4">
            {summaryData.exercises.map((exercise, index) => (
              <div key={index} className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">{exercise.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Repetições: {exercise.reps}
                  </p>
                </div>
                <span className="text-green-600">{exercise.completed}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 rounded-lg flex items-center justify-center"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Ir para o início
          </button>
          <button
            onClick={() => navigate('/workouts')}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg"
          >
            Ver todos os treinos
          </button>
        </div>
      </div>
    </>
  );
};

export default WorkoutSummary;

// Componente TrophyIcon (como não importamos de Heroicons)
function TrophyIcon(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={1.5} 
      stroke="currentColor" 
      {...props}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" 
      />
    </svg>
  );
}