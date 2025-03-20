import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ClipboardDocumentListIcon, 
  UserIcon, 
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { darkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  const navItems = [
    { name: 'Início', path: '/', icon: HomeIcon },
    { name: 'Treinos', path: '/workouts', icon: ClipboardDocumentListIcon },
    { name: 'Exercícios', path: '/exercises', icon: LightBulbIcon },
    { name: 'Progresso', path: '/progress', icon: ChartBarIcon },
    { name: 'Perfil', path: '/profile', icon: UserIcon },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      {/* Navbar para celular no topo */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-50">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary-600">CaliFit</span>
          </Link>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <button 
              onClick={toggleMenu} 
              className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Menu móvel */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 pb-4"
          >
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 ${
                  location.pathname === item.path
                    ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={toggleMenu}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </div>

      {/* Navbar para desktop na lateral */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-md z-50">
        <div className="p-6 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary-600">CaliFit</span>
          </Link>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-between px-4 py-6">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center p-3 rounded-lg ${
                  location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
          <div className="mt-auto">
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-gray-700">
              <div className="text-sm text-primary-600 dark:text-primary-400">
                Streak atual:
                <span className="font-bold ml-2">{user?.streak_count || 0} dias</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                <div 
                  className="h-2 bg-primary-500 rounded-full" 
                  style={{ width: `${user?.level_progress_percentage || 0}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {user?.xp_to_next_level || 100} XP para o próximo nível
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Espaçador para conteúdo - móvel */}
      <div className="md:hidden h-16"></div>
      
      {/* Espaçador para conteúdo - desktop */}
      <div className="hidden md:block md:ml-64"></div>
    </>
  );
};

export default NavBar;