import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkout } from '../contexts/WorkoutContext';
import { useToast } from '../contexts/ToastContext';
import NavBar from '../components/common/NavBar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const WorkoutForm = () => {
  const navigate = useNavigate();
  const { createWorkout, loading } = useWorkout();
  const { successToast, errorToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'intermediate',
    estimated_duration: 60,
    is_template: false,
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const workout = await createWorkout(formData);
      if (workout) {
        successToast('Treino criado com sucesso!');
        navigate(`/workouts/${workout.id}`);
      }
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      errorToast('Erro ao criar treino. Tente novamente.');
    }
  };
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <Link to="/workouts" className="inline-flex items-center text-primary-600 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Voltar para treinos
        </Link>
        
        <h1 className="text-2xl font-bold mb-6">Criar Novo Treino</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Treino
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dificuldade
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duração Estimada (minutos)
                </label>
                <input
                  type="number"
                  name="estimated_duration"
                  value={formData.estimated_duration}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_template"
                checked={formData.is_template}
                onChange={handleChange}
                id="is-template"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is-template" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Este é um modelo de treino (disponível para todos)
              </label>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Treino'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default WorkoutForm;