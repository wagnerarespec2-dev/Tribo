
import React, { useState, useRef } from 'react';
import { 
  Lock, 
  Mail, 
  Loader2,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
  AtSign,
  Fingerprint,
  CalendarDays,
  ShieldAlert,
  Camera,
  MapPin,
  FileText,
  User as UserIcon,
  Check,
  Dna,
  Users,
  Scale,
  MessageSquareQuote,
  ShieldAlert as AlertIcon
} from 'lucide-react';
import { UserDatabase } from '../services/db';
import { IdentityType } from '../types';

interface AuthViewProps {
  onLogin: (user: any) => void;
  syncTrigger?: number;
}

type SignupPhase = 'account' | 'profile' | 'identity' | 'summary' | 'verification';

const AuthView: React.FC<AuthViewProps> = ({ onLogin, syncTrigger }) => {
  const [hasAcceptedManifesto, setHasAcceptedManifesto] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [signupPhase, setSignupPhase] = useState<SignupPhase>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    birthDate: '',
    bio: '',
    location: '',
    avatar: '',
    gender: '' as 'Masculino' | 'Feminino' | 'Outro' | 'Não informar' | ''
  });

  const [birthParts, setBirthParts] = useState({ day: '', month: '', year: '' });
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState('123456');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerEmailCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setVerificationCode(['', '', '', '', '', '']);
    setError('');
    if (navigator.vibrate) navigator.vibrate([40, 60]);
  };

  const calculateAge = (d: number, m: number, y: number) => {
    const today = new Date();
    let age = today.getFullYear() - y;
    const monthDiff = today.getMonth() - (m - 1);
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age--;
    return age;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Imagem muito pesada (máx 2MB)');
        return;
      }
      const base64 = await UserDatabase.uploadFile(file);
      setFormData(prev => ({ ...prev, avatar: base64 }));
      setError('');
    }
  };

  const nextPhase = () => {
    setError('');
    if (signupPhase === 'account') {
      if (!formData.username || !formData.email || !formData.password) {
        setError('Preencha seu nome de usuário, e-mail e senha.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Por favor, insira um endereço de e-mail válido.');
        return;
      }
      
      if (formData.password.length < 8) {
        setError('Segurança insuficiente: a senha deve ter pelo menos 8 caracteres.');
        if (navigator.vibrate) navigator.vibrate([30, 100, 30]);
        return;
      }

      const existing = UserDatabase.getUsers().find(u => u.username.toLowerCase() === formData.username.toLowerCase().replace('@', ''));
      if (existing) {
        setError('Este @username já está em uso.');
        return;
      }

      const existingEmail = UserDatabase.getUsers().find(u => u.email?.toLowerCase() === formData.email.toLowerCase());
      if (existingEmail) {
        setError('Este e-mail já está cadastrado.');
        return;
      }
      setSignupPhase('profile');
    } else if (signupPhase === 'profile') {
      if (!formData.name || !formData.bio) {
        setError('Conte-nos um pouco sobre você.');
        return;
      }
      setSignupPhase('identity');
    } else if (signupPhase === 'identity') {
      const d = parseInt(birthParts.day);
      const m = parseInt(birthParts.month);
      const y = parseInt(birthParts.year);
      
      if (isNaN(d) || isNaN(m) || isNaN(y) || birthParts.year.length < 4) {
        setError('Data de nascimento incompleta.');
        return;
      }

      if (!formData.gender) {
        setError('Por favor, selecione sua identidade de gênero.');
        return;
      }

      const age = calculateAge(d, m, y);
      if (age < 18) {
        setError('Acesso restrito para 18+.');
        return;
      }
      const isoDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, birthDate: isoDate }));
      setSignupPhase('summary');
    }
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const user = UserDatabase.authenticate(loginData.email, loginData.password);
    if (user) onLogin(user); else setError('Credenciais inválidas.');
    setLoading(false);
  };

  const handleCompleteSignup = async () => {
    const enteredCode = verificationCode.join('');
    if (enteredCode !== generatedCode) {
      setError(`Código inválido (use ${generatedCode}).`);
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const newUser = UserDatabase.saveUser({
      ...formData,
      username: formData.username.replace('@', ''),
      identityType: IdentityType.REAL,
    });
    onLogin(newUser);
  };

  // Tela de Manifesto
  if (!hasAcceptedManifesto) {
    return (
      <div className="min-h-full h-full flex-1 bg-[#050505] flex items-center justify-center p-6 animate-in fade-in duration-700 overflow-y-auto scrollbar-hide">
        <div className="w-full max-w-2xl bg-zinc-900/40 border border-white/5 p-10 md:p-16 rounded-[4rem] shadow-2xl backdrop-blur-3xl space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <Scale size={200} className="text-emerald-500" />
          </div>

          <div className="text-center space-y-4 relative z-10">
             <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20 rotate-3">
               <ShieldAlert className="text-black" size={32} />
             </div>
             <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white leading-none uppercase">MANIFESTO DE<br/><span className="text-emerald-500">SOBERANIA</span></h1>
             <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Protocolo de Entrada TRIBO 2026</p>
          </div>

          <div className="space-y-6 text-zinc-300 font-medium leading-relaxed relative z-10 text-center md:text-left">
             <div className="flex gap-4 items-start">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0"><MessageSquareQuote size={18}/></div>
                <p className="text-sm">A <span className="text-white font-black italic">TRIBO</span> preserva integralmente os direitos de <span className="text-emerald-500">livre expressão</span> de cada usuário. Sua voz é a sua força.</p>
             </div>
             
             <div className="flex gap-4 items-start">
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 shrink-0"><AlertIcon size={18}/></div>
                <p className="text-sm">A plataforma <span className="text-rose-500 font-black">não se responsabiliza</span> pelo conteúdo postado. Você, como arquiteto de sua identidade, é o <span className="text-white font-black">único e total responsável</span> legal por cada rastro digital que deixar aqui.</p>
             </div>

             <div className="flex gap-4 items-start">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 shrink-0"><Scale size={18}/></div>
                <p className="text-sm">Apoiamos a <span className="text-white font-black italic">liberdade total</span> de expressão e economia, desde que os limites da soberania alheia sejam respeitados. O <span className="text-blue-500 font-black">desrespeito</span> aos outros usuários é a única barreira de nossa rede.</p>
             </div>
          </div>

          <div className="pt-6 relative z-10">
             <button 
              onClick={() => {
                setHasAcceptedManifesto(true);
                if (navigator.vibrate) navigator.vibrate(20);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-7 rounded-[2rem] text-xs uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
             >
               Reconheço e Concordo <ChevronRight size={20} />
             </button>
             <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest text-center mt-6">Ao prosseguir, você aceita o Protocolo de Autonomia de Dados</p>
          </div>
        </div>
      </div>
    );
  }

  const progress = {
    account: 20,
    profile: 50,
    identity: 75,
    summary: 90,
    verification: 100
  }[signupPhase];

  return (
    <div className="min-h-full h-full flex-1 bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-y-auto scrollbar-hide animate-in fade-in duration-500">
      <div className="absolute top-0 inset-x-0 h-1 bg-zinc-900 z-50">
        <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center py-10">
        <div className="flex flex-col items-center mb-8 group">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg mb-3 transform -rotate-3 group-hover:rotate-0 transition-transform">
            <span className="font-black text-black text-3xl italic">P</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">PÁGINAS</h1>
          <p className="text-zinc-600 font-black text-[8px] tracking-[0.4em] uppercase mt-1 opacity-60">Soberania Digital</p>
        </div>

        <div className="w-full bg-zinc-900/40 border border-white/5 p-8 md:p-10 rounded-[3.5rem] shadow-2xl backdrop-blur-3xl animate-in slide-in-from-bottom-6 duration-700">
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-lg font-black tracking-widest text-white italic uppercase">BEM-VINDO DE VOLTA</h2>
              </div>
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} type="text" placeholder="E-mail ou @usuário" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500/40 outline-none transition-all text-sm" required />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} type="password" placeholder="Sua senha secreta" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500/40 outline-none transition-all text-sm" required />
                </div>
              </div>
              {error && <div className="text-rose-500 text-[10px] font-black uppercase text-center bg-rose-500/5 py-3 rounded-xl border border-rose-500/10"><ShieldAlert className="inline mr-2" size={12}/> {error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-[1.5rem] shadow-xl shadow-emerald-500/10 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Reivindicar Acesso'}
              </button>
              <button type="button" onClick={() => setAuthMode('signup')} className="w-full text-zinc-500 text-[9px] font-black uppercase tracking-widest py-2 hover:text-white transition-colors">Criar Nova Identidade</button>
            </form>
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center gap-4 mb-8">
                {signupPhase !== 'account' && (
                  <button onClick={() => setSignupPhase(p => p === 'profile' ? 'account' : p === 'identity' ? 'profile' : p === 'summary' ? 'identity' : p)} className="p-3 bg-zinc-950 text-zinc-500 rounded-2xl hover:text-white"><ArrowLeft size={18}/></button>
                )}
                <h2 className="text-lg font-black text-white italic uppercase tracking-widest">
                  {signupPhase === 'account' ? 'CREDENCIAIS' : signupPhase === 'profile' ? 'PERFIL' : signupPhase === 'identity' ? 'IDENTIDADE' : 'VERIFICAÇÃO'}
                </h2>
              </div>

              {signupPhase === 'account' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="relative group">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} type="text" placeholder="Escolha seu @username" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 text-white focus:border-emerald-500/40 outline-none text-sm" />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} type="email" placeholder="Seu melhor e-mail" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 text-white focus:border-emerald-500/40 outline-none text-sm" />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} type="password" placeholder="Crie uma senha (mín. 8 caracteres)" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 text-white focus:border-emerald-500/40 outline-none text-sm" />
                  </div>
                </div>
              )}

              {signupPhase === 'profile' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center mb-6">
                    <div onClick={() => fileInputRef.current?.click()} className="relative w-28 h-28 rounded-[2.5rem] bg-zinc-950 border-4 border-dashed border-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-emerald-500/40 transition-all">
                      {formData.avatar ? <img src={formData.avatar || null} className="w-full h-full object-cover" /> : <Camera className="text-zinc-700 group-hover:text-emerald-500 transition-colors" size={32} />}
                      <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                    </div>
                    <p className="text-[8px] font-black uppercase text-zinc-600 mt-2 tracking-widest">Foto de Perfil</p>
                  </div>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} type="text" placeholder="Nome Completo" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 text-white outline-none focus:border-emerald-500/40 text-sm" />
                  </div>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} type="text" placeholder="Cidade / Estado" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 text-white outline-none focus:border-emerald-500/40 text-sm" />
                  </div>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-5 text-zinc-600" size={18} />
                    <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} placeholder="Sua bio na TRIBO..." className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 h-24 text-white outline-none focus:border-emerald-500/40 text-sm resize-none" />
                  </div>
                </div>
              )}

              {signupPhase === 'identity' && (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10">
                    <Fingerprint className="mx-auto text-emerald-500 mb-4" size={40} />
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest leading-relaxed">A TRIBO valoriza a sua identidade. Defina como você deseja ser reconhecido na rede.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-zinc-600 ml-2">Data de Nascimento</label>
                    <div className="grid grid-cols-3 gap-3">
                      <input value={birthParts.day} onChange={(e) => setBirthParts({...birthParts, day: e.target.value.replace(/\D/g, '')})} maxLength={2} type="text" placeholder="DD" className="bg-zinc-950 border border-white/5 rounded-2xl py-4 text-center text-white font-black" />
                      <input value={birthParts.month} onChange={(e) => setBirthParts({...birthParts, month: e.target.value.replace(/\D/g, '')})} maxLength={2} type="text" placeholder="MM" className="bg-zinc-950 border border-white/5 rounded-2xl py-4 text-center text-white font-black" />
                      <input value={birthParts.year} onChange={(e) => setBirthParts({...birthParts, year: e.target.value.replace(/\D/g, '')})} maxLength={4} type="text" placeholder="AAAA" className="bg-zinc-950 border border-white/5 rounded-2xl py-4 text-center text-white font-black" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 ml-2">
                      <Dna size={14} className="text-zinc-600" />
                      <label className="text-[9px] font-black uppercase text-zinc-600">Identidade de Gênero</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setFormData({...formData, gender: 'Masculino'})}
                        className={`py-4 rounded-2xl border-2 font-black text-[9px] uppercase tracking-widest transition-all ${formData.gender === 'Masculino' ? 'bg-emerald-500 border-emerald-500 text-black shadow-xl shadow-emerald-500/20 scale-105' : 'bg-zinc-950 border-white/5 text-zinc-600 hover:border-white/20'}`}
                      >
                        Masculino
                      </button>
                      <button 
                        onClick={() => setFormData({...formData, gender: 'Feminino'})}
                        className={`py-4 rounded-2xl border-2 font-black text-[9px] uppercase tracking-widest transition-all ${formData.gender === 'Feminino' ? 'bg-emerald-500 border-emerald-500 text-black shadow-xl shadow-emerald-500/20 scale-105' : 'bg-zinc-950 border-white/5 text-zinc-600 hover:border-white/20'}`}
                      >
                        Feminino
                      </button>
                      <button 
                        onClick={() => setFormData({...formData, gender: 'Outro'})}
                        className={`py-4 rounded-2xl border-2 font-black text-[9px] uppercase tracking-widest transition-all ${formData.gender === 'Outro' ? 'bg-emerald-500 border-emerald-500 text-black shadow-xl shadow-emerald-500/20 scale-105' : 'bg-zinc-950 border-white/5 text-zinc-600 hover:border-white/20'}`}
                      >
                        Outro
                      </button>
                      <button 
                        onClick={() => setFormData({...formData, gender: 'Não informar'})}
                        className={`py-4 rounded-2xl border-2 font-black text-[9px] uppercase tracking-widest transition-all ${formData.gender === 'Não informar' ? 'bg-emerald-500 border-emerald-500 text-black shadow-xl shadow-emerald-500/20 scale-105' : 'bg-zinc-950 border-white/5 text-zinc-600 hover:border-white/20'}`}
                      >
                        Ocultar
                      </button>
                    </div>
                    <p className="text-[7px] font-black uppercase text-zinc-700 text-center tracking-[0.2em] italic">Você pode alterar sua visibilidade de gênero a qualquer momento no perfil.</p>
                  </div>
                </div>
              )}

              {signupPhase === 'summary' && (
                <div className="space-y-6 animate-in zoom-in-95">
                  <div className="bg-zinc-950/60 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                      <img src={formData.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=tribo'} className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/20" />
                      <div>
                        <p className="text-lg font-black text-white leading-none">{formData.name}</p>
                        <p className="text-[10px] font-black text-emerald-500 uppercase mt-1">@{formData.username}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-zinc-600 tracking-widest"><span>E-mail</span><span className="text-zinc-400 max-w-[150px] truncate">{formData.email}</span></div>
                      <div className="flex justify-between text-[9px] font-black uppercase text-zinc-600 tracking-widest"><span>Local</span><span className="text-zinc-400">{formData.location}</span></div>
                      <div className="flex justify-between text-[9px] font-black uppercase text-zinc-600 tracking-widest"><span>Gênero</span><span className="text-emerald-500">{formData.gender}</span></div>
                      <div className="flex justify-between text-[9px] font-black uppercase text-zinc-600 tracking-widest"><span>Maturidade</span><span className="text-emerald-500">Confirmada</span></div>
                    </div>
                  </div>
                  <button onClick={() => { triggerEmailCode(); setSignupPhase('verification'); }} className="w-full bg-emerald-500 text-black font-black py-6 rounded-[2rem] uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">Ativar Identidade</button>
                </div>
              )}

              {signupPhase === 'verification' && (
                <div className="space-y-6 text-center animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                    <Mail className="text-emerald-500" size={24} />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">CONFIRME SEU E-MAIL</h3>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider px-4">
                      Enviamos um código de verificação para o endereço:<br />
                      <span className="text-emerald-400 font-black normal-case">{formData.email}</span>
                    </p>
                  </div>

                  {/* Simulated Email Delivery Inbox Notification */}
                  <div className="bg-zinc-950 p-4 rounded-3xl border border-white/5 text-left space-y-2 relative overflow-hidden">
                    <div className="absolute right-2 top-2 bg-emerald-500/10 text-emerald-400 text-[6.5px] font-black uppercase px-2 py-0.5 rounded-full">Simulador</div>
                    <div className="flex gap-2 items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">Servidor de E-mail Tribo</span>
                    </div>
                    <p className="text-[10px] text-zinc-300 font-medium leading-relaxed">
                      Sua conta está quase pronta! Use o código de ativação enviado:<br />
                      <span className="text-emerald-400 font-black tracking-widest text-base font-mono">{generatedCode}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {verificationCode.map((digit, idx) => (
                      <input key={idx} id={`code-${idx}`} type="text" maxLength={1} value={digit} onChange={(e) => {
                        const newCode = [...verificationCode];
                        newCode[idx] = e.target.value.slice(-1);
                        setVerificationCode(newCode);
                        if (e.target.value && idx < 5) document.getElementById(`code-${idx+1}`)?.focus();
                      }} className="w-full aspect-square bg-zinc-950 border border-white/10 rounded-xl text-center text-xl font-black text-emerald-500 focus:border-emerald-500/40 outline-none" />
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button onClick={handleCompleteSignup} className="w-full bg-emerald-500 text-black font-black py-5 rounded-[2.2rem] uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-xl shadow-emerald-500/10">Confirmar Código</button>
                    <button onClick={triggerEmailCode} className="text-[8px] font-black text-zinc-500 uppercase tracking-widest hover:text-emerald-400 transition-colors py-2">Reenviar Código de Confirmação</button>
                  </div>
                </div>
              )}

              {signupPhase !== 'summary' && signupPhase !== 'verification' && (
                <div className="mt-8 space-y-4">
                  {error && <p className="text-rose-500 text-[9px] font-black uppercase text-center bg-rose-500/5 py-2 rounded-xl border border-rose-500/10">{error}</p>}
                  <button onClick={nextPhase} className="w-full bg-emerald-500 text-black font-black py-5 rounded-[1.8rem] uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">
                    Próximo <ChevronRight size={18} />
                  </button>
                  <button onClick={() => { setAuthMode('login'); setSignupPhase('account'); setError(''); }} className="w-full text-zinc-600 text-[9px] font-black uppercase py-2 hover:text-white transition-colors">Voltar para Login</button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <p className="mt-10 text-[8px] font-black text-zinc-800 uppercase tracking-[0.3em] text-center px-10 leading-relaxed">
          Propriedade privada de dados • Liberdade Absoluta • PÁGINAS 2026
        </p>
      </div>
    </div>
  );
};

export default AuthView;
