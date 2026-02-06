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
    const { resumeText, targetRole } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    if (!resumeText) {
      throw new Error("Resume text is required");
    }

    const systemPrompt = `You are a hilarious but helpful resume critic. Your job is to ROAST the user's resume in a fun, sarcastic, and witty way - but always with constructive advice hidden inside the humor.

Your roast style should be:
- Playfully savage but never mean-spirited
- Full of pop culture references and memes
- Using funny analogies and comparisons
- Sarcastic observations about common resume mistakes
- Ending each roast point with actual helpful advice

You must respond with a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "roast_score": <number 0-100, where 100 = resume is fire, 0 = resume needs serious help>,
  "headline": "A funny one-liner summarizing the resume (be creative!)",
  "roasts": [
    {
      "emoji": "🔥",
      "roast": "The sarcastic observation",
      "advice": "The actual helpful tip"
    }
  ],
  "final_verdict": "A funny but encouraging closing statement",
  "silver_linings": ["Something genuinely good about the resume"]
}

Example roasts:
- "Your resume has more buzzwords than a LinkedIn influencer on caffeine. 'Synergistic team player'? Just say you work well with others!"
- "This resume is drier than a textbook. Where's the personality? Even my toaster has more spark!"
- "You've listed every technology since the dial-up era. Focus on what's actually relevant!"

Remember: Be funny, but actually helpful. The goal is to make them laugh AND improve their resume.`;

    const userPrompt = `Roast this resume${targetRole ? ` for someone trying to become a ${targetRole}` : ''}:

${resumeText}

Give me your funniest yet most helpful roast! 🔥`;

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
        temperature: 0.9, // Higher temperature for more creative/funny responses
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
    let roast;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        roast = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      roast = {
        roast_score: 50,
        headline: "Your resume walked into a bar... and the bar fell asleep 😴",
        roasts: [
          {
            emoji: "🤷",
            roast: "Our AI roaster got stage fright. Try again!",
            advice: "Resubmit and we'll deliver the fire content you deserve."
          }
        ],
        final_verdict: "Even our AI couldn't roast this one. That's either really good or really concerning!",
        silver_linings: ["You have a resume! That's a start!"]
      };
    }

    return new Response(JSON.stringify(roast), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Resume roast error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
