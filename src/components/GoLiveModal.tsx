import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Users, 
  MessageCircle, 
  X, 
  Settings,
  Monitor,
  Smartphone,
  Camera,
  Play,
  Square,
  Eye,
  Heart,
  Share2,
  Send
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { GiftModal } from './GiftModal';
import { TokenStore } from './TokenStore';

interface GoLiveModalProps {
  onClose: () => void;
  onGoLive: (streamData: any) => void;
}

interface MockMediaDevice {
  deviceId: string;
  label: string;
  kind: string;
  groupId?: string;
  toJSON?: () => any;
}

export const GoLiveModal: React.FC<GoLiveModalProps> = ({ onClose, onGoLive }) => {
  const { user } = useApp();
  const [step, setStep] = useState(1); // 1: Setup, 2: Preview, 3: Live
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [devices, setDevices] = useState<{ cameras: (MediaDeviceInfo | MockMediaDevice)[], mics: (MediaDeviceInfo | MockMediaDevice)[] }>({ cameras: [], mics: [] });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [streamStats, setStreamStats] = useState({
    duration: 0,
    likes: 0,
    viewers: 0,
    peakViewers: 0
  });
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showTokenStore, setShowTokenStore] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getMediaDevices();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  const createMockDevice = (deviceId: string, label: string, kind: 'videoinput' | 'audioinput'): MockMediaDevice => ({
    deviceId,
    label,
    kind,
    groupId: 'default',
    toJSON: () => ({ deviceId, label, kind })
  });

  const getMediaDevices = async () => {
    try {
      // Check if media devices are supported
      if (!navigator.mediaDevices) {
        console.warn('⚠️ Media devices not supported on this browser');
        // Set default devices for browsers without media support
        const mockCameras = [createMockDevice('default', 'Default Camera', 'videoinput')];
        const mockMics = [createMockDevice('default', 'Default Microphone', 'audioinput')];
        setDevices({ cameras: mockCameras, mics: mockMics });
        setSelectedCamera('default');
        setSelectedMic('default');
        return;
      }

      // Try to get device list first
      let deviceList = await navigator.mediaDevices.enumerateDevices();
      
      // If device labels are empty, request permissions first
      if (deviceList.length === 0 || !deviceList[0].label) {
        try {
          console.log('🔐 Requesting media permissions...');
          const tempStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: true 
          });
          
          // Stop the temporary stream
          tempStream.getTracks().forEach(track => track.stop());
          
          // Get device list again with labels
          deviceList = await navigator.mediaDevices.enumerateDevices();
          console.log('✅ Permissions granted, devices found:', deviceList.length);
        } catch (permError) {
          console.warn('⚠️ Media permissions denied:', permError);
          // Set default devices even if permissions are denied
          const mockCameras = [createMockDevice('default', 'Default Camera', 'videoinput')];
          const mockMics = [createMockDevice('default', 'Default Microphone', 'audioinput')];
          setDevices({ cameras: mockCameras, mics: mockMics });
          setSelectedCamera('default');
          setSelectedMic('default');
          return;
        }
      }
      
      const cameras = deviceList.filter(device => device.kind === 'videoinput');
      const mics = deviceList.filter(device => device.kind === 'audioinput');
      
      console.log('📷 Cameras found:', cameras.length);
      console.log('🎤 Microphones found:', mics.length);
      
      // Ensure we have at least default devices
      const finalCameras = cameras.length > 0 ? cameras : [createMockDevice('default', 'Default Camera', 'videoinput')];
      const finalMics = mics.length > 0 ? mics : [createMockDevice('default', 'Default Microphone', 'audioinput')];
      
      setDevices({ cameras: finalCameras, mics: finalMics });
      
      if (finalCameras.length > 0) setSelectedCamera(finalCameras[0].deviceId);
      if (finalMics.length > 0) setSelectedMic(finalMics[0].deviceId);
    } catch (error) {
      console.error('Error getting media devices:', error);
      // Set fallback devices on any error
      const mockCameras = [createMockDevice('default', 'Default Camera', 'videoinput')];
      const mockMics = [createMockDevice('default', 'Default Microphone', 'audioinput')];
      setDevices({ cameras: mockCameras, mics: mockMics });
      setSelectedCamera('default');
      setSelectedMic('default');
    }
  };

  const startPreview = async () => {
    try {
      console.log('🎬 Starting preview with settings:', { 
        video: isVideoEnabled, 
        audio: isAudioEnabled,
        selectedCamera,
        selectedMic 
      });
      
      const constraints = {
        video: isVideoEnabled ? (
          selectedCamera === 'default' 
            ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            : { deviceId: selectedCamera, width: { ideal: 1280 }, height: { ideal: 720 } }
        ) : false,
        audio: isAudioEnabled ? (
          selectedMic === 'default' 
            ? true 
            : { deviceId: selectedMic }
        ) : false
      };

      console.log('📹 Media constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Media stream obtained:', mediaStream.getTracks().length, 'tracks');
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('✅ Video element updated with stream');
      }
      
      setStep(2);
      console.log('✅ Preview started successfully');
    } catch (error) {
      console.error('Error starting preview:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to access camera/microphone. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone permissions in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found. Please connect a device and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera or microphone is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera settings not supported. Trying with default settings...';
        
        // Try again with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ 
            video: isVideoEnabled, 
            audio: isAudioEnabled 
          });
          setStream(basicStream);
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
          }
          setStep(2);
          return;
        } catch (retryError) {
          console.error('Retry with basic constraints failed:', retryError);
        }
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const startLiveStream = async () => {
    console.log('🚀 Starting live stream...');
    console.log('📝 Stream title:', streamTitle);
    console.log('👤 User:', user?.id);
    
    if (!streamTitle.trim()) {
      alert('Please enter a stream title');
      return;
    }

    if (!user?.id) {
      alert('Please sign in to start streaming');
      return;
    }

    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase not configured - creating mock live stream');
        
        // Create mock live stream for demo purposes
        const mockLiveStream = {
          id: `mock_${Date.now()}`,
          streamer_id: user.id,
          title: streamTitle,
          description: streamDescription,
          is_live: true,
          viewer_count: Math.floor(Math.random() * 50) + 1,
          started_at: new Date().toISOString()
        };
        
        console.log('✅ Mock live stream created:', mockLiveStream);
        
        setIsLive(true);
        setStep(3);
        
        // Start viewer count simulation
        streamIntervalRef.current = setInterval(() => {
          const newViewers = Math.floor(Math.random() * 10) + viewerCount;
          setViewerCount(newViewers);
          setStreamStats(prev => ({
            ...prev,
            duration: prev.duration + 1,
            viewers: newViewers,
            peakViewers: Math.max(prev.peakViewers, newViewers),
            likes: prev.likes + Math.floor(Math.random() * 3)
          }));
        }, 5000);
        
        onGoLive(mockLiveStream);
        return;
      }

      // Try to create real live stream in database
      try {
        console.log('🎥 Creating live stream in database...');
        console.log('📝 Stream data:', {
          streamer_id: user.id,
          title: streamTitle,
          description: streamDescription
        });

        const { data: liveStream, error } = await supabase
          .from('live_streams')
          .insert({
            streamer_id: user.id,
            title: streamTitle,
            description: streamDescription,
            is_live: true,
            viewer_count: 0,
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Database error creating live stream:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        console.log('✅ Live stream created successfully:', liveStream);
        
        setIsLive(true);
        setStep(3);
        
        // Start viewer count simulation and stream stats
        streamIntervalRef.current = setInterval(() => {
          const newViewers = Math.floor(Math.random() * 10) + viewerCount;
          setViewerCount(newViewers);
          setStreamStats(prev => ({
            ...prev,
            duration: prev.duration + 1,
            viewers: newViewers,
            peakViewers: Math.max(prev.peakViewers, newViewers),
            likes: prev.likes + Math.floor(Math.random() * 3)
          }));
        }, 5000);

        onGoLive(liveStream);
        
      } catch (dbError) {
        console.warn('⚠️ Database live stream creation failed, using mock stream:', dbError);
        
        // Fallback to mock stream if database fails
        const mockLiveStream = {
          id: `mock_${Date.now()}`,
          streamer_id: user.id,
          title: streamTitle,
          description: streamDescription,
          is_live: true,
          viewer_count: Math.floor(Math.random() * 50) + 1,
          started_at: new Date().toISOString()
        };
        
        console.log('✅ Mock live stream created as fallback:', mockLiveStream);
        
        setIsLive(true);
        setStep(3);
        
        // Start viewer count simulation
        streamIntervalRef.current = setInterval(() => {
          const newViewers = Math.floor(Math.random() * 10) + viewerCount;
          setViewerCount(newViewers);
          setStreamStats(prev => ({
            ...prev,
            duration: prev.duration + 1,
            viewers: newViewers,
            peakViewers: Math.max(prev.peakViewers, newViewers),
            likes: prev.likes + Math.floor(Math.random() * 3)
          }));
        }, 5000);
        
        onGoLive(mockLiveStream);
      }

    } catch (error) {
      console.error('Error starting live stream:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Provide helpful error messages
      if (errorMessage.includes('permission')) {
        alert('Camera/microphone permission required. Please allow access and try again.');
      } else if (errorMessage.includes('NotFound')) {
        alert('No camera or microphone found. Please connect a device and try again.');
      } else if (errorMessage.includes('NotAllowed')) {
        alert('Camera/microphone access denied. Please check your browser permissions.');
      } else {
        alert(`Failed to start live stream: ${errorMessage}\n\nTip: Try refreshing the page and allowing camera/microphone permissions.`);
      }
    }
  };

  const endLiveStream = async () => {
    try {
      // Try to update live stream record in database
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        try {
          await supabase
            .from('live_streams')
            .update({
              is_live: false,
              ended_at: new Date().toISOString()
            })
            .eq('streamer_id', user?.id)
            .eq('is_live', true);
          
          console.log('✅ Live stream ended in database');
        } catch (dbError) {
          console.warn('⚠️ Failed to update database, but stream ended locally:', dbError);
        }
      } else {
        console.log('✅ Mock live stream ended');
      }

      // Stop media tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Media tracks stopped');
      }

      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        console.log('✅ Stream interval cleared');
      }

      setIsLive(false);
      console.log('✅ Live stream ended successfully');
      onClose();
    } catch (error) {
      console.error('Error ending live stream:', error);
      // Still close the modal even if database update fails
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      setIsLive(false);
      onClose();
    }
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now(),
      user: user?.name || 'Anonymous',
      message: newComment,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const addGiftComment = (giftName: string, giftEmoji: string, tokenAmount: number) => {
    const comment = {
      id: Date.now(),
      user: user?.name || 'Anonymous',
      message: `sent ${giftEmoji} ${giftName} (${tokenAmount} tokens)`,
      timestamp: new Date().toLocaleTimeString(),
      isGift: true
    };
    
    setComments(prev => [...prev, comment]);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-sm sm:max-w-md md:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${
              isLive ? 'bg-red-600 animate-pulse' : 'bg-orange-500'
            }`}>
              <Video className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
                {step === 1 ? 'Set Up Live Stream' : 
                 step === 2 ? 'Preview Stream' : 
                 'Live Stream'}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-400">
                {step === 1 ? 'Configure your stream settings' :
                 step === 2 ? 'Check your setup before going live' :
                 `${viewerCount} viewers watching`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isLive && (
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-1 text-red-400">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold hidden sm:inline">LIVE</span>
                  <span className="font-semibold sm:hidden">●</span>
                </div>
                <div className="text-gray-400 hidden sm:block">
                  {formatDuration(streamStats.duration)}
                </div>
              </div>
            )}
            <button
              onClick={isLive ? endLiveStream : onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row">
          {/* Main Content */}
          <div className="flex-1 relative">
            {/* Video Preview */}
            <div className="relative bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <Camera className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-gray-400 mx-auto mb-2 sm:mb-4" />
                    <p className="text-gray-400 text-sm sm:text-base">
                      {step === 1 ? 'Configure settings and start preview' : 'Camera preview will appear here'}
                    </p>
                  </div>
                </div>
              )}

              {/* Live Overlay */}
              {step === 1 && streamTitle && (
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 space-y-1 sm:space-y-2">
                  <div className="bg-black/70 text-white px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-semibold">
                    PREVIEW
                  </div>
                  <div className="bg-black/70 text-white px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm max-w-[200px] sm:max-w-[300px] truncate">
                    {streamTitle}
                  </div>
                </div>
              )}

              {isLive && (
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 space-y-1 sm:space-y-2">
                  <div className="bg-red-600 text-white px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-semibold animate-pulse">
                    LIVE
                  </div>
                  <div className="bg-black/70 text-white px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{viewerCount}</span>
                  </div>
                </div>
              )}

              {/* Quick Actions for Step 1 */}
              {step === 1 && (
                <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 space-y-2">
                  {devices.cameras.length > 1 && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Camera</label>
                      <select
                        value={selectedCamera}
                        onChange={(e) => setSelectedCamera(e.target.value)}
                        className="w-full px-2 py-2 sm:px-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      >
                        {devices.cameras.map(camera => (
                          <option key={camera.deviceId} value={camera.deviceId}>
                            {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {devices.mics.length > 1 && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Microphone</label>
                      <select
                        value={selectedMic}
                        onChange={(e) => setSelectedMic(e.target.value)}
                        className="w-full px-2 py-2 sm:px-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      >
                        {devices.mics.map(mic => (
                          <option key={mic.deviceId} value={mic.deviceId}>
                            {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Quick Start Button */}
                  <button
                    onClick={() => {
                      if (streamTitle.trim()) {
                        startPreview();
                      } else {
                        alert('Please enter a stream title first');
                      }
                    }}
                    disabled={!streamTitle.trim()}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Video className="h-4 w-4" />
                    <span>Quick Start Live Stream</span>
                  </button>
                </div>
              )}

              {/* Stream Stats Overlay */}
              {isLive && (
                <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black/70 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
                    <div>
                      <div className="font-bold text-red-400">{streamStats.viewers}</div>
                      <div className="text-xs hidden sm:block">Viewers</div>
                    </div>
                    <div>
                      <div className="font-bold text-pink-400">{streamStats.likes}</div>
                      <div className="text-xs hidden sm:block">Likes</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-400">{formatDuration(streamStats.duration)}</div>
                      <div className="text-xs hidden sm:block">Time</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stream Controls */}
            <div className="p-2 sm:p-3 md:p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                <button
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className={`p-2 sm:p-3 rounded-full transition-colors ${
                    isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isVideoEnabled ? <Video className="h-4 w-4 sm:h-5 sm:w-5" /> : <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
                
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`p-2 sm:p-3 rounded-full transition-colors ${
                    isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isAudioEnabled ? <Mic className="h-4 w-4 sm:h-5 sm:w-5" /> : <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>

                {step === 1 && (
                  <button
                    onClick={startPreview}
                    disabled={!streamTitle.trim()}
                    className="px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                  >
                    <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Start Preview</span>
                    <span className="sm:hidden">Preview</span>
                  </button>
                )}

                {step === 2 && (
                  <button
                    onClick={startLiveStream}
                    disabled={!streamTitle.trim()}
                    className="px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                  >
                    <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Go Live</span>
                    <span className="sm:hidden">Live</span>
                  </button>
                )}

                {step === 3 && (
                  <button
                    onClick={endLiveStream}
                    className="px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                  >
                    <Square className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">End Stream</span>
                    <span className="sm:hidden">End</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-80 bg-gray-800 border-t md:border-t-0 md:border-l border-gray-700 flex flex-col max-h-[40vh] md:max-h-none">
            {step === 1 && (
              <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">Stream Setup</h3>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Stream Title</label>
                  <input
                    type="text"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    className="w-full px-2 py-2 sm:px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    placeholder="What's happening at the track?"
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-400 mt-1">{streamTitle.length}/100</div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Description (Optional)</label>
                  <textarea
                    value={streamDescription}
                    onChange={(e) => setStreamDescription(e.target.value)}
                    className="w-full px-2 py-2 sm:px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    rows={2}
                    placeholder="Tell viewers what they'll see..."
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-400 mt-1">{streamDescription.length}/500</div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Camera</label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full px-2 py-2 sm:px-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    {devices.cameras.map(camera => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Microphone</label>
                  <select
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="w-full px-2 py-2 sm:px-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    {devices.mics.map(mic => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center space-x-2 text-blue-300 text-xs sm:text-sm">
                    <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Live streams are visible to all your followers and can attract new fans!</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">Ready to Go Live?</h3>
                
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">Stream Details</h4>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-400">Title:</span>
                      <span className="text-white ml-2 break-words">{streamTitle}</span>
                    </div>
                    {streamDescription && (
                      <div>
                        <span className="text-gray-400">Description:</span>
                        <span className="text-white ml-2 break-words">{streamDescription}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Video:</span>
                      <span className={`ml-2 ${isVideoEnabled ? 'text-green-400' : 'text-red-400'}`}>
                        {isVideoEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Audio:</span>
                      <span className={`ml-2 ${isAudioEnabled ? 'text-green-400' : 'text-red-400'}`}>
                        {isAudioEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center space-x-2 text-red-300 text-xs sm:text-sm">
                    <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Once you go live, your stream will be visible to all followers!</span>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex-1 flex flex-col">
                {/* Live Chat */}
                <div className="p-2 sm:p-3 md:p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <span className="font-semibold text-white text-sm sm:text-base">Live Chat</span>
                    <span className="text-xs sm:text-sm text-gray-400">({comments.length})</span>
                  </div>
                </div>

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 max-h-[200px] sm:max-h-[300px] md:max-h-none">
                  {comments.length === 0 ? (
                    <div className="text-center text-gray-400 py-4 sm:py-8">
                      <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">No comments yet</p>
                      <p className="text-xs">Be engaging to get viewers chatting!</p>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="bg-gray-700 rounded-lg p-2 sm:p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-white text-xs sm:text-sm">{comment.user}</span>
                          <span className="text-xs text-gray-400">{comment.timestamp}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-300 break-words">{comment.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <div className="p-2 sm:p-3 md:p-4 border-t border-gray-700">
                  <div className="flex space-x-1 sm:space-x-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 px-2 py-2 sm:px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      placeholder="Say something to viewers..."
                      onKeyPress={(e) => e.key === 'Enter' && addComment()}
                    />
                    <button
                      onClick={addComment}
                      className="px-2 py-2 sm:px-3 sm:py-2 md:px-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stream Actions */}
        {step === 3 && (
          <div className="p-2 sm:p-3 md:p-4 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button className="flex items-center space-x-1 sm:space-x-2 px-2 py-1 sm:px-3 sm:py-2 md:px-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
                  <span className="text-white text-sm">{streamStats.likes}</span>
                </button>
                <button className="flex items-center space-x-1 sm:space-x-2 px-2 py-1 sm:px-3 sm:py-2 md:px-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                  <span className="text-white text-sm hidden sm:inline">Share</span>
                </button>
              </div>
              
              <div className="text-xs sm:text-sm text-gray-400">
                Peak viewers: {streamStats.peakViewers}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Gift Modal */}
      {showGiftModal && (
        <GiftModal
          racerId={user?.id || ''}
          racerName={user?.name || 'Streamer'}
          onClose={() => setShowGiftModal(false)}
          onGiftSent={(giftName: string, giftEmoji: string, tokenAmount: number) => {
            addGiftComment(giftName, giftEmoji, tokenAmount);
            setShowGiftModal(false);
          }}
        />
      )}
      
      {/* Token Store Modal */}
      {showTokenStore && (
        <TokenStore
          onClose={() => setShowTokenStore(false)}
        />
      )}
    </div>
  );
};
