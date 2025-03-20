import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PhotoIcon, XCircleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import NavBar from '../components/common/NavBar';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';

const ExerciseForm = () => {
  const { exerciseId } = useParams();
  const isEditing = !!exerciseId;
  const navigate = useNavigate();
  const { token } = useAuth();
  const { successToast, errorToast } = useToast();
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    muscle_group_ids: [],
    difficulty: 'intermediate',
    equipment_needed: '',
    image: null,
    video_url: '',
    tags: []
  });
  
  // API base URL
  const apiBaseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:8550/api/v1' 
    : '/api/v1';
  
  // Fetch muscle groups and exercise data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch muscle groups
        const muscleGroupsRes = await axios.get(`${apiBaseUrl}/muscle-groups/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMuscleGroups(muscleGroupsRes.data.results || muscleGroupsRes.data);
        
        // If editing, fetch exercise data
        if (isEditing) {
          const exerciseRes = await axios.get(`${apiBaseUrl}/exercises/${exerciseId}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const exercise = exerciseRes.data;
          setFormData({
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions,
            muscle_group_ids: exercise.muscle_groups.map(group => group.id),
            difficulty: exercise.difficulty,
            equipment_needed: exercise.equipment_needed || '',
            image: null, // Can't prefill file input
            video_url: exercise.video_url || '',
            tags: exercise.tags || []
          });
          
          if (exercise.tags) {
            setTags(exercise.tags);
          }
          
          if (exercise.image) {
            setPreviewImage(exercise.image);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        errorToast('Erro ao carregar dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isEditing, exerciseId, token, apiBaseUrl, errorToast]);
  
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      // Handle muscle group checkboxes
      const groupId = parseInt(name.split('-')[1]);
      
      setFormData(prev => {
        if (checked) {
          return {
            ...prev,
            muscle_group_ids: [...prev.muscle_group_ids, groupId]
          };
        } else {
          return {
            ...prev,
            muscle_group_ids: prev.muscle_group_ids.filter(id => id !== groupId)
          };
        }
      });
    } else if (type === 'file') {
      // Handle image upload
      if (files && files[0]) {
        setFormData(prev => ({
          ...prev,
          image: files[0]
        }));
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(files[0]);
      }
    } else {
      // Handle regular inputs
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const clearImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setPreviewImage(null);
    
    // Reset file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const addTag = () => {
    if (currentTag.trim() !== '' && !tags.includes(currentTag.trim())) {
      const newTags = [...tags, currentTag.trim()];
      setTags(newTags);
      setFormData(prev => ({
        ...prev,
        tags: newTags
      }));
      setCurrentTag('');
    }
  };
  
  const removeTag = (tagToRemove) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.name.trim() === '') {
      errorToast('O nome do exercício é obrigatório');
      return;
    }
    
    if (formData.muscle_group_ids.length === 0) {
      errorToast('Selecione pelo menos um grupo muscular');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create FormData object for multipart/form-data (for file upload)
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('instructions', formData.instructions);
      data.append('difficulty', formData.difficulty);
      data.append('equipment_needed', formData.equipment_needed);
      
      if (formData.video_url) {
        data.append('video_url', formData.video_url);
      }
      
      // Add muscle group IDs
      formData.muscle_group_ids.forEach(id => {
        data.append('muscle_group_ids', id);
      });
      
      // Add tags
      if (formData.tags.length > 0) {
        data.append('tags', JSON.stringify(formData.tags));
      }
      
      // Add image if present
      if (formData.image) {
        data.append('image', formData.image);
      }
      
      // Submit request
      let response;
      if (isEditing) {
        response = await axios.patch(
          `${apiBaseUrl}/exercises/${exerciseId}/`, 
          data,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        response = await axios.post(
          `${apiBaseUrl}/exercises/`, 
          data,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }
      
      successToast(`Exercício ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate(`/exercises/${response.data.id}`);
    } catch (error) {
      console.error('Error submitting exercise:', error);
      errorToast(`Erro ao ${isEditing ? 'atualizar' : 'criar'} exercício`);
    } finally {
      setSubmitting(false);
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
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <Link to="/exercises" className="inline-flex items-center text-primary-600 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Voltar para exercícios
        </Link>
        
        <h1 className="text-2xl font-bold mb-6">
          {isEditing ? 'Editar Exercício' : 'Novo Exercício'}
        </h1>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do exercício *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instruções
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Passos para executar o exercício corretamente..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nível de dificuldade
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Equipamento necessário
                </label>
                <input
                  type="text"
                  name="equipment_needed"
                  value={formData.equipment_needed}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Elásticos, barra fixa, cadeira..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL de vídeo (opcional)
                </label>
                <input
                  type="url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="ex: https://youtube.com/watch?v=..."
                />
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Adicionar tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Grupos musculares trabalhados *
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  {muscleGroups.map(group => (
                    <div key={group.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`group-${group.id}`}
                        name={`group-${group.id}`}
                        checked={formData.muscle_group_ids.includes(group.id)}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`group-${group.id}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {group.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Imagem do exercício
                </label>
                
                <div className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-700">
                  {!previewImage ? (
                    <div className="text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <label htmlFor="image-upload" className="relative cursor-pointer font-medium text-primary-600 hover:text-primary-500">
                          <span>Faça upload de uma imagem</span>
                          <input
                            id="image-upload"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">ou arraste e solte</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF até 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="max-h-48 rounded"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full text-red-500 hover:text-red-700"
                      >
                        <XCircleIcon className="h-6 w-6" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <Link
              to="/exercises"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-70"
            >
              {submitting 
                ? (isEditing ? 'Salvando...' : 'Criando...') 
                : (isEditing ? 'Salvar Alterações' : 'Criar Exercício')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ExerciseForm;