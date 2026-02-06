import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  FileText, 
  MessageSquare, 
  Map, 
  TrendingUp, 
  Target,
  ArrowRight,
  Sparkles,
  Zap,
  Briefcase,
  GraduationCap,
  BookOpen,
  Code
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleBadge } from "@/components/ui/role-badge";

const studentActions = [
  {
    icon: Map,
    title: "Learning Roadmap",
    description: "Build skills for your dream role",
    path: "/roadmap",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: "Craft your first resume",
    path: "/resume",
    gradient: "from-primary to-purple-500",
  },
  {
    icon: MessageSquare,
    title: "Ask SkillNest",
    description: "Get career guidance",
    path: "/mentor",
    gradient: "from-accent to-teal-400",
  },
];

const jobSeekerActions = [
  {
    icon: Briefcase,
    title: "Job Match",
    description: "ATS score your applications",
    path: "/job-match",
    gradient: "from-primary to-purple-500",
  },
  {
    icon: FileText,
    title: "Resume Analyzer",
    description: "Optimize for ATS",
    path: "/resume",
    gradient: "from-accent to-teal-400",
  },
  {
    icon: MessageSquare,
    title: "Interview Prep",
    description: "Practice with AI mentor",
    path: "/mentor",
    gradient: "from-amber-500 to-orange-500",
  },
];

export default function Dashboard() {
  const { profile, isLoading: profileLoading } = useProfile();
  const { user } = useAuth();

  const isStudent = profile?.role === "student";
  const quickActions = isStudent ? studentActions : jobSeekerActions;

  const { data: recentAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ["recentAnalysis", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("resume_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: recentJobMatch } = useQuery({
    queryKey: ["recentJobMatch", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("job_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id && !isStudent,
  });

  const { data: skillsProgress, isLoading: skillsLoading } = useQuery({
    queryKey: ["skillsProgress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("skill_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("current_level", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const isLoading = profileLoading || analysisLoading || skillsLoading;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-medium">Welcome back</span>
                </div>
                {profile?.role && (
                  <RoleBadge role={profile.role as "student" | "job_seeker"} size="sm" />
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">
                Hello, {profile?.full_name?.split(" ")[0] || "there"}! 👋
              </h1>
              <p className="text-muted-foreground max-w-xl">
                {isStudent 
                  ? profile?.target_role 
                    ? `Building your path to becoming a ${profile.target_role}. Keep learning!`
                    : "Ready to start your career journey? Set your target role in settings!"
                  : profile?.target_role 
                    ? `Let's land that ${profile.target_role} position. Your next opportunity awaits!`
                    : "Ready to find your dream job? Let's optimize your profile!"}
              </p>
            </div>
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </GlassCard>
        </motion.div>

        {/* Stats Row */}
        <div className="grid sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="text-center">
              <div className="h-12 w-12 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-primary-foreground" />
              </div>
              <p className="text-3xl font-bold text-primary">
                {profile?.career_readiness_score || 0}%
              </p>
              <p className="text-muted-foreground text-sm">
                {isStudent ? "Learning Progress" : "Career Readiness"}
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <GlassCard className="text-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent to-teal-400 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-accent">
                {isStudent 
                  ? (recentAnalysis?.ats_score || "--")
                  : (recentJobMatch?.ats_score || recentAnalysis?.ats_score || "--")
                }
              </p>
              <p className="text-muted-foreground text-sm">
                {isStudent ? "Resume Score" : "Latest Match Score"}
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="text-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
                {isStudent ? (
                  <BookOpen className="h-6 w-6 text-white" />
                ) : (
                  <Zap className="h-6 w-6 text-white" />
                )}
              </div>
              <p className="text-3xl font-bold text-amber-500">
                {skillsProgress?.length || 0}
              </p>
              <p className="text-muted-foreground text-sm">
                {isStudent ? "Skills Learning" : "Skills Tracked"}
              </p>
            </GlassCard>
          </motion.div>
        </div>

        {/* Role-specific message */}
        {isStudent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <GlassCard className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Student Mode Active</h3>
                  <p className="text-sm text-muted-foreground">
                    Focus on building skills, completing projects, and preparing for your first role. 
                    Your dashboard is optimized for learning and growth.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {isStudent ? "Start Learning" : "Quick Actions"}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <Link to={action.path}>
                  <GlassCard hover className="h-full group cursor-pointer">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                    <div className="flex items-center text-primary text-sm font-medium">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Skills Progress */}
        {isLoading ? (
          <CardSkeleton />
        ) : skillsProgress && skillsProgress.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {isStudent ? "Skills You're Learning" : "Skills Progress"}
                </h2>
                <Link to="/analytics">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {skillsProgress.map((skill) => (
                  <div key={skill.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{skill.skill_name}</span>
                      <span className="text-muted-foreground">
                        {skill.current_level}%
                      </span>
                    </div>
                    <Progress value={skill.current_level} className="h-2" />
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="text-center py-12">
              {isStudent ? (
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              ) : (
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              )}
              <h3 className="font-semibold text-lg mb-2">
                {isStudent ? "Start Your Learning Journey" : "No Skills Tracked Yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isStudent 
                  ? "Create a learning roadmap to track your progress toward your dream role."
                  : "Analyze your resume or create a career roadmap to start tracking skills."}
              </p>
              <Link to={isStudent ? "/roadmap" : "/resume"}>
                <Button className="gradient-bg border-0">
                  {isStudent ? "Create Roadmap" : "Analyze Resume"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
