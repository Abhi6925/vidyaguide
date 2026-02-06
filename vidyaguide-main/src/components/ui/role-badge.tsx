import { GraduationCap, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: "student" | "job_seeker";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RoleBadge({ role, size = "md", className }: RoleBadgeProps) {
  const isStudent = role === "student";
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-1.5 gap-2",
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-colors",
        isStudent 
          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" 
          : "bg-primary/10 text-primary",
        sizeClasses[size],
        className
      )}
    >
      {isStudent ? (
        <GraduationCap className={iconSizes[size]} />
      ) : (
        <Briefcase className={iconSizes[size]} />
      )}
      {isStudent ? "Student" : "Job Seeker"}
    </span>
  );
}
