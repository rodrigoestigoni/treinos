import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/common/NavBar';
import { FireIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const Progress = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { token } = useAuth();
  const { errorToast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // API base URL
  const apiBaseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:8550/api/v1' 
    : '/api/v1';
  
  // Estado para armazenar dados de progresso real
  const [progressData, setProgressData] = useState({
    weeklyWorkouts: [0, 0, 0, 0, 0, 0, 0],
    monthlyWorkouts: [0, 0, 0, 0],
    latestWorkouts: [],
    achievements: [],
    streak: {
      current: 0,
      best: 0
    },
    bodyMeasurements: {
      weight: [],
      dates: []
    }
  });
  
  // Buscar dados reais de progresso
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!token) return;
      
      setLoading(true);
      
      try {
        // Buscar sessões de treino
        const sessionsResponse = await axios.get(`${apiBaseUrl}/workout-sessions/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Buscar conquistas
        const achievementsResponse = await axios.get(`${apiBaseUrl}/achievements/my_achievements/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Buscar medidas corporais
        const measurementsResponse = await axios.get(`${apiBaseUrl}/body-measurements/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Buscar informações do usuário para streak
        const userResponse = await axios.get(`${apiBaseUrl}/users/me/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Processar dados de sessões de treino para histórico
        const sessions = sessionsResponse.data.results || sessionsResponse.data;
        const latestWorkouts = sessions.map(session => ({
          date: new Date(session.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          name: session.workout_detail?.name || 'Treino',
          duration: session.duration || 0
        }));
        
        // Processar dados de conquistas
        const achievements = (achievementsResponse.data.results || achievementsResponse.data).map(item => ({
          name: item.achievement_detail?.name || 'Conquista',
          date: new Date(item.unlocked_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          description: item.achievement_detail?.description || ''
        }));
        
        // Processar medidas corporais
        const measurements = measurementsResponse.data.results || measurementsResponse.data;
        const weightData = measurements.map(m => m.weight);
        const dateData = measurements.map(m => new Date(m.date).toLocaleDateString('pt-BR', { month: 'short' }));
        
        // Obter estatísticas semanais e mensais
        const weeklyWorkouts = calculateWeeklyWorkouts(sessions);
        const monthlyWorkouts = calculateMonthlyWorkouts(sessions);
        
        // Atualizar estado com dados reais
        setProgressData({
          weeklyWorkouts,
          monthlyWorkouts,
          latestWorkouts,
          achievements,
          streak: {
            current: userResponse.data.streak_count || 0,
            best: userResponse.data.streak_count || 0 // Idealmente você teria um campo para best_streak também
          },
          bodyMeasurements: {
            weight: weightData.length > 0 ? weightData : [0],
            dates: dateData.length > 0 ? dateData : ['Jan']
          }
        });
      } catch (error) {
        console.error('Erro ao buscar dados de progresso:', error);
        errorToast('Erro ao carregar dados de progresso');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProgressData();
  }, [token, apiBaseUrl, errorToast]);
  
  // Funções auxiliares para calcular estatísticas
  const calculateWeeklyWorkouts = (sessions) => {
    // Por padrão, retorna [0,0,0,0,0,0,0] se não houver dados
    if (!sessions || sessions.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    
    const today = new Date();
    const weeklyData = [0, 0, 0, 0, 0, 0, 0];
    
    // Calcular treinos por dia da semana (0 = Domingo, 1 = Segunda, etc.)
    sessions.forEach(session => {
      const sessionDate = new Date(session.start_time);
      // Se a sessão for dos últimos 7 dias
      if ((today - sessionDate) / (1000 * 60 * 60 * 24) <= 7) {
        const dayOfWeek = sessionDate.getDay();
        weeklyData[dayOfWeek]++;
      }
    });
    
    return weeklyData;
  };
  
  const calculateMonthlyWorkouts = (sessions) => {
    // Por padrão, retorna [0,0,0,0] se não houver dados
    if (!sessions || sessions.length === 0) return [0, 0, 0, 0];
    
    const monthlyData = [0, 0, 0, 0];
    const today = new Date();
    const currentMonth = today.getMonth();
    
    // Calcular treinos dos últimos 4 meses
    sessions.forEach(session => {
      const sessionDate = new Date(session.start_time);
      const sessionMonth = sessionDate.getMonth();
      const monthDiff = (currentMonth - sessionMonth + 12) % 12;
      
      if (monthDiff < 4) {
        monthlyData[monthDiff]++;
      }
    });
    
    return monthlyData.reverse(); // Reverter para mostrar do mais antigo para o mais recente
  };
  
  // Função para renderizar o gráfico de barras
  const renderBarChart = (data, labels, title) => (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
      <div className="h-48 flex items-end space-x-2">
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-primary-600 rounded-t" 
              style={{ height: `${value === 0 ? 0 : Math.max((value / Math.max(...data, 1)) * 100, 5)}%` }}
            ></div>
            <span className="text-xs mt-1">{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
  
  if (loading) {
    return (
      <>
        <NavBar />
        <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
          <h1 className="text-2xl font-bold mb-6">Meu Progresso</h1>
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
                    <p className="text-2xl font-bold">{progressData.weeklyWorkouts.reduce((a, b) => a + b, 0)} treinos</p>
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
                    <p className="text-2xl font-bold">{progressData.monthlyWorkouts[3] || 0} treinos</p>
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
                  ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                  'Últimos 7 dias'
                )}
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-2">Treinos por Mês</h2>
                {renderBarChart(
                  progressData.monthlyWorkouts,
                  ['Há 3 meses', 'Há 2 meses', 'Mês passado', 'Este mês'],
                  'Últimos 4 meses'
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Treinos Recentes</h2>
              {progressData.latestWorkouts.length > 0 ? (
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
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Ver todos os treinos
                  </button>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Você ainda não registrou nenhum treino. Comece a treinar para ver seu progresso!
                </p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Histórico de Treinos</h2>
            {progressData.latestWorkouts.length > 0 ? (
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
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Você ainda não registrou nenhum treino. Comece a treinar para ver seu histórico!
              </p>
            )}
          </div>
        )}
        
        {activeTab === 'achievements' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Conquistas Desbloqueadas</h2>
            {progressData.achievements.length > 0 ? (
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
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Você ainda não desbloqueou nenhuma conquista. Continue treinando para ganhar conquistas!
              </p>
            )}
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
            
            {progressData.bodyMeasurements.weight.length > 0 ? (
              <>
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-2">Peso (kg)</h3>
                  <div className="h-48 flex items-end space-x-2">
                    {progressData.bodyMeasurements.weight.map((weight, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-green-600 rounded-t" 
                          style={{ height: `${(weight / Math.max(...progressData.bodyMeasurements.weight, 1)) * 100}%` }}
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
              </>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Você ainda não registrou nenhuma medida corporal. Adicione suas medidas para acompanhar seu progresso!
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Progress;

// Componentes de ícones
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