// Test script for post creation and retrieval
import { createFanPost, supabase } from './lib/supabase';

// Define the FanPostData interface here to avoid import issues
interface FanPostData {
  fan_id: string;
  content: string;
  media_urls: string[];
  post_type: 'text' | 'photo' | 'video' | 'gallery';
  visibility: 'public' | 'fans_only';
}

interface TestResult {
  success: boolean;
  createdPost?: unknown;
  retrievedPost?: unknown;
  error?: unknown;
}

const testPostCreation = async (): Promise<TestResult> => {
  try {
    console.log('Testing post creation and retrieval...');
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No authenticated user found. Please sign in first.');
      return { success: false, error: 'No authenticated user found' };
    }
    
    console.log('Using authenticated user:', user.id);
    
    // Create a test post
    const testPostData: FanPostData = {
      fan_id: user.id,
      content: 'This is a test post from the integration test',
      media_urls: ['https://placehold.co/600x400?text=TestPhoto'],
      post_type: 'photo',
      visibility: 'public'
    };
    
    console.log('Creating test post...');
    const { data: created, error: createErr } = await createFanPost(testPostData);
    if (createErr || !created) {
      console.error('Create post failed:', createErr);
      return { success: false, error: createErr };
    }
    console.log('Post created successfully:', created);
    
    // Directly fetch the created post instead of loading all posts
    console.log('Fetching created post...');
    const { data: retrieved, error: fetchErr } = await supabase
      .from('racer_posts')
      .select(`
        id,
        content,
        media_urls,
        created_at,
        post_type,
        visibility,
        user_id,
        user_type,
        racer_id
      `)
      .eq('id', (created as any).id)
      .single();
      
    if (fetchErr) {
      console.error('❌ Error fetching created post:', fetchErr);
      return { success: false, error: fetchErr };
    }
    
    if (retrieved) {
      console.log('✅ Post successfully retrieved:', retrieved);
      console.log('✅ Post creation and retrieval test passed!');
    } else {
      console.error('❌ Created post not found in database');
      return { success: false, error: 'Post not found' };
    }
    
    return { success: true, createdPost: created, retrievedPost: retrieved };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
};

// Make the test function available in the global scope for browser testing
declare global {
  interface Window {
    testPostCreation: () => Promise<TestResult>;
  }
}

// Execute the test when this script is run directly
if (typeof window !== 'undefined') {
  console.log('Run this test in the browser console to test post integration');
  window.testPostCreation = testPostCreation;
  console.log('To run the test, execute: testPostCreation()');
}

export { testPostCreation };
