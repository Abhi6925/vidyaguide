import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const systemPrompt = `You are SkillNest, a warm, encouraging, and highly knowledgeable AI career mentor. You help students and professionals with:

1. **Career Planning**: Help users explore career paths, set goals, and create actionable plans
2. **Resume Improvement**: Provide specific, actionable feedback on resumes
3. **Interview Preparation**: Conduct mock interviews, provide tips, and review answers
4. **Skill Development**: Recommend courses, projects, and resources for skill building
5. **Job Search Strategy**: Help with job search strategies, networking tips, and application optimization
6. **Industry Insights**: Share knowledge about different industries, roles, and career transitions

Your personality:
- Warm and encouraging, like a supportive mentor
- Direct and actionable in your advice
- Use examples and specific recommendations
- Ask clarifying questions when needed
- Remember context from the conversation
- Use markdown for formatting when helpful (bullet points, bold, headers)

${userContext ? `User Context:
- Current Role: ${userContext.jobTitle || 'Not specified'}
- Target Role: ${userContext.targetRole || 'Not specified'}
- Skills: ${userContext.skills?.join(', ') || 'Not specified'}
- Experience: ${userContext.experienceYears || 0} years` : ''}

Start conversations warmly and guide users toward their career goals. Be specific and actionable in your recommendations.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Mentor chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
