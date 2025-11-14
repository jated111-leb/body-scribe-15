import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateSummaryRequest {
  userId?: string; // Optional: for dieticians generating summary for their clients
  weekStartDate: string; // ISO date string
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("User error:", userError);
      throw new Error("Unauthorized");
    }

    const { userId, weekStartDate }: GenerateSummaryRequest = await req.json();
    const targetUserId = userId || user.id;

    console.log("Generating summary for user:", targetUserId, "week:", weekStartDate);

    // Calculate week end date
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      throw new Error("Failed to load profile");
    }

    // Fetch timeline events for the week
    const { data: events, error: eventsError } = await supabaseClient
      .from("timeline_events")
      .select("*")
      .eq("user_id", targetUserId)
      .gte("event_date", startDate.toISOString())
      .lte("event_date", endDate.toISOString())
      .order("event_date", { ascending: true });

    if (eventsError) {
      console.error("Events error:", eventsError);
      throw new Error("Failed to load events");
    }

    console.log(`Found ${events?.length || 0} events for the week`);

    // Calculate stats
    const mealCount = events?.filter(e => e.event_type === "meal").length || 0;
    const workoutCount = events?.filter(e => e.event_type === "workout").length || 0;
    const medicationCount = events?.filter(e => e.event_type === "medication").length || 0;

    // Prepare context for AI
    const userContext = `
User Profile:
- Name: ${profile.full_name || "Unknown"}
- Age: ${profile.age || "N/A"}
- Sex: ${profile.sex || "N/A"}
- Height: ${profile.height ? `${profile.height} cm` : "N/A"}
- Weight: ${profile.weight ? `${profile.weight} kg` : "N/A"}
- Health Conditions: ${profile.health_conditions?.join(", ") || "None"}
- Medications: ${profile.medications?.join(", ") || "None"}
- Goals: ${profile.goals?.join(", ") || "None"}

Week Summary (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}):
- Total Events: ${events?.length || 0}
- Meals Logged: ${mealCount}
- Workouts: ${workoutCount}
- Medications: ${medicationCount}

Detailed Events:
${events?.map(e => `
  - ${e.event_date}: ${e.event_type.toUpperCase()} - ${e.title}
    ${e.description ? `Description: ${e.description}` : ""}
    ${e.meal_type ? `Meal Type: ${e.meal_type}` : ""}
    ${e.calories ? `Calories: ${e.calories}` : ""}
    ${e.activity_type ? `Activity: ${e.activity_type}` : ""}
    ${e.duration ? `Duration: ${e.duration} minutes` : ""}
    ${e.intensity ? `Intensity: ${e.intensity}` : ""}
`).join("\n") || "No events logged this week"}
    `.trim();

    console.log("Calling Lovable AI...");

    // Generate summary using Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional health and wellness assistant. Create a comprehensive, personalized weekly health summary. 

Your summary should:
1. Start with an engaging overview of the week
2. Highlight key achievements and positive patterns
3. Analyze nutrition habits if meals were logged
4. Comment on exercise and activity levels
5. Note medication adherence
6. Identify areas for improvement
7. Provide 2-3 actionable recommendations
8. End with encouraging words

Keep the tone professional yet friendly, informative yet motivating. Use bullet points for clarity. Limit to 300-400 words.`
          },
          {
            role: "user",
            content: userContext
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summaryText = aiData.choices[0]?.message?.content || "Unable to generate summary";

    console.log("Summary generated successfully");

    // Save summary to database
    const { data: summary, error: saveError } = await supabaseClient
      .from("weekly_summaries")
      .upsert({
        user_id: targetUserId,
        week_start_date: startDate.toISOString().split('T')[0],
        week_end_date: endDate.toISOString().split('T')[0],
        summary_text: summaryText,
        total_events: events?.length || 0,
        meal_count: mealCount,
        workout_count: workoutCount,
        medication_count: medicationCount,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error("Failed to save summary");
    }

    console.log("Summary saved to database:", summary.id);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-weekly-summary:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate summary",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
