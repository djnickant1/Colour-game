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
      // "Samantha" is the built-in high quality iOS voice.
      let bestVoice = availableVoices.find(voice => 
        voice.name === 'Samantha' || 
        voice.name === 'Samantha Enhanced' || 
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
    if ('speechSynthesis' in
