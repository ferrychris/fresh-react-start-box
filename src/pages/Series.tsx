import React, { useState } from 'react';
import { Trophy, Calendar, Users, Star, MapPin } from 'lucide-react';

interface SeriesItem {
  id: string;
  name: string;
  category: 'Late Model' | 'Sprint Car' | 'Modified' | 'Street Stock' | string;
  description: string;
  bannerImage: string;
  logo: string;
  followers: number;
  subscribers: number;
  verified: boolean;
  season: string;
  racerCount: number;
  eventCount: number;
  region: string;
  upcomingEvent?: {
    name: string;
    date: string;
    track: string;
  };
}

const mockSeries: SeriesItem[] = [
  {
    id: '1',
    name: 'Late Model Championship Series',
    category: 'Late Model',
    description: 'The premier late model racing series featuring the best drivers and most competitive racing in the Southeast.',
    bannerImage: 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    logo: 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    followers: 28934,
    subscribers: 5672,
    verified: true,
    season: '2024',
    racerCount: 45,
    eventCount: 12,
    region: 'Southeast',
    upcomingEvent: {
      name: 'Charlotte 400',
      date: '2024-02-15',
      track: 'Charlotte Motor Speedway'
    }
  },
  {
    id: '2',
    name: 'Sprint Car Championship',
    category: 'Sprint Car',
    description: 'High-speed sprint car action across the Midwest featuring the most talented drivers in open-wheel racing.',
    bannerImage: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    logo: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    followers: 19456,
    subscribers: 3421,
    verified: true,
    season: '2024',
    racerCount: 32,
    eventCount: 15,
    region: 'Midwest',
    upcomingEvent: {
      name: 'Thunder Valley 200',
      date: '2024-02-18',
      track: 'Thunder Valley Speedway'
    }
  },
  {
    id: '3',
    name: 'Modified Madness Series',
    category: 'Modified',
    description: 'The most exciting modified racing series in the Northeast, featuring weekly battles and championship points.',
    bannerImage: 'https://images.pexels.com/photos/163304/sport-treadmill-tor-route-163304.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    logo: 'https://images.pexels.com/photos/163304/sport-treadmill-tor-route-163304.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    followers: 15782,
    subscribers: 2156,
    verified: false,
    season: '2024',
    racerCount: 28,
    eventCount: 18,
    region: 'Northeast',
    upcomingEvent: {
      name: 'Modified Mayhem',
      date: '2024-02-20',
      track: 'Riverside Speedway'
    }
  }
];

interface SeriesProps {
  onSeriesSelect?: (seriesId: string) => void;
}

export const Series: React.FC<SeriesProps> = ({ onSeriesSelect }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'late-model' | 'sprint-car' | 'modified' | 'street-stock'>('all');

  const filters = [
    { id: 'all' as const, label: 'All Series' },
    { id: 'late-model' as const, label: 'Late Model' },
    { id: 'sprint-car' as const, label: 'Sprint Car' },
    { id: 'modified' as const, label: 'Modified' },
    { id: 'street-stock' as const, label: 'Street Stock' }
  ];

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'late model': return 'bg-purple-500/20 text-purple-400';
      case 'sprint car': return 'bg-orange-500/20 text-orange-400';
      case 'modified': return 'bg-blue-500/20 text-blue-400';
      case 'street stock': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  // Apply selected filter to the mock series list
  const filteredSeries = mockSeries.filter((series) => {
    if (selectedFilter === 'all') return true;
    const map: Record<typeof selectedFilter, string> = {
      'all': 'all',
      'late-model': 'Late Model',
      'sprint-car': 'Sprint Car',
      'modified': 'Modified',
      'street-stock': 'Street Stock',
    };
    return series.category === map[selectedFilter];
  });

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white racing-number">Racing Series</h1>
              <p className="text-slate-400">Discover championship series and racing leagues</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedFilter === filter.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Series Grid */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredSeries.map((series) => (
              <div 
                key={series.id} 
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden group hover:border-slate-700 transition-all duration-300 cursor-pointer" 
                onClick={() => onSeriesSelect?.(series.id)}
              >
                {/* Series Banner */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={series.bannerImage}
                    alt={series.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Category Badge */}
                  <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-sm font-medium ${getCategoryColor(series.category)}`}>
                    {series.category}
                  </div>

                  {/* Verified Badge */}
                  {series.verified && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}

                  {/* Stats Overlay */}
                  <div className="absolute bottom-4 right-4 flex space-x-3">
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      <div className="text-white text-sm font-medium">{series.racerCount}</div>
                      <div className="text-slate-300 text-xs">Racers</div>
                    </div>
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      <div className="text-white text-sm font-medium">{series.eventCount}</div>
                      <div className="text-slate-300 text-xs">Events</div>
                    </div>
                  </div>
                </div>

                {/* Series Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={series.logo}
                        alt={series.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{series.name}</h3>
                        <div className="flex items-center text-slate-400 text-sm space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{series.region}</span>
                          <span>•</span>
                          <span>{series.season} Season</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">{series.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-orange-500 font-bold racing-number">{series.followers.toLocaleString()}</div>
                      <div className="text-slate-400 text-xs">Fans</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-bold racing-number">{series.subscribers.toLocaleString()}</div>
                      <div className="text-slate-400 text-xs">Subscribers</div>
                    </div>
                  </div>

                  {/* Upcoming Event */}
                  {series.upcomingEvent && (
                    <div className="bg-slate-800 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="text-white font-medium text-sm">Next Event</span>
                      </div>
                      <div className="text-white font-semibold">{series.upcomingEvent.name}</div>
                      <div className="text-slate-400 text-sm">
                        {series.upcomingEvent.track} • {new Date(series.upcomingEvent.date).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Follow</span>
                    </button>
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2">
                      <Star className="w-4 h-4" />
                      <span>Join the Team</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};