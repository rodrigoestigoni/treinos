import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/common/NavBar';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ProgressDashboard from '../components/progress/ProgressDashboard';
import { 
  CalendarIcon, 
  CalendarDaysIcon, 
  ChartBarSquareIcon
} from '@heroicons/react/24/outline';

const Progress = () => {
  const [activePeriod, setActivePeriod] = useState('week');
  const [activeSection, setActiveSection] = useState('dashboard');
  const { token, user } = useAuth();
  const { errorToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bodyMeasurements, setBodyMeasurements] = useState([]);
  const [showAddMeasurementForm, setShowAddMeasurementForm] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({
    weight: user?.weight || '',
    body_fat: '',
    chest: '',
    waist: '',
    hips: '',
    biceps: '',
    thighs: '',
    calves: ''
  });
  
  // API base URL
  const apiBaseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:8550/api/v1' 
    : '/api/v1';
  
  // Estado para armazenar dados de progresso
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
  
  // Buscar dados de progresso
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
        
        // Buscar estatísticas do usuário
        const statsResponse = await axios.get(`${apiBaseUrl}/users/stats/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Processar dados de sessões de treino para histórico
        const sessions = sessionsResponse.data.results || sessionsResponse.data;
        const latestWorkouts = sessions.map(session => ({
          id: session.id,
          date: new Date(session.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          name: session.workout_detail?.name || 'Treino',
          duration: session.duration || 0,
          calories: session.calories_burned || 0
        }));
        
        // Processar dados de conquistas
        const achievements = (achievementsResponse.data.results || achievementsResponse.data).map(item => ({
          id: item.id,
          name: item.achievement_detail?.name || 'Conquista',
          description: item.achievement_detail?.description || '',
          date: new Date(item.earned_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          icon: item.achievement_detail?.icon_name || ''
        }));
        
        // Processar medidas corporais
        const measurements = measurementsResponse.data.results || measurementsResponse.data;
        setBodyMeasurements(measurements);
        
        const weightData = measurements.map(m => m.weight);
        const dateData = measurements.map(m => new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
        
        // Obter dados das estatísticas
        const stats = statsResponse.data;
        
        // Atualizar estado com dados reais
        setProgressData({
          weeklyWorkouts: stats.weeklyWorkouts || [0, 0, 0, 0, 0, 0, 0],
          monthlyWorkouts: stats.monthlyWorkouts || [0, 0, 0, 0],
          latestWorkouts,
          achievements,
          streak: {
            current: user?.streak_count || 0,
            best: stats.bestStreak || user?.streak_count || 0
          },
          bodyMeasurements: {
            weight: weightData,
            dates: dateData
          },
          muscleGroupStats: stats.muscleGroupStats || []
        });
      } catch (error) {
        console.error('Erro ao buscar dados de progresso:', error);
        errorToast('Erro ao carregar dados de progresso');
        
        // Dados de fallback para demonstração
        const fallbackData = {
          weeklyWorkouts: [1, 0, 2, 1, 0, 2, 0],
          monthlyWorkouts: [4, 5, 6, 7],
          latestWorkouts: [
            { id: 1, date: '25 mar', name: 'Treino de Peito e Ombros', duration: 3600, calories: 450 },
            { id: 2, date: '23 mar', name: 'Treino de Pernas', duration: 4200, calories: 520 },
            { id: 3, date: '20 mar', name: 'Treino de Costas e Bíceps', duration: 3200, calories: 380 }
          ],
          achievements: [
            { id: 1, name: 'Primeiro Passo', description: 'Complete seu primeiro treino', date: '15 mar', icon: 'first_workout' },
            { id: 2, name: 'Consistência Inicial', description: 'Complete 3 dias consecutivos de treino', date: '18 mar', icon: 'streak_3' }
          ],
          streak: {
            current: user?.streak_count || 3,
            best: 5
          },
          bodyMeasurements: {
            weight: [80.5, 80.2, 79.8, 79.3, 78.9],
            dates: ['1 mar', '8 mar', '15 mar', '22 mar', '29 mar']
          },
          muscleGroupStats: [
            { name: 'Peito', count: 5 },
            { name: 'Costas', count: 4 },
            { name: 'Pernas', count: 3 },
            { name: 'Ombros', count: 3 },
            { name: 'Braços', count: 2 },
            { name: 'Core', count: 2 }
          ]
        };
        
        setProgressData(fallbackData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProgressData();
  }, [token, apiBaseUrl, errorToast, user]);
  
  const handleMeasurementChange = (e) => {
    const { name, value } = e.target;
    setNewMeasurement({
      ...newMeasurement,
      [name]: value
    });
  };
  
  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    
    if (!newMeasurement.weight) {
      errorToast('O peso é obrigatório');
      return;
    }
    
    try {
      await axios.post(
        `${apiBaseUrl}/body-measurements/`,
        newMeasurement,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Recarregar dados
      setLoading(true);
      const measurementsResponse = await axios.get(`${apiBaseUrl}/body-measurements/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const measurements = measurementsResponse.data.results || measurementsResponse.data;
      setBodyMeasurements(measurements);
      
      const weightData = measurements.map(m => m.weight);
      const dateData = measurements.map(m => new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
      
      setProgressData(prev => ({
        ...prev,
        bodyMeasurements: {
          weight: weightData,
          dates: dateData
        }
      }));
      
      // Resetar formulário
      setShowAddMeasurementForm(false);
      setNewMeasurement({
        weight: user?.weight || '',
        body_fat: '',
        chest: '',
        waist: '',
        hips: '',
        biceps: '',
        thighs: '',
        calves: ''
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao adicionar medida:', error);
      errorToast('Erro ao adicionar medida corporal');
    }
  };
  
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
        
        {/* Seleção de período */}
        <div className="mb-6">
          <div className="flex space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow p-1">
            <button
              onClick={() => setActivePeriod('week')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activePeriod === 'week'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 mr-1" />
                Semana
              </span>
            </button>
            <button
              onClick={() => setActivePeriod('month')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activePeriod === 'month'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center justify-center">
                <CalendarDaysIcon className="h-5 w-5 mr-1" />
                Mês
              </span>
            </button>
            <button
              onClick={() => setActivePeriod('year')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activePeriod === 'year'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center justify-center">
                <ChartBarSquareIcon className="h-5 w-5 mr-1" />
                Ano
              </span>
            </button>
          </div>
        </div>
        
        {/* Seleção de seções */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeSection === 'dashboard'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveSection('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeSection === 'measurements'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveSection('measurements')}
              >
                Medidas Corporais
              </button>
              <button
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeSection === 'achievements'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveSection('achievements')}
              >
                Conquistas
              </button>
            </nav>
          </div>
        </div>
        
        {/* Conteúdo da seção ativa */}
        {activeSection === 'dashboard' && (
          <ProgressDashboard progressData={progressData} period={activePeriod} />
        )}
        
        {activeSection === 'measurements' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Medidas Corporais</h2>
              <button 
                onClick={() => setShowAddMeasurementForm(!showAddMeasurementForm)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
              >
                {showAddMeasurementForm ? 'Cancelar' : 'Adicionar Medida'}
              </button>
            </div>
            
            {/* Formulário para adicionar medida */}
            {showAddMeasurementForm && (
              <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-md font-medium mb-4">Nova Medida</h3>
                
                <form onSubmit={handleAddMeasurement} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Peso (kg) *
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={newMeasurement.weight}
                        onChange={handleMeasurementChange}
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gordura Corporal (%)
                      </label>
                      <input
                        type="number"
                        name="body_fat"
                        value={newMeasurement.body_fat}
                        onChange={handleMeasurementChange}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Peitoral (cm)
                      </label>
                      <input
                        type="number"
                        name="chest"
                        value={newMeasurement.chest}
                        onChange={handleMeasurementChange}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cintura (cm)
                      </label>
                      <input
                        type="number"
                        name="waist"
                        value={newMeasurement.waist}
                        onChange={handleMeasurementChange}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quadril (cm)
                      </label>
                      <input
                        type="number"
                        name="hips"
                        value={newMeasurement.hips}
                        onChange={handleMeasurementChange}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bíceps (cm)
                      </label>
                      <input
                        type="number"
                        name="biceps"
                        value={newMeasurement.biceps}
                        onChange={handleMeasurementChange}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Coxas (cm)
                      </label>
                      <input
                        type="number"
                        name="thighs"
                        value={newMeasurement.thighs}
                        onChange={handleMeasurementChange}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Panturrilhas (cm)
                      </label>
                      <input
                        type="number"
                        name="calves"
                        value={newMeasurement.calves}
                        onChange={handleMeasurementChange}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                    >
                      Salvar Medida
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {bodyMeasurements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Peso (kg)</th>
                      <th className="px-4 py-3">Gordura (%)</th>
                      <th className="px-4 py-3">Peitoral</th>
                      <th className="px-4 py-3">Cintura</th>
                      <th className="px-4 py-3">Quadril</th>
                      <th className="px-4 py-3">Bíceps</th>
                      <th className="px-4 py-3">Coxas</th>
                      <th className="px-4 py-3">Panturrilhas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bodyMeasurements.map((measurement, index) => (
                      <tr key={index} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-3">
                          {new Date(measurement.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 font-medium">{measurement.weight}</td>
                        <td className="px-4 py-3">{measurement.body_fat || '-'}</td>
                        <td className="px-4 py-3">{measurement.chest || '-'}</td>
                        <td className="px-4 py-3">{measurement.waist || '-'}</td>
                        <td className="px-4 py-3">{measurement.hips || '-'}</td>
                        <td className="px-4 py-3">{measurement.biceps || '-'}</td>
                        <td className="px-4 py-3">{measurement.thighs || '-'}</td>
                        <td className="px-4 py-3">{measurement.calves || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Você ainda não registrou nenhuma medida corporal.
                </p>
                <button 
                  onClick={() => setShowAddMeasurementForm(true)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                >
                  Adicionar Primeira Medida
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeSection === 'achievements' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Conquistas Desbloqueadas</h2>
            
            {progressData.achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {progressData.achievements.map((achievement, index) => (
                  <div 
                    key={achievement.id || index} 
                    className="flex bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full mr-4 h-12 w-12 flex items-center justify-center">
                      <span className="text-amber-600 dark:text-amber-300 text-xl font-bold">
                        {achievement.icon || 'A'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline">
                        <h3 className="font-medium text-lg">{achievement.name}</h3>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{achievement.date}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">
                  Você ainda não desbloqueou nenhuma conquista. Continue treinando para ganhar conquistas!
                </p>
              </div>
            )}
            
            {/* Próximas conquistas */}
            <div className="mt-8">
              <h3 className="text-md font-medium mb-4">Próximas Conquistas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex bg-gray-50 dark:bg-gray-700 p-4 rounded-lg opacity-70">
                  <div className="bg-gray-200 dark:bg-gray-600 p-3 rounded-full mr-4 h-12 w-12 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 text-xl font-bold">
                      ?
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">Persistência de Ferro</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Complete 7 dias consecutivos de treino
                    </p>
                    <div className="mt-2 flex items-center">
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${(user?.streak_count / 7) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        {user?.streak_count}/7
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex bg-gray-50 dark:bg-gray-700 p-4 rounded-lg opacity-70">
                  <div className="bg-gray-200 dark:bg-gray-600 p-3 rounded-full mr-4 h-12 w-12 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 text-xl font-bold">
                      ?
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">Atleta Dedicado</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Complete 10 treinos
                    </p>
                    <div className="mt-2 flex items-center">
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${(progressData.latestWorkouts.length / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        {progressData.latestWorkouts.length}/10
                      </span>
                    </div>
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