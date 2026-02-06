import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  FileText,
  Calendar
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function Analytics() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const { data: resumeAnalyses } = useQuery({
    queryKey: ["allAnalyses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("resume_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: skillsProgress } = useQuery({
    queryKey: ["allSkills", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("skill_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("current_level", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: careerGoals } = useQuery({
    queryKey: ["allGoals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("career_goals")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Transform data for charts
  const scoreData = resumeAnalyses?.map((analysis, index) => ({
    name: `Analysis ${index + 1}`,
    score: analysis.ats_score,
    date: new Date(analysis.created_at).toLocaleDateString(),
  })) || [];

  const skillsData = skillsProgress?.map((skill) => ({
    name: skill.skill_name,
    current: skill.current_level,
    target: skill.target_level,
  })) || [];

  const averageScore = resumeAnalyses?.length 
    ? Math.round(resumeAnalyses.reduce((acc, a) => acc + a.ats_score, 0) / resumeAnalyses.length)
    : 0;

  const totalSkills = skillsProgress?.length || 0;
  const avgSkillLevel = totalSkills
    ? Math.round(skillsProgress!.reduce((acc, s) => acc + s.current_level, 0) / totalSkills)
    : 0;

  const stats = [
    {
      icon: FileText,
      label: "Resume Analyses",
      value: resumeAnalyses?.length || 0,
      color: "from-primary to-purple-500",
    },
    {
      icon: TrendingUp,
      label: "Avg ATS Score",
      value: `${averageScore}%`,
      color: "from-accent to-teal-400",
    },
    {
      icon: Target,
      label: "Skills Tracked",
      value: totalSkills,
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: Calendar,
      label: "Career Goals",
      value: careerGoals?.length || 0,
      color: "from-pink-500 to-rose-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Track your career progress and growth over time.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard>
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* ATS Score Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="h-full">
              <h3 className="font-semibold mb-6">ATS Score Trend</h3>
              {scoreData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scoreData}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 90%)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(240, 5%, 46%)"
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(240, 5%, 46%)"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: "hsl(0, 0%, 100%)", 
                          border: "1px solid hsl(240, 10%, 90%)",
                          borderRadius: "0.5rem"
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(239, 84%, 67%)" 
                        fillOpacity={1}
                        fill="url(#scoreGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data yet. Analyze your resume to see trends.
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Skills Progress */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <GlassCard className="h-full">
              <h3 className="font-semibold mb-6">Skills Progress</h3>
              {skillsData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 90%)" />
                      <XAxis 
                        type="number" 
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        stroke="hsl(240, 5%, 46%)"
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(240, 5%, 46%)"
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: "hsl(0, 0%, 100%)", 
                          border: "1px solid hsl(240, 10%, 90%)",
                          borderRadius: "0.5rem"
                        }}
                      />
                      <Bar 
                        dataKey="current" 
                        fill="hsl(160, 84%, 39%)" 
                        radius={[0, 4, 4, 0]}
                        name="Current Level"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No skills tracked yet. Create a roadmap to get started.
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* Career Readiness */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold">Career Readiness Score</h3>
                <p className="text-sm text-muted-foreground">
                  Based on your profile completeness, skills, and resume quality
                </p>
              </div>
              <div className="text-4xl font-bold gradient-text">
                {profile?.career_readiness_score || 0}%
              </div>
            </div>
            <Progress value={profile?.career_readiness_score || 0} className="h-4" />
            
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-sm text-muted-foreground">Profile Completion</p>
                <p className="text-2xl font-bold mt-1">
                  {profile?.full_name && profile?.target_role ? "100%" : "50%"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-sm text-muted-foreground">Avg Skill Level</p>
                <p className="text-2xl font-bold mt-1">{avgSkillLevel}%</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-sm text-muted-foreground">Resume Score</p>
                <p className="text-2xl font-bold mt-1">{averageScore || "--"}%</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
