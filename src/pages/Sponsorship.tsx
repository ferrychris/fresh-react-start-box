import React, { useState } from 'react';
import { MapPin, DollarSign, Zap, Car, Trophy, Users, Star, Calendar } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const Sponsorship: React.FC = () => {
  const { racers } = useApp();
  const [selectedRacer, setSelectedRacer] = useState(racers[0]);
  const [selectedSpot, setSelectedSpot] = useState(null);

  const sponsorshipSpots = [
    { 
      id: 'hood', 
      name: 'Hood', 
      price: 500, 
      available: true, 
      position: { top: '20%', left: '45%' },
      size: 'large'
    },
    { 
      id: 'doors', 
      name: 'Door Panels', 
      price: 350, 
      available: false, 
      position: { top: '45%', left: '25%' },
      size: 'medium',
      sponsor: 'FastLane Racing'
    },
    { 
      id: 'spoiler', 
      name: 'Rear Spoiler', 
      price: 250, 
      available: true, 
      position: { top: '15%', left: '75%' },
      size: 'small'
    },
    { 
      id: 'bumper', 
      name: 'Front Bumper', 
      price: 200, 
      available: true, 
      position: { top: '65%', left: '45%' },
      size: 'medium'
    },
    { 
      id: 'quarter', 
      name: 'Quarter Panel', 
      price: 300, 
      available: true, 
      position: { top: '45%', left: '75%' },
      size: 'medium'
    }
  ];

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-red-400 bg-clip-text text-transparent">
              Sponsorship Marketplace
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Support your favorite racers by sponsoring prime real estate on their race cars
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <Car className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">247</div>
            <div className="text-gray-400 text-sm">Available Spots</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">$52K</div>
            <div className="text-gray-400 text-sm">Total Sponsored</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">89</div>
            <div className="text-gray-400 text-sm">Active Sponsors</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">1.2M</div>
            <div className="text-gray-400 text-sm">Total Exposure</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Car Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Sponsor {selectedRacer.name}'s Car</h2>
                  <p className="text-gray-400">Click on available spots to sponsor</p>
                </div>
                <select
                  value={selectedRacer.id}
                  onChange={(e) => setSelectedRacer(racers.filter(r => r.profileComplete !== false).find(r => r.id === e.target.value))}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  {racers.filter(racer => racer.profileComplete !== false).map(racer => (
                    <option key={racer.id} value={racer.id}>
                      {racer.name} (#{racer.carNumber}) - VERIFIED RACER
                    </option>
                  ))}
                </select>
              </div>

              {/* Car Image with Sponsorship Spots */}
              <div className="relative bg-gray-800 rounded-lg p-8 mb-6">
                <img
                  src="https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Race Car"
                  className="w-full h-96 object-cover rounded-lg"
                />
                <div className="absolute inset-0 p-8">
                  {sponsorshipSpots.map(spot => (
                    <button
                      key={spot.id}
                      onClick={() => setSelectedSpot(spot)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                        spot.available 
                          ? 'bg-green-500 hover:bg-green-400 hover:scale-110' 
                          : 'bg-red-500 hover:bg-red-400'
                      } rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                        spot.size === 'large' ? 'w-12 h-12 text-lg' :
                        spot.size === 'medium' ? 'w-10 h-10' : 'w-8 h-8 text-sm'
                      } ${selectedSpot?.id === spot.id ? 'ring-4 ring-white scale-110' : ''}`}
                      style={{ top: spot.position.top, left: spot.position.left }}
                    >
                      {spot.available ? <DollarSign className="h-4 w-4" /> : <Zap className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sponsorship Spots Legend */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sponsorshipSpots.map(spot => (
                  <div
                    key={spot.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSpot?.id === spot.id
                        ? 'border-red-600 bg-red-600/10'
                        : spot.available
                        ? 'border-green-600/50 bg-green-600/5 hover:border-green-600'
                        : 'border-red-600/50 bg-red-600/5'
                    }`}
                    onClick={() => setSelectedSpot(spot)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{spot.name}</h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        spot.available ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {spot.available ? 'Available' : 'Sponsored'}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-400 mb-1">
                      ${spot.price}/race
                    </div>
                    {!spot.available && (
                      <div className="text-sm text-gray-400">
                        Sponsored by {spot.sponsor}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Racer Info */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={selectedRacer.profilePicture}
                  alt={selectedRacer.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold">{selectedRacer.name}</h3>
                  <p className="text-gray-400">#{selectedRacer.carNumber} • {selectedRacer.class}</p>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-400">{selectedRacer.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Subscribers</span>
                  <span className="font-semibold">{selectedRacer.subscribers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Avg. Views per Race</span>
                  <span className="font-semibold">25.3K</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Season Races</span>
                  <span className="font-semibold">24 races</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Performance Rating</span>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-400 mr-1" />
                    <span className="font-semibold">4.8/5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Spot Details */}
            {selectedSpot && (
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Sponsor: {selectedSpot.name}</h3>
                
                {selectedSpot.available ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400 mb-2">
                        ${selectedSpot.price}
                      </div>
                      <div className="text-gray-400">per race event</div>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">What you get:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Logo placement on {selectedSpot.name.toLowerCase()}</li>
                        <li>• Social media mentions</li>
                        <li>• Race footage with your logo</li>
                        <li>• Fan engagement analytics</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Company/Brand Name"
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      />
                      <input
                        type="email"
                        placeholder="Contact Email"
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      />
                      <textarea
                        placeholder="Special requests or message to racer..."
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        rows={3}
                      />
                    </div>
                    
                    <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors">
                      Sponsor This Spot - ${selectedSpot.price}
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-red-600/20 p-4 rounded-lg mb-4">
                      <p className="text-red-400">This spot is already sponsored by {selectedSpot.sponsor}</p>
                    </div>
                    <button className="w-full px-4 py-3 bg-gray-700 rounded-lg font-semibold text-gray-400" disabled>
                      Currently Unavailable
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Races */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Upcoming Races</h3>
              <div className="space-y-3">
                {[
                  { date: 'Feb 15', event: 'Winter Nationals', track: 'Eldora Speedway' },
                  { date: 'Feb 22', event: 'Season Opener', track: 'Knoxville Raceway' },
                  { date: 'Mar 1', event: 'Spring Classic', track: 'Williams Grove' }
                ].map((race, index) => (
                  <div key={index} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{race.event}</div>
                        <div className="text-xs text-gray-400">{race.track}</div>
                      </div>
                      <div className="text-red-400 font-bold">{race.date}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
                <Calendar className="inline h-4 w-4 mr-2" />
                View Full Schedule
              </button>
            </div>

            {/* Success Stories */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">Success Story</h3>
              <p className="text-sm text-green-100 mb-3">
                "Sponsoring Jake's hood spot gave us 50K+ brand impressions and 200 new customers!"
              </p>
              <div className="text-sm font-semibold">- FastLane Racing Parts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};