import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subjects, availableHours, goal } = await req.json();

    // Fetch past study sessions for context
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 14);
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("task, duration, created_at")
      .eq("user_id", user.id)
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch recent daily tasks completion
    const { data: dailyTasks } = await supabase
      .from("daily_tasks")
      .select("subject, topic, completed, date")
      .eq("user_id", user.id)
      .gte("date", weekAgo.toISOString().split("T")[0])
      .order("date", { ascending: false })
      .limit(100);

    // Build history summary
    const subjectStats: Record<string, { totalTime: number; sessions: number; completed: number; total: number }> = {};
    sessions?.forEach((s) => {
      const key = s.task.toLowerCase();
      if (!subjectStats[key]) subjectStats[key] = { totalTime: 0, sessions: 0, completed: 0, total: 0 };
      subjectStats[key].totalTime += s.duration;
      subjectStats[key].sessions += 1;
    });
    dailyTasks?.forEach((t) => {
      const key = t.subject.toLowerCase();
      if (!subjectStats[key]) subjectStats[key] = { totalTime: 0, sessions: 0, completed: 0, total: 0 };
      subjectStats[key].total += 1;
      if (t.completed) subjectStats[key].completed += 1;
    });

    const historyContext = Object.entries(subjectStats)
      .map(([sub, s]) => `${sub}: ${Math.round(s.totalTime / 60)}min studied over ${s.sessions} sessions, ${s.completed}/${s.total} tasks completed`)
      .join("\n") || "No previous study history available.";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an intelligent study schedule generator. Create optimal study schedules based on user inputs and their past performance data.

Rules:
- Generate exact time slots starting from the current hour or next available hour
- Include 10-15 min breaks between study blocks
- Allocate MORE time to weak subjects (low completion rates, less study time)
- Allocate LESS time to strong subjects (high completion, more study time)
- Use study techniques: Deep Focus, Active Recall, Spaced Repetition, Practice Problems
- Be adaptive: if history shows poor performance in a subject, add extra review time
- Total scheduled time should match available hours closely

You MUST respond using the generate_schedule tool.`;

    const userPrompt = `Generate a study schedule with these inputs:
Subjects: ${subjects.join(", ")}
Available hours: ${availableHours}
Study goal: ${goal}

Past 2 weeks performance:
${historyContext}

Current time: ${new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_schedule",
              description: "Generate a structured study schedule with time slots and insights",
              parameters: {
                type: "object",
                properties: {
                  slots: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        time: { type: "string", description: "Start time like 09:00" },
                        endTime: { type: "string", description: "End time like 10:00" },
                        subject: { type: "string" },
                        duration: { type: "string", description: "e.g. 1h or 30min" },
                        type: { type: "string", description: "Study technique" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        reason: { type: "string", description: "Why this allocation" },
                      },
                      required: ["time", "endTime", "subject", "duration", "type", "priority"],
                    },
                  },
                  insights: {
                    type: "object",
                    properties: {
                      weakAreas: { type: "array", items: { type: "string" } },
                      strongAreas: { type: "array", items: { type: "string" } },
                      bestStudyTime: { type: "string" },
                      consistencyScore: { type: "number", description: "0-100" },
                      tips: { type: "array", items: { type: "string" } },
                    },
                    required: ["weakAreas", "strongAreas", "tips"],
                  },
                },
                required: ["slots", "insights"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_schedule" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
