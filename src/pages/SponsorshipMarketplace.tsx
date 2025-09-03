import React, { useState } from 'react';
import { Search, Filter, DollarSign, Calendar, MapPin, Car, Eye, ShoppingCart } from 'lucide-react';

interface SponsorshipSlot {
  id: string;
  carId: string;
  racerId: string;
  racerName: string;
  racerAvatar: string;
  carName: string;
  carImage: string;
  title: string;
  description?: string;
  price: number;
  duration: 'per-race' | 'per-season';
  category: 'hood' | 'side-panel' | 'spoiler' | 'bumper' | 'roof' | 'door' | 'quarter-panel' | 'other';
  status: 'open' | 'sold' | 'pending';
  x: number;
  y: number;
  width: number;
  height: number;
  racingClass: string;
  region: string;
  nextRace?: string;
  followers: number;
  avgViews: number;
}

const mockSlots: SponsorshipSlot[] = [
  {
    id: '1',
    carId: '1',
    racerId: 'jake-johnson',
    racerName: 'Jake Johnson',
    racerAvatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    carName: 'Primary Race Car',
    carImage: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    title: 'Hood Center',
    description: 'Prime visibility placement on the hood center',
    price: 750,
    duration: 'per-race',
    category: 'hood',
    status: 'open',
    x: 50,
    y: 30,
    width: 12,
    height: 8,
    racingClass: 'Late Model',
    region: 'Southeast',
    nextRace: 'Charlotte 400 - Feb 15',
    followers: 12847,
    avgViews: 8500
  },
  {
    id: '2',
    carId: '1',
    racerId: 'jake-johnson',
    racerName: 'Jake Johnson',
    racerAvatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    carName: 'Primary Race Car',
    carImage: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    title: 'Side Panel',
    description: 'Highly visible side panel placement',
    price: 500,
    duration: 'per-race',
    category: 'side-panel',
    status: 'open',
    x: 70,
    y: 50,
    width: 15,
    height: 10,
    racingClass: 'Late Model',
    region: 'Southeast',
    nextRace: 'Charlotte 400 - Feb 15',
    followers: 12847,
    avgViews: 8500
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440042',
    carId: '2',
    racerId: '550e8400-e29b-41d4-a716-446655440003',
    racerName: 'Sarah Martinez',
    racerAvatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2',
    carName: 'Sprint Car #7',
    carImage: 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    title: 'Spoiler',
    description: 'Premium spoiler placement for maximum visibility',
    price: 1200,
    duration: 'per-season',
    category: 'spoiler',
    status: 'open',
    x: 50,
    y: 20,
    width: 20,
    height: 6,
    racingClass: 'Sprint Car',
    region: 'Midwest',
    nextRace: 'Bristol Thunder - Feb 18',
    followers: 8234,
    avgViews: 6200
  }
];

export const SponsorshipMarketplace: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [selectedSlot, setSelectedSlot] = useState<SponsorshipSlot | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'hood', label: 'Hood' },
    { value: 'side-panel', label: 'Side Panel' },
    { value: 'spoiler', label: 'Spoiler' },
    { value: 'bumper', label: 'Bumper' },
    { value: 'roof', label: 'Roof' },
    { value: 'door', label: 'Door' },
    { value: 'quarter-panel', label: 'Quarter Panel' },
    { value: 'other', label: 'Other' }
  ];

  const filteredSlots = mockSlots.filter(slot => {
    const matchesSearch = slot.racerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         slot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         slot.racingClass.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || slot.category === selectedCategory;
    const matchesDuration = selectedDuration === 'all' || slot.duration === selectedDuration;
    const matchesPrice = slot.price >= priceRange[0] && slot.price <= priceRange[1];
    const isAvailable = slot.status === 'open';

    return matchesSearch && matchesCategory && matchesDuration && matchesPrice && isAvailable;
  });

  const handleRequestSponsorship = (slot: SponsorshipSlot) => {
    // This would open a modal or redirect to a request form
    console.log('Requesting sponsorship for:', slot);
    alert(`Sponsorship request sent for ${slot.title} on ${slot.racerName}'s ${slot.carName}`);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white racing-number">Sponsorship Marketplace</h1>
              <p className="text-slate-400">Discover and purchase sponsorship opportunities</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Search racers, cars, or placement types..."
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-slate-800 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duration
                  </label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Durations</option>
                    <option value="per-race">Per Race</option>
                    <option value="per-season">Per Season</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Price: ${priceRange[1]}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-orange-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Marketplace Grid */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-slate-400">
              {filteredSlots.length} sponsorship opportunities available
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-sm">Filter by type:</span>
                <select className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>All Types</option>
                  <option>Racers</option>
                  <option>Tracks</option>
                  <option>Series</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-sm">Sort by:</span>
              <select className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Most Popular</option>
                <option>Newest</option>
              </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSlots.map((slot) => (
              <div key={slot.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-all duration-300 group">
                {/* Car Image with Slot Preview */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={slot.carImage}
                    alt={slot.carName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Slot Indicator */}
                  <div
                    className="absolute bg-green-500/80 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center"
                    style={{
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                      width: `${slot.width}%`,
                      height: `${slot.height}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>

                  {/* Price Badge */}
                  <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-lg font-bold">
                    ${slot.price}
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
                    {slot.duration}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={slot.racerAvatar}
                      alt={slot.racerName}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-white">{slot.racerName}</h3>
                      <p className="text-slate-400 text-sm">{slot.racingClass} • {slot.region}</p>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-2">{slot.title}</h4>
                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                    {slot.description || 'Premium sponsorship placement opportunity'}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-orange-500 font-bold racing-number">{slot.followers.toLocaleString()}</div>
                      <div className="text-slate-400 text-xs">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-bold racing-number">{slot.avgViews.toLocaleString()}</div>
                      <div className="text-slate-400 text-xs">Avg Views</div>
                    </div>
                  </div>

                  {/* Next Race */}
                  {slot.nextRace && (
                    <div className="flex items-center space-x-2 mb-4 text-sm text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span>{slot.nextRace}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedSlot(slot)}
                      className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleRequestSponsorship(slot)}
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Request</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSlots.length === 0 && (
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No sponsorship opportunities found</h3>
              <p className="text-slate-400">Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedSlot.title}</h2>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="p-2 text-slate-400 hover:text-white transition-colors duration-200"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Car Preview */}
                <div>
                  <div className="relative bg-white rounded-xl overflow-hidden">
                    <img
                      src={selectedSlot.carImage}
                      alt={selectedSlot.carName}
                      className="w-full h-auto"
                    />
                    
                    {/* Slot Highlight */}
                    <div
                      className="absolute bg-green-500/80 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center animate-pulse"
                      style={{
                        left: `${selectedSlot.x}%`,
                        top: `${selectedSlot.y}%`,
                        width: `${selectedSlot.width}%`,
                        height: `${selectedSlot.height}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedSlot.racerAvatar}
                      alt={selectedSlot.racerName}
                      className="w-16 h-16 rounded-2xl object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedSlot.racerName}</h3>
                      <p className="text-slate-400">{selectedSlot.racingClass} • {selectedSlot.region}</p>
                      <p className="text-slate-300">{selectedSlot.carName}</p>
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-2">Sponsorship Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Placement:</span>
                        <span className="text-white">{selectedSlot.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Category:</span>
                        <span className="text-white capitalize">{selectedSlot.category.replace('-', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Price:</span>
                        <span className="text-orange-500 font-bold">${selectedSlot.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Duration:</span>
                        <span className="text-white capitalize">{selectedSlot.duration.replace('-', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-2">Audience Reach</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500 racing-number">{selectedSlot.followers.toLocaleString()}</div>
                        <div className="text-slate-400 text-sm">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400 racing-number">{selectedSlot.avgViews.toLocaleString()}</div>
                        <div className="text-slate-400 text-sm">Avg Views</div>
                      </div>
                    </div>
                  </div>

                  {selectedSlot.description && (
                    <div className="bg-slate-800 rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-2">Description</h4>
                      <p className="text-slate-300 text-sm">{selectedSlot.description}</p>
                    </div>
                  )}

                  {selectedSlot.nextRace && (
                    <div className="bg-slate-800 rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-2">Next Race</h4>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Calendar className="w-4 h-4" />
                        <span>{selectedSlot.nextRace}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleRequestSponsorship(selectedSlot)}
                    className="w-full px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Request Sponsorship - ${selectedSlot.price}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};