import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  DollarSign, 
  Share2, 
  Globe, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Send,
  UserPlus,
  CheckCircle,
  Crown
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { PostComment } from '@/types';
import type { Post as PostType } from '@/types';
import { formatTimeAgo } from '@/lib/utils';
import { getPostLikers, likePost, unlikePost, addCommentToPost, getPostComments, deletePost, updatePost } from '@/lib/supabase/posts';
import { createPaymentSession } from '@/lib/supabase/payments';
import { AuthModal } from '@/components/auth/AuthModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { VerifiedBadge } from '@/components/VerifiedBadge';

// Helper functions for user type styling
const getUserTypeColor = (userType: string) => {
  switch (userType) {
    case 'RACER': return 'text-orange-500';
    case 'TRACK': return 'text-blue-500';
    case 'SERIES': return 'text-purple-500';
    case 'FAN': return 'text-green-500';
    default: return 'text-slate-500';
  }
};

const getUserTypeIcon = (userType: string) => {
  switch (userType) {
    case 'RACER': return '🏎️';
    case 'TRACK': return '🏁';
    case 'SERIES': return '🏆';
    case 'FAN': return '👥';
    default: return '👤';
  }
};

// Define a more complete Post type for the component
export type Post = PostType;

interface PostCardProps {
  post: Post & {
    racer_profiles?: {
      id: string;
      username: string;
      profile_photo_url: string;
      car_number?: string;
      racing_class?: string;
      team_name?: string;
      profiles?: {
        id: string;
        name: string;
        user_type: string;
        avatar?: string;
        is_verified?: boolean;
      };
    };
    track?: {
      id: string;
      track_name: string;
      track_logo_url: string;
    };
  };
  onPostUpdate?: () => void;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (post: Post) => void;
}
