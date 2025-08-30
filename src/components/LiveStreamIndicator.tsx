
import React, { useState, useEffect } from 'react';
import { Video, Eye, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LiveStream } from '../lib/supabase/types';

interface LiveStreamIndicatorProps {
  racerId?: string;
  className?: string;
}

export const LiveStreamIndicator: React.FC<LiveStreamIndicatorProps> = ({ 
  racerId, 
  className = '' 
}) => {
  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!racerId) return;

    const fetchLiveStream = async () => {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*')
          .eq('streamer_id', racerId)
          .eq('is_live', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching live stream:', error);
        } else {
          setLiveStream(data as LiveStream);
        }
      } catch (error) {
        console.error('Error in fetchLiveStream:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveStream();
  }, [racerId]);

  if (loading || !liveStream?.is_live) {
    return null;
  }

  return (
    <div className={`inline-flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse ${className}`}>
      <Video className="h-4 w-4" />
      <span>LIVE</span>
      <div className="flex items-center space-x-1">
        <Eye className="h-3 w-3" />
        <span>{liveStream.viewer_count || 0}</span>
      </div>
      {liveStream.title && (
        <span className="hidden sm:inline truncate max-w-[100px]">
          {liveStream.title}
        </span>
      )}
    </div>
  );
};

export default LiveStreamIndicator;
