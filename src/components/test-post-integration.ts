import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface TestResult {
  success: boolean;
  createdPost?: any;
  posts?: any[];
  error?: unknown;
}

/**
 * Test function for post creation and retrieval
 * This tests the integration between the frontend and Supabase backend
 */
export const testPostCreation = async (): Promise<TestResult> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to run this test');
      return { 
        success: false, 
        error: 'Authentication required: Please log in to run this test' 
      };
    }
    
    console.log('✅ User authenticated');
    
    // Create a test post
    const testContent = `Test post created at ${new Date().toISOString()}`;
    console.log(`Creating test post with content: "${testContent}"`);
    
    const { data: createdPost, error: createError } = await supabase
      .from('fan_posts')
      .insert({
        content: testContent,
        visibility: 'public',
        fan_id: user.id,
        media_urls: [],
        media_type: null,
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Failed to create test post:', createError);
      toast.error(`Post creation failed: ${createError.message}`);
      return { 
        success: false, 
        error: createError 
      };
    }
    
    console.log('✅ Test post created successfully:', createdPost);
    toast.success('Test post created successfully!');
    
    // Fetch posts to verify the post was created
    const { data: posts, error: fetchError } = await supabase
      .from('fan_posts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (fetchError) {
      console.error('Failed to fetch posts:', fetchError);
      toast.error(`Failed to fetch posts: ${fetchError.message}`);
      return { 
        success: true, 
        createdPost, 
        error: fetchError 
      };
    }
    
    console.log(`✅ Successfully fetched ${posts?.length || 0} recent posts`);
    
    // Check if our created post is in the results
    const foundPost = posts?.find(post => post.id === createdPost.id);
    
    if (foundPost) {
      console.log('✅ Created post was found in the fetched posts');
    } else {
      console.log('⚠️ Created post was not found in the fetched posts');
    }
    
    return {
      success: true,
      createdPost,
      posts
    };
    
  } catch (error) {
    console.error('Test execution error:', error);
    toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { 
      success: false, 
      error 
    };
  }
};
