import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  DollarSign, 
  MapPin, 
  Trophy, 
  Users, 
  Star, 
  Calendar,
  ArrowLeft,
  Target,
  Car,
  Zap,
  Plus,
  X,
  Save,
  Edit3,
  Trash2,
  Move
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { 
  getRacerSponsorshipSpots, 
  createSponsorshipSpot, 
  updateSponsorshipSpot,
  deleteSponsorshipSpot,
  createSponsorshipInquiry,
  supabase 
} from '../lib/supabase';

interface SponsorshipSpot {
  id: string;
  spot_name: string;
  price_per_race: number;
  position_top: string;
  position_left: string;
  spot_size: 'small' | 'medium' | 'large';
  description: string;
  is_available: boolean;
  sponsor_name?: string;
  sponsor_logo_url?: string;
}

export const SponsorshipPackages: React.FC = () => {
  const { id } = useParams();
  const { user, racers, setShowAuthModal } = useApp();
  const [racer, setRacer] = useState<any>(null);
  const [sponsorshipSpots, setSponsorshipSpots] = useState<SponsorshipSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<SponsorshipSpot | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [draggedSpot, setDraggedSpot] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  // Form states
  const [newSpot, setNewSpot] = useState({
    spot_name: '',
    price_per_race: 0,
    position_top: '50%',
    position_left: '50%',
    spot_size: 'medium' as 'small' | 'medium' | 'large',
    description: ''
  });

  const [sponsorForm, setSponsorForm] = useState({
    sponsor_name: '',
    sponsor_email: '',
    sponsor_budget: '',
    message: ''
  });

  useEffect(() => {
    if (id) {
      loadRacerData();
      loadSponsorshipSpots();
    }
  }, [id]);

  const loadRacerData = () => {
    const racerData = racers.find(r => r.id === id);
    setRacer(racerData);
  };

  const loadSponsorshipSpots = async () => {
    if (!id) return;
    
    try {
      const spots = await getRacerSponsorshipSpots(id);
      setSponsorshipSpots(spots);
    } catch (error) {
      console.error('Error loading sponsorship spots:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, spotId: string) => {
    if (!editMode) return;
    
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.parentElement?.getBoundingClientRect();
    
    if (containerRect) {
      setDraggedSpot(spotId);
      setDragOffset({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedSpot || !editMode) return;
    
    const containerRect = e.currentTarget.getBoundingClientRect();
    const newLeft = ((e.clientX - containerRect.left - dragOffset.x) / containerRect.width) * 100;
    const newTop = ((e.clientY - containerRect.top - dragOffset.y) / containerRect.height) * 100;
    
    // Constrain to container bounds
    const constrainedLeft = Math.max(5, Math.min(95, newLeft));
    const constrainedTop = Math.max(5, Math.min(95, newTop));
    
    setSponsorshipSpots(prev => 
      prev.map(spot => 
        spot.id === draggedSpot 
          ? { 
              ...spot, 
              position_left: `${constrainedLeft}%`, 
              position_top: `${constrainedTop}%` 
            }
          : spot
      )
    );
  };

  const handleMouseUp = async () => {
    if (!draggedSpot || !editMode) return;
    
    try {
      const spot = sponsorshipSpots.find(s => s.id === draggedSpot);
      if (spot) {
        await updateSponsorshipSpot(spot.id, {
          position_top: spot.position_top,
          position_left: spot.position_left
        });
      }
    } catch (error) {
      console.error('Error updating spot position:', error);
    } finally {
      setDraggedSpot(null);
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleAddSpot = async () => {
    if (!id || !user) return;
    
    setLoading(true);
    try {
      await createSponsorshipSpot({
        racer_id: id,
        spot_name: newSpot.spot_name,
        price_per_race: newSpot.price_per_race, // Store as dollars, not cents
        position_top: newSpot.position_top,
        position_left: newSpot.position_left,
        spot_size: newSpot.spot_size,
        description: newSpot.description,
        is_available: true
      });

      setNewSpot({
        spot_name: '',
        price_per_race: 0,
        position_top: '50%',
        position_left: '50%',
        spot_size: 'medium',
        description: ''
      });
      setShowAddSpot(false);
      loadSponsorshipSpots();
    } catch (error) {
      console.error('Error creating sponsorship spot:', error);
      alert('Failed to create sponsorship spot');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (!confirm('Are you sure you want to delete this sponsorship spot?')) return;
    
    try {
      await deleteSponsorshipSpot(spotId);
      loadSponsorshipSpots();
      setSelectedSpot(null);
    } catch (error) {
      console.error('Error deleting sponsorship spot:', error);
      alert('Failed to delete sponsorship spot');
    }
  };

  const handleSponsorInquiry = async () => {
    if (!selectedSpot || !sponsorForm.sponsor_name || !sponsorForm.sponsor_email) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await createSponsorshipInquiry({
        spot_id: selectedSpot.id,
        racer_id: id!,
        sponsor_name: sponsorForm.sponsor_name,
        sponsor_email: sponsorForm.sponsor_email,
        sponsor_budget: sponsorForm.sponsor_budget,
        message: sponsorForm.message,
        status: 'pending'
      });

      setSponsorForm({
        sponsor_name: '',
        sponsor_email: '',
        sponsor_budget: '',
        message: ''
      });
      setShowSponsorForm(false);
      setSelectedSpot(null);
      alert('Sponsorship inquiry sent successfully!');
    } catch (error) {
      console.error('Error sending sponsorship inquiry:', error);
      alert('Failed to send sponsorship inquiry');
    } finally {
      setLoading(false);
    }
  };

  const getSpotSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'w-8 h-8 text-sm';
      case 'large': return 'w-12 h-12 text-lg';
      default: return 'w-10 h-10';
    }
  };

  if (!racer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-fedex-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading racer profile...</p>
        </div>
      </div>
    );
  }

  // Require authentication to view individual racer sponsorship details
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-fedex-orange/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="h-10 w-10 text-fedex-orange" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Account Required
          </h2>
          
          <p className="text-gray-300 text-lg mb-8">
            To view detailed sponsorship opportunities for {racer?.name || 'this racer'}, please create a free account or sign in.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full px-6 py-3 bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Create Free Account
            </button>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full px-6 py-3 border-2 border-fedex-orange text-fedex-orange hover:bg-fedex-orange hover:text-white font-semibold rounded-xl transition-all duration-300"
            >
              Sign In
            </button>
            <Link
              to="/sponsorships"
              className="block w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
            >
              Back to Marketplace
            </Link>
          </div>
          
          <p className="text-sm text-gray-400 mt-6">
            Free account • No credit card required • Takes 2 minutes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to={`/racer/${id}`}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2">Sponsorship Marketplace</h1>
              <p className="text-gray-400">Manage sponsorship opportunities for {racer.name}</p>
            </div>
          </div>
          
          {user && user.id === id && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  editMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                <Edit3 className="inline h-4 w-4 mr-2" />
                {editMode ? 'Save Changes' : 'Edit Spots'}
              </button>
              {editMode && (
                <button
                  onClick={() => setShowAddSpot(true)}
                  className="px-4 py-2 bg-fedex-orange hover:bg-fedex-orange-dark rounded-lg font-semibold transition-colors"
                >
                  <Plus className="inline h-4 w-4 mr-2" />
                  Add Spot
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Car Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {editMode ? 'Edit Sponsorship Spots' : `Sponsor ${racer.name}'s Car`}
                  </h2>
                  <p className="text-gray-400">
                    {editMode 
                      ? 'Drag spots to reposition them on your car' 
                      : 'Click on available spots to sponsor'
                    }
                  </p>
                </div>
              </div>

              {/* Car Image with Sponsorship Spots */}
              <div 
                className="relative bg-gray-800 rounded-lg p-8 mb-6 select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  src={racer.carPhotos?.[0] || racer.profilePicture || "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800"}
                  alt="Race Car"
                  className="w-full h-96 object-cover rounded-lg"
                  draggable={false}
                />
                
                {/* Sponsorship Spots */}
                <div className="absolute inset-0 p-8">
                  {sponsorshipSpots.map(spot => (
                    <button
                      key={spot.id}
                      onMouseDown={(e) => handleMouseDown(e, spot.id)}
                      onClick={() => !editMode && setSelectedSpot(spot)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                        getSpotSizeClass(spot.spot_size)
                      } ${
                        spot.is_available 
                          ? 'bg-green-500 hover:bg-green-400 hover:scale-110' 
                          : 'bg-red-500 hover:bg-red-400'
                      } rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                        selectedSpot?.id === spot.id ? 'ring-4 ring-white scale-110' : ''
                      } ${
                        editMode ? 'cursor-move' : 'cursor-pointer'
                      } ${
                        draggedSpot === spot.id ? 'z-50 scale-125' : 'z-10'
                      }`}
                      style={{ 
                        top: spot.position_top, 
                        left: spot.position_left,
                        userSelect: 'none'
                      }}
                      title={editMode ? `Drag to move ${spot.spot_name}` : spot.spot_name}
                    >
                      {editMode ? (
                        <Move className="h-4 w-4" />
                      ) : spot.is_available ? (
                        <DollarSign className="h-4 w-4" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Edit Mode Instructions */}
                {editMode && (
                  <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <Move className="h-4 w-4" />
                      <span>Drag spots to reposition them</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sponsorship Spots Legend */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sponsorshipSpots.map(spot => (
                  <div
                    key={spot.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSpot?.id === spot.id
                        ? 'border-fedex-orange bg-fedex-orange/10'
                        : spot.is_available
                        ? 'border-green-600/50 bg-green-600/5 hover:border-green-600'
                        : 'border-red-600/50 bg-red-600/5'
                    }`}
                    onClick={() => !editMode && setSelectedSpot(spot)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{spot.spot_name}</h4>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          spot.is_available ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {spot.is_available ? 'Available' : 'Sponsored'}
                        </div>
                        {editMode && user && user.id === id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSpot(spot.id);
                            }}
                            className="p-1 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-400 mb-1">
                      ${typeof spot.price_per_race === 'number' ? spot.price_per_race : (spot.price_per_race / 100)}/race
                    </div>
                    {spot.description && (
                      <p className="text-sm text-gray-400 mb-2">{spot.description}</p>
                    )}
                    {!spot.is_available && spot.sponsor_name && (
                      <div className="text-sm text-gray-400">
                        Sponsored by {spot.sponsor_name}
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
                  src={racer.profilePicture}
                  alt={racer.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-bold">{racer.name}</h3>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{racer.location}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-fedex-orange">{racer.wins || 0}</div>
                  <div className="text-sm text-gray-400">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-fedex-orange">{racer.followers || 0}</div>
                  <div className="text-sm text-gray-400">Followers</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Experience:</span>
                  <span>{racer.experience || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Car Class:</span>
                  <span>{racer.carClass || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Avg. Finish:</span>
                  <span>{racer.avgFinish || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Selected Spot Details */}
            {selectedSpot && (
              <div className="bg-gray-900 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{selectedSpot.spot_name}</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedSpot.is_available ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {selectedSpot.is_available ? 'Available' : 'Sponsored'}
                  </div>
                </div>
                
                {selectedSpot.description && (
                  <p className="text-gray-300 mb-4">{selectedSpot.description}</p>
                )}
                
                {selectedSpot.is_available ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400 mb-2">
                        ${typeof selectedSpot.price_per_race === 'number' ? selectedSpot.price_per_race : (selectedSpot.price_per_race / 100)}
                      </div>
                      <div className="text-gray-400">per race event</div>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">What you get:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Logo placement on {selectedSpot.spot_name.toLowerCase()}</li>
                        <li>• Social media mentions</li>
                        <li>• Race footage with your logo</li>
                        <li>• Fan engagement analytics</li>
                      </ul>
                    </div>
                    
                    {user ? (
                      <button
                        onClick={() => setShowSponsorForm(true)}
                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                      >
                        Sponsor This Spot - ${typeof selectedSpot.price_per_race === 'number' ? selectedSpot.price_per_race : (selectedSpot.price_per_race / 100)}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            const event = new CustomEvent('openAuthModal');
                            window.dispatchEvent(event);
                          }}
                          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                        >
                          Sign In to Sponsor - ${typeof selectedSpot.price_per_race === 'number' ? selectedSpot.price_per_race : (selectedSpot.price_per_race / 100)}
                        </button>
                        <p className="text-xs text-gray-400 text-center">
                          Create a free account to sponsor this racer
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-red-600/20 p-4 rounded-lg mb-4">
                      <p className="text-red-400">This spot is already sponsored by {selectedSpot.sponsor_name}</p>
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
                      <div className="text-fedex-orange font-bold">{race.date}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
                <Calendar className="inline h-4 w-4 mr-2" />
                View Full Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Add Spot Modal */}
        {showAddSpot && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Sponsorship Spot</h3>
                <button
                  onClick={() => setShowAddSpot(false)}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Spot Name</label>
                  <input
                    type="text"
                    value={newSpot.spot_name}
                    onChange={(e) => setNewSpot(prev => ({ ...prev, spot_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="Hood, Door Panel, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price per Race</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={newSpot.price_per_race}
                      onChange={(e) => setNewSpot(prev => ({ ...prev, price_per_race: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="500"
                      min="0"
                      step="50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Spot Size</label>
                  <select
                    value={newSpot.spot_size}
                    onChange={(e) => setNewSpot(prev => ({ ...prev, spot_size: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newSpot.description}
                    onChange={(e) => setNewSpot(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    rows={2}
                    placeholder="Describe the sponsorship spot..."
                  />
                </div>

                <button
                  onClick={handleAddSpot}
                  disabled={loading || !newSpot.spot_name || newSpot.price_per_race <= 0}
                  className="w-full px-4 py-3 bg-fedex-orange hover:bg-fedex-orange-dark disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Sponsorship Spot'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sponsor Form Modal */}
        {showSponsorForm && selectedSpot && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sponsor {selectedSpot.spot_name}</h3>
                <button
                  onClick={() => setShowSponsorForm(false)}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Company/Brand Name *</label>
                  <input
                    type="text"
                    value={sponsorForm.sponsor_name}
                    onChange={(e) => setSponsorForm(prev => ({ ...prev, sponsor_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Contact Email *</label>
                  <input
                    type="email"
                    value={sponsorForm.sponsor_email}
                    onChange={(e) => setSponsorForm(prev => ({ ...prev, sponsor_email: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="contact@yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Budget Range</label>
                  <select
                    value={sponsorForm.sponsor_budget}
                    onChange={(e) => setSponsorForm(prev => ({ ...prev, sponsor_budget: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="">Select budget range</option>
                    <option value="$500-$1,000">$500-$1,000</option>
                    <option value="$1,000-$2,500">$1,000-$2,500</option>
                    <option value="$2,500-$5,000">$2,500-$5,000</option>
                    <option value="$5,000+">$5,000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message to Racer</label>
                  <textarea
                    value={sponsorForm.message}
                    onChange={(e) => setSponsorForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    rows={3}
                    placeholder="Tell the racer about your company and sponsorship goals..."
                  />
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Sponsorship Summary:</h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>Spot: {selectedSpot.spot_name}</div>
                    <div>Price: ${typeof selectedSpot.price_per_race === 'number' ? selectedSpot.price_per_race : (selectedSpot.price_per_race / 100)}/race</div>
                    <div>Size: {selectedSpot.spot_size}</div>
                  </div>
                </div>

                <button
                  onClick={handleSponsorInquiry}
                  disabled={loading || !sponsorForm.sponsor_name || !sponsorForm.sponsor_email}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Sending...' : `Send Sponsorship Inquiry`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};