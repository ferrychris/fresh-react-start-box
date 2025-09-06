import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Row {
  id: string;
  event_name: string;
  event_date: string;
  track_name?: string | null;
  description?: string | null;
  series_id?: string | null;
  track_id?: string | null;
}

const FullSchedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const racerId = id as string;
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!racerId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('race_schedules')
          .select('id, event_name, event_date, track_name, description, series_id, track_id')
          .eq('racer_id', racerId)
          .order('event_date', { ascending: true });
        if (!error) setRows((data as Row[]) || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [racerId]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return rows.filter(r => new Date(r.event_date) >= now);
  }, [rows]);
  const past = useMemo(() => {
    const now = new Date();
    return rows.filter(r => new Date(r.event_date) < now).reverse();
  }, [rows]);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={`/racer/${racerId}`} className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
              <ArrowLeft className="w-4 h-4" /> Back to Profile
            </Link>
          </div>
          <div className="inline-flex items-center gap-2 text-slate-400">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold text-white">Full Schedule</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading schedule…</div>
        ) : (
          <div className="space-y-10">
            <section>
              <h3 className="text-lg font-bold text-white mb-3">Upcoming</h3>
              {upcoming.length === 0 ? (
                <div className="text-slate-400">No upcoming events</div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((r) => (
                    <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-white font-semibold">{r.event_name}</div>
                          <div className="text-slate-400 text-sm">{r.track_name}</div>
                          <div className="text-slate-500 text-xs"></div>
                          {r.description && (
                            <div className="text-slate-300 text-sm mt-1">{r.description}</div>
                          )}
                        </div>
                        <div className="bg-slate-700 px-3 py-1 rounded-lg text-white font-medium">
                          {new Date(r.event_date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-lg font-bold text-white mb-3">Past</h3>
              {past.length === 0 ? (
                <div className="text-slate-400">No past events</div>
              ) : (
                <div className="space-y-3">
                  {past.map((r) => (
                    <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 opacity-80">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-white font-semibold">{r.event_name}</div>
                          <div className="text-slate-400 text-sm">{r.track?.name || r.track_name}</div>
                          <div className="text-slate-500 text-xs">{r.series?.name || ''}</div>
                          {r.description && (
                            <div className="text-slate-300 text-sm mt-1">{r.description}</div>
                          )}
                        </div>
                        <div className="bg-slate-800 px-3 py-1 rounded-lg text-slate-200 font-medium">
                          {new Date(r.event_date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullSchedule;
