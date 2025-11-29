import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: { authorization: authHeader },
      },
    });

    // Get the user from the auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Starting account deletion for user: ${user.id}`);

    // Create admin client for deletions
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete data in proper order to handle foreign key constraints
    const tablesToDelete = [
      'achievement_notifications',
      'achievement_progress',
      'achievements',
      'lifestyle_achievements',
      'lifestyle_focus',
      'inferred_patterns',
      'user_achievement_preferences',
      'weekly_summaries',
      'dietician_notes',
      'client_alerts',
      'dietician_clients',
      'client_invitations',
      'dietician_profiles',
      'timeline_events',
      'subscriptions',
      'user_roles',
      'profiles',
    ];

    for (const table of tablesToDelete) {
      let deleteQuery;
      
      // Special handling for tables with different user ID columns
      if (table === 'dietician_notes') {
        const { error } = await adminClient
          .from(table)
          .delete()
          .or(`dietician_id.eq.${user.id},client_id.eq.${user.id}`);
        if (error) console.error(`Error deleting from ${table}:`, error);
      } else if (table === 'dietician_clients') {
        const { error } = await adminClient
          .from(table)
          .delete()
          .or(`dietician_id.eq.${user.id},client_id.eq.${user.id}`);
        if (error) console.error(`Error deleting from ${table}:`, error);
      } else if (table === 'client_invitations') {
        const { error } = await adminClient
          .from(table)
          .delete()
          .eq('dietician_id', user.id);
        if (error) console.error(`Error deleting from ${table}:`, error);
      } else if (table === 'client_alerts') {
        const { error } = await adminClient
          .from(table)
          .delete()
          .or(`dietician_id.eq.${user.id},client_id.eq.${user.id}`);
        if (error) console.error(`Error deleting from ${table}:`, error);
      } else if (table === 'profiles') {
        // profiles uses 'id' not 'user_id'
        const { error } = await adminClient
          .from(table)
          .delete()
          .eq('id', user.id);
        if (error) console.error(`Error deleting from ${table}:`, error);
      } else {
        // Default: assume 'user_id' column
        const { error } = await adminClient
          .from(table)
          .delete()
          .eq('user_id', user.id);
        if (error) console.error(`Error deleting from ${table}:`, error);
      }
      
      console.log(`Deleted from ${table}`);
    }

    // Delete the auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      throw deleteAuthError;
    }

    console.log(`Successfully deleted account for user: ${user.id}`);

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in delete-user-account function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
