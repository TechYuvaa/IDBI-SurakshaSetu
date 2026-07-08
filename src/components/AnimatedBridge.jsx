import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { User, Building, ShieldCheck } from 'lucide-react';
import { cn } from './cn';

const AnimatedBridge = ({ status = 'safe', activeTrigger, className }) => {
  const controls = useAnimation();

  // Colors based on status
  const colors = {
    safe: { stroke: '#75E6CC', glow: 'rgba(117, 230, 204, 0.5)' },
    flagged: { stroke: '#E58766', glow: 'rgba(229, 135, 102, 0.5)' },
    blocked: { stroke: '#F47C7C', glow: 'rgba(244, 124, 124, 0.5)' },
  };

  const currentColor = colors[status] || colors.safe;

  // Whenever a new event arrives (activeTrigger changes), trigger a flash animation
  useEffect(() => {
    if (activeTrigger) {
      controls.start({
        scale: [1, 1.25, 1],
        boxShadow: [
          `0 0 0px ${currentColor.glow}`,
          `0 0 35px 8px ${currentColor.glow}`,
          `0 0 0px ${currentColor.glow}`
        ],
        borderColor: ['rgba(117, 230, 204, 0.5)', currentColor.stroke, 'rgba(117, 230, 204, 0.5)'],
        transition: { duration: 0.8, ease: "easeOut" }
      });
    }
  }, [activeTrigger, status, currentColor.glow, currentColor.stroke, controls]);

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
              filter: `drop-shadow(0 0 6px ${currentColor.glow})`
            }}
          />
        </svg>

        {/* Traveling Dot */}
        <motion.div 
          className="absolute w-3.5 h-3.5 rounded-full"
          style={{
            backgroundColor: currentColor.stroke,
            boxShadow: `0 0 12px 3px ${currentColor.glow}`,
            top: 'calc(50% - 7px)',
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

        {/* Shield Icon in the center (The "Setu") */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <motion.div 
            animate={controls}
            initial={{
              boxShadow: `0 0 0px ${currentColor.glow}`,
              borderColor: 'rgba(117, 230, 204, 0.5)'
            }}
            className="w-12 h-12 rounded-full border border-brand-primary/30 flex items-center justify-center bg-brand-surface shadow-2xl"
          >
            <ShieldCheck className="w-6 h-6 text-brand-primary animate-pulse" style={{ color: status === 'blocked' ? currentColor.stroke : undefined }} />
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

export default AnimatedBridge;
