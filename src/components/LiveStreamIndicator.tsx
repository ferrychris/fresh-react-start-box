import React, { useState, useEffect } from 'react';
import { Video, Eye, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LiveStreamIndicatorProps {
  streamerId: string;
  className?: string;
}

export const LiveStreamIndicator: React.FC<LiveStreamIndicatorProps> = ({ 
  streamerId, 
  className = '' 
}) => {
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamTitle, setStreamTitle] = useState('');

  useEffect(() => {
    checkLiveStatus();
    
    // Set up real-time subscription for live status
    const subscription = supabase
      .channel('live_streams')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'live_streams',
          filter: `streamer_id=eq.${streamerId}`
        }, 
        (payload) => {
          console.log('Live stream update:', payload);
          if (payload.new) {
            setIsLive(payload.new.is_live);
            setViewerCount(payload.new.viewer_count || 0);
            setStreamTitle(payload.new.title || '');
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [streamerId]);

  const checkLiveStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('is_live, viewer_count, title')
        .eq('streamer_id', streamerId)
        .eq('is_live', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking live status:', error);
        return;
      }

      if (data) {
        setIsLive(true);
        setViewerCount(data.viewer_count || 0);
        setStreamTitle(data.title || '');
      } else {
        setIsLive(false);
        setViewerCount(0);
        setStreamTitle('');
      }
    } catch (error) {
      console.error('Error checking live status:', error);
    }
  };

  if (!isLive) return null;

  return (
    <div className={`inline-flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold ${className}`}>
      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      <Video className="h-3 w-3" />
      <span>LIVE</span>
      {viewerCount > 0 && (
        <>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>{viewerCount}</span>
          </div>
        </>
      )}
    </div>
  );
};