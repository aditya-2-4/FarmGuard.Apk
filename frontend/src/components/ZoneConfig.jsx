import React, { useState, useEffect, useRef } from 'react';
import { Radio, Save, Shield, Info, Check, Trash2 } from 'lucide-react';
import { API_URL } from '../config';


export default function ZoneConfig({ token }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(null);

  // Background blueprint grid metrics
  const gridWidth = 800;
  const gridHeight = 450;

  useEffect(() => {
    fetchZones();
  }, []);

  // Sync canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Draw dark blueprints background
    ctx.fillStyle = '#0a0d10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = '#161b22';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Reference area labels
    ctx.strokeStyle = 'rgba(46, 133, 78, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 300, 200); // Pasture A
    ctx.strokeRect(400, 80, 350, 300); // Pasture B
    
    ctx.fillStyle = 'rgba(46, 133, 78, 0.1)';
    ctx.font = '11px sans-serif';
    ctx.fillText('North Pasture Area', 60, 75);
    ctx.fillText('Main Barn & Water Trough', 420, 105);

    // Draw warning zone layers
    zones.forEach((zone, idx) => {
      const isSelected = selectedZoneIndex === idx;
      const coords = zone.coordinates;
      
      if (zone.type === 'rectangle') {
        ctx.strokeStyle = isSelected ? '#fbbf24' : '#ef4444';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(coords.x, coords.y, coords.width, coords.height);

        ctx.fillStyle = isSelected ? 'rgba(251, 191, 36, 0.08)' : 'rgba(239, 68, 68, 0.04)';
        ctx.fillRect(coords.x, coords.y, coords.width, coords.height);

        ctx.fillStyle = isSelected ? '#fbbf24' : '#ef4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(zone.name, coords.x + 8, coords.y + 18);
      } else if (zone.type === 'radius') {
        ctx.strokeStyle = isSelected ? '#fbbf24' : '#ef4444';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, coords.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = isSelected ? 'rgba(251, 191, 36, 0.08)' : 'rgba(239, 68, 68, 0.04)';
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, coords.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isSelected ? '#fbbf24' : '#ef4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(zone.name, coords.x - 30, coords.y + 4);
      }
    });

    // Draw active dotted drag outlines
    if (isDrawing) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      
      const width = currentPos.x - startPos.x;
      const height = currentPos.y - startPos.y;
      ctx.strokeRect(startPos.x, startPos.y, width, height);
      ctx.setLineDash([]);
    }
  }, [zones, isDrawing, startPos, currentPos, selectedZoneIndex]);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/zones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getTouchCanvasCoords = (e) => {
    if (!e.touches || e.touches.length === 0) return null;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  // Mouse Handlers
  const handleMouseDown = (e) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);
    setCurrentPos(coords);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    setCurrentPos(getCanvasCoords(e));
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width > 15 && height > 15) {
      const newZone = {
        name: `Zone ${zones.length + 1}`,
        type: 'rectangle',
        coordinates: { x, y, width, height }
      };
      setZones(prev => [...prev, newZone]);
      setSelectedZoneIndex(zones.length);
    }
  };

  // Mobile Touch Handlers
  const handleTouchStart = (e) => {
    const coords = getTouchCanvasCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    setStartPos(coords);
    setCurrentPos(coords);
  };

  const handleTouchMove = (e) => {
    if (!isDrawing) return;
    const coords = getTouchCanvasCoords(e);
    if (coords) setCurrentPos(coords);
  };

  const handleTouchEnd = (e) => {
    handleMouseUp();
  };

  const handleDeleteSelected = () => {
    if (selectedZoneIndex === null) return;
    setZones(prev => prev.filter((_, idx) => idx !== selectedZoneIndex));
    setSelectedZoneIndex(null);
  };

  const handleSaveZones = async () => {
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API_URL}/api/zones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ zonesList: zones })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Visual Canvas Drawing space (2/3 width) */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="bg-security-900 border border-security-800 rounded-xl p-4 sm:p-5 shadow-xl flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-security-800">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-farm-400" />
              <span>Interactive warning zones canvas editor</span>
            </h3>
            <span className="text-[11px] text-security-400 font-semibold">Touch-drag/Click-drag to draw boundary ranges</span>
          </div>

          {/* Canvas Component with touch listeners */}
          <div className="rounded-lg overflow-hidden border border-security-850 cursor-crosshair relative aspect-[16/9] w-full">
            <canvas
              ref={canvasRef}
              width={gridWidth}
              height={gridHeight}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full h-full block touch-none"
            />
          </div>
        </div>
      </div>

      {/* Editor list controls (1/3 width) */}
      <div className="space-y-6">
        
        {/* Active zones list */}
        <div className="bg-security-900 border border-security-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-5 pb-2 border-b border-security-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-farm-400" />
              <span>Zone Coordinates</span>
            </h3>
            <span className="text-xs text-security-400 font-semibold">{zones.length} Zones Defined</span>
          </div>

          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
            {zones.map((zone, idx) => {
              const isSelected = selectedZoneIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedZoneIndex(idx)}
                  className={`w-full p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-farm-900/20 border-farm-500' 
                      : 'bg-security-950/60 border-security-850 hover:bg-security-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <input 
                      type="text" 
                      value={zone.name}
                      onChange={e => {
                        const updated = [...zones];
                        updated[idx].name = e.target.value;
                        setZones(updated);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="font-bold text-sm text-white bg-transparent border-b border-transparent focus:border-farm-500 outline-none w-2/3"
                    />
                    <span className="text-[10px] font-mono font-bold text-security-400 uppercase">
                      {zone.type}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-security-400 flex flex-wrap gap-2">
                    <span>X: {Math.round(zone.coordinates.x)}</span>
                    <span>Y: {Math.round(zone.coordinates.y)}</span>
                    {zone.type === 'rectangle' ? (
                      <>
                        <span>W: {Math.round(zone.coordinates.width)}</span>
                        <span>H: {Math.round(zone.coordinates.height)}</span>
                      </>
                    ) : (
                      <span>R: {Math.round(zone.coordinates.radius)}</span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {zones.length === 0 && (
              <div className="text-center py-8 text-security-550 text-xs">No active warning zones. Draw on map to create.</div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col gap-3">
            {selectedZoneIndex !== null && (
              <button 
                onClick={handleDeleteSelected}
                className="w-full bg-red-950 text-red-300 border border-red-800/30 font-semibold text-xs py-2.5 rounded-lg hover:bg-red-900/60 transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected Zone</span>
              </button>
            )}

            <button 
              onClick={handleSaveZones}
              disabled={saveLoading}
              className="w-full bg-farm-600 hover:bg-farm-500 text-white font-semibold text-xs py-3 rounded-lg shadow-lg hover:shadow-farm-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {saveSuccess ? <Check className="w-4.5 h-4.5 text-white" /> : <Save className="w-4.5 h-4.5" />}
              <span>{saveLoading ? 'Saving...' : saveSuccess ? 'Settings Synced!' : 'Sync settings to ESP32'}</span>
            </button>
          </div>
        </div>

        {/* Informational help panel */}
        <div className="bg-security-900 border border-security-800 rounded-xl p-5 shadow-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-farm-400 shrink-0 mt-0.5" />
          <div className="text-xs text-security-300 space-y-1.5">
            <h4 className="font-bold text-white">How Zones Work</h4>
            <p>ESP32 hardware uses radar coordinate frames mapping to visual streams. Drawing zones defines high-risk zones.</p>
            <p>If an unrecognized entity stays in a defined warning zone for more than 3 seconds, a high-priority SMS alert will be fired.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
