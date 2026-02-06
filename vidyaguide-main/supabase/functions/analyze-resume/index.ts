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
    const { resumeText, targetRole, skills } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const systemPrompt = `You are SkillNest, an expert career coach and resume analyst. Analyze the provided resume against the target role and provide actionable feedback.

You must respond with a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "atsScore": <number 0-100>,
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "suggestions": "detailed paragraph of suggestions",
  "rewrittenResume": "improved version of the resume with action verbs and quantified achievements"
}

Scoring guidelines:
- 90-100: Excellent match, ATS optimized, strong keywords
- 70-89: Good foundation, minor improvements needed
- 50-69: Average, significant gaps to address
- Below 50: Needs major revision

Focus on:
1. ATS optimization (keywords, formatting)
2. Action verbs and quantified achievements
3. Skills alignment with target role
4. Industry-specific terminology
5. Clear, concise bullet points`;

    const userPrompt = `Analyze this resume for the role of "${targetRole}":

RESUME:
${resumeText}

CANDIDATE'S LISTED SKILLS:
${skills?.join(", ") || "Not provided"}

Provide comprehensive analysis and a rewritten version.`;

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Provide a fallback response
      analysis = {
        atsScore: 65,
        strengths: ["Resume submitted for analysis"],
        improvements: ["Unable to parse detailed analysis, please try again"],
        missingSkills: [],
        suggestions: "Please try resubmitting your resume for a detailed analysis.",
        rewrittenResume: resumeText,
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Resume analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
