import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Map, 
  Sparkles, 
  Target,
  Clock,
  CheckCircle2,
  BookOpen,
  Code,
  Users,
  ExternalLink,
  Loader2,
  Calendar
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  type: "course" | "project" | "practice" | "networking";
  resources: { name: string; url: string; type: string }[];
  estimatedHours: number;
}

interface Phase {
  id: string;
  name: string;
  duration: string;
  description: string;
  skills: string[];
  tasks: Task[];
}

interface Roadmap {
  title: string;
  description: string;
  totalWeeks: number;
  phases: Phase[];
  milestones: { week: number; title: string; description: string }[];
}

const taskTypeIcons = {
  course: BookOpen,
  project: Code,
  practice: Target,
  networking: Users,
};

export default function CareerRoadmap() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [targetRole, setTargetRole] = useState(profile?.target_role || "");
  const [skills, setSkills] = useState(profile?.skills?.join(", ") || "");
  const [timeframe, setTimeframe] = useState("6 months");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const { data: savedGoals, isLoading: goalsLoading } = useQuery({
    queryKey: ["careerGoals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("career_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-roadmap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            targetRole,
            currentSkills: skills.split(",").map(s => s.trim()).filter(Boolean),
            experienceYears: profile?.experience_years || 0,
            timeframe,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate roadmap");
      }

      return response.json();
    },
    onSuccess: async (data: Roadmap) => {
      setRoadmap(data);
      setExpandedPhase(data.phases[0]?.id || null);

      // Save to database
      if (user?.id) {
        await supabase.from("career_goals").insert({
          user_id: user.id,
          title: `${targetRole} Roadmap`,
          description: data.description,
          roadmap: data as any,
        });
        queryClient.invalidateQueries({ queryKey: ["careerGoals", user.id] });
      }

      toast.success("Roadmap generated successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    },
  });

  const loadSavedRoadmap = (goal: any) => {
    if (goal.roadmap) {
      setRoadmap(goal.roadmap as Roadmap);
      setExpandedPhase(goal.roadmap.phases?.[0]?.id || null);
      setTargetRole(goal.title.replace(" Roadmap", ""));
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Map className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Career Roadmap</h1>
          </div>
          <p className="text-muted-foreground">
            Generate a personalized learning path to reach your career goals.
          </p>
        </motion.div>

        {/* Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard>
            <Tabs defaultValue="generate">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="generate" className="flex-1">Generate New</TabsTrigger>
                <TabsTrigger value="saved" className="flex-1">
                  Saved Roadmaps ({savedGoals?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generate">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Target Role</Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g., Full Stack Developer"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Current Skills</Label>
                    <Input
                      placeholder="HTML, CSS, JavaScript"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Timeframe</Label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3 months">3 months</SelectItem>
                        <SelectItem value="6 months">6 months</SelectItem>
                        <SelectItem value="9 months">9 months</SelectItem>
                        <SelectItem value="12 months">12 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={!targetRole.trim() || generateMutation.isPending}
                  className="w-full mt-6 gradient-bg border-0 h-12"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Roadmap...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Personalized Roadmap
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="saved">
                {goalsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : savedGoals && savedGoals.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {savedGoals.map((goal) => (
                      <motion.div
                        key={goal.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 rounded-xl bg-secondary/50 cursor-pointer transition-colors hover:bg-secondary"
                        onClick={() => loadSavedRoadmap(goal)}
                      >
                        <h3 className="font-semibold mb-1">{goal.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {goal.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(goal.created_at).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No saved roadmaps yet. Generate one above!
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </GlassCard>
        </motion.div>

        {/* Roadmap Display */}
        <AnimatePresence mode="wait">
          {roadmap && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Overview */}
              <GlassCard>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{roadmap.title}</h2>
                    <p className="text-muted-foreground">{roadmap.description}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-sm">
                    <Clock className="h-4 w-4" />
                    {roadmap.totalWeeks} weeks
                  </div>
                </div>
                <Progress value={0} className="h-2" />
              </GlassCard>

              {/* Phases */}
              <div className="space-y-4">
                {roadmap.phases.map((phase, index) => {
                  const isExpanded = expandedPhase === phase.id;
                  const TaskIcon = taskTypeIcons[phase.tasks?.[0]?.type || "course"];

                  return (
                    <motion.div
                      key={phase.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <GlassCard
                        className="cursor-pointer"
                        onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-primary-foreground font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{phase.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {phase.duration} • {phase.tasks?.length || 0} tasks
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {phase.skills?.slice(0, 3).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded-full bg-secondary text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-6 space-y-4"
                            >
                              <p className="text-muted-foreground">{phase.description}</p>

                              <div className="space-y-3">
                                {phase.tasks?.map((task) => {
                                  const Icon = taskTypeIcons[task.type] || BookOpen;
                                  return (
                                    <div
                                      key={task.id}
                                      className="p-4 rounded-xl bg-secondary/50"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                          <Icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <h4 className="font-medium">{task.title}</h4>
                                            <span className="text-xs text-muted-foreground">
                                              ~{task.estimatedHours}h
                                            </span>
                                          </div>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            {task.description}
                                          </p>
                                          {task.resources?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {task.resources.map((resource, i) => (
                                                <a
                                                  key={i}
                                                  href={resource.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <ExternalLink className="h-3 w-3" />
                                                  {resource.name}
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>

              {/* Milestones */}
              {roadmap.milestones && roadmap.milestones.length > 0 && (
                <GlassCard>
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    Key Milestones
                  </h3>
                  <div className="space-y-4">
                    {roadmap.milestones.map((milestone, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-accent">
                          W{milestone.week}
                        </div>
                        <div>
                          <h4 className="font-medium">{milestone.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!roadmap && !generateMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <GlassCard className="text-center py-16">
              <Map className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Create Your Career Roadmap</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Enter your target role and skills above to generate a personalized 
                learning path with courses, projects, and milestones.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
