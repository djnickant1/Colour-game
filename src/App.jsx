import React, { useState, useEffect, useCallback } from 'react';

// CVI-friendly high saturation colors
const COLORS = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Pink', hex: '#FF1493' },
  { name: 'White', hex: '#FFFFFF' }
];

const App = () => {
  const [started, setStarted] = useState(false);
  const [options, setOptions] = useState([]);
  const [target, setTarget] = useState(null);
  const [status, setStatus] = useState('playing'); 
  
  // Voice state
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // --- IMPROVED VOICE SEARCH LOGIC ---
      
      // 1. Look for specific High-Quality Female IOS/Mac voices
      // "Matilda" is the built-in high quality iOS voice.
      let bestVoice = availableVoices.find(voice => 
        voice.name === 'Matilda' || 
        voice.name === 'Matilda Premium' || 
        voice.name === 'Ava' ||
        voice.name === 'Ava Premium'
      );

      // 2. If not found, look for Google/Android High Quality
      if (!bestVoice) {
        bestVoice = availableVoices.find(voice => 
          voice.name.includes('Google US English')
        );
      }

      // 3. If not found, look for ANY voice marked "Enhanced", "Premium" or "Natural"
      if (!bestVoice) {
        bestVoice = availableVoices.find(voice => 
          (voice.name.includes('Enhanced') || 
           voice.name.includes('Premium') || 
           voice.name.includes('Natural')) &&
           voice.lang.startsWith('en')
        );
      }

      // 4. Fallback: Look for any female English voice
      if (!bestVoice) {
         bestVoice = availableVoices.find(voice => 
          (voice.name.includes('Female') || voice.name.includes('Victoria') || voice.name.includes('Susan')) && 
          voice.lang.startsWith('en')
        );
      }

      // 5. Absolute Fallback: The first English voice available
      if (!bestVoice) {
        bestVoice = availableVoices.find(voice => voice.lang.startsWith('en'));
      }

      setSelectedVoice(bestVoice || availableVoices[0]);
    };

    loadVoices();
    
    // iOS sometimes loads voices a second or two after the page loads
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Force a reload check after 1 second just in case (helps on older iPads)
    const timer = setTimeout(loadVoices, 1000);
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      clearTimeout(timer);
    };
  }, []);

  // Text-to-Speech Helper
  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // SPEECH RATE: 0.8 is 20% slower than normal. Very clear.
      utterance.rate = 0.8; 
      utterance.pitch = 1.0; 
      
      window.speechSynthesis.speak(utterance);
    }
  }, [selectedVoice]);

  const generateRound = useCallback(() => {
    setStatus('playing');
    
    const targetIndex = Math.floor(Math.random() * COLORS.length);
    const targetColor = COLORS[targetIndex];

    let distractorIndex;
    do {
      distractorIndex = Math.floor(Math.random() * COLORS.length);
    } while (distractorIndex === targetIndex);
    const distractorColor = COLORS[distractorIndex];

    const newOptions = Math.random() > 0.5 
      ? [targetColor, distractorColor] 
      : [distractorColor, targetColor];

    setTarget(targetColor);
    setOptions(newOptions);

    setTimeout(() => {
      speak(`Which colour is ${targetColor.name}?`);
    }, 800);

  }, [speak]);

  const handleStart = () => {
    setStarted(true);
    generateRound();
  };

  const handleChoice = (selectedColor) => {
    if (status === 'correct') return;

    if (selectedColor.name === target.name) {
      setStatus('correct');
      speak(`Yes! That is ${target.name}!`);
      
      setTimeout(() => {
        generateRound();
      }, 3000);

    } else {
      setStatus('wrong');
      speak(`Not quite. Try again.`);
      
      setTimeout(() => {
        setStatus('playing');
      }, 2000);
    }
  };

  if (!started) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white p-4 font-sans">
        <h1 className="text-4xl md:text-6xl font-bold mb-8 text-center text-yellow-400 tracking-wider">
          COLOUR GAME
        </h1>
        <button
          onClick={handleStart}
          className="bg-blue-600 hover:bg-blue-500 text-white text-3xl font-bold py-8 px-16 rounded-xl border-4 border-white transition-transform active:scale-95 shadow-[0_0_30px_rgba(0,0,255,0.5)]"
        >
          START
        </button>
        <p className="mt-8 text-gray-400 text-lg text-center">
          {voices.length > 0 
            ? "Audio Ready" 
            : "Loading voices..."}
        </p>
        {/* This helps you verify if the iPad found Samantha */}
        <p className="text-xs text-gray-600 mt-4">
           Voice: {selectedVoice ? selectedVoice.name : 'Default'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col relative font-sans">
      <div className="h-24 min-h-[6rem] flex items-center justify-center bg-gray-900 border-b-2 border-gray-800 z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-widest uppercase">
          FIND <span style={{ color: target?.hex }}>{target?.name}</span>
        </h2>
      </div>

      <div className="flex-1 flex gap-4 p-4">
        {options.map((color, index) => (
          <button
            key={index}
            onClick={() => handleChoice(color)}
            style={{ backgroundColor: color.hex }}
            className={`
              flex-1 rounded-2xl transition-all duration-200
              border-4 border-transparent
              active:scale-[0.98]
              ${status === 'wrong' && color.name !== target.name ? 'opacity-30 scale-95' : 'opacity-100'}
              ${status === 'correct' && color.name === target.name ? 'animate-pulse z-20 scale-105 border-white' : ''}
            `}
            aria-label={color.name}
          />
        ))}
      </div>

      {status === 'correct' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
           <div className="text-white font-black text-8xl md:text-9xl drop-shadow-[0_5px_5px_rgba(0,0,0,1)] animate-bounce">
             YES!
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
