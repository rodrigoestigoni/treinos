import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import NavBar from '../components/common/NavBar';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  ClockIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const WorkoutForm = () => {
  const navigate = useNavigate();
  const { workoutId } = useParams();
  const isEditing = !!workoutId;
  const { token } = useAuth();
  const { successToast, errorToast } = useToast();
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [isSuperSet, setIsSuperSet] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'intermediate',
    estimated_duration: 60,
    is_template: false,
    workout_exercises: []
  });
  
  // Exercise form state (for adding/editing workout exercises)
  const [exerciseForm, setExerciseForm] = useState({
    exercise_id: '',
    exercise_detail: null,
    sets: 3,
    target_reps: 12,
    rest_duration: 60,
    notes: '',
    is_superset: false,
    superset_with: []
  });
  
  // API base URL
  const apiBaseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:8550/api/v1' 
    : '/api/v1';
  
  // Fetch exercises and workout data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch exercises
        const exercisesRes = await axios.get(`${apiBaseUrl}/exercises/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch muscle groups
        const muscleGroupsRes = await axios.get(`${apiBaseUrl}/muscle-groups/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const exercisesList = exercisesRes.data.results || exercisesRes.data;
        setExercises(exercisesList);
        setFilteredExercises(exercisesList);
        setMuscleGroups(muscleGroupsRes.data.results || muscleGroupsRes.data);
        
        // If editing, fetch workout data
        if (isEditing) {
          const workoutRes = await axios.get(`${apiBaseUrl}/workouts/${workoutId}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const workout = workoutRes.data;
          setFormData({
            name: workout.name,
            description: workout.description,
            difficulty: workout.difficulty,
            estimated_duration: workout.estimated_duration,
            is_template: workout.is_template,
            workout_exercises: workout.workout_exercises.map(exercise => ({
              exercise_id: exercise.exercise_detail.id,
              exercise_detail: exercise.exercise_detail,
              sets: exercise.sets,
              target_reps: exercise.target_reps,
              rest_duration: exercise.rest_duration,
              notes: exercise.notes,
              is_superset: exercise.is_superset || false,
              superset_with: exercise.superset_with || []
            }))
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        errorToast('Erro ao carregar dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isEditing, workoutId, token, apiBaseUrl, errorToast]);
  
  // Update filtered exercises when search term or muscle group changes
  useEffect(() => {
    let filtered = exercises;
    
    if (searchTerm) {
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedMuscleGroup) {
      filtered = filtered.filter(exercise => 
        exercise.muscle_groups.some(group => group.id === parseInt(selectedMuscleGroup))
      );
    }
    
    setFilteredExercises(filtered);
  }, [searchTerm, selectedMuscleGroup, exercises]);
  
  // Calculate estimated duration based on workout exercises
  useEffect(() => {
    if (formData.workout_exercises.length > 0) {
      let totalDuration = 0;
      
      formData.workout_exercises.forEach(exercise => {
        // Time for performing sets
        const setTime = exercise.sets * 45; // Assume 45 seconds per set
        
        // Rest time between sets
        const restTime = (exercise.sets - 1) * exercise.rest_duration;
        
        // Add to total
        totalDuration += setTime + restTime;
      });
      
      // Convert to minutes and round up
      const durationInMinutes = Math.ceil(totalDuration / 60);
      
      setFormData(prev => ({
        ...prev,
        estimated_duration: durationInMinutes
      }));
    }
  }, [formData.workout_exercises]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleExerciseFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setExerciseForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'sets' || name === 'target_reps' || name === 'rest_duration' ? parseInt(value) : value)
    }));
  };
  
  // CORRIGIDO: Agora imediatamente configura o exerciseForm com detalhes e passa para 
  // a etapa de configuração de séries/repetições
  const addExercise = (exerciseId) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    
    if (exercise) {
      setExerciseForm({
        exercise_id: exercise.id,
        exercise_detail: exercise,
        sets: 3,
        target_reps: 12,
        rest_duration: 60,
        notes: '',
        is_superset: false,
        superset_with: []
      });
      
      // Fechar o seletor de exercícios e não resetar o formulário
      setShowExerciseSelector(false);
      setEditingExerciseIndex(null);
    }
  };
  
  const saveExerciseToWorkout = () => {
    if (!exerciseForm.exercise_id) {
      errorToast('Selecione um exercício');
      return;
    }
    
    // O exercício já está no exerciseForm agora
    const exercise = exerciseForm.exercise_detail || exercises.find(ex => ex.id === exerciseForm.exercise_id);
    
    if (!exercise) {
      errorToast('Exercício não encontrado');
      return;
    }
    
    // Usar os detalhes já disponíveis
    const newExercise = {
      ...exerciseForm,
      exercise_detail: exercise
    };
    
    // If editing an existing exercise
    if (editingExerciseIndex !== null) {
      const updatedExercises = [...formData.workout_exercises];
      updatedExercises[editingExerciseIndex] = newExercise;
      
      setFormData(prev => ({
        ...prev,
        workout_exercises: updatedExercises
      }));
      
      setEditingExerciseIndex(null);
    } else {
      // Adding a new exercise
      setFormData(prev => ({
        ...prev,
        workout_exercises: [...prev.workout_exercises, newExercise]
      }));
    }
    
    // Reset exercise form
    setExerciseForm({
      exercise_id: '',
      exercise_detail: null,
      sets: 3,
      target_reps: 12,
      rest_duration: 60,
      notes: '',
      is_superset: false,
      superset_with: []
    });
    
    setIsSuperSet(false);
  };
  
  const editExercise = (index) => {
    const exerciseToEdit = formData.workout_exercises[index];
    
    setExerciseForm({
      exercise_id: exerciseToEdit.exercise_id,
      exercise_detail: exerciseToEdit.exercise_detail,
      sets: exerciseToEdit.sets,
      target_reps: exerciseToEdit.target_reps,
      rest_duration: exerciseToEdit.rest_duration,
      notes: exerciseToEdit.notes,
      is_superset: exerciseToEdit.is_superset,
      superset_with: exerciseToEdit.superset_with || []
    });
    
    setEditingExerciseIndex(index);
    setIsSuperSet(exerciseToEdit.is_superset);
  };
  
  const removeExercise = (index) => {
    const updatedExercises = [...formData.workout_exercises];
    updatedExercises.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      workout_exercises: updatedExercises
    }));
  };
  
  const moveExercise = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === formData.workout_exercises.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedExercises = [...formData.workout_exercises];
    
    // Swap exercises
    [updatedExercises[index], updatedExercises[newIndex]] = 
    [updatedExercises[newIndex], updatedExercises[index]];
    
    setFormData(prev => ({
      ...prev,
      workout_exercises: updatedExercises
    }));
  };
  
  const toggleSuperSet = () => {
    setIsSuperSet(!isSuperSet);
    setExerciseForm(prev => ({
      ...prev,
      is_superset: !isSuperSet
    }));
  };
  
  const addToSuperSet = (exerciseId) => {
    if (!exerciseForm.superset_with.includes(exerciseId)) {
      setExerciseForm(prev => ({
        ...prev,
        superset_with: [...prev.superset_with, exerciseId]
      }));
    }
  };
  
  const removeFromSuperSet = (exerciseId) => {
    setExerciseForm(prev => ({
      ...prev,
      superset_with: prev.superset_with.filter(id => id !== exerciseId)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.name.trim() === '') {
      errorToast('O nome do treino é obrigatório');
      return;
    }
    
    if (formData.workout_exercises.length === 0) {
      errorToast('Adicione pelo menos um exercício ao treino');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Format workout exercises for the API
      const workout_exercises = formData.workout_exercises.map((exercise, index) => ({
        exercise_id: exercise.exercise_id,
        order: index,
        sets: exercise.sets,
        target_reps: exercise.target_reps,
        rest_duration: exercise.rest_duration,
        notes: exercise.notes,
        is_superset: exercise.is_superset,
        superset_with: exercise.superset_with
      }));
      
      const dataToSubmit = {
        name: formData.name,
        description: formData.description,
        difficulty: formData.difficulty,
        estimated_duration: formData.estimated_duration,
        is_template: formData.is_template,
        workout_exercises: workout_exercises
      };
      
      let response;
      
      if (isEditing) {
        response = await axios.patch(
          `${apiBaseUrl}/workouts/${workoutId}/`,
          dataToSubmit,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        response = await axios.post(
          `${apiBaseUrl}/workouts/`,
          dataToSubmit,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
      
      successToast(`Treino ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate(`/workouts/${response.data.id}`);
    } catch (error) {
      console.error('Error submitting workout:', error);
      errorToast(`Erro ao ${isEditing ? 'atualizar' : 'criar'} treino`);
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
        <Link to="/workouts" className="inline-flex items-center text-primary-600 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Voltar para treinos
        </Link>
        
        <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Treino' : 'Criar Novo Treino'}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Treino *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dificuldade
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="mt-4 flex items-center">
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
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Exercícios</h2>
              
              <button
                type="button"
                onClick={() => {
                  setShowExerciseSelector(true);
                  setEditingExerciseIndex(null);
                  setExerciseForm({
                    exercise_id: '',
                    exercise_detail: null,
                    sets: 3,
                    target_reps: 12,
                    rest_duration: 60,
                    notes: '',
                    is_superset: false,
                    superset_with: []
                  });
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded-lg text-sm font-medium inline-flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Adicionar Exercício
              </button>
            </div>
            
            {formData.workout_exercises.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum exercício adicionado ao treino.
                </p>
                <button
                  type="button"
                  onClick={() => setShowExerciseSelector(true)}
                  className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Adicionar exercício
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.workout_exercises.map((exercise, index) => (
                  <div 
                    key={index}
                    className={`border ${exercise.is_superset ? 'border-primary-300 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'} rounded-lg p-4`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-200 font-medium mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-medium text-lg">
                            {exercise.exercise_detail.name}
                            {exercise.is_superset && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">
                                Super Set
                              </span>
                            )}
                          </h3>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>{exercise.sets} séries</span>
                            <span>{exercise.target_reps} repetições</span>
                            <span>{exercise.rest_duration}s descanso</span>
                          </div>
                          {exercise.is_superset && exercise.superset_with.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Super set com:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {exercise.superset_with.map(exId => {
                                  const supersetEx = exercises.find(e => e.id === exId);
                                  return supersetEx ? (
                                    <span 
                                      key={exId}
                                      className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full"
                                    >
                                      {supersetEx.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                          {exercise.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              <span className="font-medium">Notas:</span> {exercise.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => moveExercise(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:hover:text-gray-500"
                        >
                          <ChevronUpIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveExercise(index, 'down')}
                          disabled={index === formData.workout_exercises.length - 1}
                          className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:hover:text-gray-500"
                        >
                          <ChevronDownIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => editExercise(index)}
                          className="p-1 text-gray-500 hover:text-primary-600"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExercise(index)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex items-center justify-between py-4 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span>Tempo estimado:</span>
                  </div>
                  <span className="font-medium">{formData.estimated_duration} minutos</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Link
              to="/workouts"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 mr-3"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50"
            >
              {submitting 
                ? (isEditing ? 'Salvando...' : 'Criando...') 
                : (isEditing ? 'Salvar Alterações' : 'Criar Treino')}
            </button>
          </div>
        </form>
        
        {/* Exercise selector modal */}
        {showExerciseSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {exerciseForm.exercise_id 
                    ? 'Configurar Exercício' 
                    : (editingExerciseIndex !== null 
                        ? 'Editar Exercício' 
                        : 'Adicionar Exercício ao Treino')}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowExerciseSelector(false);
                    // Apenas limpar se não estiver configurando um exercício
                    if (!exerciseForm.exercise_id) {
                      setExerciseForm({
                        exercise_id: '',
                        exercise_detail: null,
                        sets: 3,
                        target_reps: 12,
                        rest_duration: 60,
                        notes: '',
                        is_superset: false,
                        superset_with: []
                      });
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {exerciseForm.exercise_id ? (
                // Exercise configuration form
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-lg mb-1">
                      {exerciseForm.exercise_detail?.name || ''}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {exerciseForm.exercise_detail?.description || ''}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Séries
                      </label>
                      <input
                        type="number"
                        name="sets"
                        value={exerciseForm.sets}
                        onChange={handleExerciseFormChange}
                        min="1"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Repetições
                      </label>
                      <input
                        type="number"
                        name="target_reps"
                        value={exerciseForm.target_reps}
                        onChange={handleExerciseFormChange}
                        min="1"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descanso (segundos)
                      </label>
                      <input
                        type="number"
                        name="rest_duration"
                        value={exerciseForm.rest_duration}
                        onChange={handleExerciseFormChange}
                        min="10"
                        max="300"
                        step="5"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notas (opcional)
                    </label>
                    <textarea
                      name="notes"
                      value={exerciseForm.notes}
                      onChange={handleExerciseFormChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Instruções específicas, variações, etc."
                    />
                  </div>
                  
                  {/* Super Set toggle */}
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="is-superset"
                        checked={isSuperSet}
                        onChange={toggleSuperSet}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is-superset" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Configurar como Super Set
                      </label>
                    </div>
                    
                    {isSuperSet && (
                      <div className="mt-2 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                        <h5 className="font-medium text-sm mb-2">Selecione os exercícios para o super set:</h5>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {exercises
                            .filter(ex => ex.id !== exerciseForm.exercise_id)
                            .map(exercise => (
                              <div key={exercise.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`superset-${exercise.id}`}
                                  checked={exerciseForm.superset_with.includes(exercise.id)}
                                  onChange={() => {
                                    if (exerciseForm.superset_with.includes(exercise.id)) {
                                      removeFromSuperSet(exercise.id);
                                    } else {
                                      addToSuperSet(exercise.id);
                                    }
                                  }}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`superset-${exercise.id}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                  {exercise.name}
                                </label>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        // Voltar para seleção de exercícios
                        setExerciseForm({
                          exercise_id: '',
                          exercise_detail: null,
                          sets: 3,
                          target_reps: 12,
                          rest_duration: 60,
                          notes: '',
                          is_superset: false,
                          superset_with: []
                        });
                        setIsSuperSet(false);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 mr-2"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={saveExerciseToWorkout}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                    >
                      {editingExerciseIndex !== null ? 'Atualizar Exercício' : 'Adicionar ao Treino'}
                    </button>
                  </div>
                </div>
              ) : (
                // Exercise selection list
                <>
                  <div className="mb-4 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="Buscar exercícios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    
                    <select
                      value={selectedMuscleGroup}
                      onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Todos os grupos musculares</option>
                      {muscleGroups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {filteredExercises.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredExercises.map(exercise => (
                          <div
                            key={exercise.id}
                            onClick={() => addExercise(exercise.id)}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <h4 className="font-medium">{exercise.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                              {exercise.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {exercise.muscle_groups.map(group => (
                                <span
                                  key={group.id}
                                  className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-xs"
                                >
                                  {group.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 dark:text-gray-400">
                          Nenhum exercício encontrado.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WorkoutForm;