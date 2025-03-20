import React from 'react';
import NavBar from '../components/common/NavBar';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <h1 className="text-2xl font-bold mb-6">Perfil do Usuário</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-2xl font-bold">
              {user?.username?.[0] || 'U'}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold">{user?.username || 'Usuário'}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{user?.email || 'usuario@exemplo.com'}</p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
                  Nível {user?.level || 1}
                </div>
                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                  Streak: {user?.streak_count || 0} dias
                </div>
              </div>
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span>Progresso para o próximo nível</span>
              <span>{user?.xp_points || 0} XP</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="h-2 bg-primary-600 rounded-full" 
                style={{ width: `${user?.level_progress_percentage || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Faltam {user?.xp_to_next_level || 100} XP para o próximo nível
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
        >
          Sair
        </button>
      </div>
    </>
  );
};

export default Profile;