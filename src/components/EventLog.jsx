import React, { useState, useEffect } from 'react';
import { Filter, Calendar, Grid, Play, ZoomIn, ZoomOut, Download, ChevronRight, X, AlertOctagon, CheckSquare } from 'lucide-react';
import { API_URL } from '../config';


export default function EventLog({ token }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [typeFilter, setTypeFilter] = useState('');
  const [recognizedFilter, setRecognizedFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected event for modal view
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Image Digital Zoom inside modal
  const [modalImageZoom, setModalImageZoom] = useState(1.0);

  useEffect(() => {
    fetchEvents();
  }, [typeFilter, recognizedFilter, startDate, endDate]);

  // Reset zoom whenever selected event changes
  useEffect(() => {
    setModalImageZoom(1.0);
  }, [selectedEvent]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let query = `${API_URL}/api/events?1=1`;
      if (typeFilter) query += `&type=${encodeURIComponent(typeFilter)}`;
      if (recognizedFilter !== '') query += `&is_recognized=${recognizedFilter}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const res = await fetch(query, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const cutoff = new Date('2026-07-21T17:00:00Z');
        setEvents(data.filter(e => new Date(e.timestamp) >= cutoff));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyles = (type, recognized) => {
    if (type === 'Human Detected' && recognized === 0) {
      return 'bg-red-950/60 text-red-400 border-red-500/30';
    }
    if (type === 'Recognized Owner') {
      return 'bg-farm-900/60 text-farm-300 border-farm-800/40';
    }
    return 'bg-security-800 text-security-300 border-security-700';
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      
      {/* Filters Box */}
      <div className="bg-security-900 border border-security-800 p-5 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Filter className="w-4 h-4 text-farm-400" />
          <span>Timeline Filter Controls</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-security-400 mb-1.5">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-security-950 border border-security-700 text-security-200 text-xs px-3 py-2 rounded-lg outline-none focus:border-farm-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-security-400 mb-1.5">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-security-950 border border-security-700 text-security-200 text-xs px-3 py-2 rounded-lg outline-none focus:border-farm-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-security-400 mb-1.5">Detection Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full bg-security-950 border border-security-700 text-security-200 text-xs px-3 py-2 rounded-lg outline-none focus:border-farm-500"
            >
              <option value="">All Types</option>
              <option value="Human Detected">Human Detected</option>
              <option value="Recognized Owner">Recognized Owner</option>
              <option value="Animal Ignored">Animal Ignored</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-security-400 mb-1.5">Status</label>
            <select
              value={recognizedFilter}
              onChange={e => setRecognizedFilter(e.target.value)}
              className="w-full bg-security-950 border border-security-700 text-security-200 text-xs px-3 py-2 rounded-lg outline-none focus:border-farm-500"
            >
              <option value="">All Statuses</option>
              <option value="1">Recognized (Access Allowed)</option>
              <option value="0">Unrecognized (Alarm Triggered)</option>
            </select>
          </div>
        </div>

        {(startDate || endDate || typeFilter || recognizedFilter !== '') && (
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setTypeFilter('');
                setRecognizedFilter('');
              }}
              className="text-xs text-farm-400 hover:text-farm-300 font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Grid of Event Cards */}
      {loading ? (
        <div className="text-center py-20 text-security-400">Querying timeline records...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div 
              key={event.id}
              className="bg-security-900 border border-security-800 rounded-xl overflow-hidden shadow-xl flex flex-col group hover:border-farm-600/30 transition-all"
            >
              
              {/* Media Thumbnail Container */}
              <div className="aspect-video bg-security-950 border-b border-security-800/40 relative overflow-hidden flex items-center justify-center">
                {event.media_path ? (
                  <img 
                    src={`${API_URL}${event.media_path}`} 
                    alt={event.detection_type} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-security-600 text-xs font-mono uppercase">Telemetry event only</div>
                )}
                
                <button 
                  onClick={() => setSelectedEvent(event)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-bold text-xs uppercase"
                >
                  <ZoomIn className="w-5 h-5 text-farm-400" />
                  <span>Inspect Media</span>
                </button>

                {event.media_type === 'video' && (
                  <span className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1">
                    <Play className="w-3 h-3 fill-white" /> VIDEO
                  </span>
                )}
              </div>

              {/* Event details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-security-400">#{event.id}</span>
                    <span className="text-xs text-security-400">{formatTime(event.timestamp)}</span>
                  </div>
                  
                  <h4 className="text-md font-bold text-white">{event.detection_type}</h4>
                  <p className="text-xs text-security-300 mt-1">Zone: {event.zone_name}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-security-800/60">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getBadgeStyles(event.detection_type, event.is_recognized)}`}>
                    {event.is_recognized === 1 ? 'RECOGNIZED / SILENT' : 'UNRECOGNIZED / ALARM'}
                  </span>
                  
                  <button 
                    onClick={() => setSelectedEvent(event)}
                    className="text-farm-400 hover:text-farm-300 p-1 rounded transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
          ))}

          {events.length === 0 && (
            <div className="col-span-full text-center py-20 bg-security-900 border border-security-800 rounded-xl text-security-400 font-medium">
              No matching events found in logs database.
            </div>
          )}
        </div>
      )}

      {/* Expanded inspect media modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-security-900 border border-security-800 rounded-xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-security-400 hover:text-white z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-2">
              <span className={`text-xs font-bold uppercase border px-2 py-0.5 rounded ${getBadgeStyles(selectedEvent.detection_type, selectedEvent.is_recognized)}`}>
                {selectedEvent.detection_type}
              </span>
              <h3 className="text-xl font-bold text-white">Event Log #{selectedEvent.id} Detail</h3>
              <p className="text-xs text-security-400">
                Triggered on {formatTime(selectedEvent.timestamp)} • Target Zone: {selectedEvent.zone_name}
              </p>
            </div>

            {/* Media Screen with Zoom controls for photos */}
            <div className="border border-security-800 rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center relative">
              {selectedEvent.media_path ? (
                selectedEvent.media_type === 'video' ? (
                  <video 
                    src={`${API_URL}${selectedEvent.media_path}`} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                    <img 
                      src={`${API_URL}${selectedEvent.media_path}`} 
                      alt="Expanded view" 
                      className="w-full h-full object-contain transition-transform duration-200 origin-center"
                      style={{ transform: `scale(${modalImageZoom})` }}
                    />
                    {/* Zoom HUD buttons overlay */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-security-900/80 border border-security-700 px-3 py-1.5 rounded-lg backdrop-blur z-10">
                      <button 
                        onClick={() => setModalImageZoom(prev => Math.max(1.0, prev - 0.25))}
                        className="p-1 hover:bg-security-800 rounded text-security-300 hover:text-white"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono font-bold text-farm-400 min-w-[45px] text-center">
                        {modalImageZoom.toFixed(2)}x
                      </span>
                      <button 
                        onClick={() => setModalImageZoom(prev => Math.min(4.0, prev + 0.25))}
                        className="p-1 hover:bg-security-800 rounded text-security-300 hover:text-white"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-security-550 text-sm font-mono text-center">
                  <AlertOctagon className="w-12 h-12 text-security-700 mx-auto mb-2" />
                  NO PHOTO/VIDEO CAPTURED<br />
                  <span className="text-xs">Radar telemetry triggered silent event.</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
              <div className="text-xs text-security-400 text-center sm:text-left">
                {selectedEvent.is_recognized === 1 ? (
                  <span className="text-farm-400 flex items-center gap-1.5 justify-center sm:justify-start">
                    <CheckSquare className="w-4 h-4" /> Enrolled biometric signature match. System silent.
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1.5 justify-center sm:justify-start animate-pulse">
                    <AlertOctagon className="w-4 h-4" /> Unrecognized entity. Alarm triggered & alerts dispatched.
                  </span>
                )}
              </div>

              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-security-800 hover:bg-security-750 text-security-300 rounded-lg font-semibold text-xs uppercase"
                >
                  Close
                </button>
                {selectedEvent.media_path && (
                  <a 
                    href={`${API_URL}${selectedEvent.media_path}`} 
                    download={`FarmGuard-Event-${selectedEvent.id}.jpg`}
                    className="px-4 py-2 bg-farm-600 hover:bg-farm-500 text-white rounded-lg font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Evidence</span>
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
