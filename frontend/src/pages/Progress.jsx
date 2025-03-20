import React, { useState } from 'react';
import NavBar from '../components/common/NavBar';
import { FireIcon, CalendarIcon } from '@heroicons/react/24/outline';

const Progress = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dados simulados - em um app real, estes dados viriam do backend
  const progressData = {
    weeklyWorkouts: [3, 4, 5, 4, 5, 3, 4],
    monthlyWorkouts: [12, 15, 18, 16],
    latestWorkouts: [
      { date: '20 Mar', name: 'Treino 1 - Peito e Tríceps', duration: 55 },
      { date: '18 Mar', name: 'Treino 3 - Pernas', duration: 65 },
      { date: '17 Mar', name: 'Treino 2 - Costas e Bíceps', duration: 50 },
      { date: '15 Mar', name: 'Treino 4 - Core', duration: 45 },
      { date: '14 Mar', name: 'Treino 1 - Peito e Tríceps', duration: 60 }
    ],
    achievements: [
      { name: 'Consistência de Ferro', date: '14 Mar', description: '7 dias consecutivos de treino' },
      { name: 'Mestre das Flexões', date: '10 Mar', description: '500 flexões no total' },
      { name: 'Desafio Completado', date: '28 Fev', description: 'Desafio de 30 dias de exercícios' }
    ],
    streak: {
      current: 7,
      best: 14
    },
    bodyMeasurements: {
      weight: [78.5, 77.8, 77.2, 76.9, 76.5, 76.0],
      dates: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    }
  };
  
  // Função para renderizar o gráfico de barras (simplificado)
  const renderBarChart = (data, labels, title) => (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
      <div className="h-48 flex items-end space-x-2">
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-primary-600 rounded-t" 
              style={{ height: `${(value / Math.max(...data)) * 100}%` }}
            ></div>
            <span className="text-xs mt-1">{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <h1 className="text-2xl font-bold mb-6">Meu Progresso</h1>
        
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                Visão Geral
              </button>
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('history')}
              >
                Histórico
              </button>
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'achievements'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('achievements')}
              >
                Conquistas
              </button>
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'measurements'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('measurements')}
              >
                Medidas
              </button>
            </nav>
          </div>
        </div>
        
        {activeTab === 'overview' && (
          <div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 mr-4">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Esta semana</p>
                    <p className="text-2xl font-bold">4 treinos</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mr-4">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Este mês</p>
                    <p className="text-2xl font-bold">16 treinos</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 mr-4">
                    <TrophyIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Conquistas</p>
                    <p className="text-2xl font-bold">{progressData.achievements.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 mr-4">
                    <FireIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Streak atual</p>
                    <p className="text-2xl font-bold">{progressData.streak.current} dias</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-2">Treinos por Semana</h2>
                {renderBarChart(
                  progressData.weeklyWorkouts,
                  ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                  'Últimas 7 semanas'
                )}
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-2">Treinos por Mês</h2>
                {renderBarChart(
                  progressData.monthlyWorkouts,
                  ['Jan', 'Fev', 'Mar', 'Abr'],
                  'Últimos 4 meses'
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Treinos Recentes</h2>
              <div className="space-y-4">
                {progressData.latestWorkouts.slice(0, 3).map((workout, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                    <div className="flex items-center">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                        <span className="text-sm">{workout.date.split(' ')[0]}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{workout.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {workout.duration} minutos
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Ver todos os treinos
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Histórico de Treinos</h2>
            <div className="space-y-4">
              {progressData.latestWorkouts.map((workout, index) => (
                <div key={index} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="flex items-center">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                      <span className="text-sm">{workout.date.split(' ')[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{workout.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {workout.duration} minutos
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-500 hover:text-primary-600">
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'achievements' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Conquistas Desbloqueadas</h2>
            <div className="space-y-6">
              {progressData.achievements.map((achievement, index) => (
                <div key={index} className="flex">
                  <div className="bg-amber-100 p-3 rounded-full mr-4 h-12 w-12 flex items-center justify-center">
                    <TrophyIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-baseline">
                      <h3 className="font-medium text-lg">{achievement.name}</h3>
                      <span className="ml-2 text-xs text-gray-500">{achievement.date}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'measurements' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Medidas Corporais</h2>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Adicionar nova medida
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Peso (kg)</h3>
              <div className="h-48 flex items-end space-x-2">
                {progressData.bodyMeasurements.weight.map((weight, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-green-600 rounded-t" 
                      style={{ height: `${(weight / 80) * 100}%` }}
                    ></div>
                    <span className="text-xs mt-1">{progressData.bodyMeasurements.dates[index]}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-2">Histórico de Peso</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2">Data</th>
                      <th className="text-right py-2">Peso (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressData.bodyMeasurements.weight.map((weight, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-2">{progressData.bodyMeasurements.dates[index]}</td>
                        <td className="text-right py-2">{weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-2">Resumo</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Peso inicial:</span>
                    <span className="font-medium">{progressData.bodyMeasurements.weight[0]} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peso atual:</span>
                    <span className="font-medium">{progressData.bodyMeasurements.weight[progressData.bodyMeasurements.weight.length - 1]} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diferença:</span>
                    <span className="font-medium text-green-600">
                      {(progressData.bodyMeasurements.weight[progressData.bodyMeasurements.weight.length - 1] - progressData.bodyMeasurements.weight[0]).toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Progress;

// Componentes de ícones (já que não estamos importando todos do heroicons)
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

function ChevronRightIcon(props) {
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
        d="M8.25 4.5l7.5 7.5-7.5 7.5" 
      />
    </svg>
  );
}