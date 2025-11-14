import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  clientEmail: string;
  dieticianName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client with user's token for auth check
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );
    
    // Create admin client with service role for database operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("User error:", userError);
      throw new Error("Unauthorized");
    }

    console.log("User authenticated:", user.id);

    const { clientEmail, dieticianName }: InvitationRequest = await req.json();

    // Validate email
    if (!clientEmail || !clientEmail.includes("@")) {
      throw new Error("Invalid email address");
    }

    console.log("Creating invitation for:", clientEmail);

    // Create invitation record using admin client to bypass RLS
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("client_invitations")
      .insert({
        dietician_id: user.id,
        client_email: clientEmail,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Invitation creation error:", inviteError);
      throw new Error(`Failed to create invitation: ${inviteError.message}`);
    }

    console.log("Invitation created:", invitation.id);

    // Create invitation link
    const invitationUrl = `${Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "")}/invite?token=${invitation.invitation_token}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Life Tracker <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `${dieticianName} invited you to Life Tracker`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 40px 20px; border: 1px solid #e5e7eb; border-top: none; }
              .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .highlight { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">You're Invited!</h1>
              </div>
              <div class="content">
                <p>Hi there!</p>
                <p><strong>${dieticianName}</strong> has invited you to join Life Tracker as their client.</p>
                
                <div class="highlight">
                  <p style="margin: 0;"><strong>What is Life Tracker?</strong></p>
                  <p style="margin: 10px 0 0 0;">Life Tracker is a comprehensive health tracking platform that helps you monitor your fitness goals, nutrition, medications, and overall wellness. ${dieticianName} will be able to view your progress and provide personalized guidance.</p>
                </div>

                <p>Click the button below to accept the invitation and create your account:</p>
                
                <div style="text-align: center;">
                  <a href="${invitationUrl}" class="button">Accept Invitation</a>
                </div>

                <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:<br/>
                <a href="${invitationUrl}" style="color: #667eea; word-break: break-all;">${invitationUrl}</a></p>

                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">This invitation will expire in 7 days.</p>
              </div>
              <div class="footer">
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        invitationId: invitation.id,
        message: "Invitation sent successfully",
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
    console.error("Error in send-client-invitation:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send invitation",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
