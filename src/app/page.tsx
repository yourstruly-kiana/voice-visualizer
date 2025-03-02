'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="w-full">
        <h1 className="text-4xl font-bold text-center my-4">Voice Visualizer</h1>
        <p className="text-center mb-8">Speak or make sounds to see the visualization</p>
        {/* Client component wrapper to avoid hydration issues */}
        <ClientVisualizer />
      </div>
    </main>
  );
}

// Client component wrapper
const ClientVisualizer = () => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) return null;
  
  return <Visualizer />;
};

// Visualizer component
const Visualizer = () => {
  const [micStarted, setMicStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const startMic = async () => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create analyzer
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      // Connect stream to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start visualization
      setMicStarted(true);
      drawVisualization();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please ensure you've granted permission.");
    }
  };

  const drawVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) return;
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const waveformData = new Uint8Array(bufferLength);
  
    const draw = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 100;
      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(waveformData);
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // Draw circular waveforms
      for (let i = 0; i < bufferLength; i++) {
        const frequencyValue = dataArray[i];
        const normalizedValue = frequencyValue / 255; // Normalize to 0-1
        
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
  
        // Circle size based on frequency
        const circleSize = normalizedValue * 100;
  
        // HSL color based on frequency
        const hue = (i / bufferLength) * 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(x, y, circleSize, 0, Math.PI * 2);
        ctx.fill();
      }
      animationRef.current = requestAnimationFrame(draw);
    };
  
    draw();
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="visualizer-container">
      {!micStarted && (
        <button 
          onClick={startMic}
          className="start-button"
        >
          Start Microphone
        </button>
      )}
      <canvas 
        ref={canvasRef} 
        className="visualization-canvas"
        style={{ display: micStarted ? 'block' : 'none' }}
      />
    </div>
  );
};