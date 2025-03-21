// src/utils/sounds.js
const sounds = {
  exerciseComplete: null,
  restComplete: null,
  countdown: null,
  workoutComplete: null,
  tick: null,
  finalTick: null,
  notification: null
};

let soundsLoaded = false;
let soundsEnabled = true;

export const loadSounds = () => {
  if (soundsLoaded) return;
  
  const soundFiles = {
    exerciseComplete: '/sounds/exercise-complete.wav',
    restComplete: '/sounds/rest-complete.mp3',
    countdown: '/sounds/countdown.wav',
    workoutComplete: '/sounds/workout-complete.mp3',
    tick: '/sounds/tick.wav',
    finalTick: '/sounds/final-tick.wav',
    notification: '/sounds/notification.mp3'
  };

  // Pré-carrega todos os sons
  Object.entries(soundFiles).forEach(([key, path]) => {
    try {
      sounds[key] = new Audio(path);
      sounds[key].load();
      
      // Configurar atributos para melhor desempenho em dispositivos móveis
      sounds[key].preload = 'auto';
      
      // Reduzir o atraso entre a chamada e a reprodução
      if (key === 'tick' || key === 'finalTick') {
        sounds[key].volume = 0.7;
      }
    } catch (error) {
      console.error(`Erro ao carregar som ${key}:`, error);
    }
  });

  soundsLoaded = true;
};

export const playSound = (sound) => {
  if (!soundsEnabled || !sounds[sound]) return;
  
  try {
    // Clone o som para permitir reproduções sobrepostas
    const soundClone = sounds[sound].cloneNode();
    
    // Para dispositivos móveis, é necessário uma interação do usuário antes de reproduzir sons
    // Por isso, usamos o padrão Promise para lidar com potenciais erros
    const playPromise = soundClone.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.error(`Erro ao tocar ${sound}:`, err);
      });
    }
  } catch (err) {
    console.error(`Erro ao clonar e tocar ${sound}:`, err);
  }
};

export const toggleSoundEnabled = () => {
  soundsEnabled = !soundsEnabled;
  return soundsEnabled;
};

export const isSoundEnabled = () => soundsEnabled;