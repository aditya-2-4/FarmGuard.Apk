import React, { useState, useEffect } from 'react';
import { Search, History, CheckCircle, CreditCard, Camera } from 'lucide-react';
import { API_URL } from '../config';

export default function AttendanceLog({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    (log.person_name && log.person_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (log.identifier && log.identifier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 h-full flex flex-col bg-[#050a06] text-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Attendance Logs</h1>
          <p className="text-gray-400">View real-time recognition and access history.</p>
        </div>
      </div>

      <div className="bg-[#121a14] rounded-xl border border-gray-800 shadow-xl flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0a100d]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by Name or Identifier..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a241c] border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <History size={48} className="text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-300 mb-2">No attendance logs</h3>
              <p className="text-gray-500 max-w-md">Access events from Face Recognition and RFID will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1a241c] text-gray-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">Person Name</th>
                  <th className="px-6 py-4 font-medium">Method</th>
                  <th className="px-6 py-4 font-medium">Identifier</th>
                  <th className="px-6 py-4 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1a241c]/50 transition-colors">
                    <td className="px-6 py-4 text-gray-300">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{log.person_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        log.method === 'Face' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {log.method === 'Face' ? <Camera size={14}/> : <CreditCard size={14}/>}
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-400">
                      {log.identifier}
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-medium">
                      {log.confidence ? `${log.confidence}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
