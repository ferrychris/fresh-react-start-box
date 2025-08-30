import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertTestData() {
  try {
    // Get current user for testing
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found. Please log in first.');
      process.exit(1);
    }
    
    console.log('Using user ID:', user.id);
    
    // Get a racer profile for testing
    const { data: racerProfiles, error: racerError } = await supabase
      .from('racer_profiles')
      .select('id')
      .limit(1);
      
    if (racerError || !racerProfiles || racerProfiles.length === 0) {
      console.error('No racer profiles found:', racerError);
      process.exit(1);
    }
    
    const racerId = racerProfiles[0].id;
    console.log('Using racer ID:', racerId);
    
    // Insert fan stats
    const { data: fanStats, error: statsError } = await supabase
      .from('fan_stats')
      .upsert({
        fan_id: user.id,
        support_points: 250,
        total_tips: 5,
        active_subscriptions: 2,
        activity_streak: 7
      }, { onConflict: 'fan_id' })
      .select();
      
    if (statsError) {
      console.error('Error inserting fan stats:', statsError);
    } else {
      console.log('Fan stats inserted:', fanStats);
    }
    
    // Insert fan favorite racers
    const { data: favoriteRacers, error: favoritesError } = await supabase
      .from('fan_favorite_racers')
      .upsert({
        fan_id: user.id,
        racer_id: racerId,
        last_tipped: new Date().toISOString(),
        total_tipped: 1500,
        subscription_tier: 'VIP'
      }, { onConflict: 'fan_id, racer_id' })
      .select();
      
    if (favoritesError) {
      console.error('Error inserting favorite racers:', favoritesError);
    } else {
      console.log('Favorite racer inserted:', favoriteRacers);
    }
    
    // Insert fan activity entries
    const activities = [
      {
        fan_id: user.id,
        activity_type: 'tip',
        racer_id: racerId,
        racer_name: 'Test Racer',
        amount: 500,
        content: 'Great race last weekend!',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
      },
      {
        fan_id: user.id,
        activity_type: 'subscription',
        racer_id: racerId,
        racer_name: 'Test Racer',
        content: 'Subscribed to VIP tier',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
      },
      {
        fan_id: user.id,
        activity_type: 'comment',
        racer_id: racerId,
        racer_name: 'Test Racer',
        post_id: '00000000-0000-0000-0000-000000000000',
        comment_content: 'Looking forward to seeing you race this weekend!',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() // 5 days ago
      }
    ];
    
    const { data: activityData, error: activityError } = await supabase
      .from('fan_activity')
      .insert(activities)
      .select();
      
    if (activityError) {
      console.error('Error inserting fan activity:', activityError);
    } else {
      console.log('Fan activity inserted:', activityData);
    }
    
    console.log('Test data insertion complete!');
  } catch (error) {
    console.error('Error inserting test data:', error);
  }
}

insertTestData();
