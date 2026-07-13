
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  Bell, 
  UserPlus, 
  X,
  EyeOff,
  Eye,
  Wifi,
  ShoppingBag,
  Users,
  Tractor,
  Compass,
  User as UserIcon,
  Sun,
  Moon,
  Palette
} from 'lucide-react';

import FeedView from './views/FeedView';
import CommunitiesView from './views/CommunitiesView';
import ChatView from './views/ChatView';
import ProfileView from './views/ProfileView';
import MarketplaceView from './views/MarketplaceView';
import AuthView from './views/AuthView';
import UniversoView from './views/UniversoView';
import FriendsView from './views/FriendsView';
import { OnboardingTour } from './src/components/OnboardingTour';
import { BiometricLockScreen } from './src/components/BiometricLockScreen';
import { IdentityType, User, AppNotification } from './types';
import { UserDatabase } from './services/db';
import { SWManager } from './services/swManager';
import { SyncClient } from './services/syncClient';

const TopHeader: React.FC<{ 
  currentUser: User; 
  isIncognito: boolean; 
  onToggleIncognito: () => void;
  onStartTour?: () => void;
  currentTheme: 'light' | 'dark' | 'nostalgia';
  onToggleTheme: () => void;
}> = ({ currentUser, isIncognito, onToggleIncognito, onStartTour, currentTheme, onToggleTheme }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifs = useCallback(() => {
    const data = UserDatabase.getNotifications(currentUser.id);
    setNotifications(data);
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1000);
  }, [currentUser.id]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--msn-sidebar)] backdrop-blur-2xl border-b border-white/5 pt-safe transition-colors duration-300">
      <div className="h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NavLink to="/" className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-black italic text-xl shadow-lg shadow-emerald-500/20">T</NavLink>
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-lg leading-none">TRIBO</span>
            {isSyncing && <span className="text-[7px] font-black text-emerald-500 uppercase flex items-center gap-1 mt-0.5"><Wifi size={8}/> Sincronizando...</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {onStartTour && (
            <button 
              onClick={onStartTour} 
              className="p-2.5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center justify-center relative group"
              title="Iniciar Tour Interativo"
            >
              <Compass size={18} className="text-emerald-400 group-hover:rotate-45 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>
          )}

          {/* Botão de Tema */}
          <button 
            onClick={onToggleTheme} 
            className="p-2.5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center justify-center relative"
            title="Alterar Tema (Modo Claro / Modo Escuro / Nostalgia)"
          >
            {currentTheme === 'light' ? (
              <Moon size={18} className="text-amber-400" />
            ) : currentTheme === 'nostalgia' ? (
              <Palette size={18} className="text-rose-400 animate-pulse" />
            ) : (
              <Sun size={18} className="text-yellow-400" />
            )}
          </button>

          <button 
            onClick={onToggleIncognito} 
            className={`p-2.5 rounded-xl transition-all ${isIncognito ? 'bg-emerald-500 text-black' : 'bg-white/5 text-zinc-500'}`}
            title="Modo Privacidade"
          >
            {isIncognito ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
          
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 bg-white/5 text-zinc-400 rounded-xl hover:text-white transition-all">
              <Bell size={20} />
              {notifications.some(n => !n.read) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-black animate-pulse"></span>}
            </button>
            {showNotifications && (
              <div className="fixed inset-x-4 top-20 md:absolute md:right-0 md:top-auto md:mt-4 md:w-80 bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl animate-in fade-in slide-in-from-top-2 overflow-hidden z-[200]">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-950/40">
                  <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Atividade</h4>
                  <button onClick={() => setShowNotifications(false)}><X size={16}/></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} className="p-5 border-b border-white/5 flex gap-4 hover:bg-white/5 transition-colors">
                      <img src={n.senderAvatar} className="w-10 h-10 rounded-2xl object-cover shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{n.message}</p>
                        <span className="text-[8px] font-black uppercase text-zinc-600 mt-1.5 block">{n.timestamp}</span>
                      </div>
                    </div>
                  )) : <div className="p-12 text-center text-zinc-700 font-black text-[9px] uppercase tracking-widest">Tudo limpo por aqui</div>}
                </div>
              </div>
            )}
          </div>
          
          <NavLink to="/profile" className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all ${currentUser.animatedAvatar ? 'avatar-animated border-emerald-500' : 'border-white/10'}`}>
            <img src={currentUser.avatar} className="w-full h-full object-cover" />
          </NavLink>
        </div>
      </div>
    </div>
  );
};

const BottomNav: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-3xl border-t border-white/5 select-none pb-safe">
      <nav className="h-16 flex items-center justify-around px-2">
        <NavLink to="/" className={({isActive}) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <Home size={20} />
          <span className="text-[6px] font-black uppercase tracking-widest">Início</span>
        </NavLink>
        <NavLink to="/friends" className={({isActive}) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <UserPlus size={20} />
          <span className="text-[6px] font-black uppercase tracking-widest">Aliados</span>
        </NavLink>
        <NavLink to="/communities" className={({isActive}) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <Users size={20} />
          <span className="text-[6px] font-black uppercase tracking-widest">Tribo</span>
        </NavLink>
        <NavLink to="/universo" className={({isActive}) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <Tractor size={20} />
          <span className="text-[6px] font-black uppercase tracking-widest">Roça</span>
        </NavLink>
        <NavLink to="/mercado" className={({isActive}) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <ShoppingBag size={20} />
          <span className="text-[6px] font-black uppercase tracking-widest">Mercado</span>
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <UserIcon size={20} />
          <span className="text-[6px] font-black uppercase tracking-widest">Perfil</span>
        </NavLink>
        <NavLink to="/chat" className={({isActive}) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <MessageCircle size={20} />
          <span className="text-[6px] font-black uppercase tracking-widest">Papo</span>
        </NavLink>
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tribo_logged_user_id');
      if (saved) {
        return UserDatabase.findById(saved) || null;
      }
    }
    return null;
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'nostalgia'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tribo_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'nostalgia') {
        return saved;
      }
    }
    return 'dark';
  });
  const [isIncognito, setIsIncognito] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [syncCount, setSyncCount] = useState(0);

  const toggleTheme = () => {
    const nextThemeMap: Record<'light' | 'dark' | 'nostalgia', 'light' | 'dark' | 'nostalgia'> = {
      dark: 'light',
      light: 'nostalgia',
      nostalgia: 'dark'
    };
    const nextTheme = nextThemeMap[theme];
    setTheme(nextTheme);
    
    if (currentUser) {
      const updatedUser = { ...currentUser, themePreference: nextTheme };
      UserDatabase.updateUser(updatedUser);
      setCurrentUser(updatedUser);
    }
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const [visitorId] = useState(() => {
    if (typeof window !== 'undefined') {
      let vid = localStorage.getItem('tribo_visitor_id');
      if (!vid) {
        vid = 'visitor_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('tribo_visitor_id', vid);
      }
      return vid;
    }
    return 'visitor_temp';
  });

  const [isBiometricLocked, setIsBiometricLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tribo_logged_user_id');
      if (saved) {
        const u = UserDatabase.findById(saved);
        return u?.privacy?.biometricLockEnabled || false;
      }
    }
    return false;
  });

  useEffect(() => {
    if (!currentUser) {
      setIsBiometricLocked(false);
    }
  }, [currentUser]);

  const refreshUser = useCallback(() => {
    if (currentUser) {
      const freshUser = UserDatabase.findById(currentUser.id);
      if (freshUser) {
        const hasChanges = JSON.stringify(freshUser) !== JSON.stringify(currentUser);
        if (hasChanges) {
          setCurrentUser(freshUser);
        }
      }
    }
  }, [currentUser]);

  useEffect(() => {
    // Sincronização inicial (bootstrap) da rede no carregamento do app
    fetch('/api/bootstrap')
      .then(res => {
        if (!res.ok) throw new Error('Falha ao conectar ao servidor central');
        return res.json();
      })
      .then(data => {
        UserDatabase.bootstrapState(data);
        setSyncCount(prev => prev + 1);
        // Atualiza os dados do usuário caso já estivesse logado
        const savedId = localStorage.getItem('tribo_logged_user_id');
        if (savedId) {
          const fresh = UserDatabase.findById(savedId);
          if (fresh) {
            setCurrentUser(fresh);
          }
        }
      })
      .catch(err => {
        console.warn('[TRIBO NETWORK] Modo offline ativo:', err.message);
      });
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('tribo_logged_user_id', currentUser.id);
    } else {
      localStorage.removeItem('tribo_logged_user_id');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(refreshUser, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshUser]);

  useEffect(() => {
    if (currentUser) {
      const isCompleted = localStorage.getItem(`tribo_tour_completed_${currentUser.id}`) === 'true';
      if (!isCompleted) {
        const timer = setTimeout(() => {
          setIsTourOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } else {
      setIsTourOpen(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const activeConnectionId = currentUser ? currentUser.id : visitorId;

    // Conecta ao servidor central de internet (como usuário ou visitante para sincronismo em segundo plano)
    SyncClient.connect(activeConnectionId);

    // Assina atualizações em tempo real recebidas de outros aparelhos
    const unsubscribe = SyncClient.addUpdateCallback(() => {
      refreshUser();
      setSyncCount(prev => prev + 1);
    });

    return () => {
      unsubscribe();
      SyncClient.disconnect();
    };
  }, [currentUser, visitorId, refreshUser]);

  useEffect(() => {
    if (currentUser?.themePreference) {
      setTheme(currentUser.themePreference);
    }
  }, [currentUser?.themePreference]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'nostalgia');
    document.documentElement.classList.add(theme);
    localStorage.setItem('tribo_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Registrar o Service Worker e solicitar permissão se ativado
    if (currentUser?.pushNotificationsEnabled && SWManager.isSupported()) {
      SWManager.register().then(() => {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          SWManager.requestPermission();
        }
      });
    }
  }, [currentUser?.pushNotificationsEnabled]);

  const toggleIncognito = () => {
    setIsIncognito(!isIncognito);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const renderContent = () => {
    if (!currentUser) {
      return <AuthView onLogin={setCurrentUser} syncTrigger={syncCount} />;
    }

    if (isBiometricLocked) {
      return <BiometricLockScreen currentUser={currentUser} onUnlock={() => setIsBiometricLocked(false)} />;
    }

    return (
      <div className={`min-h-[100dvh] bg-[var(--msn-bg)] text-[var(--msn-text)] flex flex-col relative ${isIncognito ? 'privacy-active' : ''}`}>
        <TopHeader 
          currentUser={currentUser} 
          isIncognito={isIncognito} 
          onToggleIncognito={toggleIncognito} 
          onStartTour={() => setIsTourOpen(true)} 
          currentTheme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className={`flex-grow pt-24 pb-24 px-4 overflow-x-hidden ${isIncognito ? 'incognito-blur' : ''}`}>
          <Routes>
            <Route path="/" element={<FeedView currentUser={currentUser} syncTrigger={syncCount} />} />
            <Route path="/friends" element={<FriendsView currentUser={currentUser} onUpdate={refreshUser} syncTrigger={syncCount} />} />
            <Route path="/communities" element={<CommunitiesView currentUser={currentUser} syncTrigger={syncCount} />} />
            <Route path="/chat" element={<ChatView currentUser={currentUser} syncTrigger={syncCount} />} />
            <Route path="/universo" element={<UniversoView currentUser={currentUser} />} />
            <Route path="/mercado" element={<MarketplaceView currentUser={currentUser} syncTrigger={syncCount} />} />
            {/* Rota de perfil flexível */}
            <Route path="/profile" element={<ProfileView currentUser={currentUser} onUpdate={refreshUser} syncTrigger={syncCount} />} />
            <Route path="/profile/:userId" element={<ProfileView currentUser={currentUser} onUpdate={refreshUser} syncTrigger={syncCount} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <BottomNav />
        <OnboardingTour userId={currentUser.id} isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      </div>
    );
  };

  return (
    <HashRouter>
      {renderContent()}
    </HashRouter>
  );
};

export default App;
