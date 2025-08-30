import React, { useState } from 'react';
import { Camera, Video, MapPin, Calendar, Globe, Users } from 'lucide-react';
import { useApp } from '../../../App';

// Fix the ExtendedUser interface
interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  user_type: 'racer' | 'fan' | 'track' | 'series';
  avatar?: string;
  banner_image?: string;
}

interface CreatePostProps {
  onPostCreated: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { user } = useApp();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'community'>('public');

  const handlePostSubmit = () => {
    // Placeholder for post submission logic
    console.log('Submitting post with:', {
      content,
      media,
      location,
      eventDate,
      visibility,
      user
    });
    onPostCreated(); // Notify parent component that a post was created
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <textarea
        className="w-full border-gray-300 rounded-md mb-3"
        rows={3}
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex justify-between items-center mb-3">
        <div className="flex space-x-2">
          <button className="text-blue-500 hover:text-blue-700">
            <Camera className="h-5 w-5" />
          </button>
          <button className="text-blue-500 hover:text-blue-700">
            <Video className="h-5 w-5" />
          </button>
          <button className="text-blue-500 hover:text-blue-700">
            <MapPin className="h-5 w-5" />
          </button>
          <button className="text-blue-500 hover:text-blue-700">
            <Calendar className="h-5 w-5" />
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-full text-white ${
              visibility === 'public' ? 'bg-green-500' : 'bg-gray-300 text-gray-600'
            }`}
            onClick={() => setVisibility('public')}
          >
            <Globe className="h-4 w-4 mr-2 inline-block" /> Public
          </button>
          <button
            className={`px-4 py-2 rounded-full text-white ${
              visibility === 'community' ? 'bg-purple-500' : 'bg-gray-300 text-gray-600'
            }`}
            onClick={() => setVisibility('community')}
          >
            <Users className="h-4 w-4 mr-2 inline-block" /> Community
          </button>
        </div>
      </div>

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handlePostSubmit}
      >
        Post
      </button>
    </div>
  );
};
