import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const RadialProgress = ({ value, max = 100, size = 200, strokeWidth = 15 }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    // Animate to value on load
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedValue / max) * circumference;

  // Determine color based on score (higher is better for safety score)
  let color = '#34D399'; // Success
  if (value < 50) color = '#F0555B'; // Danger
  else if (value < 80) color = '#F2994A'; // Warning

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background Circle */}
      <svg
        className="absolute transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(16, 30, 26, 0.8)"
          strokeWidth={strokeWidth}
          className="drop-shadow-lg"
        />
        
        {/* Animated Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 8px ${color}80)`
          }}
        />
      </svg>

      {/* Inner Content */}
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span 
          className="font-display font-bold text-5xl text-brand-text"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {value}
        </motion.span>
        <span className="font-mono text-xs text-brand-text-muted mt-1 uppercase tracking-widest">
          Safety Score
        </span>
      </div>
    </div>
  );
};

export default RadialProgress;
