import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';

interface UpcomingRacesProps {
  userId: string;
  canEdit?: boolean; // show create form for owner
}

interface Race {
  id: string;
  eventName: string;
  date: string;
  track: string;
  series: string;
}

export const UpcomingRaces: React.FC<UpcomingRacesProps> = ({ userId, canEdit = false }) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [trackName, setTrackName] = useState('');
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEventName, setEditEventName] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editTrackName, setEditTrackName] = useState('');
  const [description, setDescription] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Lookups
  const [seriesOptions, setSeriesOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [trackOptions, setTrackOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [seriesId, setSeriesId] = useState<string>('');
  const [trackId, setTrackId] = useState<string>('');
  const [editSeriesId, setEditSeriesId] = useState<string>('');
  const [editTrackId, setEditTrackId] = useState<string>('');

  useEffect(() => {
    const fetchUpcomingRaces = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const today = new Date().toISOString();
        
        // Load lookups
        const [seriesRes, tracksRes] = await Promise.all([
          supabase.from('race_series').select('id, name').order('name'),
          supabase.from('tracks').select('id, name').order('name'),
        ]);
        if (!seriesRes.error) setSeriesOptions((seriesRes.data as any[])?.map((r) => ({ id: r.id, name: r.name })) || []);
        if (!tracksRes.error) setTrackOptions((tracksRes.data as any[])?.map((r) => ({ id: r.id, name: r.name })) || []);

        // Fetch upcoming races for this racer from race_schedules
        const { data, error } = await supabase
          .from('race_schedules')
          .select('id, event_name, event_date, track_name, description, series_id, track_id')
          .eq('racer_id', userId)
          .gt('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5);
          
        if (error) {
          console.error('Error fetching upcoming races:', error);
          // Do not use mock data; show empty state
          setRaces([]);
        } else if (data && data.length > 0) {
          const formattedRaces = data.map((race: any) => {
            const track = trackOptions.find(t => t.id === race.track_id)?.name || race.track_name;
            const series = seriesOptions.find(s => s.id === race.series_id)?.name || '';
            return {
              id: race.id,
              eventName: race.event_name,
              date: race.event_date,
              track,
              series,
            } as Race;
          });
          setRaces(formattedRaces);
        } else {
          // No upcoming races found
          setRaces([]);
        }
      } catch (error) {
        console.error('Error in fetchUpcomingRaces:', error);
        setRaces([]);
      } finally {
        setLoading(false);
      }
    };

  
    
    fetchUpcomingRaces();
  }, [userId]);

  // Editing helpers at component scope (outside useEffect)
  const startEdit = (race: Race) => {
    setEditingId(race.id);
    setEditEventName(race.eventName);
    // Convert ISO to local datetime-local value
    const dt = new Date(race.date);
    const tzOffset = dt.getTimezoneOffset();
    const local = new Date(dt.getTime() - tzOffset * 60000).toISOString().slice(0, 16);
    setEditEventDate(local);
    setEditTrackName(race.track);
    setEditDescription('');
    setEditSeriesId(seriesOptions.find((s) => s.name === race.series)?.id || '');
    setEditTrackId(trackOptions.find((t) => t.name === race.track)?.id || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditEventName('');
    setEditEventDate('');
    setEditTrackName('');
    setEditDescription('');
    setEditSeriesId('');
    setEditTrackId('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('race_schedules')
        .update({
          event_name: editEventName,
          event_date: new Date(editEventDate).toISOString(),
          track_name: editTrackName,
          series_id: editSeriesId || null,
          track_id: editTrackId || null,
          description: editDescription || null,
        })
        .eq('id', editingId)
        .eq('racer_id', userId);
      if (error) throw error;
      await refresh();
      cancelEdit();
    } catch (e) {
      console.error('Failed to update schedule', e);
    } finally {
      setSaving(false);
    }
  };

  const deleteRace = async (id: string) => {
    try {
      const { error } = await supabase
        .from('race_schedules')
        .delete()
        .eq('id', id)
        .eq('racer_id', userId);
      if (error) throw error;
      await refresh();
    } catch (e) {
      console.error('Failed to delete schedule', e);
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString();
      const { data } = await supabase
        .from('race_schedules')
        .select('id, event_name, event_date, track_name')
        .eq('racer_id', userId)
        .gt('event_date', today)
        .order('event_date', { ascending: true })
        .limit(5);
      if (data && data.length > 0) {
        setRaces(
          data.map((race: any) => ({
            id: race.id,
            eventName: race.event_name,
            date: race.event_date,
            track: race.track_name,
            series: ''
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!eventName || !eventDate || !trackName) return;
    setSaving(true);
    try {
      // Insert schedule row; RLS requires racer_id = auth.uid()
      const { error: insErr } = await supabase
        .from('race_schedules')
        .insert({
          racer_id: userId,
          event_name: eventName,
          event_date: new Date(eventDate).toISOString(),
          track_name: trackName,
          series_id: seriesId || null,
          track_id: trackId || null,
          description: description || null,
        });
      if (insErr) throw insErr;

      // Optionally notify followers
      if (notifyFollowers) {
        const { data: fans } = await supabase
          .from('fan_connections')
          .select('fan_id')
          .eq('racer_id', userId);
        const notifications = (fans || []).map((f: any) => ({
          user_id: f.fan_id,
          title: 'New race scheduled',
          message: `${eventName} at ${trackName} on ${new Date(eventDate).toLocaleString()}`,
          type: 'race_schedule',
          read: false,
        }));
        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications as any);
        }
      }

      // Reset form and refresh list
      setEventName('');
      setEventDate('');
      setTrackName('');
      setSeriesId('');
      setTrackId('');
      setDescription('');
      setShowForm(false);
      await refresh();
    } catch (e) {
      console.error('Failed to create schedule', e);
    } finally {
      setSaving(false);
    }
  };

  // No mock data; display empty state when there are no upcoming races

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Upcoming Races</h3>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          {canEdit && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-3 h-3" /> Add Race
            </button>
          )}
        </div>
      </div>
      {canEdit && showForm && (
        <div className="mb-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Event name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
            <input
              type="datetime-local"
              className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-orange-500"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <input
              className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Track name"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white" value={seriesId} onChange={(e) => setSeriesId(e.target.value)}>
              <option value="">Select series (optional)</option>
              {seriesOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white" value={trackId} onChange={(e) => setTrackId(e.target.value)}>
              <option value="">Select track (optional)</option>
              {trackOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <input
              className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white"
              placeholder="Short description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <label className="text-slate-300 text-sm inline-flex items-center gap-2">
              <input type="checkbox" checked={notifyFollowers} onChange={(e) => setNotifyFollowers(e.target.checked)} />
              Notify followers
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white"
              >
                Cancel
              </button>
              <button
                disabled={saving || !eventName || !eventDate || !trackName}
                onClick={handleCreate}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : races.length > 0 ? (
          races.map((race) => (
            <div key={race.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              {canEdit && editingId === race.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Event name"
                      value={editEventName}
                      onChange={(e) => setEditEventName(e.target.value)}
                    />
                    <input
                      type="datetime-local"
                      className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-orange-500"
                      value={editEventDate}
                      onChange={(e) => setEditEventDate(e.target.value)}
                    />
                    <input
                      className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Track name"
                      value={editTrackName}
                      onChange={(e) => setEditTrackName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white" value={editSeriesId} onChange={(e) => setEditSeriesId(e.target.value)}>
                      <option value="">Select series (optional)</option>
                      {seriesOptions.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <select className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white" value={editTrackId} onChange={(e) => setEditTrackId(e.target.value)}>
                      <option value="">Select track (optional)</option>
                      {trackOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <input
                      className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-sm text-white"
                      placeholder="Short description (optional)"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={cancelEdit} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button disabled={saving || !editEventName || !editEventDate || !editTrackName} onClick={saveEdit} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                      <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white">{race.eventName}</h4>
                    <p className="text-slate-400">{race.track}</p>
                    <p className="text-xs text-slate-500">{race.series}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-700 px-3 py-1 rounded-lg text-white font-medium">
                      {new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => startEdit(race)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRace(race.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400">
            <p>No upcoming races scheduled</p>
          </div>
        )}
      </div>
      <button onClick={() => window.location.href = `/racer/${userId}/schedule`} className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
        View Full Schedule
      </button>
    </div>
  );
};
