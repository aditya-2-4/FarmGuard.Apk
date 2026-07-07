import React, { useState, useEffect, useRef } from 'react';
import { Camera, Maximize, Settings, ShieldAlert, Sliders, Play, Check, ZoomIn, ZoomOut } from 'lucide-react';

export default function LiveView({ token }) {
  const [streamUrl, setStreamUrl] = useState(localStorage.getItem('mjpeg_stream_url') || 'rtsp://admin:farmpass@192.168.1.100:554/h264Preview_01_main');
  const [savedUrl, setSavedUrl] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Digital Zoom State (1.0x to 4.0x)
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // States for canvas simulation
  const [cows, setCows] = useState([
    { id: 'Bessie', x: 200, y: 180, vx: 0.1, vy: 0.05, text: 'Bessie (Cow) - Safe' },
    { id: 'Bella', x: 450, y: 320, vx: -0.05, vy: 0.08, text: 'Bella (Cow) - Safe' },
    { id: 'Dolly', x: 600, y: 150, vx: 0.2, vy: -0.1, text: 'Dolly (Sheep) - Border Warning' }
  ]);

  const [human, setHuman] = useState({ x: 100, y: 350, vx: 0.25, vy: -0.12, active: true, name: 'Intruder' });
  const [panAngle, setPanAngle] = useState(0);
  const [panDirection, setPanDirection] = useState(1);
  const [capturedImage, setCapturedImage] = useState(null);

  // Animate the simulated CCTV feed in Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#050a06'; // dark green tint base
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Night vision scan lines
      ctx.strokeStyle = 'rgba(46, 133, 78, 0.04)';
      ctx.lineWidth = 2;
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Camera panning sweep effect
      let nextPan = panAngle + 0.003 * panDirection;
      if (nextPan > 0.12) {
        setPanDirection(-1);
      } else if (nextPan < -0.12) {
        setPanDirection(1);
      }
      setPanAngle(nextPan);

      // Save context state for Panning & Digital Zoom
      ctx.save();
      
      // 1. Center context for zoom, scale, then translate back
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // 2. Camera panning rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(panAngle);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Draw background landscape (fence, barn outline)
      ctx.strokeStyle = 'rgba(46, 133, 78, 0.2)';
      ctx.lineWidth = 1.5;
      
      // Barn outline
      ctx.beginPath();
      ctx.moveTo(150, 250);
      ctx.lineTo(250, 180);
      ctx.lineTo(350, 250);
      ctx.closePath();
      ctx.stroke();
      
      // Fence line
      ctx.beginPath();
      ctx.moveTo(50, 300);
      ctx.lineTo(750, 300);
      ctx.stroke();
      for (let x = 80; x < 750; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 280);
        ctx.lineTo(x, 320);
        ctx.stroke();
      }

      // Animate Cows
      cows.forEach(cow => {
        cow.x += cow.vx;
        cow.y += cow.vy;
        
        if (cow.x < 120 || cow.x > 700) cow.vx *= -1;
        if (cow.y < 120 || cow.y > 400) cow.vy *= -1;

        ctx.fillStyle = cow.id === 'Dolly' ? '#fbbf24' : '#10b981';
        ctx.beginPath();
        ctx.arc(cow.x, cow.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = cow.id === 'Dolly' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(16, 185, 129, 0.4)';
        ctx.strokeRect(cow.x - 15, cow.y - 15, 30, 30);
        
        ctx.fillStyle = cow.id === 'Dolly' ? '#fbbf24' : '#10b981';
        ctx.font = '10px monospace';
        ctx.fillText(cow.id, cow.x - 20, cow.y - 22);
      });

      // Animate Intruder
      if (human.active) {
        human.x += human.vx;
        human.y += human.vy;
        if (human.x < 50 || human.x > 750) human.vx *= -1;
        if (human.y < 100 || human.y > 420) human.vy *= -1;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(human.x, human.y, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(human.x - 18, human.y - 20, 36, 40);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('HUMAN INTRUDER', human.x - 45, human.y - 28);
      }

      // Restore zoom and pan translations
      ctx.restore();

      // Static UI HUD Overlays
      ctx.strokeStyle = '#2e854e';
      ctx.lineWidth = 2;
      
      const size = 30;
      // Top Left
      ctx.beginPath(); ctx.moveTo(20, 20 + size); ctx.lineTo(20, 20); ctx.lineTo(20 + size, 20); ctx.stroke();
      // Top Right
      ctx.beginPath(); ctx.moveTo(canvas.width - 20 - size, 20); ctx.lineTo(canvas.width - 20, 20); ctx.lineTo(canvas.width - 20, 20 + size); ctx.stroke();
      // Bottom Left
      ctx.beginPath(); ctx.moveTo(20, canvas.height - 20 - size); ctx.lineTo(20, canvas.height - 20); ctx.lineTo(20 + size, canvas.height - 20); ctx.stroke();
      // Bottom Right
      ctx.beginPath(); ctx.moveTo(canvas.width - 20 - size, canvas.height - 20); ctx.lineTo(canvas.width - 20, canvas.height - 20); ctx.lineTo(canvas.width - 20, canvas.height - 20 - size); ctx.stroke();

      // Center crosshair
      ctx.strokeStyle = 'rgba(46, 133, 78, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 20, canvas.height / 2);
      ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2);
      ctx.moveTo(canvas.width / 2, canvas.height / 2 - 20);
      ctx.lineTo(canvas.width / 2, canvas.height / 2 + 20);
      ctx.stroke();

      // Blinking REC dot
      if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(45, 45, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('REC', 60, 49);
      }

      // HUD Telemetry
      ctx.fillStyle = '#2e854e';
      ctx.font = '12px monospace';
      ctx.fillText(new Date().toISOString().replace('T', ' ').slice(0, 19), canvas.width - 200, 45);
      ctx.fillText('CAM_01_NORTH_FIELD', 40, canvas.height - 40);
      ctx.fillText(`IR ACTIVE / ZOOM ${zoomLevel.toFixed(1)}X`, 40, canvas.height - 25);
      
      // Radar warning grid boundary
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.strokeRect(300, 80, 200, 100);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.fillRect(300, 80, 200, 100);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('RADAR RADIAL WARNING ZONE', 320, 100);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [cows, human, panAngle, panDirection, zoomLevel]);

  const handleSaveUrl = () => {
    localStorage.setItem('mjpeg_stream_url', streamUrl);
    setSavedUrl(true);
    setTimeout(() => setSavedUrl(false), 2000);
  };

  const handleCaptureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* CCTV Screen Box */}
      <div 
        ref={containerRef}
        className="relative bg-black rounded-xl overflow-hidden border border-security-800 shadow-2xl aspect-video w-full"
      >
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={480}
          className="w-full h-full block"
        />

        {/* Live stream details overlays */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {/* Zoom Level Indicator Badge */}
          <div className="bg-security-900/80 text-farm-400 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-security-700 backdrop-blur font-bold">
            {zoomLevel.toFixed(1)}X ZOOM
          </div>
          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-security-900/80 hover:bg-security-800 text-security-300 rounded-lg backdrop-blur border border-security-700 transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 bg-security-900/80 hover:bg-security-800 text-security-300 rounded-lg backdrop-blur border border-security-700 transition-colors"
            title="Stream Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Unrecognized Intrusion Alert box inside CCTV */}
        {human.active && (
          <div className="absolute bottom-4 right-4 bg-red-950/90 border border-red-500 text-red-200 px-4 py-3 rounded-lg backdrop-blur flex items-center gap-3 max-w-sm animate-pulse z-10">
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-400">Security Intrusion Active</p>
              <p className="text-xs">ESP32 Radar detected human movement in Zone North Gate.</p>
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-6 p-5 bg-security-900 border border-security-800 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
          <span className="text-sm font-bold text-white uppercase tracking-wider">Live CCTV Feed Controls</span>
        </div>

        {/* Zoom Slider and snap buttons */}
        <div className="flex items-center gap-6 flex-1 sm:flex-initial">
          <div className="flex items-center gap-2.5 bg-security-950 px-4 py-2 rounded-lg border border-security-800 w-full sm:w-auto">
            <ZoomOut className="w-4 h-4 text-security-400 cursor-pointer hover:text-white" onClick={() => setZoomLevel(prev => Math.max(1.0, prev - 0.5))} />
            <input 
              type="range" 
              min="1.0" 
              max="4.0" 
              step="0.1" 
              value={zoomLevel} 
              onChange={e => setZoomLevel(parseFloat(e.target.value))}
              className="accent-farm-500 h-1.5 bg-security-800 rounded-lg appearance-none cursor-pointer w-24 sm:w-32"
            />
            <ZoomIn className="w-4 h-4 text-security-400 cursor-pointer hover:text-white" onClick={() => setZoomLevel(prev => Math.min(4.0, prev + 0.5))} />
          </div>

          <button 
            onClick={handleCaptureSnapshot}
            className="px-4 py-2.5 bg-farm-600 hover:bg-farm-500 active:bg-farm-700 text-white rounded-lg font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Capture Snapshot</span>
          </button>
        </div>
      </div>

      {/* Stream Config Modal Panel */}
      {showConfig && (
        <div className="bg-security-900 border border-security-800 p-6 rounded-xl space-y-4">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-farm-400" />
            <span>Stream Source Settings</span>
          </h3>
          <p className="text-xs text-security-400">
            Configure the camera RTSP or MJPEG network video stream path for direct ESP32 hardware streaming.
          </p>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={streamUrl}
              onChange={e => setStreamUrl(e.target.value)}
              className="flex-1 bg-security-950 border border-security-700 focus:border-farm-500 rounded-lg px-4 py-2 text-sm text-white placeholder-security-600 outline-none"
              placeholder="rtsp://admin:password@ip_address/path"
            />
            <button 
              onClick={handleSaveUrl}
              className="bg-farm-600 hover:bg-farm-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {savedUrl ? <Check className="w-4.5 h-4.5" /> : <Play className="w-4.5 h-4.5" />}
              <span>{savedUrl ? 'Saved!' : 'Save & Connect'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {capturedImage && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-security-900 border border-security-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-security-800 pb-3">
              <h3 className="text-lg font-bold text-white">Captured Security Snapshot</h3>
              <button 
                onClick={() => setCapturedImage(null)}
                className="text-security-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="border border-security-800 rounded-lg overflow-hidden bg-black aspect-video relative">
              <img src={capturedImage} alt="Captured Snapshot" className="w-full h-full object-contain" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setCapturedImage(null)}
                className="px-4 py-2 bg-security-800 hover:bg-security-750 text-security-300 rounded-lg font-semibold text-xs uppercase"
              >
                Cancel
              </button>
              <a 
                href={capturedImage} 
                download={`FarmGuard-Snapshot-${Date.now()}.jpg`}
                className="px-4 py-2 bg-farm-600 hover:bg-farm-500 text-white rounded-lg font-semibold text-xs uppercase tracking-wider text-center flex items-center"
              >
                Download Snapshot
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
