
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export const VideoRecorder: React.FC<{ onCapture: (base64: string) => void; onClose: () => void }> = ({ onCapture, onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function setupCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        alert("Câmera não disponível.");
        onClose();
      }
    }
    setupCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => setRecordingTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
      const reader = new FileReader();
      reader.onloadend = () => onCapture(reader.result as string);
      reader.readAsDataURL(blob);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl aspect-[9/16] bg-zinc-900 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        
        <div className="absolute top-8 left-0 right-0 flex justify-center">
          {isRecording && (
            <div className="bg-rose-600 px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-[10px] font-black uppercase text-white tracking-widest">
                Gravando {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        <button onClick={onClose} className="absolute top-8 right-8 p-4 bg-black/40 backdrop-blur-xl text-white rounded-2xl hover:bg-rose-500 transition-all">
          <X size={24} />
        </button>

        <div className="absolute bottom-12 left-0 right-0 flex justify-center">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-90 transition-all"
            >
              <div className="w-16 h-16 bg-rose-600 rounded-full group-hover:scale-110 transition-transform"></div>
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-90 transition-all"
            >
              <div className="w-10 h-10 bg-white rounded-lg"></div>
            </button>
          )}
        </div>
      </div>
      <p className="mt-8 text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Estúdio de Captura TRIBO 2026</p>
    </div>
  );
};
