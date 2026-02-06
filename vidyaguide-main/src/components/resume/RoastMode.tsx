import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, 
  Sparkles, 
  RefreshCw,
  ThumbsUp,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RoastResult {
  roast_score: number;
  headline: string;
  roasts: {
    emoji: string;
    roast: string;
    advice: string;
  }[];
  final_verdict: string;
  silver_linings: string[];
}

interface RoastModeProps {
  resumeText: string;
  targetRole?: string;
  isRoastMode: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function RoastMode({ resumeText, targetRole, isRoastMode, onToggle, className }: RoastModeProps) {
  const [isRoasting, setIsRoasting] = useState(false);
  const [result, setResult] = useState<RoastResult | null>(null);

  const handleRoast = async () => {
    if (!resumeText.trim()) {
      toast.error("Please add your resume first!");
      return;
    }

    setIsRoasting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roast-resume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ resumeText, targetRole }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Roast failed");
      }

      const data = await response.json();
      setResult(data);
      toast.success("🔥 Roast complete!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to roast resume");
    } finally {
      setIsRoasting(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Toggle */}
      <GlassCard className={cn(
        "transition-all duration-300",
        isRoastMode && "border-orange-500/50 bg-gradient-to-br from-orange-500/5 to-red-500/5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
              isRoastMode 
                ? "bg-gradient-to-br from-orange-500 to-red-500" 
                : "bg-secondary"
            )}>
              <Flame className={cn(
                "h-5 w-5",
                isRoastMode ? "text-white" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <Label htmlFor="roast-mode" className="text-base font-semibold cursor-pointer">
                🔥 Roast Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Get brutally honest (but helpful) feedback
              </p>
            </div>
          </div>
          <Switch 
            id="roast-mode"
            checked={isRoastMode}
            onCheckedChange={onToggle}
          />
        </div>

        <AnimatePresence>
          {isRoastMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <Button
                onClick={handleRoast}
                disabled={!resumeText.trim() || isRoasting}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0 text-white"
              >
                {isRoasting ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Roasting...
                  </>
                ) : (
                  <>
                    <Flame className="h-5 w-5 mr-2" />
                    Roast My Resume 🔥
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Results */}
      <AnimatePresence>
        {result && isRoastMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Roast Score */}
            <GlassCard className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">🔥 Roast Score</h3>
                <div className="relative h-4 rounded-full bg-secondary overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.roast_score}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-red-500"
                  />
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  {result.roast_score}/100
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.roast_score >= 70 ? "Actually pretty fire! 🔥" :
                   result.roast_score >= 50 ? "Not bad, but needs some heat" :
                   "Needs serious work, friend 😅"}
                </p>
              </div>
            </GlassCard>

            {/* Headline */}
            <GlassCard className="border-orange-500/30">
              <p className="text-xl font-bold text-center">
                "{result.headline}"
              </p>
            </GlassCard>

            {/* Roasts */}
            <GlassCard className="border-orange-500/30">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-orange-500" />
                The Roast
              </h3>
              <div className="space-y-4">
                {result.roasts.map((roast, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{roast.emoji}</span>
                      <div>
                        <p className="font-medium text-orange-600 dark:text-orange-400">
                          {roast.roast}
                        </p>
                        <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
                          <Lightbulb className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>{roast.advice}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Silver Linings */}
            <GlassCard className="border-accent/30 bg-accent/5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <ThumbsUp className="h-5 w-5 text-accent" />
                Silver Linings
              </h3>
              <ul className="space-y-2">
                {result.silver_linings.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            {/* Final Verdict */}
            <GlassCard className="border-orange-500/30">
              <h3 className="font-semibold mb-2">🎤 Final Verdict</h3>
              <p className="text-lg italic text-muted-foreground">
                "{result.final_verdict}"
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
