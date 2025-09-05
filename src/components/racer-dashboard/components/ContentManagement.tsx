import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface ContentManagementProps {
  userId: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'text' | 'photo' | 'video';
  visibility: 'public' | 'fans_only';
  created_at: string;
}

export const ContentManagement: React.FC<ContentManagementProps> = ({ userId }) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, post_type, visibility, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) {
          console.error('Error fetching content:', error);
        } else if (data) {
          const formattedContent = data.map(item => ({
            id: item.id,
            title: item.title || 'Untitled Post',
            type: (item.post_type || 'text') as 'text' | 'photo' | 'video',
            visibility: (item.visibility || 'public') as 'public' | 'fans_only',
            created_at: item.created_at
          }));
          setContentItems(formattedContent);
        }
      } catch (error) {
        console.error('Error in fetchContent:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [userId]);

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
      <h3 className="text-xl font-bold text-white mb-4">Content Management</h3>
      
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : contentItems.length > 0 ? (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-12 text-sm font-medium text-slate-400 pb-2 border-b border-slate-800">
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Visibility</div>
            <div className="col-span-2">Date</div>
          </div>
          
          {contentItems.map(item => (
            <div key={item.id} className="grid grid-cols-12 text-sm items-center py-2 border-b border-slate-800/50 hover:bg-slate-800/30 rounded-lg px-2">
              <div className="col-span-5 font-medium text-white truncate">{item.title}</div>
              <div className="col-span-2">
                <span className={`px-2 py-1 rounded-md text-xs ${
                  item.type === 'photo' ? 'bg-green-500/20 text-green-400' :
                  item.type === 'video' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </span>
              </div>
              <div className="col-span-3">
                <span className={`px-2 py-1 rounded-md text-xs ${
                  item.visibility === 'fans_only' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {item.visibility === 'fans_only' ? 'Fans Only' : 'Public'}
                </span>
              </div>
              <div className="col-span-2 text-slate-400">
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400 mb-6">
          <p>No content created yet</p>
        </div>
      )}
      
      <div className="flex justify-center">
        <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors">
          Create New Content
        </button>
      </div>
    </div>
  );
};
