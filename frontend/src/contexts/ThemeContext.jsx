// frontend/src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// Crie o contexto
const ThemeContext = createContext();

// Hook para usar o contexto
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Verifica se deve usar modo escuro baseado nas preferências do usuário ou localStorage
  const getInitialDarkMode = () => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    // Verifica preferência do sistema
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  // Alterna entre os modos
  const toggleTheme = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Aplica a classe ao body quando o modo muda
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;