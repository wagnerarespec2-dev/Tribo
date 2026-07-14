import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, RefreshCw, Check, Undo2, Aperture, Eye } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
  aspectRatio?: '1:1' | '4:3' | 'free';
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ 
  onCapture, 
  onClose,
  aspectRatio = '4:3'
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Play a browser-synthesized camera shutter click
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const bufferSize = audioCtx.sampleRate * 0.08;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(7000, audioCtx.currentTime + 0.06);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start();
    } catch (e) {
      console.log('Audio Context error bypassed', e);
    }
  };

  const setupCamera = async () => {
    setLoading(true);
    setError(null);
    
    // Stop any existing tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setLoading(false);
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      setError("Não foi possível acessar a câmera. Certifique-se de que deu as permissões necessárias.");
      setLoading(false);
    }
  };

  useEffect(() => {
    setupCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([40, 10, 40]);

    // Flash effect
    setIsFlashActive(true);
    playShutterSound();
    setTimeout(() => setIsFlashActive(false), 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      // Configure canvas sizes
      if (aspectRatio === '1:1') {
        const size = Math.min(videoWidth, videoHeight);
        canvas.width = size;
        canvas.height = size;
        
        const startX = (videoWidth - size) / 2;
        const startY = (videoHeight - size) / 2;
        
        // If facing user, we might want to mirror
        if (facingMode === 'user') {
          ctx.translate(size, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
          ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
        } else {
          ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        }
      } else {
        // 4:3 or Free
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        if (facingMode === 'user') {
          ctx.translate(videoWidth, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, videoWidth, videoHeight);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        } else {
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, videoWidth, videoHeight);
        }
      }
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-8 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="w-full max-w-lg flex items-center justify-between py-2 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Aperture className="text-emerald-400 animate-spin-slow w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Câmera Tribo v5</span>
        </div>
        
        <button 
          onClick={onClose} 
          className="p-3 bg-white/5 hover:bg-rose-500 hover:text-white rounded-2xl text-zinc-400 transition-all active:scale-95 border border-white/5"
          title="Fechar Câmera"
        >
          <X size={18} />
        </button>
      </div>

      {/* Screen / Viewfinder */}
      <div className="relative w-full max-w-lg aspect-square sm:aspect-[4/3] bg-zinc-950 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
        
        {/* Flash Overlay */}
        {isFlashActive && (
          <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-150" />
        )}

        {/* Captured Preview Stage */}
        {capturedImage ? (
          <img 
            src={capturedImage || null} 
            className="w-full h-full object-cover animate-in zoom-in-95 duration-200" 
            alt="Foto capturada"
          />
        ) : (
          <>
            {/* Live Camera Stream */}
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
            />
            
            {/* Viewfinder Grid Overlay */}
            {showGrid && !loading && !error && (
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10">
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-white/10" />
                <div className="border-r border-white/10" />
                <div className="relative">
                  {/* Small viewfinder accent */}
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-emerald-400/50" />
                </div>
              </div>
            )}

            {/* Viewfinder Centered Focus Ring */}
            {!loading && !error && (
              <div className="absolute w-16 h-16 border-2 border-white/20 rounded-full pointer-events-none flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            )}
          </>
        )}

        {/* Status Indicators (Loading or Error) */}
        {loading && (
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Iniciando Lente...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-zinc-950 p-8 flex flex-col items-center justify-center text-center gap-4">
            <p className="text-sm font-bold text-rose-500 leading-relaxed">{error}</p>
            <button 
              onClick={setupCamera} 
              className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-emerald-500 hover:text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </div>

      {/* Hidden Canvas for Capturing Framed Buffer */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Control Actions Panel */}
      <div className="w-full max-w-lg shrink-0 flex flex-col items-center gap-6 z-10 py-4">
        {!capturedImage ? (
          // Live camera buttons
          <div className="flex items-center justify-between w-full px-6">
            <button 
              onClick={() => setShowGrid(g => !g)}
              className={`p-4 rounded-2xl transition-all ${showGrid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-zinc-500 border border-white/5'}`}
              title="Grade de Enquadramento"
              disabled={loading || !!error}
            >
              <Eye size={18} />
            </button>

            <button 
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-4 border-white bg-zinc-950 hover:bg-white flex items-center justify-center group active:scale-95 transition-all shadow-xl shadow-black/50"
              disabled={loading || !!error}
              title="Tirar Foto"
            >
              <div className="w-14 h-14 bg-emerald-500 group-hover:bg-emerald-400 rounded-full transition-all group-active:scale-90" />
            </button>

            <button 
              onClick={toggleFacingMode}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95"
              title="Alternar Câmera"
              disabled={loading || !!error}
            >
              <RefreshCw size={18} className="hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        ) : (
          // Confirm / Preview buttons
          <div className="flex items-center justify-center gap-4 w-full px-4 animate-in slide-in-from-bottom-5">
            <button 
              onClick={handleRetake}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all active:scale-95"
            >
              <Undo2 size={16} /> Retirar
            </button>

            <button 
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 rounded-2xl text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Check size={16} /> Confirmar
            </button>
          </div>
        )}
        
        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">
          Sessão segura de captura • 100% processado no dispositivo
        </p>
      </div>

    </div>
  );
};
