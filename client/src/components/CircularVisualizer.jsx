import React, { useEffect, useRef } from 'react';
import { audioManager } from '../utils/audioManager';

const CircularVisualizer = ({ isSpeaking, isListening }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 60;
    
    const analyser = audioManager.getAnalyser();
    let dataArray;
    if (analyser) {
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      let values = [];
      if (analyser && isSpeaking) {
        analyser.getByteFrequencyData(dataArray);
        values = Array.from(dataArray).slice(0, 64); // take first 64 bins
      } else if (isListening) {
        // simulate listening activity slightly
        for (let i = 0; i < 64; i++) values.push(Math.random() * 30 + 10);
      } else {
        // idle state
        for (let i = 0; i < 64; i++) values.push(5);
      }

      const numBars = 64;
      const angleStep = (Math.PI * 2) / numBars;

      for (let i = 0; i < numBars; i++) {
        const val = values[i] || 5;
        const barHeight = (val / 255) * 60 + 5; // scale height
        
        const angle = i * angleStep;
        
        const x1 = cx + Math.cos(angle) * radius;
        const y1 = cy + Math.sin(angle) * radius;
        
        const x2 = cx + Math.cos(angle) * (radius + barHeight);
        const y2 = cy + Math.sin(angle) * (radius + barHeight);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        
        // Color changes based on state
        if (isSpeaking) {
          ctx.strokeStyle = `rgba(138, 43, 226, ${0.5 + (val/255)})`;
        } else if (isListening) {
          ctx.strokeStyle = `rgba(74, 222, 128, 0.7)`;
        } else {
          ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
        }

        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Draw center circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = isListening ? 'rgba(74, 222, 128, 0.1)' : (isSpeaking ? 'rgba(138, 43, 226, 0.1)' : 'rgba(255,255,255,0.05)');
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isSpeaking, isListening]);

  return (
    <div className="visualizer-container">
      <canvas ref={canvasRef} width={300} height={300} />
    </div>
  );
};

export default CircularVisualizer;
