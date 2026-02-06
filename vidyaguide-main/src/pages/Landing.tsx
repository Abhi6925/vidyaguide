import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  FileText, 
  MessageSquare, 
  Map, 
  BarChart3, 
  Target,
  ArrowRight,
  CheckCircle2,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const features = [
  {
    icon: FileText,
    title: "AI Resume Analyzer",
    description: "Get instant ATS scores, detailed feedback, and AI-powered rewrites to land more interviews.",
    gradient: "from-primary to-purple-500",
  },
  {
    icon: MessageSquare,
    title: "Personal AI Mentor",
    description: "Chat with SkillNest, your AI career coach. Get personalized advice on careers, interviews, and skills.",
    gradient: "from-accent to-teal-400",
  },
  {
    icon: Map,
    title: "Career Roadmaps",
    description: "Generate personalized learning paths with courses, projects, and milestones to reach your goals.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Track your growth with beautiful visualizations. See your skills improve over time.",
    gradient: "from-pink-500 to-rose-500",
  },
];

const benefits = [
  "Increase interview callbacks by 3x",
  "Identify skill gaps instantly",
  "Get personalized career advice 24/7",
  "Track your professional growth",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 mesh-gradient -z-10" />
      
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Navigation */}
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SkillNest</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gradient-bg border-0">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="container mx-auto px-4 pt-16 pb-32">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8"
            >
              <Star className="h-4 w-4 fill-primary" />
              <span className="text-sm font-medium">AI-Powered Career Planning</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Your Personal
              <span className="block gradient-text">AI Career Mentor</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Plan your career, analyze your resume, identify skill gaps, and get personalized 
              mentorship—all powered by AI.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="gradient-bg border-0 h-14 px-8 text-lg glow">
                  Start Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span className="text-sm">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Floating elements */}
        <motion.div
          className="absolute top-32 left-10 h-20 w-20 rounded-2xl gradient-bg opacity-20 blur-xl"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-32 right-10 h-32 w-32 rounded-full bg-accent opacity-10 blur-2xl"
          animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </header>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="gradient-text"> Level Up</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive AI tools designed to accelerate your career growth
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard hover className="h-full">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative max-w-4xl mx-auto"
          >
            <GlassCard className="text-center py-16 px-8 glow">
              <Target className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Career?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                Join thousands of professionals using AI to advance their careers faster than ever.
              </p>
              <Link to="/register">
                <Button size="lg" className="gradient-bg border-0 h-14 px-10 text-lg">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">SkillNest</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 SkillNest. Your AI-powered career companion.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
