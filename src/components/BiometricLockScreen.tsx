import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Fingerprint, Shield, Delete, AlertCircle } from 'lucide-react';
import { User } from '../../types';

interface BiometricLockScreenProps {
  currentUser: User;
  onUnlock: () => void;
}

export const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ currentUser, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  // Sincronizar o relógio local e formatar a data elegantemente
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setDateString(now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  // Tentar autenticação biométrica (WebAuthn) ao carregar
  const handleBiometricAuth = async () => {
    setError('');
    if (!window.PublicKeyCredential) {
      setError('Biometria indisponível neste navegador. Use o PIN de backup.');
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          timeout: 12000,
          rpId: window.location.hostname,
          userVerification: "required"
        }
      });

      if (assertion) {
        if (navigator.vibrate) navigator.vibrate(20);
        onUnlock();
      }
    } catch (err: any) {
      console.warn("Falha ao recuperar credencial biométrica:", err);
      // Caso dê erro de sandbox, restrição de iframe ou cancelamento, instruímos amigavelmente
      if (err.name === 'SecurityError' || err.name === 'NotAllowedError') {
        setError('Acesso biométrico restrito pelo ambiente. Use seu PIN.');
      } else {
        setError('Tentativa cancelada ou não reconhecida. Use o PIN de backup.');
      }
    }
  };

  useEffect(() => {
    // Dispara a biometria nativa automaticamente ao montar com leve delay
    const timer = setTimeout(() => {
      handleBiometricAuth();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyPress = (num: string) => {
    if (pin.length >= 6) return;
    setError('');
    const newPin = pin + num;
    setPin(newPin);
    if (navigator.vibrate) navigator.vibrate(10);

    // Se atingiu o tamanho do PIN cadastrado
    const savedPin = currentUser.privacy?.biometricPIN || '';
    if (newPin.length === savedPin.length) {
      if (newPin === savedPin) {
        if (navigator.vibrate) navigator.vibrate([15, 15]);
        onUnlock();
      } else {
        // PIN Errado
        setShake(true);
        if (navigator.vibrate) navigator.vibrate([40, 40]);
        setTimeout(() => {
          setShake(false);
          setPin('');
          setError('PIN de Segurança incorreto. Tente novamente.');
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      if (navigator.vibrate) navigator.vibrate(8);
    }
  };

  const expectedLength = currentUser.privacy?.biometricPIN?.length || 4;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-zinc-950 text-white p-6 select-none overflow-hidden">
      {/* Background Decorativo premium com Auras de Luz */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Cabeçalho de Relógio / Data */}
      <div className="mt-12 text-center space-y-2 z-10">
        <div className="flex justify-center items-center gap-2 mb-1">
          <Shield size={16} className="text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">TRIBO SOBERANA</span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-zinc-100">{timeString || '12:00'}</h1>
        <p className="text-xs text-zinc-400 font-semibold capitalize">{dateString || 'Carregando data...'}</p>
      </div>

      {/* Centro: Biometria & PIN Dots */}
      <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm z-10 my-auto">
        {/* Pulsar de Biometria */}
        <button 
          onClick={handleBiometricAuth}
          className="group relative w-24 h-24 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center shadow-2xl hover:border-emerald-500/30 transition-all duration-500 hover:scale-105"
        >
          <div className="absolute inset-0 bg-emerald-500/5 rounded-full animate-ping pointer-events-none" />
          <Fingerprint size={42} className="text-emerald-400 group-hover:text-emerald-300 transition-colors" />
        </button>

        {/* Dots do PIN */}
        <div className="space-y-4 text-center w-full">
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
            Digite o PIN de Segurança
          </p>
          
          <motion.div 
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex justify-center items-center gap-4 h-8"
          >
            {Array.from({ length: expectedLength }).map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full transition-all duration-200 border ${
                  i < pin.length 
                    ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-lg shadow-emerald-400/20' 
                    : 'bg-transparent border-zinc-800'
                }`}
              />
            ))}
          </motion.div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-rose-400 text-[10px] font-bold uppercase tracking-wider bg-rose-500/5 border border-rose-500/10 px-4 py-2 rounded-xl inline-block">
              <AlertCircle size={12} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Teclado Numérico Virtual */}
      <div className="w-full max-w-xs space-y-4 mb-8 z-10">
        <div className="grid grid-cols-3 gap-4 justify-items-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-16 w-16 bg-zinc-900/50 hover:bg-zinc-850 active:scale-95 text-xl font-bold rounded-full flex items-center justify-center border border-zinc-850 transition-all cursor-pointer"
            >
              {num}
            </button>
          ))}
          {/* Botão de Biometria Alternativo */}
          <button
            onClick={handleBiometricAuth}
            className="h-16 w-16 hover:text-emerald-400 active:scale-95 rounded-full flex items-center justify-center text-zinc-500 transition-all cursor-pointer"
            title="Usar Leitor Biométrico"
          >
            <Fingerprint size={24} />
          </button>
          {/* Botão 0 */}
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 w-16 bg-zinc-900/50 hover:bg-zinc-850 active:scale-95 text-xl font-bold rounded-full flex items-center justify-center border border-zinc-850 transition-all cursor-pointer"
          >
            0
          </button>
          {/* Botão Apagar */}
          <button
            onClick={handleDelete}
            className="h-16 w-16 hover:text-rose-400 active:scale-95 rounded-full flex items-center justify-center text-zinc-500 transition-all cursor-pointer"
          >
            <Delete size={22} />
          </button>
        </div>

        <div className="text-center pt-2">
          <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest leading-relaxed">
            Sua chave biométrica é processada localmente e protegida.
          </p>
        </div>
      </div>
    </div>
  );
};
