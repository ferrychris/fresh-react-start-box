import React, { useState, useEffect } from 'react';
import { Users, Star, Trophy, Heart, Plus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getTeams, toggleTeamFollow, checkTeamFollow, type Team } from '@/lib/supabase/teams';

interface RacerSuggestion {
  id: string;
  name: string;
  username: string;
  profile_photo_url?: string;
  racing_class?: string;
  followers_count?: number;
  type: 'racer';
}

interface TeamSuggestion extends Team {
  type: 'team';
}

type Suggestion = RacerSuggestion | TeamSuggestion;

interface SuggestionsPanelProps {
  className?: string;
}

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ className = '' }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [followedItems, setFollowedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      
      // Get racers and teams in parallel
      const [racersData, teamsData] = await Promise.all([
        supabase
          .from('racer_profiles')
          .select('id, username, profile_photo_url, racing_class')
          .eq('profile_published', true)
          .limit(3),
        getTeams()
      ]);

      const racers: RacerSuggestion[] = (racersData.data || []).map(racer => ({
        id: racer.id,
        name: racer.username || 'Racer',
        username: racer.username || '',
        profile_photo_url: racer.profile_photo_url,
        racing_class: racer.racing_class,
        type: 'racer' as const
      }));

      const teams: TeamSuggestion[] = (teamsData || []).slice(0, 3).map(team => ({
        ...team,
        type: 'team' as const
      }));

      // Mix racers and teams for engaging suggestions
      const mixed: Suggestion[] = [];
      const maxLength = Math.max(racers.length, teams.length);
      
      for (let i = 0; i < maxLength; i++) {
        if (i < racers.length) mixed.push(racers[i]);
        if (i < teams.length) mixed.push(teams[i]);
      }

      setSuggestions(mixed);

      // Check follow status for all items
      const followStatus = new Set<string>();
      for (const item of mixed) {
        try {
          let isFollowed = false;
          if (item.type === 'racer') {
            // Check racer follow (you'll need to implement this)
            // For now, just set to false
            isFollowed = false;
          } else {
            isFollowed = await checkTeamFollow(item.id);
          }
          if (isFollowed) {
            followStatus.add(item.id);
          }
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
      setFollowedItems(followStatus);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (item: Suggestion) => {
    try {
      if (item.type === 'team') {
        await toggleTeamFollow(item.id);
        setFollowedItems(prev => {
          const newSet = new Set(prev);
          if (newSet.has(item.id)) {
            newSet.delete(item.id);
          } else {
            newSet.add(item.id);
          }
          return newSet;
        });
      } else {
        // Handle racer follow - you'll need to implement this
        console.log('Follow racer:', item.id);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Suggested for You</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 bg-muted rounded-full" />
              <div className="flex-1">
                <div className="w-24 h-4 bg-muted rounded mb-1" />
                <div className="w-16 h-3 bg-muted rounded" />
              </div>
              <div className="w-20 h-8 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Suggested for You</h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.map((item) => (
          <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
            <div className="relative">
              <img
                src={item.type === 'racer' ? item.profile_photo_url : item.logo_url}
                alt={item.type === 'racer' ? item.name : item.team_name}
                className="w-12 h-12 rounded-full object-cover bg-muted"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
              {item.type === 'team' && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Users className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">
                {item.type === 'racer' ? item.name : item.team_name}
              </h4>
              <p className="text-sm text-muted-foreground truncate">
                {item.type === 'racer' 
                  ? `@${item.username}${item.racing_class ? ` • ${item.racing_class}` : ''}`
                  : `${item.follower_count || 0} followers${item.racing_classes?.length ? ` • ${item.racing_classes[0]}` : ''}`
                }
              </p>
            </div>
            
            <button
              onClick={() => handleFollow(item)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                followedItems.has(item.id)
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {followedItems.has(item.id) ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Following
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  Follow
                </span>
              )}
            </button>
          </div>
        ))}
      </div>
      
      {suggestions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No suggestions available</p>
        </div>
      )}
    </div>
  );
};