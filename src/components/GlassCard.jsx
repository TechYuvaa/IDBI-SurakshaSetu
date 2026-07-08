import { motion } from 'framer-motion';
import { cn } from './cn';

const GlassCard = ({ children, className, hover = true, glow = false, ...props }) => {
  return (
    <motion.div 
      whileHover={hover ? { 
        y: -4,
        scale: 1.01,
        boxShadow: "0 0 25px rgba(117, 230, 204, 0.15)",
        borderColor: "rgba(117, 230, 204, 0.4)"
      } : {}}
      whileTap={hover ? { scale: 0.99 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "cyber-panel rounded-lg overflow-hidden relative transition-colors duration-300",
        glow && "before:absolute before:inset-0 before:bg-brand-primary/5 before:blur-xl before:-z-10",
        className
      )}
      {...props}
    >
      {/* Decorative subtle border highlight at the top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent"></div>
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
