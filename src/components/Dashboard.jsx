import React, { useState, useEffect } from 'react';
import { 
  Users, Key, AlertTriangle, Camera, CheckCircle, Clock, 
  Activity, Shield, ShieldAlert, Radio
} from 'lucide-react';
import { API_URL } from '../config';

export default function Dashboard({ deviceStatus, recentEvents, token, online }) {
  const [stats, setStats] = useState({
    faces: 0,
    rfid: 0,
    unknown: 0,
    totalAttendance: 0
  });

  const [attendance, setAttendance] = useState([]);
  
  useEffect(() => {
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      const [facesRes, rfidRes, attendanceRes] = await Promise.all([
        fetch(`${API_URL}/api/faces`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/rfid`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/attendance`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      let facesCount = 0, rfidCount = 0, unknownCount = 0, attendList = [];
      
      if (facesRes.ok) {
        const faces = await facesRes.json();
        facesCount = faces.length;
      }
      if (rfidRes.ok) {
        const rfids = await rfidRes.json();
        rfidCount = rfids.length;
      }
      if (attendanceRes.ok) {
        attendList = await attendanceRes.json();
        unknownCount = attendList.filter(a => a.person_name === 'Unknown').length;
      }

      setStats({
        faces: facesCount,
        rfid: rfidCount,
        unknown: unknownCount,
        totalAttendance: attendList.length
      });
      setAttendance(attendList.slice(0, 10)); // Just recent for feed
    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Status Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Registered Faces Card */}
        <div className="bg-[#121a14] border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Registered Faces</span>
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white mb-1">{stats.faces}</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">Total active face profiles</p>
          </div>
        </div>

        {/* Active RFID Cards Card */}
        <div className="bg-[#121a14] border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active RFID Cards</span>
            <Key className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white mb-1">{stats.rfid}</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">Total registered RFID tags</p>
          </div>
        </div>

        {/* Unknown Faces Card */}
        <div className="bg-[#121a14] border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Unknown Face Alerts</span>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white mb-1">{stats.unknown}</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">Total unrecognized attempts</p>
          </div>
        </div>

        {/* Camera Status Card */}
        <div className="bg-[#121a14] border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Camera Status</span>
            <Camera className={`w-6 h-6 ${online ? 'text-emerald-400 animate-pulse' : 'text-gray-600'}`} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{online ? 'ONLINE' : 'OFFLINE'}</h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">
                {online ? 'ESP32 Streaming' : 'Connection Lost'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Simple Data Analysis Chart Panel (Placeholder via CSS styling) */}
        <div className="lg:col-span-2 bg-[#121a14] border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Recognition Activity Overview</span>
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">Last 7 Days</span>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 pt-4 px-2 h-64">
            {/* Minimalist CSS bar chart representing activity */}
            {[45, 60, 30, 80, 55, 90, 70].map((height, i) => (
              <div key={i} className="flex flex-col items-center w-full gap-2">
                <div className="w-full relative h-full flex items-end rounded overflow-hidden">
                  <div 
                    className="w-full bg-emerald-500/80 rounded-t-sm hover:bg-emerald-400 transition-colors"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-gray-500 font-medium">Day {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-[#121a14] border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col h-96 lg:h-auto">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span>Live Activity Feed</span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {attendance.length > 0 ? attendance.map((log) => (
              <div key={log.id} className={`p-3 rounded-lg flex items-start justify-between border ${
                log.person_name === 'Unknown' ? 'bg-red-500/10 border-red-500/20' : 'bg-[#1a241c] border-gray-800'
              }`}>
                <div className="flex gap-3">
                  <div className={`mt-0.5 p-2 rounded-full ${
                    log.person_name === 'Unknown' ? 'bg-red-500/20 text-red-400' : 
                    log.method === 'Face' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {log.person_name === 'Unknown' ? <ShieldAlert size={16}/> : log.method === 'Face' ? <Camera size={16}/> : <Key size={16}/>}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {log.person_name === 'Unknown' ? 'Unknown Person Detected' : `${log.person_name} Authenticated`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={12} /> {new Date(log.timestamp).toLocaleTimeString()} via {log.method}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <CheckCircle size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No recent activity.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
