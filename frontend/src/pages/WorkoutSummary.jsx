// src/pages/WorkoutSummary.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '../components/common/NavBar';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  HomeIcon,
  FireIcon,
  TrophyIcon,
  ChartBarIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import confetti from 'canvas-confetti';

const WorkoutSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loadingData, setLoadingData] = useState(true);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [achievementAnimation, setAchievementAnimation] = useState(false);
  
  const { 
    workoutId, 
    exerciseProgress, 
    duration, 
    name: workoutName 
  } = location.state || {};
  
  // Simulated data (replace with API data in a real app)
  const [summaryData, setSummaryData] = useState({
    workoutName: workoutName || "Treino Completo",
    duration: duration || 50 * 60, // in seconds
    xpGained: 120,
    totalSets: 0,
    completedSets: 0,
    caloriesBurned: 0,
    exercises: [],
    achievements: []
  });
  
  useEffect(() => {
    // Show confetti animation on load
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Simulate loading data from API
    setTimeout(() => {
      // Process exercise progress to build exercises list
      let exercises = [];
      let totalSets = 0;
      let completedSets = 0;
      
      if (exerciseProgress) {
        // In a real app, you would process exerciseProgress data here
        // or fetch the data from an API
      }
      
      // Simulate data for demo purposes
      exercises = [
        { name: "Flexão tradicional", completed: "4/4 séries", reps: "15, 16, 18, 15" },
        { name: "Flexão diamante", completed: "4/4 séries", reps: "12, 13, 12, 11" },
        { name: "Dips na barra paralela", completed: "4/4 séries", reps: "10, 10, 8, 8" },
        { name: "Archer push-ups", completed: "3/3 séries", reps: "10, 10, 8 por lado" },
        { name: "Pike push-ups", completed: "3/3 séries", reps: "12, 12, 10" },
        { name: "Elevação lateral com elásticos", completed: "3/3 séries", reps: "15, 15, 15" }
      ];
      
      totalSets = 21;
      completedSets = 21;
      
      // Calculate calories (simplified formula)
      const weight = user?.weight || 70; // default to 70kg if no user weight
      const caloriesBurned = Math.round((duration / 60) * 8 * weight / 70);
      
      // Check for achievements
      const achievements = [
        {
          id: 1,
          name: "Persistência de Ferro",
          description: "Complete 7 dias consecutivos de treino",
          xp: 50,
          isNew: true
        }
      ];
      
      // If user streak is exactly 7, mark the achievement as new
      if (user?.streak_count === 7) {
        achievements[0].isNew = true;
        
        // Trigger achievement animation after a delay
        setTimeout(() => {
          setAchievementAnimation(true);
        }, 1500);
      }
      
      setSummaryData({
        workoutName: workoutName || "Treino Completo",
        duration: duration || 50 * 60,
        xpGained: 120,
        totalSets,
        completedSets,
        caloriesBurned,
        exercises,
        achievements
      });
      
      setLoadingData(false);
    }, 1000);
  }, [workoutName, duration, exerciseProgress, user]);
  
  // Format time function
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!workoutId && !location.state) {
    return (
      <>
        <NavBar />
        <div className="container mx-auto px-4 py-8">
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
  
  if (loadingData) {
    return (
      <>
        <NavBar />
        <div className="container mx-auto px-4 pt-20 pb-8">
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <div className="max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 10 
              }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4"
            >
              <CheckCircleIcon className="h-12 w-12" />
            </motion.div>
            <h1 className="text-2xl font-bold">Treino Concluído!</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Parabéns por completar o treino "{summaryData.workoutName}"
            </p>
          </motion.div>
          
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-3">
                <ClockIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Tempo Total</span>
              <span className="text-xl font-bold">{formatTime(summaryData.duration)}</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-3">
                <FireIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Calorias Queimadas</span>
              <span className="text-xl font-bold">{summaryData.caloriesBurned} kcal</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-3">
                <ChartBarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">XP Ganho</span>
              <span className="text-xl font-bold text-primary-600">+{summaryData.xpGained} XP</span>
            </motion.div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-primary-600" />
                Resumo
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300">Séries completadas</span>
                  <span className="font-semibold">
                    {summaryData.completedSets}/{summaryData.totalSets}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300">Streak atual</span>
                  <span className="font-semibold">{user?.streak_count || 0} dias</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300">Nível</span>
                  <span className="font-semibold">{user?.level || 1}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Progresso para próximo nível</span>
                  <span className="font-semibold">{user?.level_progress_percentage || 0}%</span>
                </div>
                
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-600 rounded-full" 
                    style={{ width: `${user?.level_progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
                Conquistas
              </h2>
              
              {summaryData.achievements.length > 0 ? (
                <div className="space-y-4">
                  {summaryData.achievements.map((achievement, index) => (
                    <motion.div 
                      key={achievement.id || index}
                      initial={achievement.isNew ? { opacity: 0, scale: 0.9 } : { opacity: 1 }}
                      animate={achievementAnimation && achievement.isNew 
                        ? { opacity: 1, scale: [0.9, 1.05, 1] } 
                        : { opacity: 1 }}
                      transition={achievement.isNew 
                        ? { duration: 0.5, type: "spring" } 
                        : {}}
                      className={`flex items-start p-3 rounded-lg ${
                        achievement.isNew ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-full mr-3 ${
                        achievement.isNew 
                          ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        <TrophyIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium">{achievement.name}</h3>
                          {achievement.isNew && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full">
                              Novo!
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {achievement.description}
                        </p>
                        <p className="text-sm text-primary-600 mt-1">
                          +{achievement.xp} XP
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Continue treinando para desbloquear conquistas!
                </p>
              )}
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Detalhes dos Exercícios</h2>
              <button 
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="text-primary-600 hover:text-primary-700 p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
            </div>
            
            <AnimatePresence>
              {showShareOptions && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-wrap gap-2">
                    <button className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                      Compartilhar no Facebook
                    </button>
                    <button className="px-3 py-1 bg-blue-400 text-white rounded-lg text-sm hover:bg-blue-500">
                      Compartilhar no Twitter
                    </button>
                    <button className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                      Compartilhar no WhatsApp
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-4">
              {summaryData.exercises.map((exercise, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (index * 0.1) }}
                  className="flex justify-between pb-2 border-b border-gray-200 dark:border-gray-700"
                >
                  <div>
                    <h3 className="font-medium">{exercise.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Repetições: {exercise.reps}
                    </p>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-medium">{exercise.completed}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex space-x-4"
          >
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 rounded-lg flex items-center justify-center"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Voltar ao início
            </button>
            <button
              onClick={() => navigate('/workouts')}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg flex items-center justify-center"
            >
              Ver todos os treinos
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default WorkoutSummary;