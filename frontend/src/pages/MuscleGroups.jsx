import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import NavBar from '../components/common/NavBar';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';

const MuscleGroups = () => {
  const { token } = useAuth();
  const { successToast, errorToast } = useToast();
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: ''
  });
  
  // API base URL
  const apiBaseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:8550/api/v1' 
    : '/api/v1';
  
  // Fetch muscle groups on component mount
  useEffect(() => {
    fetchMuscleGroups();
  }, []);
  
  const fetchMuscleGroups = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/muscle-groups/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMuscleGroups(response.data.results || response.data);
    } catch (error) {
      console.error('Erro ao carregar grupos musculares:', error);
      errorToast('Erro ao carregar grupos musculares');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      errorToast('O nome do grupo muscular é obrigatório');
      return;
    }
    
    try {
      if (editingId) {
        // Update existing muscle group
        await axios.patch(
          `${apiBaseUrl}/muscle-groups/${editingId}/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        successToast('Grupo muscular atualizado com sucesso!');
      } else {
        // Create new muscle group
        await axios.post(
          `${apiBaseUrl}/muscle-groups/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        successToast('Grupo muscular criado com sucesso!');
      }
      
      // Reset form and refresh list
      setFormData({ name: '', description: '', icon: '' });
      setShowAddForm(false);
      setEditingId(null);
      fetchMuscleGroups();
    } catch (error) {
      console.error('Erro ao salvar grupo muscular:', error);
      errorToast('Erro ao salvar grupo muscular');
    }
  };
  
  const handleEdit = (group) => {
    setFormData({
      name: group.name,
      description: group.description || '',
      icon: group.icon || ''
    });
    setEditingId(group.id);
    setShowAddForm(true);
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo muscular?')) {
      return;
    }
    
    try {
      await axios.delete(
        `${apiBaseUrl}/muscle-groups/${id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      successToast('Grupo muscular excluído com sucesso!');
      fetchMuscleGroups();
    } catch (error) {
      console.error('Erro ao excluir grupo muscular:', error);
      errorToast('Erro ao excluir grupo muscular');
    }
  };
  
  // Função para criar grupos padrão se não existirem
  const createDefaultGroups = async () => {
    const defaultGroups = [
      { name: 'Peito', description: 'Músculos peitorais, incluindo peitoral maior e menor', icon: 'chest' },
      { name: 'Costas', description: 'Músculos das costas, incluindo latíssimos e trapézio', icon: 'back' },
      { name: 'Ombros', description: 'Músculos dos ombros, incluindo deltoides', icon: 'shoulders' },
      { name: 'Braços', description: 'Músculos dos braços, incluindo bíceps e tríceps', icon: 'arms' },
      { name: 'Pernas', description: 'Músculos das pernas, incluindo quadríceps e isquiotibiais', icon: 'legs' },
      { name: 'Abdômen', description: 'Músculos do abdômen', icon: 'abs' },
      { name: 'Glúteos', description: 'Músculos glúteos', icon: 'glutes' },
      { name: 'Core', description: 'Músculos do núcleo, incluindo abdominais profundos', icon: 'core' }
    ];
    
    try {
      setLoading(true);
      for (const group of defaultGroups) {
        await axios.post(
          `${apiBaseUrl}/muscle-groups/`,
          group,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      successToast('Grupos musculares padrão criados com sucesso!');
      fetchMuscleGroups();
    } catch (error) {
      console.error('Erro ao criar grupos padrão:', error);
      errorToast('Erro ao criar grupos padrão');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Grupos Musculares</h1>
          <div className="flex space-x-2">
            {muscleGroups.length === 0 && (
              <button
                onClick={createDefaultGroups}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Criar Grupos Padrão
              </button>
            )}
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (!showAddForm) {
                  setFormData({ name: '', description: '', icon: '' });
                  setEditingId(null);
                }
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center"
            >
              {showAddForm ? (
                'Cancelar'
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Novo Grupo Muscular
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'Editar Grupo Muscular' : 'Novo Grupo Muscular'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  Ícone (opcional)
                </label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nome do ícone (ex: chest, back, arms)"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                >
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Muscle Groups List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : muscleGroups.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ícone
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {muscleGroups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{group.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{group.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{group.icon || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(group)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Nenhum grupo muscular encontrado. Crie novos grupos para poder cadastrar exercícios.
            </p>
            <div className="flex justify-center">
              <button
                onClick={createDefaultGroups}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg inline-flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Criar Grupos Musculares Padrão
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <Link 
            to="/exercises"
            className="inline-flex items-center text-primary-600"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para exercícios
          </Link>
        </div>
      </div>
    </>
  );
};

export default MuscleGroups;