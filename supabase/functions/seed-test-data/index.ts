import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const WORKOUT_TYPES = ['running', 'cycling', 'swimming', 'weights', 'yoga', 'hiit'];
const INTENSITIES = ['low', 'moderate', 'high'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMealEvent(userId: string, date: Date) {
  const mealType = randomElement(MEAL_TYPES);
  const meals = {
    breakfast: ['Oatmeal with berries', 'Eggs and toast', 'Greek yogurt parfait', 'Smoothie bowl'],
    lunch: ['Grilled chicken salad', 'Turkey sandwich', 'Buddha bowl', 'Soup and salad'],
    dinner: ['Salmon with vegetables', 'Pasta primavera', 'Stir-fry with tofu', 'Grilled steak'],
    snack: ['Apple with peanut butter', 'Protein bar', 'Mixed nuts', 'Hummus and veggies']
  };
  
  return {
    user_id: userId,
    event_type: 'meal',
    title: randomElement(meals[mealType as keyof typeof meals]),
    meal_type: mealType,
    calories: randomInt(200, 800),
    protein: randomInt(10, 50),
    carbs: randomInt(20, 100),
    fats: randomInt(5, 40),
    event_date: date.toISOString(),
  };
}

function generateWorkoutEvent(userId: string, date: Date) {
  const activityType = randomElement(WORKOUT_TYPES);
  return {
    user_id: userId,
    event_type: 'workout',
    title: `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} session`,
    activity_type: activityType,
    duration: randomInt(20, 90),
    calories_burned: randomInt(150, 600),
    intensity: randomElement(INTENSITIES),
    event_date: date.toISOString(),
  };
}

function generateSymptomEvent(userId: string, date: Date) {
  const symptoms = [
    { title: 'Headache', severity: 'moderate' },
    { title: 'Fatigue', severity: 'mild' },
    { title: 'Stomach discomfort', severity: 'mild' },
    { title: 'Muscle soreness', severity: 'moderate' },
    { title: 'Good energy levels', severity: 'positive' },
  ];
  const symptom = randomElement(symptoms);
  
  return {
    user_id: userId,
    event_type: 'symptom',
    title: symptom.title,
    severity: symptom.severity,
    event_date: date.toISOString(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { clientCount = 3, dieticianCount = 1, eventsPerUser = 30 } = await req.json().catch(() => ({}));

    const createdUsers: { email: string; password: string; role: string; userId: string }[] = [];
    const password = 'TestPassword123!';
    let firstDieticianId: string | null = null;

    // Delete existing test users first
    console.log('Cleaning up existing test users...');
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    for (const user of existingUsers?.users || []) {
      if (user.email?.endsWith('@test.local')) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        console.log(`Deleted existing test user: ${user.email}`);
      }
    }

    // Create dieticians with predictable emails
    for (let i = 0; i < dieticianCount; i++) {
      const email = `testdietician${i + 1}@test.local`;
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `Test Dietician ${i + 1}` }
      });

      if (authError) {
        console.error('Error creating dietician:', authError);
        continue;
      }

      const userId = authUser.user.id;
      if (i === 0) firstDieticianId = userId;

      createdUsers.push({ email, password, role: 'dietician', userId });

      // Assign dietician role
      await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: 'dietician' });

      // Update profile
      await supabaseAdmin.from('profiles').update({
        full_name: `Test Dietician ${i + 1}`,
        role_selected: true,
        onboarding_completed: true
      }).eq('id', userId);

      // Create dietician profile
      await supabaseAdmin.from('dietician_profiles').insert({
        user_id: userId,
        practice_name: `Wellness Practice ${i + 1}`,
        specialty_areas: ['Weight Management', 'Sports Nutrition'],
        years_experience: randomInt(3, 15),
        bio: 'Experienced nutrition professional dedicated to helping clients achieve their health goals.'
      });

      console.log(`Created dietician: ${email}`);
    }

    // Create clients with predictable emails
    for (let i = 0; i < clientCount; i++) {
      const email = `testclient${i + 1}@test.local`;
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `Test Client ${i + 1}` }
      });

      if (authError) {
        console.error('Error creating client:', authError);
        continue;
      }

      const userId = authUser.user.id;
      createdUsers.push({ email, password, role: 'client', userId });

      // Assign client role
      await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: 'client' });

      // Update profile with health data
      await supabaseAdmin.from('profiles').update({
        full_name: `Test Client ${i + 1}`,
        role_selected: true,
        onboarding_completed: true,
        age: randomInt(25, 55),
        height: randomInt(155, 190),
        weight: randomInt(55, 95),
        sex: randomElement(['male', 'female']),
        goals: [randomElement(['Lose weight', 'Build muscle', 'Improve energy', 'Better sleep'])],
        health_conditions: Math.random() > 0.7 ? [randomElement(['None', 'Mild allergies'])] : null,
      }).eq('id', userId);

      // Generate timeline events for the past 30 days
      const events = [];
      for (let day = 0; day < eventsPerUser; day++) {
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() - randomInt(0, 30));
        eventDate.setHours(randomInt(6, 22), randomInt(0, 59));

        const eventType = randomElement(['meal', 'meal', 'meal', 'workout', 'symptom']);
        
        if (eventType === 'meal') {
          events.push(generateMealEvent(userId, eventDate));
        } else if (eventType === 'workout') {
          events.push(generateWorkoutEvent(userId, eventDate));
        } else {
          events.push(generateSymptomEvent(userId, eventDate));
        }
      }

      if (events.length > 0) {
        await supabaseAdmin.from('timeline_events').insert(events);
      }

      // Link to first dietician if exists
      if (firstDieticianId) {
        await supabaseAdmin.from('dietician_clients').insert({
          dietician_id: firstDieticianId,
          client_id: userId,
          status: 'active'
        });
      }

      console.log(`Created client: ${email}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${createdUsers.filter(u => u.role === 'dietician').length} dieticians and ${createdUsers.filter(u => u.role === 'client').length} clients`,
        users: createdUsers.map(u => ({ email: u.email, password: u.password, role: u.role }))
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in seed-test-data:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
