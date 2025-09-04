// Test Supabase connection and createFanPost function
import { supabase } from './lib/supabase/client';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  
  // Test 1: Basic connection
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
    console.log('✅ Basic connection successful');
  } catch (err) {
    console.error('❌ Network error:', err);
    return false;
  }

  // Test 2: Auth session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Auth session error:', error);
    } else {
      console.log('✅ Auth session:', session ? 'Active' : 'None');
    }
  } catch (err) {
    console.error('❌ Auth error:', err);
  }

  // Test 3: racer_posts table structure
  try {
    const { data, error } = await supabase
      .from('racer_posts')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ racer_posts table access failed:', error);
      return false;
    }
    console.log('✅ racer_posts table accessible');
  } catch (err) {
    console.error('❌ racer_posts table error:', err);
    return false;
  }

  return true;
};

// Test createFanPost with mock data
export const testCreateFanPost = async (userId: string) => {
  console.log('🔍 Testing createFanPost...');
  
  const testPost = {
    fan_id: userId,
    content: 'Test post from connection test',
    media_urls: [],
    post_type: 'text',
    visibility: 'public'
  };

  try {
    const { data, error } = await supabase.from('racer_posts').insert([{
      content: testPost.content,
      media_urls: testPost.media_urls,
      post_type: testPost.post_type,
      visibility: testPost.visibility,
      user_id: testPost.fan_id,
      user_type: 'fan',
      allow_tips: false,
      total_tips: 0
    }]).select();
    
    if (error) {
      console.error('❌ createFanPost test failed:', error);
      return null;
    }
    
    console.log('✅ createFanPost test successful:', data[0]);
    return data[0];
  } catch (err) {
    console.error('❌ createFanPost exception:', err);
    return null;
  }
};

// Run tests
export const runAllTests = async () => {
  console.log('🚀 Starting Supabase diagnostics...');
  
  const connectionOk = await testSupabaseConnection();
  if (!connectionOk) {
    console.log('❌ Connection tests failed. Check your environment variables and network.');
    return;
  }
  
  // For testing createFanPost, we need a user ID
  // This would typically come from auth session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) {
    await testCreateFanPost(session.user.id);
  } else {
    console.log('⚠️ No authenticated user - skipping createFanPost test');
  }
  
  console.log('🏁 Diagnostics complete');
};
