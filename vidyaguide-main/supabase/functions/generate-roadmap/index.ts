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
    const { targetRole, currentSkills, experienceYears, timeframe } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const systemPrompt = `You are SkillNest, an expert career coach. Generate a personalized career roadmap.

You must respond with a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "title": "Roadmap title",
  "description": "Brief description of the journey",
  "totalWeeks": <number>,
  "phases": [
    {
      "id": "phase-1",
      "name": "Phase name",
      "duration": "X weeks",
      "description": "Phase description",
      "skills": ["skill1", "skill2"],
      "tasks": [
        {
          "id": "task-1",
          "title": "Task title",
          "description": "Task description",
          "type": "course" | "project" | "practice" | "networking",
          "resources": [
            {
              "name": "Resource name",
              "url": "https://example.com",
              "type": "video" | "article" | "course" | "book"
            }
          ],
          "estimatedHours": <number>
        }
      ]
    }
  ],
  "milestones": [
    {
      "week": <number>,
      "title": "Milestone title",
      "description": "Milestone description"
    }
  ]
}

Create a realistic, actionable roadmap with:
1. Clear phases (Beginner → Intermediate → Advanced → Job Ready)
2. Specific, achievable weekly tasks
3. Mix of learning, projects, and networking
4. Real resources (Coursera, Udemy, YouTube channels, books)
5. Portfolio-building projects
6. Industry-relevant milestones`;

    const userPrompt = `Create a career roadmap for:

TARGET ROLE: ${targetRole}
CURRENT SKILLS: ${currentSkills?.join(", ") || "None specified"}
EXPERIENCE: ${experienceYears || 0} years
TIMEFRAME: ${timeframe || "6 months"}

Generate a comprehensive, phase-by-phase roadmap with weekly tasks, projects, courses, and milestones.`;

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
    let roadmap;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        roadmap = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to generate roadmap. Please try again.");
    }

    return new Response(JSON.stringify(roadmap), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Roadmap generation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
