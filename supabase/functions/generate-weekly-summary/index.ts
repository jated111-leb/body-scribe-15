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
      // Return a gentle message instead of throwing
      return new Response(
        JSON.stringify({
          success: true,
          summary: {
            user_id: targetUserId,
            week_start_date: startDate.toISOString().split('T')[0],
            week_end_date: endDate.toISOString().split('T')[0],
            summary_text: "Unable to access your health signals for this week. Please ensure you have logged some activities.",
            total_events: 0,
            meal_count: 0,
            workout_count: 0,
            medication_count: 0,
            generated_at: new Date().toISOString(),
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log(`Found ${events?.length || 0} events for the week`);

    // Handle case with no events gracefully
    if (!events || events.length === 0) {
      console.log("No events found - generating minimal summary");
      const minimalSummary = `This week shows a quiet rhythm. No health signals were recorded between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}.\n\nConsider logging meals, movement, or moments to help Aura understand your patterns better. Even small entries create meaningful insights over time.`;
      
      const summaryData = {
        user_id: targetUserId,
        week_start_date: startDate.toISOString().split('T')[0],
        week_end_date: endDate.toISOString().split('T')[0],
        summary_text: minimalSummary,
        total_events: 0,
        meal_count: 0,
        workout_count: 0,
        medication_count: 0,
        generated_at: new Date().toISOString(),
      };

      // Try to save minimal summary
      await supabaseClient
        .from("weekly_summaries")
        .upsert(summaryData, {
          onConflict: 'user_id,week_start_date',
          ignoreDuplicates: false
        });

      return new Response(
        JSON.stringify({
          success: true,
          summary: summaryData,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

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

    let aiResponse;
    try {
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `You are Aura, a calm intelligence layer that transforms health signals into understanding.

Your role is to create a weekly rhythm summary that:
1. Opens with observation of the week's steadiness and flow
2. Surfaces meaningful patterns - not just activity counts
3. Notes connections between nutrition, movement, and vitality
4. Reflects on consistency and rhythm (not "good" or "bad")
5. Offers 2-3 gentle, informed suggestions for alignment
6. Closes with calm encouragement about progress

Tone: Poetic precision. Professional grace. Human, not clinical. Observational, not judgmental.
Style: Use clear paragraphs (not bullet points). Write as if composing a reflection letter.
Length: 250-350 words.

Remember: You're not a tracker - you're an understanding engine. Focus on patterns, rhythms, and meaningful signals.`
            },
            {
              role: "user",
              content: userContext
            }
          ],
        }),
      });
    } catch (fetchError) {
      console.error("Network error calling AI:", fetchError);
      // Return a fallback summary
      return new Response(
        JSON.stringify({
          success: true,
          summary: {
            user_id: targetUserId,
            week_start_date: startDate.toISOString().split('T')[0],
            week_end_date: endDate.toISOString().split('T')[0],
            summary_text: `Your week showed ${events?.length || 0} health signals. Unable to generate detailed insights at this time - please try again.`,
            total_events: events?.length || 0,
            meal_count: mealCount,
            workout_count: workoutCount,
            medication_count: medicationCount,
            generated_at: new Date().toISOString(),
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      // Handle rate limit specifically
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Rate limit reached. Please wait a moment and try again.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      // Return fallback summary for other AI errors
      return new Response(
        JSON.stringify({
          success: true,
          summary: {
            user_id: targetUserId,
            week_start_date: startDate.toISOString().split('T')[0],
            week_end_date: endDate.toISOString().split('T')[0],
            summary_text: `This week captured ${events?.length || 0} health moments across ${mealCount} meals, ${workoutCount} workouts, and ${medicationCount} medication logs. Your rhythm is being observed, though detailed insights are temporarily unavailable.`,
            total_events: events?.length || 0,
            meal_count: mealCount,
            workout_count: workoutCount,
            medication_count: medicationCount,
            generated_at: new Date().toISOString(),
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const aiData = await aiResponse.json();
    const summaryText = aiData.choices[0]?.message?.content || "Unable to generate summary";

    console.log("Summary generated successfully");

    // Save summary to database with proper conflict resolution
    const summaryData = {
      user_id: targetUserId,
      week_start_date: startDate.toISOString().split('T')[0],
      week_end_date: endDate.toISOString().split('T')[0],
      summary_text: summaryText,
      total_events: events?.length || 0,
      meal_count: mealCount,
      workout_count: workoutCount,
      medication_count: medicationCount,
      generated_at: new Date().toISOString(),
    };

    console.log("Saving summary to database...");
    
    const { data: summary, error: saveError } = await supabaseClient
      .from("weekly_summaries")
      .upsert(summaryData, {
        onConflict: 'user_id,week_start_date',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      // Still return success with the generated summary even if save fails
      return new Response(
        JSON.stringify({
          success: true,
          summary: {
            ...summaryData,
            id: 'temp-' + Date.now(),
          },
          warning: "Summary generated but not saved to database",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
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
