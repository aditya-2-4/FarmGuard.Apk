import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Key, Eye, Clock, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config';


export default function UserManagement({ token, online }) {
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // New user form states
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('RFID');
  const [newIdentifier, setNewIdentifier] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchSilentLogs();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSilentLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnrollUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, type: newType, identifier: newIdentifier })
      });
      
      if (res.ok) {
        setFormSuccess(`Successfully enrolled ${newName}!`);
        setNewName('');
        setNewIdentifier('');
        await fetchUsers();
      } else {
        const err = await res.json();
        setFormError(err.error || 'Failed to enroll user');
      }
    } catch (err) {
      setFormError('Connection issue. Failed to sync.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to remove this authorized user? Access permissions will be revoked immediately.')) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Authorized Users list (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-security-900 border border-security-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-security-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-farm-400" />
              <span>Enrolled Biometrics & RFID Keys</span>
            </h3>
            <span className="text-xs text-security-400 font-semibold">{users.length} Enrolled Profiles</span>
          </div>

          {!online && (
            <div className="mb-4 bg-yellow-950/40 border border-yellow-700/50 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-yellow-500">Read-Only Mode</p>
                <p className="text-xs text-yellow-200/70">Connect device to revoke access permissions.</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-security-500">Querying credentials...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-security-800 text-[10px] uppercase font-bold tracking-wider text-security-400">
                    <th className="py-3 px-4">Authorized User</th>
                    <th className="py-3 px-4">Credential Type</th>
                    <th className="py-3 px-4">Identifier Hash / Key</th>
                    <th className="py-3 px-4">Enrolled On</th>
                    <th className="py-3 px-4 text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-security-800/40 text-sm">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-security-950/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-farm-400" />
                        <span>{user.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-security-200">
                        <span className="bg-security-800 text-security-300 font-mono text-xs px-2 py-0.5 rounded border border-security-700">
                          {user.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-security-400">
                        {user.identifier}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-security-400 whitespace-nowrap">
                        {new Date(user.enrolled_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={!online}
                          className={`p-1.5 rounded-lg transition-colors ${
                            !online 
                              ? 'bg-security-900 text-security-600 cursor-not-allowed' 
                              : 'bg-security-850 hover:bg-red-950/40 text-security-400 hover:text-red-400'
                          }`}
                          title={!online ? "Device Offline" : "Revoke Permission"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-security-550">No users enrolled yet. Complete the form to add access keys.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Silent logs: Recent entries */}
        <div className="bg-security-900 border border-security-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 pb-4 border-b border-security-800">
            <Clock className="w-5 h-5 text-farm-400" />
            <span>Silent Log: Recent Authorized Entries</span>
          </h3>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {history.map(entry => (
              <div 
                key={entry.id}
                className="p-4 bg-security-950/40 border border-security-850 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-farm-950/80 border border-farm-800 text-farm-400 rounded-full">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white">{entry.zone_name} Access Granted</span>
                    <p className="text-[10px] text-security-400 mt-1">{formatTime(entry.timestamp)}</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-farm-300 bg-farm-900/40 border border-farm-800/40 px-2 py-0.5 rounded uppercase">
                  Biometric Match (Silent)
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-8 text-security-500 text-sm">No recognized entry logs found.</div>
            )}
          </div>
        </div>

      </div>

      {/* Enroll Form (1/3 width) */}
      <div className="space-y-6">
        <div className="bg-security-900 border border-security-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-5 pb-2 border-b border-security-800">
            <UserPlus className="w-4 h-4 text-farm-400" />
            <span>Enroll Access Key / Face</span>
          </h3>

          <form onSubmit={handleEnrollUser} className="space-y-4">
            
            {!online && (
              <div className="bg-yellow-950/40 border border-yellow-700/50 rounded-lg p-3 flex items-start gap-3 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-200/70">Enrollment disabled while device is offline.</p>
              </div>
            )}
            
            {formError && (
              <div className="bg-red-950/60 border border-red-500/40 text-red-200 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="bg-farm-950/60 border border-farm-500/40 text-farm-200 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-farm-400 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-security-400 mb-1.5">User Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. John Doe"
                disabled={!online}
                className={`w-full bg-security-950 border border-security-700 text-white rounded-lg px-3 py-2 text-xs outline-none ${!online ? 'opacity-50 cursor-not-allowed' : 'focus:border-farm-500'}`}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-security-400 mb-1.5">Key Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                disabled={!online}
                className={`w-full bg-security-950 border border-security-700 text-white rounded-lg px-3 py-2 text-xs outline-none ${!online ? 'opacity-50 cursor-not-allowed' : 'focus:border-farm-500'}`}
              >
                <option value="RFID">RFID Tag Key</option>
                <option value="Face">Face Biometric Profile</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-security-400 mb-1.5">Identifier ID</label>
              <input 
                type="text" 
                value={newIdentifier}
                onChange={e => setNewIdentifier(e.target.value)}
                placeholder={newType === 'RFID' ? 'e.g. RFID_A829C' : 'e.g. face_enc_john_...' }
                disabled={!online}
                className={`w-full bg-security-950 border border-security-700 text-white rounded-lg px-3 py-2 text-xs outline-none font-mono ${!online ? 'opacity-50 cursor-not-allowed' : 'focus:border-farm-500'}`}
                required
              />
              <p className="text-[10px] text-security-500 mt-1">Unique RFID serial code or Face landmark signature hash.</p>
            </div>

            <button
              type="submit"
              disabled={formLoading || !online}
              className={`w-full py-2.5 rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 mt-4 ${
                !online 
                  ? 'bg-security-800 text-security-500 cursor-not-allowed' 
                  : 'bg-farm-600 hover:bg-farm-500 text-white'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>{formLoading ? 'Syncing...' : 'Enroll Credential'}</span>
            </button>

          </form>
        </div>
      </div>

    </div>
  );
}
