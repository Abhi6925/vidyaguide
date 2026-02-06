import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Target, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Copy,
  History
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PDFUpload } from "@/components/resume/PDFUpload";
import { RoastMode } from "@/components/resume/RoastMode";
import { toast } from "sonner";

interface AnalysisResult {
  atsScore: number;
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  suggestions: string;
  rewrittenResume: string;
}

export default function ResumeAnalyzer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isRoastMode, setIsRoastMode] = useState(false);
  const [inputMethod, setInputMethod] = useState<"paste" | "upload">("paste");

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["resumeHistory", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("resume_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            resumeText,
            targetRole,
            skills: skills.split(",").map(s => s.trim()).filter(Boolean),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      return response.json();
    },
    onSuccess: async (data: AnalysisResult) => {
      setResult(data);
      
      // Save to database
      if (user?.id) {
        await supabase.from("resume_analyses").insert({
          user_id: user.id,
          resume_text: resumeText,
          target_role: targetRole,
          ats_score: data.atsScore,
          strengths: data.strengths,
          improvements: data.improvements,
          missing_skills: data.missingSkills,
          suggestions: data.suggestions,
          rewritten_resume: data.rewrittenResume,
        });
        
        queryClient.invalidateQueries({ queryKey: ["resumeHistory", user.id] });
        queryClient.invalidateQueries({ queryKey: ["recentAnalysis", user.id] });
      }

      toast.success("Resume analyzed successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    },
  });

  const handleCopyResume = () => {
    if (result?.rewrittenResume) {
      navigator.clipboard.writeText(result.rewrittenResume);
      toast.success("Improved resume copied to clipboard!");
    }
  };

  const loadFromHistory = (analysis: any) => {
    setResumeText(analysis.resume_text);
    setTargetRole(analysis.target_role || "");
    setResult({
      atsScore: analysis.ats_score,
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      missingSkills: analysis.missing_skills || [],
      suggestions: analysis.suggestions || "",
      rewrittenResume: analysis.rewritten_resume || "",
    });
  };

  const handlePDFExtracted = (text: string, fileName: string) => {
    setResumeText(text);
    setInputMethod("paste");
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
            <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">AI Resume Analyzer</h1>
          </div>
          <p className="text-muted-foreground">
            Get instant ATS scores, detailed feedback, AI-powered improvements, or get roasted! 🔥
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <GlassCard>
              <Tabs defaultValue="input">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="input" className="flex-1">New Analysis</TabsTrigger>
                  <TabsTrigger value="upload" className="flex-1">Upload PDF</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="input" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Target Role</Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="role"
                        placeholder="e.g., Senior Frontend Developer"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Your Skills (comma-separated)</Label>
                    <Input
                      id="skills"
                      placeholder="React, TypeScript, Node.js, AWS"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resume">Resume Text</Label>
                    <Textarea
                      id="resume"
                      placeholder="Paste your resume text here..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="min-h-[250px] resize-none"
                    />
                  </div>

                  <Button
                    onClick={() => analyzeMutation.mutate()}
                    disabled={!resumeText.trim() || !targetRole.trim() || analyzeMutation.isPending || isRoastMode}
                    className="w-full gradient-bg border-0 h-12"
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Analyze Resume
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <PDFUpload onTextExtracted={handlePDFExtracted} />
                  {resumeText && (
                    <div className="p-3 bg-accent/10 rounded-xl text-sm text-accent flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Resume text extracted! Switch to "New Analysis" tab to continue.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history">
                  {historyLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading history...
                    </div>
                  ) : history && history.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
                      {history.map((analysis) => (
                        <motion.div
                          key={analysis.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                          onClick={() => loadFromHistory(analysis)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {analysis.target_role || "Resume Analysis"}
                            </span>
                            <span className={`text-sm font-bold ${
                              analysis.ats_score >= 70 ? "text-accent" : 
                              analysis.ats_score >= 50 ? "text-warning" : "text-destructive"
                            }`}>
                              {analysis.ats_score}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No previous analyses yet
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </GlassCard>

            {/* Roast Mode */}
            <RoastMode 
              resumeText={resumeText}
              targetRole={targetRole}
              isRoastMode={isRoastMode}
              onToggle={setIsRoastMode}
            />
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              {result && !isRoastMode ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Score Card */}
                  <GlassCard className="text-center">
                    <h3 className="text-lg font-semibold mb-4">ATS Score</h3>
                    <ScoreBadge score={result.atsScore} size="lg" />
                    <Progress 
                      value={result.atsScore} 
                      className="mt-6 h-3"
                    />
                  </GlassCard>

                  {/* Strengths */}
                  <GlassCard>
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {result.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>

                  {/* Improvements */}
                  <GlassCard>
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {result.improvements.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>

                  {/* Missing Skills */}
                  {result.missingSkills.length > 0 && (
                    <GlassCard>
                      <h3 className="font-semibold flex items-center gap-2 mb-4">
                        <XCircle className="h-5 w-5 text-destructive" />
                        Missing Skills for {targetRole}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.missingSkills.map((skill, i) => (
                          <span 
                            key={i} 
                            className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </GlassCard>
                  )}

                  {/* Improved Resume */}
                  {result.rewrittenResume && (
                    <GlassCard>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          AI-Improved Resume
                        </h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCopyResume}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/50 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto scrollbar-thin">
                        {result.rewrittenResume}
                      </div>
                    </GlassCard>
                  )}
                </motion.div>
              ) : !isRoastMode ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GlassCard className="text-center py-16">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Paste your resume and target role to get instant AI-powered feedback and improvements.
                    </p>
                  </GlassCard>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
