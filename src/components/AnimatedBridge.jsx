import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { User, Building, ShieldCheck } from 'lucide-react';
import { cn } from './cn';

// Helper to calculate the quadratic Bezier y coordinate (ranges from 5 to 10 in SVG viewBox coordinates)
const getBezierY = (t) => {
  return 10 * (1 - 2 * t + 2 * t * t);
};

const AnimatedBridge = ({ status = 'safe', activeTrigger, className }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [dots, setDots] = useState([]);
  const setuControls = useAnimation();

  // Colors based on status
  const colors = {
    safe: { stroke: '#75E6CC', glow: 'rgba(117, 230, 204, 0.5)' },
    flagged: { stroke: '#E58766', glow: 'rgba(229, 135, 102, 0.5)' },
    blocked: { stroke: '#F47C7C', glow: 'rgba(244, 124, 124, 0.5)' },
  };

  const currentColor = colors[status] || colors.safe;

  // 1. Detect user motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // 2. Play center Setu shield flash/ripple effect
  const triggerShieldFlash = (dotColor) => {
    setuControls.start({
      scale: [1, 1.3, 0.95, 1],
      boxShadow: [
        `0 0 0px ${dotColor.glow}`,
        `0 0 40px 10px ${dotColor.glow}`,
        `0 0 10px 2px ${dotColor.glow}`,
        `0 0 0px ${dotColor.glow}`
      ],
      borderColor: ['rgba(117, 230, 204, 0.3)', dotColor.stroke, 'rgba(117, 230, 204, 0.3)'],
      transition: { duration: 0.7, ease: "easeOut" }
    });
  };

  // 3. Spawn dot on active trigger (scam checker / transaction monitor action)
  useEffect(() => {
    if (activeTrigger) {
      const isThreat = status === 'blocked' || status === 'flagged';
      const newDot = {
        id: `trigger-${Date.now()}-${Math.random()}`,
        status,
        color: currentColor,
        size: isThreat ? 7 : 5, // Threat dots are slightly larger
        duration: isThreat ? 1.6 : 2.0, // Threat dots slow down as they approach the center
      };
      setDots(prev => [...prev, newDot]);
    }
  }, [activeTrigger, status]);

  // 4. Ambient background dots to keep the bridge alive (every 3.5s if not prefers reduced motion)
  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      // 85% safe green dots, 15% suspicious amber dots
      const rand = Math.random();
      const dotStatus = rand > 0.85 ? 'flagged' : 'safe';
      const dotColor = colors[dotStatus];

      const newDot = {
        id: `ambient-${Date.now()}-${Math.random()}`,
        status: dotStatus,
        color: dotColor,
        size: dotStatus === 'flagged' ? 5.5 : 4,
        duration: dotStatus === 'flagged' ? 1.8 : 2.2,
      };

      setDots(prev => [...prev, newDot]);
    }, 3500);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  // Clean up completed dots
  const handleDotFinished = (id) => {
    setDots(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className={cn("relative w-full max-w-3xl mx-auto py-12 flex items-center justify-between", className)}>
      
      {/* Customer Node */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full cyber-panel flex items-center justify-center border-brand-primary/40 relative group">
          <div className="absolute inset-0 rounded-full bg-brand-primary/5 animate-pulse"></div>
          <User className="w-8 h-8 text-brand-text group-hover:text-brand-primary transition-colors" />
        </div>
        <span className="font-mono text-[10px] tracking-widest text-brand-text-muted">CUSTOMER</span>
      </div>

      {/* The Bridge */}
      <div className="flex-1 relative mx-4 h-32 flex items-center justify-center">
        {/* Background track line */}
        <svg className="absolute w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20">
          <path 
            d="M 0,10 Q 50,0 100,10" 
            fill="none" 
            stroke="rgba(117, 230, 204, 0.15)" 
            strokeWidth="0.75" 
            strokeDasharray="3,3"
          />
        </svg>

        {/* Animated pulsing path */}
        <svg className="absolute w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20">
          <motion.path 
            d="M 0,10 Q 50,0 100,10" 
            fill="none" 
            stroke={currentColor.stroke}
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: status === 'blocked' ? 0.5 : 1, 
              opacity: activeTrigger ? [0.4, 1, 0.4] : [0.2, 0.8, 0.2]
            }}
            transition={{
              pathLength: { duration: 1.5, ease: "easeInOut" },
              opacity: { duration: activeTrigger ? 0.8 : 2.5, repeat: activeTrigger ? 0 : Infinity, ease: "easeInOut" }
            }}
            style={{
              filter: `drop-shadow(0 0 6px ${currentColor.glow})`,
              willChange: 'opacity, filter'
            }}
          />

          {/* Render Multiple Live Dots with Comet Trails (SVG based for performance) */}
          {!prefersReducedMotion && dots.map((dot) => (
            <DotWithTrail 
              key={dot.id}
              dot={dot}
              onComplete={() => handleDotFinished(dot.id)}
              onHitCenter={() => triggerShieldFlash(dot.color)}
            />
          ))}
        </svg>

        {/* Fallback Single Dot (only rendered when prefers-reduced-motion is active) */}
        {prefersReducedMotion && (
          <motion.div 
            className="absolute w-3.5 h-3.5 rounded-full"
            style={{
              backgroundColor: currentColor.stroke,
              boxShadow: `0 0 12px 3px ${currentColor.glow}`,
              top: 'calc(50% - 7px)',
              willChange: 'left, opacity, scale, transform'
            }}
            initial={{ left: '0%' }}
            animate={{ 
              left: status === 'blocked' ? '50%' : '100%',
              opacity: status === 'blocked' ? [1, 0] : 1,
              scale: status === 'blocked' ? [1, 2, 0] : [1, 1.2, 1]
            }}
            transition={{
              duration: activeTrigger ? 1.0 : 1.8,
              ease: "easeInOut",
              repeat: status === 'blocked' ? 0 : Infinity,
              repeatDelay: 0.3
            }}
          />
        )}

        {/* Shield Icon in the center (The "Setu") */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <motion.div 
            animate={setuControls}
            initial={{
              boxShadow: `0 0 0px ${currentColor.glow}`,
              borderColor: 'rgba(117, 230, 204, 0.5)'
            }}
            className="w-12 h-12 rounded-full border border-brand-primary/30 flex items-center justify-center bg-brand-surface shadow-2xl"
          >
            <ShieldCheck className="w-6 h-6 text-brand-primary" style={{ color: status === 'blocked' ? currentColor.stroke : undefined }} />
          </motion.div>
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <span className="font-mono text-[9px] text-brand-primary uppercase tracking-widest font-bold">Setu Engine</span>
          </div>
        </div>
      </div>

      {/* Bank Node */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full cyber-panel flex items-center justify-center border-brand-primary/40 relative group">
          <div className="absolute inset-0 rounded-full bg-brand-primary/5 animate-pulse delay-100"></div>
          <Building className="w-8 h-8 text-brand-text group-hover:text-brand-primary transition-colors" />
        </div>
        <span className="font-mono text-[10px] tracking-widest text-brand-text-muted">IDBI BANK</span>
      </div>

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Component: Dot with trailing comet elements
// ─────────────────────────────────────────────────────────────────────────────
const DotWithTrail = ({ dot, onComplete, onHitCenter }) => {
  const [progress, setProgress] = useState(0);
  const isThreat = dot.status === 'blocked' || dot.status === 'flagged';
  const limit = isThreat ? 0.5 : 1.0;
  const hasTriggeredHit = useRef(false);

  useEffect(() => {
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const t = Math.min(1, elapsed / (dot.duration * 1000));
      
      // Calculate current t progress along the bridge
      // Easing curves: linear for safe dot, easeOut for threat dot to slow down
      const currentProgress = isThreat 
        ? (1 - Math.pow(1 - t, 3)) * limit // easeOutCubic deceleration towards the Setu Node
        : t * limit;

      setProgress(currentProgress);

      // Trigger Setu flash/deflect ripple exactly when the threat dot hits the center (progress >= 0.5)
      if (isThreat && currentProgress >= 0.49 && !hasTriggeredHit.current) {
        hasTriggeredHit.current = true;
        onHitCenter();
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [dot.duration, isThreat, limit]);

  // Trail dots - offsets behind the lead dot
  const trailOffsets = [0, 0.03, 0.06, 0.09, 0.12];

  return (
    <g>
      {trailOffsets.map((offset, index) => {
        const t = Math.max(0, progress - offset);
        if (t <= 0 || (isThreat && t >= 0.5)) return null;

        const cx = t * 100;
        const cy = getBezierY(t);

        // First item is the head dot, others are trailing comets
        const isHead = index === 0;
        const opacity = isHead 
          ? (isThreat && progress >= 0.48 ? 1 - (progress - 0.45) / 0.05 : 1) // fade out at center
          : (0.7 - index * 0.15) * (isThreat && progress >= 0.48 ? 1 - (progress - 0.45) / 0.05 : 1);

        const r = isHead 
          ? dot.size 
          : dot.size * (1 - index * 0.15);

        // Ripple/Deflect scale-up when threat dot explodes at Setu Node
        const scaleEffect = isThreat && isHead && progress >= 0.48 
          ? 1.5 
          : 1.0;

        return (
          <circle
            key={index}
            cx={`${cx}%`}
            cy={`${cy}%`}
            r={r * scaleEffect}
            fill={dot.color.stroke}
            opacity={opacity}
            style={{
              filter: isHead ? `drop-shadow(0 0 4px ${dot.color.glow})` : 'blur(0.5px)',
              willChange: 'cx, cy, opacity, r'
            }}
          />
        );
      })}
    </g>
  );
};

export default AnimatedBridge;
