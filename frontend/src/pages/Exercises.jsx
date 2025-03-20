import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import NavBar from '../components/common/NavBar';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const Exercises = () => {
  const { token } = useAuth();
  const { errorToast } = useToast();
  const [exercises, setExercises] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    difficulty: '',
    muscleGroup: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Define API base URL
  const apiBaseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:8550/api/v1' 
    : '/api/v1';
  
  // Fetch exercises and muscle groups on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch exercises
        const exercisesRes = await axios.get(`${apiBaseUrl}/exercises/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch muscle groups
        const muscleGroupsRes = await axios.get(`${apiBaseUrl}/muscle-groups/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setExercises(exercisesRes.data.results || exercisesRes.data);
        setMuscleGroups(muscleGroupsRes.data.results || muscleGroupsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        errorToast('Erro ao carregar exercícios. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token, apiBaseUrl, errorToast]);
  
  // Filter exercises based on search term and filters
  const filteredExercises = exercises.filter(exercise => {
    // Search term filter
    const matchesSearch = 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Difficulty filter
    const matchesDifficulty = 
      filters.difficulty === '' || exercise.difficulty === filters.difficulty;
    
    // Muscle group filter
    const matchesMuscleGroup = 
      filters.muscleGroup === '' || 
      exercise.muscle_groups.some(group => group.id === parseInt(filters.muscleGroup));
    
    return matchesSearch && matchesDifficulty && matchesMuscleGroup;
  });
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      difficulty: '',
      muscleGroup: '',
    });
    setSearchTerm('');
  };
  
  // Get difficulty label
  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return { label: 'Iniciante', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      case 'intermediate':
        return { label: 'Intermediário', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
      case 'advanced':
        return { label: 'Avançado', bgColor: 'bg-red-100', textColor: 'text-red-800' };
      default:
        return { label: 'Desconhecido', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }
  };
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Exercícios</h1>
          <Link
            to="/exercises/create"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Novo Exercício
          </Link>
        </div>
        
        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Buscar exercícios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              {searchTerm && (
                <button
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setSearchTerm('')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:w-auto w-full flex items-center justify-center space-x-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span>Filtros</span>
            </button>
          </div>
          
          {showFilters && (
            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 space-y-4 md:flex md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nível de dificuldade
                </label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Grupo muscular
                </label>
                <select
                  value={filters.muscleGroup}
                  onChange={(e) => setFilters({ ...filters, muscleGroup: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  {muscleGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Exercise Grid */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredExercises.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredExercises.map(exercise => {
              const { label, bgColor, textColor } = getDifficultyLabel(exercise.difficulty);
              
              return (
                <Link
                  key={exercise.id}
                  to={`/exercises/${exercise.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                    {exercise.image ? (
                      <img
                        src={exercise.image}
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-gray-400 dark:text-gray-500 text-xl">Sem imagem</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent p-3">
                      <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>
                    </div>
                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                      {label}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {exercise.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {exercise.muscle_groups.map(group => (
                        <span 
                          key={group.id}
                          className="px-2 py-1 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
                        >
                          {group.name}
                        </span>
                      ))}
                    </div>
                    
                    {exercise.tags && exercise.tags.length > 0 && (
                      <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {exercise.tags.slice(0, 3).join(', ')}
                        {exercise.tags.length > 3 && '...'}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filters.difficulty || filters.muscleGroup
                ? 'Nenhum exercício encontrado com os filtros aplicados.'
                : 'Nenhum exercício encontrado. Crie seu primeiro exercício!'}
            </p>
            {searchTerm || filters.difficulty || filters.muscleGroup ? (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
              >
                Limpar filtros
              </button>
            ) : (
              <Link
                to="/exercises/create"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg inline-block"
              >
                Criar exercício
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Exercises;