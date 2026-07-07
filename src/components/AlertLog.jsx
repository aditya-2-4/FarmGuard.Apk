import React, { useState } from 'react';
import { Bell, Smartphone, Send, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

export default function AlertLog({ token, alerts, fetchAlerts }) {
  const [resendingId, setResendingId] = useState(null);

  const handleResend = async (id) => {
    setResendingId(id);
    try {
      const res = await fetch(`${API_URL}/api/alerts/resend/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResendingId(null);
    }
  };

  const smsAlerts = alerts.filter(a => a.type === 'SMS');
  const pushAlerts = alerts.filter(a => a.type === 'Push');

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      
      {/* SMS Table Panel */}
      <div className="bg-security-900 border border-security-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-security-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-farm-400" />
            <span>SMS Network Dispatch Logs</span>
          </h3>
          <span className="text-xs text-security-400 font-semibold">{smsAlerts.length} Messages logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-security-800 text-[10px] uppercase font-bold tracking-wider text-security-400">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Message Details</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-security-800/40 text-sm">
              {smsAlerts.map(alert => (
                <tr key={alert.id} className="hover:bg-security-950/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs text-security-300 whitespace-nowrap">
                    {formatTime(alert.timestamp)}
                  </td>
                  <td className="py-3.5 px-4 text-security-200 font-medium">
                    {alert.message}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      alert.status === 'Delivered' 
                        ? 'bg-farm-900/40 text-farm-300 border border-farm-800/30' 
                        : 'bg-yellow-950/40 text-yellow-300 border border-yellow-800/30'
                    }`}>
                      {alert.status === 'Delivered' ? (
                        <CheckCircle className="w-3 h-3 text-farm-400" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-yellow-400 animate-pulse" />
                      )}
                      <span>{alert.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleResend(alert.id)}
                      disabled={resendingId === alert.id}
                      className="px-3 py-1.5 bg-security-800 hover:bg-security-750 text-security-200 hover:text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                    >
                      {resendingId === alert.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Resend</span>
                    </button>
                  </td>
                </tr>
              ))}
              {smsAlerts.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-security-500">No SMS logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Push Notifications Table Panel */}
      <div className="bg-security-900 border border-security-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-security-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-farm-400" />
            <span>App Push Notification Logs</span>
          </h3>
          <span className="text-xs text-security-400 font-semibold">{pushAlerts.length} Alerts logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-security-800 text-[10px] uppercase font-bold tracking-wider text-security-400">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Alert Payload</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-security-800/40 text-sm">
              {pushAlerts.map(alert => (
                <tr key={alert.id} className="hover:bg-security-950/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs text-security-300 whitespace-nowrap">
                    {formatTime(alert.timestamp)}
                  </td>
                  <td className="py-3.5 px-4 text-security-200 font-medium">
                    {alert.message}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-farm-900/40 text-farm-300 border border-farm-800/30">
                      <CheckCircle className="w-3 h-3 text-farm-400" />
                      <span>{alert.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleResend(alert.id)}
                      disabled={resendingId === alert.id}
                      className="px-3 py-1.5 bg-security-800 hover:bg-security-750 text-security-200 hover:text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                    >
                      {resendingId === alert.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Test Push</span>
                    </button>
                  </td>
                </tr>
              ))}
              {pushAlerts.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-security-500">No push notification logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
