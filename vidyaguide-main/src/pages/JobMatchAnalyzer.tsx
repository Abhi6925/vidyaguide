import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  FileText, 
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TrendingUp,
  Lightbulb,
  Copy,
  History
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PDFUpload } from "@/components/resume/PDFUpload";
import { toast } from "sonner";

interface JobMatchResult {
  ats_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  improvements: string[];
  rewrite_suggestions: string;
}

export default function JobMatchAnalyzer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [inputMethod, setInputMethod] = useState<"paste" | "upload" | "saved">("paste");

  // Fetch saved resumes
  const { data: savedResumes } = useQuery({
    queryKey: ["savedResumes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch analysis history
  const { data: history } = useQuery({
    queryKey: ["jobAnalysisHistory", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("job_analyses")
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-job-match`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ resumeText, jobDescription }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      return response.json();
    },
    onSuccess: async (data: JobMatchResult) => {
      setResult(data);
      
      // Save to database
      if (user?.id) {
        await supabase.from("job_analyses").insert({
          user_id: user.id,
          resume_text: resumeText,
          job_description: jobDescription,
          ats_score: data.ats_score,
          matched_keywords: data.matched_keywords,
          missing_keywords: data.missing_keywords,
          improvements: data.improvements,
          rewrite_suggestions: data.rewrite_suggestions,
        });
        
        queryClient.invalidateQueries({ queryKey: ["jobAnalysisHistory", user.id] });
      }

      toast.success("Job match analysis complete!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    },
  });

  const loadFromHistory = (analysis: any) => {
    setResumeText(analysis.resume_text);
    setJobDescription(analysis.job_description);
    setResult({
      ats_score: analysis.ats_score,
      matched_keywords: analysis.matched_keywords || [],
      missing_keywords: analysis.missing_keywords || [],
      improvements: analysis.improvements || [],
      rewrite_suggestions: analysis.rewrite_suggestions || "",
    });
  };

  const handlePDFExtracted = (text: string, fileName: string) => {
    setResumeText(text);
    setInputMethod("paste");
  };

  const selectSavedResume = (resume: any) => {
    setResumeText(resume.parsed_text);
    setInputMethod("paste");
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Job Match Analyzer</h1>
          </div>
          <p className="text-muted-foreground">
            Compare your resume against job descriptions and get ATS optimization tips.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard>
                <Tabs defaultValue="paste" onValueChange={(v) => setInputMethod(v as any)}>
                  <TabsList className="w-full mb-6">
                    <TabsTrigger value="paste" className="flex-1">Paste Resume</TabsTrigger>
                    <TabsTrigger value="upload" className="flex-1">Upload PDF</TabsTrigger>
                    {savedResumes && savedResumes.length > 0 && (
                      <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="paste" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Your Resume</Label>
                      <Textarea
                        placeholder="Paste your resume text here..."
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        className="min-h-[200px] resize-none"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="upload">
                    <PDFUpload onTextExtracted={handlePDFExtracted} />
                    {resumeText && (
                      <div className="mt-4 p-3 bg-accent/10 rounded-xl text-sm text-accent flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Resume text extracted and ready
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="saved">
                    {savedResumes && savedResumes.length > 0 ? (
                      <div className="space-y-3 max-h-[200px] overflow-y-auto">
                        {savedResumes.map((resume) => (
                          <div
                            key={resume.id}
                            onClick={() => selectSavedResume(resume)}
                            className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="font-medium">{resume.file_name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(resume.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No saved resumes yet
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <GlassCard>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Job Description
                    </Label>
                    <Textarea
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[200px] resize-none"
                    />
                  </div>

                  <Button
                    onClick={() => analyzeMutation.mutate()}
                    disabled={!resumeText.trim() || !jobDescription.trim() || analyzeMutation.isPending}
                    className="w-full gradient-bg border-0 h-12"
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Analyzing Match...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Analyze Job Match
                      </>
                    )}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>

            {/* History */}
            {history && history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GlassCard>
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <History className="h-5 w-5" />
                    Recent Analyses
                  </h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
                    {history.map((analysis) => (
                      <div
                        key={analysis.id}
                        onClick={() => loadFromHistory(analysis)}
                        className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm truncate flex-1">
                          {analysis.job_description.substring(0, 50)}...
                        </span>
                        <span className={`text-sm font-bold ${
                          analysis.ats_score >= 70 ? "text-accent" : 
                          analysis.ats_score >= 50 ? "text-warning" : "text-destructive"
                        }`}>
                          {analysis.ats_score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* ATS Score Circle */}
                  <GlassCard className="text-center">
                    <h3 className="text-lg font-semibold mb-4">ATS Match Score</h3>
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-40 h-40 transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-secondary"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 70}`}
                          strokeDashoffset={`${2 * Math.PI * 70 * (1 - result.ats_score / 100)}`}
                          strokeLinecap="round"
                          className={
                            result.ats_score >= 70 ? "text-accent" :
                            result.ats_score >= 50 ? "text-warning" : "text-destructive"
                          }
                          style={{ transition: "stroke-dashoffset 1s ease-out" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-4xl font-bold ${
                          result.ats_score >= 70 ? "text-accent" :
                          result.ats_score >= 50 ? "text-warning" : "text-destructive"
                        }`}>
                          {result.ats_score}%
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-4">
                      {result.ats_score >= 70 ? "Great match! Your resume aligns well with this job." :
                       result.ats_score >= 50 ? "Good potential. Some improvements recommended." :
                       "Needs work. Focus on adding missing keywords."}
                    </p>
                  </GlassCard>

                  {/* Matched Keywords */}
                  <GlassCard>
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      Matched Keywords ({result.matched_keywords.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.matched_keywords.map((keyword, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Missing Keywords */}
                  {result.missing_keywords.length > 0 && (
                    <GlassCard>
                      <h3 className="font-semibold flex items-center gap-2 mb-4">
                        <XCircle className="h-5 w-5 text-destructive" />
                        Missing Keywords ({result.missing_keywords.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.missing_keywords.map((keyword, i) => (
                          <span 
                            key={i} 
                            className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </GlassCard>
                  )}

                  {/* Improvements */}
                  <GlassCard>
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Improvements
                    </h3>
                    <ul className="space-y-3">
                      {result.improvements.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>

                  {/* Suggestions */}
                  {result.rewrite_suggestions && (
                    <GlassCard>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          AI Suggestions
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(result.rewrite_suggestions);
                            toast.success("Copied to clipboard!");
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/50 text-sm whitespace-pre-wrap">
                        {result.rewrite_suggestions}
                      </div>
                    </GlassCard>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GlassCard className="text-center py-16">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
                      <Briefcase className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Match</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Paste your resume and job description to see how well they match and get optimization tips.
                    </p>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
