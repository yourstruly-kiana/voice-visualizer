'use client';

import React, { useState, useRef, useEffect } from 'react';
import './globals.css'; 

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
    <div className="w-full">
      <h1 className="text-4xl font-bold text-center my-4">Voice Visualizer</h1>
      <p className="text-center mb-8">Speak or make sounds to see the visualization</p>
      {/* Client component wrapper to avoid hydration issues */}      <ClientVisualizer />
      </div>    </main>
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
  const circlesRef = useRef<{ x: number; y: number; size: number; hue: number; opacity: number }[]>([]);

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

    const draw = () => {
      // Ensure canvas is full width/height
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas with a semi-transparent black overlay for fading effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add new circles based on frequency data
      for (let i = 0; i < bufferLength; i++) {
        const frequencyValue = dataArray[i];
        const normalizedValue = frequencyValue / 255; // Normalize to 0-1

        // Random position for the circle
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;

        // Circle size based on frequency
        const circleSize = normalizedValue * 100;

        // HSL color based on frequency
        const hue = (i / bufferLength) * 360;

        // Add new circle to the array
        circlesRef.current.push({ x, y, size: circleSize, hue, opacity: 1 });
      }

      // Draw and update circles
      for (let i = circlesRef.current.length - 1; i >= 0; i--) {
        const circle = circlesRef.current[i];
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${circle.hue}, 100%, 50%, ${circle.opacity})`;
        ctx.fill();

        // Reduce opacity for fading effect
        circle.opacity -= 0.1;

        // Remove circle if fully faded
        if (circle.opacity <= 0) {
          circlesRef.current.splice(i, 1);
        }
      }

      // Continue the animation
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  useEffect(() => {
    return () => {
      // Clean up on unmount
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
        style={{
          display: micStarted ? 'block' : 'none',
          width: '100%',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          backgroundColor: 'black',
        }}
      />
    </div>
  );
};