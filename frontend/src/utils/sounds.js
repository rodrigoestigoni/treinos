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
    
    try {
      sounds.exerciseComplete = new Audio('/sounds/exercise-complete.wav');
      sounds.restComplete = new Audio('/sounds/rest-complete.wav');  
      sounds.countdown = new Audio('/sounds/countdown.wav');
      sounds.workoutComplete = new Audio('/sounds/workout-complete.wav');
      sounds.tick = new Audio('/sounds/tick.wav');
      sounds.finalTick = new Audio('/sounds/final-tick.wav');
      sounds.notification = new Audio('/sounds/notification.mp3');
      
      // Pré-carregar
      Object.values(sounds).forEach(sound => {
        if (sound) sound.load();
      });
      
      soundsLoaded = true;
    } catch (error) {
      console.error('Erro ao carregar sons:', error);
    }
  };
  
  export const playSound = (sound) => {
    if (!soundsEnabled || !sounds[sound]) return;
    
    // Clone o som para permitir reproduções sobrepostas
    const soundClone = sounds[sound].cloneNode();
    
    soundClone.play().catch(err => {
      console.error(`Erro ao tocar ${sound}:`, err);
    });
  };
  
  export const toggleSoundEnabled = () => {
    soundsEnabled = !soundsEnabled;
    return soundsEnabled;
  };
  
  export const isSoundEnabled = () => soundsEnabled;