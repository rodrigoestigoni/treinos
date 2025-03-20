import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ChartBarIcon,
  ClockIcon,
  FireIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';

const ProgressDashboard = ({ progressData, period = 'week' }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Dados formatados para gráficos
  const [chartData, setChartData] = useState({
    workouts: [],
    weights: [],
    performance: []
  });
  
  useEffect(() => {
    if (progressData) {
      // Formatação básica para os exemplos, em produção seria adaptado aos dados reais
      const workoutData = period === 'week' 
        ? progressData.weeklyWorkouts.map((value, index) => ({
            name: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][index],
            treinos: value
          }))
        : progressData.monthlyWorkouts.map((value, index) => ({
            name: [`Semana ${index + 1}`],
            treinos: value
          }));
      
      // Dados de peso ao longo do tempo (exemplo)
      const weightData = progressData.bodyMeasurements?.weight.map((weight, index) => ({
        name: progressData.bodyMeasurements?.dates[index] || `Dia ${index + 1}`,
        peso: weight
      })) || [];
      
      // Exemplo de dados de performance (força/resistência)
      // Em produção, isso viria dos registros de séries com peso
      const performanceData = [
        { name: 'Semana 1', supino: 40, agachamento: 60, levantamento: 80 },
        { name: 'Semana 2', supino: 45, agachamento: 65, levantamento: 85 },
        { name: 'Semana 3', supino: 48, agachamento: 70, levantamento: 90 },
        { name: 'Semana 4', supino: 50, agachamento: 75, levantamento: 95 }
      ];
      
      setChartData({
        workouts: workoutData,
        weights: weightData,
        performance: performanceData
      });
    }
  }, [progressData, period]);
  
  // Calcular valores comparativos para os cards
  const calculateComparisons = () => {
    if (!progressData) return { 
      workoutsChange: 0, 
      caloriesChange: 0, 
      timeChange: 0, 
      weightChange: 0 
    };
    
    // Em produção, esses valores seriam calculados com base nos dados reais
    // Aqui são apenas demonstrativos
    return {
      workoutsChange: 15, // 15% a mais que no período anterior
      caloriesChange: -5,  // 5% a menos que no período anterior
      timeChange: 22,     // 22% a mais que no período anterior
      weightChange: -2.1   // Perda de 2.1kg desde o início do período
    };
  };
  
  const comparisons = calculateComparisons();
  
  if (!progressData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Carregando dados de progresso...
        </p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {/* Tabs de navegação */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`inline-block py-2 px-4 text-sm font-medium ${
                selectedTab === 'overview'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              Visão Geral
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setSelectedTab('workouts')}
              className={`inline-block py-2 px-4 text-sm font-medium ${
                selectedTab === 'workouts'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              Treinos
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setSelectedTab('weight')}
              className={`inline-block py-2 px-4 text-sm font-medium ${
                selectedTab === 'weight'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              Peso
            </button>
          </li>
          <li>
            <button
              onClick={() => setSelectedTab('performance')}
              className={`inline-block py-2 px-4 text-sm font-medium ${
                selectedTab === 'performance'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              Performance
            </button>
          </li>
        </ul>
      </div>
      
      {/* Conteúdo da tab selecionada */}
      <div>
        {selectedTab === 'overview' && (
          <div>
            {/* Cards principais */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {/* Card de treinos */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 mr-3">
                      <ChartBarIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Treinos</p>
                      <p className="text-xl font-bold">{progressData.weeklyWorkouts.reduce((a, b) => a + b, 0)}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center px-2 py-1 rounded-full text-sm ${
                    comparisons.workoutsChange >= 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {comparisons.workoutsChange >= 0 ? (
                      <ArrowUpIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(comparisons.workoutsChange)}%</span>
                  </div>
                </div>
                
                <div className="h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.workouts} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Bar dataKey="treinos" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Card de calorias */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 mr-3">
                      <FireIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Calorias</p>
                      <p className="text-xl font-bold">2,450</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center px-2 py-1 rounded-full text-sm ${
                    comparisons.caloriesChange >= 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {comparisons.caloriesChange >= 0 ? (
                      <ArrowUpIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(comparisons.caloriesChange)}%</span>
                  </div>
                </div>
                
                <div className="h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.workouts} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Line type="monotone" dataKey="treinos" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Card de tempo */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 mr-3">
                      <ClockIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tempo</p>
                      <p className="text-xl font-bold">8h 25m</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center px-2 py-1 rounded-full text-sm ${
                    comparisons.timeChange >= 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {comparisons.timeChange >= 0 ? (
                      <ArrowUpIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(comparisons.timeChange)}%</span>
                  </div>
                </div>
                
                <div className="h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.workouts} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Bar dataKey="treinos" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Card de peso */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mr-3">
                      <ScaleIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Peso</p>
                      <p className="text-xl font-bold">
                        {chartData.weights.length > 0 
                          ? `${chartData.weights[chartData.weights.length - 1].peso} kg` 
                          : '72 kg'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center px-2 py-1 rounded-full text-sm ${
                    comparisons.weightChange <= 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {comparisons.weightChange <= 0 ? (
                      <ArrowDownIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowUpIcon className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(comparisons.weightChange)} kg</span>
                  </div>
                </div>
                
                <div className="h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.weights} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Line type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Gráficos principais */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Gráfico de treinos */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Treinos Por Dia</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.workouts} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="treinos" fill="#4f46e5" name="Treinos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Gráfico de peso */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Progresso de Peso</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.weights} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} name="Peso (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedTab === 'workouts' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Histórico de Treinos</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.workouts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="treinos" fill="#4f46e5" name="Treinos Completados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {selectedTab === 'weight' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Histórico de Peso</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.weights} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} name="Peso (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {selectedTab === 'performance' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Evolução da Força</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.performance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="supino" stroke="#4f46e5" name="Supino (kg)" />
                  <Line type="monotone" dataKey="agachamento" stroke="#ef4444" name="Agachamento (kg)" />
                  <Line type="monotone" dataKey="levantamento" stroke="#f59e0b" name="Levantamento (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard;