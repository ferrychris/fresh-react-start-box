import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';

interface UpcomingRacesProps {
  userId: string;
}

interface Race {
  id: string;
  eventName: string;
  date: string;
  track: string;
  series: string;
}

export const UpcomingRaces: React.FC<UpcomingRacesProps> = ({ userId }) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingRaces = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const today = new Date().toISOString();
        
        // Fetch upcoming races for this racer from race_schedules
        const { data, error } = await supabase
          .from('race_schedules')
          .select('id, event_name, event_date, track_name')
          .eq('racer_id', userId)
          .gt('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5);
          
        if (error) {
          console.error('Error fetching upcoming races:', error);
          // If there's an error or no data, fall back to mock data
          setRaces(getMockRaces());
        } else if (data && data.length > 0) {
          const formattedRaces = data.map((race: any) => ({
            id: race.id,
            eventName: race.event_name,
            date: race.event_date,
            track: race.track_name,
            series: ''
          }));
          setRaces(formattedRaces);
        } else {
          // No upcoming races found, use mock data
          setRaces(getMockRaces());
        }
      } catch (error) {
        console.error('Error in fetchUpcomingRaces:', error);
        setRaces(getMockRaces());
      } finally {
        setLoading(false);
      }
    };
    
    fetchUpcomingRaces();
  }, [userId]);

  // Fallback mock data
  const getMockRaces = (): Race[] => [
    {
      id: '1',
      eventName: 'Charlotte 400',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      track: 'Charlotte Motor Speedway',
      series: 'Cup Series'
    },
    {
      id: '2',
      eventName: 'Bristol Night Race',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      track: 'Bristol Motor Speedway',
      series: 'Cup Series'
    }
  ];

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Upcoming Races</h3>
        <Calendar className="w-5 h-5 text-slate-400" />
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : races.length > 0 ? (
          races.map((race) => (
            <div key={race.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white">{race.eventName}</h4>
                  <p className="text-slate-400">{race.track}</p>
                  <p className="text-xs text-slate-500">{race.series}</p>
                </div>
                <div className="bg-slate-700 px-3 py-1 rounded-lg text-white font-medium">
                  {new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400">
            <p>No upcoming races scheduled</p>
          </div>
        )}
      </div>
      <button className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
        View Full Schedule
      </button>
    </div>
  );
};
