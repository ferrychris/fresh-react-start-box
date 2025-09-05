import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Trophy } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface StatsCardsProps {
  userId: string;
}

interface RacerStats {
  totalEarnings: number;
  subscriberCount: number;
  followers: number;
  nextRace: {
    date: string;
    name: string;
  } | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ userId }) => {
  const [stats, setStats] = useState<RacerStats>({
    totalEarnings: 0,
    subscriberCount: 0,
    followers: 0,
    nextRace: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRacerStats = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Fetch earnings data
        const { data: earningsData, error: earningsError } = await supabase
          .from('racer_earnings')
          .select('total_earnings_cents')
          .eq('user_id', userId)
          .single();
          
        if (earningsError && earningsError.code !== 'PGRST116') {
          console.error('Error fetching earnings:', earningsError);
        }
        
        // Fetch subscriber count
        const { count: subscriberCount, error: subscriberError } = await supabase
          .from('subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('racer_id', userId)
          .eq('status', 'active');
          
        if (subscriberError) {
          console.error('Error fetching subscribers:', subscriberError);
        }
        
        // Fetch follower count
        const { count: followerCount, error: followerError } = await supabase
          .from('fan_follows')
          .select('id', { count: 'exact', head: true })
          .eq('racer_id', userId);
          
        if (followerError) {
          console.error('Error fetching followers:', followerError);
        }
        
        // Fetch next race
        const today = new Date().toISOString();
        const { data: nextRaceData, error: raceError } = await supabase
          .from('racer_events')
          .select('date, name')
          .eq('racer_id', userId)
          .gt('date', today)
          .order('date', { ascending: true })
          .limit(1)
          .single();
          
        if (raceError && raceError.code !== 'PGRST116') {
          console.error('Error fetching next race:', raceError);
        }
        
        setStats({
          totalEarnings: earningsData?.total_earnings_cents || 0,
          subscriberCount: subscriberCount || 0,
          followers: followerCount || 0,
          nextRace: nextRaceData || null
        });
      } catch (error) {
        console.error('Error fetching racer stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRacerStats();
  }, [userId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Total Earnings</p>
            <p className="text-2xl font-bold text-green-400 racing-number">
              ${loading ? '...' : ((stats.totalEarnings || 0) / 100).toFixed(2)}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Subscribers</p>
            <p className="text-2xl font-bold text-blue-400 racing-number">
              {loading ? '...' : stats.subscriberCount}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Followers</p>
            <p className="text-2xl font-bold text-purple-400 racing-number">
              {loading ? '...' : stats.followers}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Next Race</p>
            <p className="text-2xl font-bold text-orange-400 racing-number">
              {loading ? '...' : (stats.nextRace ? 
                new Date(stats.nextRace.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
                'None')}
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-orange-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
