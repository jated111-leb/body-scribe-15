import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInvitationRequest {
  invitationToken: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitationToken, userId }: AcceptInvitationRequest = await req.json();

    if (!invitationToken || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Validate invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("client_invitations")
      .select("*")
      .eq("invitation_token", invitationToken)
      .eq("status", "pending")
      .single();

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseAdmin
        .from("client_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return new Response(
        JSON.stringify({ error: "Invitation has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create dietician-client relationship
    const { error: relationshipError } = await supabaseAdmin
      .from("dietician_clients")
      .insert({
        dietician_id: invitation.dietician_id,
        client_id: userId,
        status: "active"
      });

    if (relationshipError) {
      console.error("Error creating relationship:", relationshipError);
      return new Response(
        JSON.stringify({ error: "Failed to create relationship" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update invitation status
    const { error: updateError } = await supabaseAdmin
      .from("client_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString()
      })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Error updating invitation:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, dieticianId: invitation.dietician_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in accept-invitation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
