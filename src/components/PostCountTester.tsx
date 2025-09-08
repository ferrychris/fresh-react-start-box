import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { checkPostCountSync, fixPostCounts, checkAllPostCounts, logPostCountStatus, PostCountStatus } from '@/utils/postCountDebugger';
import toast from 'react-hot-toast';

export const PostCountTester: React.FC = () => {
  const [testPostId, setTestPostId] = useState('');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<PostCountStatus[]>([]);

  const handleTestSinglePost = async () => {
    if (!testPostId.trim()) {
      toast.error('Please enter a post ID');
      return;
    }

    setTesting(true);
    try {
      const status = await checkPostCountSync(testPostId.trim());
      logPostCountStatus(status);
      setResults([status]);
      
      if (status.isSync) {
        toast.success('Post counts are synchronized!');
      } else {
        toast.error('Post counts are out of sync!');
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Failed to test post counts');
    } finally {
      setTesting(false);
    }
  };

  const handleTestAllPosts = async () => {
    setTesting(true);
    try {
      const statuses = await checkAllPostCounts(10);
      setResults(statuses);
      
      const outOfSync = statuses.filter(s => !s.isSync);
      
      console.group('All Posts Count Status');
      statuses.forEach(logPostCountStatus);
      console.groupEnd();
      
      if (outOfSync.length === 0) {
        toast.success('All post counts are synchronized!');
      } else {
        toast.error(`${outOfSync.length} posts have count mismatches`);
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Failed to test all post counts');
    } finally {
      setTesting(false);
    }
  };

  const handleFixPost = async (postId: string) => {
    try {
      await fixPostCounts(postId);
      toast.success('Post counts fixed!');
      
      // Re-test the post
      const status = await checkPostCountSync(postId);
      setResults(prev => prev.map(r => r.postId === postId ? status : r));
    } catch (error) {
      console.error('Fix failed:', error);
      toast.error('Failed to fix post counts');
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Post Count Synchronization Tester</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter post ID to test"
            value={testPostId}
            onChange={(e) => setTestPostId(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
          />
          <Button 
            onClick={handleTestSinglePost} 
            disabled={testing}
            variant="outline"
          >
            Test Single Post
          </Button>
        </div>
        
        <Button 
          onClick={handleTestAllPosts} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test All Recent Posts'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-white mb-3">Test Results:</h4>
          <div className="space-y-2">
            {results.map((result) => (
              <div 
                key={result.postId} 
                className={`p-3 rounded border ${
                  result.isSync 
                    ? 'bg-green-900/20 border-green-700' 
                    : 'bg-red-900/20 border-red-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-mono text-gray-300">
                      {result.postId.slice(0, 8)}...
                    </span>
                    <span className={`ml-2 text-sm ${result.isSync ? 'text-green-400' : 'text-red-400'}`}>
                      {result.isSync ? '✅ Synchronized' : '❌ Out of Sync'}
                    </span>
                  </div>
                  {!result.isSync && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleFixPost(result.postId)}
                    >
                      Fix Counts
                    </Button>
                  )}
                </div>
                
                {!result.isSync && (
                  <div className="mt-2 text-xs text-gray-400">
                    <div>Stored: L:{result.storedCounts.likes} U:{result.storedCounts.upvotes} C:{result.storedCounts.comments}</div>
                    <div>Actual: L:{result.actualCounts.likes} U:{result.actualCounts.upvotes} C:{result.actualCounts.comments}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>This tool helps verify that post like/upvote/comment counts are synchronized between the main posts table and the interaction tables.</p>
        <p>Check the browser console for detailed logs.</p>
      </div>
    </div>
  );
};