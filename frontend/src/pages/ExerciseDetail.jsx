// src/pages/ExerciseDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import NavBar from '../components/common/NavBar';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  InformationCircleIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const ExerciseDetail = () => {
  const { exerciseId } = useParams();
  const { token } = useAuth();
  const { errorToast, successToast } = useToast();
  const navigate = useNavigate();
  
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // API base URL
  const apiBaseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:8550/api/v1' 
    : '/api/v1';
  
  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/exercises/${exerciseId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExercise(response.data);
      } catch (error) {
        console.error('Error fetching exercise:', error);
        errorToast('Erro ao carregar exercício');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExercise();
  }, [exerciseId, token, apiBaseUrl, errorToast]);
  
  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este exercício?')) {
      return;
    }
    
    setDeleteLoading(true);
    try {
      await axios.delete(`${apiBaseUrl}/exercises/${exerciseId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      successToast('Exercício excluído com sucesso!');
      navigate('/exercises');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      errorToast('Erro ao excluir exercício');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  if (loading) {
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
  
  if (!exercise) {
    return (
      <>
        <NavBar />
        <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
          <Link to="/exercises" className="inline-flex items-center text-primary-600 mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para exercícios
          </Link>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Exercício não encontrado ou foi removido.
            </p>
            <Link
              to="/exercises"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              Ver todos os exercícios
            </Link>
          </div>
        </div>
      </>
    );
  }
  
  // Get difficulty color and label
  const getDifficultyInfo = () => {
    switch (exercise.difficulty) {
      case 'beginner':
        return { 
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', 
          label: 'Iniciante' 
        };
      case 'intermediate':
        return { 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', 
          label: 'Intermediário' 
        };
      case 'advanced':
        return { 
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', 
          label: 'Avançado' 
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', 
          label: 'Desconhecido' 
        };
    }
  };
  
  const difficultyInfo = getDifficultyInfo();
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <Link to="/exercises" className="inline-flex items-center text-primary-600 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Voltar para exercícios
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Image section */}
          <div className="md:w-2/5">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="h-64 md:h-80 bg-gray-200 dark:bg-gray-700 relative">
                {exercise.image ? (
                  <img
                    src={exercise.image}
                    alt={exercise.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500 text-xl">Sem imagem</span>
                  </div>
                )}
              </div>
              
              {exercise.video_url && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium mb-2">Vídeo demonstrativo</h3>
                  <a
                    href={exercise.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700"
                  >
                    <PlayIcon className="h-5 w-5 mr-1" />
                    Ver vídeo
                  </a>
                </div>
              )}
            </div>
            
            {/* Metadata */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <h3 className="font-medium mb-3 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-1 text-gray-500" />
                Informações
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Dificuldade</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${difficultyInfo.color}`}>
                    {difficultyInfo.label}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Grupos musculares</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {exercise.muscle_groups.map(group => (
                      <span 
                        key={group.id}
                        className="px-2 py-1 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
                      >
                        {group.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                {exercise.equipment_needed && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center mb-1">
                      <TagIcon className="h-4 w-4 mr-1" />
                      Equipamento necessário
                    </span>
                    <p className="text-sm">{exercise.equipment_needed}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Details section */}
          <div className="md:w-3/5">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold">{exercise.name}</h1>
                
                <div className="flex space-x-2">
                  <Link
                    to={`/exercises/edit/${exerciseId}`}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Link>
                  
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-50"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Descrição</h2>
                <p className="text-gray-700 dark:text-gray-300">{exercise.description}</p>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Instruções</h2>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  {exercise.instructions.split('\n').map((instruction, index) => (
                    <p key={index}>{instruction}</p>
                  ))}
                </div>
              </div>
              
              <div className="mt-8">
                <Link
                  to={`/workouts/create?exerciseId=${exerciseId}`}
                  className="w-full md:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg inline-flex items-center justify-center"
                >
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Adicionar a um treino
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExerciseDetail;