// Simple console test script for post creation and retrieval
import { createFanPost, getFanPosts } from './lib/supabase';

// Define the FanPostData interface
interface FanPostData {
  fan_id: string;
  content: string;
  media_urls: string[];
  post_type: 'text' | 'photo' | 'video' | 'gallery';
  visibility: 'public' | 'fans_only';
}

// Make functions available globally for console testing
declare global {
  interface Window {
    testCreatePost: (userId: string, content: string) => Promise<any>;
    testGetPosts: () => Promise<any>;
  }
}

// Create a test post
window.testCreatePost = async (userId: string, content: string) => {
  try {
    console.log('Creating test post...');
    const testPostData: FanPostData = {
      fan_id: userId,
      content: content || 'Test post from console',
      media_urls: ['https://placehold.co/600x400?text=TestPhoto'],
      post_type: 'photo',
      visibility: 'public'
    };
    
    const createdPost = await createFanPost(testPostData);
    console.log('Post created successfully:', createdPost);
    return createdPost;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Get all posts
window.testGetPosts = async () => {
  try {
    console.log('Fetching posts...');
    const posts = await getFanPosts();
    console.log(`Retrieved ${posts.length} posts:`, posts);
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

console.log('Post test functions loaded. Available commands:');
console.log('1. testCreatePost(userId, content) - Create a test post');
console.log('2. testGetPosts() - Fetch all posts');
