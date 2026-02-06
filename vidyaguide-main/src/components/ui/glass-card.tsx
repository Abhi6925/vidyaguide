import { ReactNode, forwardRef } from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends MotionProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({ 
  children, 
  className, 
  hover = false,
  glow = false,
  onClick,
  ...motionProps 
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "glass-card p-6",
        hover && "transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        glow && "glow",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
});

GlassCard.displayName = "GlassCard";
