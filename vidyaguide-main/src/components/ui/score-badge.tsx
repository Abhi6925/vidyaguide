import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = "md", showLabel = true }: ScoreBadgeProps) {
  const getScoreStyle = () => {
    if (score >= 90) return "score-excellent";
    if (score >= 70) return "score-good";
    if (score >= 50) return "score-average";
    return "score-poor";
  };

  const getScoreLabel = () => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Average";
    return "Needs Work";
  };

  const sizeClasses = {
    sm: "h-12 w-12 text-lg",
    md: "h-20 w-20 text-2xl",
    lg: "h-28 w-28 text-4xl",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={cn(
          "rounded-full flex items-center justify-center font-bold",
          getScoreStyle(),
          sizeClasses[size]
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn("font-medium text-sm", getScoreStyle().replace("bg-", "text-").replace("/10", ""))}>
          {getScoreLabel()}
        </span>
      )}
    </div>
  );
}
