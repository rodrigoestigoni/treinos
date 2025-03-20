import React from 'react';
import NavBar from '../components/common/NavBar';

const Home = () => {
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 md:py-12 md:pl-72">
        <h1 className="text-2xl font-bold mb-6">Bem-vindo ao CaliFit!</h1>
        <p className="mb-4">
          Seu aplicativo pessoal para acompanhamento de treinos de calistenia.
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Comece agora</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Navegue até a seção de Treinos para começar seu programa de calistenia.
          </p>
        </div>
      </div>
    </>
  );
};

export default Home;