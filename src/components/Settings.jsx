import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Radio, Phone, Bell, Cpu, Sun, Volume2, Check } from 'lucide-react';

export default function Settings({ token, online }) {
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem('alert_phone_number') || '+1 (555) 902-1823');
  const [backupPhone, setBackupPhone] = useState(localStorage.getItem('backup_phone_number') || '+1 (555) 902-1824');
  
  // Notification configs
  const [sirenSensitivity, setSirenSensitivity] = useState(localStorage.getItem('siren_sensitivity') || 'medium');
  const [nightLighting, setNightLighting] = useState(localStorage.getItem('night_lighting') === 'true');
  const [smsStatusToggle, setSmsStatusToggle] = useState(localStorage.getItem('sms_notifications_enabled') !== 'false');
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    // Save configuration states locally
    localStorage.setItem('alert_phone_number', phoneNumber);
    localStorage.setItem('backup_phone_number', backupPhone);
    localStorage.setItem('siren_sensitivity', sirenSensitivity);
    localStorage.setItem('night_lighting', nightLighting.toString());
    localStorage.setItem('sms_notifications_enabled', smsStatusToggle.toString());

    setTimeout(() => {
      setLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Offline Warning Banner */}
        {!online && (
          <div className="bg-yellow-950/40 border border-yellow-700/50 rounded-xl p-4 flex items-start gap-3 shadow-xl">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-yellow-500">Settings Locked (Read-Only Mode)</p>
              <p className="text-xs text-yellow-200/70">The ESP32 gateway is currently disconnected. You cannot modify hardware behaviors or SMS dispatch rules until the device is back online.</p>
            </div>
          </div>
        )}
        
        {/* SMS settings panel */}
        <div className="bg-security-900 border border-security-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-security-850">
            <Phone className="w-5 h-5 text-farm-400" />
            <div>
              <h3 className="text-md font-bold text-white leading-tight">SMS Alert Dispatched Numbers</h3>
              <p className="text-xs text-security-400">Configure phone numbers that will receive urgent SMS messages upon intrusion detection.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase font-bold text-security-300 mb-1.5">Primary Phone Number</label>
              <input 
                type="text" 
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                disabled={!online}
                className={`w-full bg-security-950 border border-security-700 text-sm text-white placeholder-security-600 outline-none transition-colors rounded-lg px-4 py-2 ${
                  !online ? 'opacity-50 cursor-not-allowed' : 'focus:border-farm-500'
                }`}
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-security-300 mb-1.5">Backup Emergency Phone</label>
              <input 
                type="text" 
                value={backupPhone}
                onChange={e => setBackupPhone(e.target.value)}
                disabled={!online}
                className={`w-full bg-security-950 border border-security-700 text-sm text-white placeholder-security-600 outline-none transition-colors rounded-lg px-4 py-2 ${
                  !online ? 'opacity-50 cursor-not-allowed' : 'focus:border-farm-500'
                }`}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={smsStatusToggle}
                onChange={e => setSmsStatusToggle(e.target.checked)}
                disabled={!online}
                className={`w-4 h-4 accent-farm-500 bg-security-950 border-security-700 rounded focus:ring-0 ${!online ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              />
              <span className="text-xs text-security-300 font-semibold">Enable SMS alert dispatches during ARM state</span>
            </label>
          </div>
        </div>

        {/* Siren sensitivity / Hardware triggers */}
        <div className="bg-security-900 border border-security-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-security-850">
            <Volume2 className="w-5 h-5 text-farm-400" />
            <div>
              <h3 className="text-md font-bold text-white leading-tight">Buzzer / Siren & Night Lighting Preferences</h3>
              <p className="text-xs text-security-400">Manage device hardware behaviors on the field ESP32 unit.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-security-300 mb-2">Buzzer Siren Sensitivity</label>
              <div className="grid grid-cols-3 gap-3">
                {['low', 'medium', 'high'].map(level => (
                  <button
                    key={level}
                    type="button"
                    disabled={!online}
                    onClick={() => setSirenSensitivity(level)}
                    className={`py-2 px-4 rounded-lg font-bold text-xs uppercase border transition-all ${
                      sirenSensitivity === level 
                        ? 'bg-farm-900/20 border-farm-500 text-white' 
                        : 'bg-security-950 border-security-750 text-security-400 hover:text-white'
                    } ${!online ? 'opacity-50 cursor-not-allowed hover:text-security-400' : ''}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-security-500 mt-1.5">
                Adjusts the radar velocity thresholds before triggering the physical horn/siren on the ESP32 gateway.
              </p>
            </div>

            <div className="pt-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-xs text-security-200 font-bold flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-farm-400" /> Night-Only Lighting Activation
                  </span>
                  <p className="text-[10px] text-security-400">Only turn on external security floodlight sensors between sunset and sunrise.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={nightLighting}
                  onChange={e => setNightLighting(e.target.checked)}
                  disabled={!online}
                  className={`w-10 h-5 accent-farm-500 bg-security-950 border-security-700 rounded-full focus:ring-0 ${!online ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                />
              </label>
            </div>
          </div>
        </div>

        {/* ESP32 hardware metadata */}
        <div className="bg-security-900 border border-security-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-security-850">
            <Cpu className="w-5 h-5 text-farm-400" />
            <div>
              <h3 className="text-md font-bold text-white leading-tight">Device Firmware & Hardware Info</h3>
              <p className="text-xs text-security-400">Details of your active FarmGuard node connected via WebSocket/REST gateway.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="p-3 bg-security-950/60 border border-security-850 rounded-lg space-y-1">
              <p className="text-security-400">Firmware Build version</p>
              <p className="text-white font-mono">v1.2.8-beta-build4921</p>
            </div>
            <div className="p-3 bg-security-950/60 border border-security-850 rounded-lg space-y-1">
              <p className="text-security-400">Processor / Controller Architecture</p>
              <p className="text-white font-mono">ESP-WROOM-32E (XTensa Dual-Core 240MHz)</p>
            </div>
            <div className="p-3 bg-security-950/60 border border-security-850 rounded-lg space-y-1">
              <p className="text-security-400">Connected sensors</p>
              <p className="text-white font-mono">RCWL-0516 Radar, OV2640 camera, RFID-RC522</p>
            </div>
            <div className="p-3 bg-security-950/60 border border-security-850 rounded-lg space-y-1">
              <p className="text-security-400">Hardware Network Interface</p>
              <p className="text-white font-mono">Wi-Fi Client Mode + SIM800L GPRS Modem</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !online}
            className={`py-3 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2 uppercase tracking-wider text-xs font-bold ${
              !online 
                ? 'bg-security-800 text-security-500 cursor-not-allowed' 
                : 'bg-farm-600 hover:bg-farm-500 active:bg-farm-700 text-white hover:shadow-farm-500/20'
            }`}
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{loading ? 'Saving...' : saveSuccess ? 'Settings Saved!' : 'Save System Settings'}</span>
          </button>
        </div>

      </form>
      
    </div>
  );
}
