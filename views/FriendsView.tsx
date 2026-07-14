import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserStatus, Community, SharedLocation } from '../types';
import { UserDatabase } from '../services/db';
import { useGeolocation } from '../src/hooks/useGeolocation';
import { 
  Search, 
  UserPlus, 
  Check, 
  X, 
  Users, 
  Clock,
  MessageCircle,
  UserMinus,
  SearchX,
  Compass,
  Circle,
  RotateCcw,
  ShieldCheck,
  Zap,
  MapPin,
  TrendingUp,
  Sparkles,
  Eye,
  EyeOff,
  Radio,
  Send,
  Trash2,
  Map
} from 'lucide-react';

const StatusMarker: React.FC<{ status: UserStatus; size?: number }> = ({ status, size = 12 }) => {
  const color = {
    [UserStatus.ONLINE]: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    [UserStatus.OFFLINE]: 'bg-zinc-700',
    [UserStatus.BUSY]: 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    [UserStatus.AWAY]: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
  }[status];

  return <span className={`block rounded-full ${color}`} style={{ width: size, height: size }}></span>;
};

interface FriendsViewProps {
  currentUser: User;
  onUpdate?: () => void;
  syncTrigger?: number;
}

const FriendsView: React.FC<FriendsViewProps> = ({ currentUser, onUpdate, syncTrigger }) => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const activeUser = useMemo(() => UserDatabase.findById(currentUser.id) || currentUser, [currentUser, refreshKey]);
  const [socialTab, setSocialTab] = useState<'aliados' | 'seguindo' | 'seguidores'>('aliados');
  const [searchTerm, setSearchTerm] = useState('');
  const [friendSearchTerm, setFriendSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteTab, setInviteTab] = useState<'recebidos' | 'enviados'>('recebidos');
  
  const [mainTab, setMainTab] = useState<'conexoes' | 'radar'>('conexoes');
  const [statusText, setStatusText] = useState('');
  const [sharingTarget, setSharingTarget] = useState<'friends' | 'community'>('friends');
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  // States for transparency and location consent
  const [consentAccepted, setConsentAccepted] = useState<boolean>(() => {
    return localStorage.getItem('tribo_gps_consent_v1') === 'true';
  });
  const [deactivatedToast, setDeactivatedToast] = useState<boolean>(false);

  const handleAcceptConsent = () => {
    localStorage.setItem('tribo_gps_consent_v1', 'true');
    setConsentAccepted(true);
    
    // Auto-enable location feature in user object for smooth onboarding
    const user = UserDatabase.findById(currentUser.id);
    if (user) {
      if (!user.privacy) {
        user.privacy = {
          isPublic: true,
          showLocation: true,
          allowStrangersMsg: true,
          showOnlineStatus: true,
        };
      }
      user.privacy.showLocation = true;
      user.privacy.incognitoMode = false;
      UserDatabase.updateUser(user);
      triggerRefresh();
    }
    if (navigator.vibrate) {
      navigator.vibrate([40, 80]);
    }
  };

  const handleDeactivateEverything = () => {
    // 1. Delete all shared locations for current user
    UserDatabase.deleteSharedLocationsForUser(currentUser.id);
    
    // 2. Clear consent flag
    localStorage.setItem('tribo_gps_consent_v1', 'false');
    setConsentAccepted(false);

    // 3. Update database privacy records
    const user = UserDatabase.findById(currentUser.id);
    if (user) {
      if (!user.privacy) {
        user.privacy = {
          isPublic: true,
          showLocation: false,
          allowStrangersMsg: true,
          showOnlineStatus: true,
        };
      }
      user.privacy.showLocation = false;
      user.privacy.incognitoMode = true;
      UserDatabase.updateUser(user);
    }

    // 4. Reset internal form states
    setStatusText('');
    setShareSuccess(false);

    // 5. Force refresh
    triggerRefresh();

    // 6. Visual feedback
    setDeactivatedToast(true);
    setTimeout(() => {
      setDeactivatedToast(false);
    }, 5500);

    // 7. Haptics
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const {
    location,
    isLoading: isLocLoading,
    error: locError,
    isAllowed: isLocAllowed,
    incognitoMode,
    showLocation,
    fetchLocation,
    share: shareLocationInDb,
    deleteShared
  } = useGeolocation(currentUser);

  // Unhas as localizações visíveis no radar
  const visibleSharedLocations = useMemo(() => {
    return UserDatabase.getVisibleLocationsForUser(currentUser.id);
  }, [currentUser.id, refreshKey, mainTab]);

  // Lista de comunidades que o usuário atual participa
  const userCommunities = useMemo(() => {
    const allComms = UserDatabase.getCommunities();
    return allComms.filter(c => c.members.includes(currentUser.id));
  }, [currentUser.joinedCommunities, refreshKey]);

  // Caso selecione comunidade mas nenhuma esteja selecionada, pegar a primeira
  useEffect(() => {
    if (userCommunities.length > 0 && !selectedCommunityId) {
      setSelectedCommunityId(userCommunities[0].id);
    }
  }, [userCommunities, selectedCommunityId]);

  const handleToggleIncognito = () => {
    const user = UserDatabase.findById(currentUser.id);
    if (user) {
      if (!user.privacy) {
        user.privacy = {
          isPublic: true,
          showLocation: true,
          allowStrangersMsg: true,
          showOnlineStatus: true,
        };
      }
      user.privacy.incognitoMode = !user.privacy.incognitoMode;
      UserDatabase.updateUser(user);
      triggerRefresh();
    }
  };

  const handleToggleShowLocation = () => {
    const user = UserDatabase.findById(currentUser.id);
    if (user) {
      if (!user.privacy) {
        user.privacy = {
          isPublic: true,
          showLocation: true,
          allowStrangersMsg: true,
          showOnlineStatus: true,
        };
      }
      user.privacy.showLocation = !user.privacy.showLocation;
      UserDatabase.updateUser(user);
      triggerRefresh();
    }
  };

  const handleTransmitLocation = async () => {
    setShareSuccess(false);
    const targetId = sharingTarget === 'community' ? selectedCommunityId : undefined;
    const success = await shareLocationInDb(sharingTarget, targetId, statusText);
    if (success) {
      setShareSuccess(true);
      setStatusText('');
      triggerRefresh();
      if (navigator.vibrate) navigator.vibrate([40, 80, 40]);
      setTimeout(() => setShareSuccess(false), 4400);
    }
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
    if (onUpdate) onUpdate();
  };

  // Algoritmo de Sugestão de Amigos (Soberania Social)
  const suggestions = useMemo(() => {
    const allUsers = UserDatabase.getUsers();
    const myFriendsSet = new Set(currentUser.friends);
    
    return allUsers
      .filter(u => u.id !== currentUser.id && !myFriendsSet.has(u.id))
      .map(u => {
        const uFriendsSet = new Set(u.friends);
        const mutuals = currentUser.friends.filter(fId => uFriendsSet.has(fId));
        return { user: u, mutuals };
      })
      .sort((a, b) => b.mutuals.length - a.mutuals.length)
      .slice(0, 6);
  }, [currentUser.friends, refreshKey]);

  // Busca em tempo real
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(() => {
      const users = UserDatabase.getUsers();
      const term = searchTerm.toLowerCase();
      const matches = users.filter(u => 
        u.id !== currentUser.id && 
        (u.username.toLowerCase().includes(term) || u.name.toLowerCase().includes(term))
      );
      setSearchResults(matches);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, currentUser.id]);

  // Atualizar lista imediatamente quando ocorrer uma sincronização em tempo real
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [syncTrigger]);

  // Sincronização em tempo real: atualiza a lista e simula alteração aleatória de status
  useEffect(() => {
    // Sincroniza periodicamente com os dados do localStorage / banco de dados simulado
    const handleSync = setInterval(() => {
      const users = UserDatabase.getUsers();
      if (users.length > 1) {
        // Selecionar um usuário diferente do atual para simular atividade em tempo real
        const otherUsers = users.filter(u => u.id !== currentUser.id);
        if (otherUsers.length > 0) {
          const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
          const possibleStatuses = [UserStatus.ONLINE, UserStatus.OFFLINE, UserStatus.BUSY, UserStatus.AWAY];
          const nextStatus = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
          randomUser.status = nextStatus;
          UserDatabase.updateUser(randomUser);
        }
      }
      setRefreshKey(prev => prev + 1);
    }, 5000);

    return () => clearInterval(handleSync);
  }, [currentUser.id]);

  const sendRequest = (targetId: string) => {
    UserDatabase.sendFriendRequest(currentUser.id, targetId);
    triggerRefresh();
    if (navigator.vibrate) navigator.vibrate([40, 40]);
  };

  const cancelRequest = (targetId: string) => {
    UserDatabase.cancelFriendRequest(currentUser.id, targetId);
    triggerRefresh();
  };

  const acceptRequest = (fromId: string) => {
    UserDatabase.acceptFriendRequest(currentUser.id, fromId);
    triggerRefresh();
    if (navigator.vibrate) navigator.vibrate([30, 100, 30]);
  };

  const incomingRequests = useMemo(() => {
    return activeUser.friendRequests
      .map(req => ({ ...req, sender: UserDatabase.findById(req.fromId) }))
      .filter(r => r.sender);
  }, [activeUser.friendRequests, refreshKey]);

  const sentRequests = useMemo(() => {
    return UserDatabase.getUsers()
      .filter(u => u.friendRequests.some(r => r.fromId === activeUser.id))
      .map(u => ({ 
        target: u, 
        timestamp: u.friendRequests.find(r => r.fromId === activeUser.id)?.timestamp 
      }));
  }, [refreshKey, activeUser.id]);

  const friendsList = useMemo(() => {
    return activeUser.friends
      .map(id => UserDatabase.findById(id))
      .filter(f => f) as User[];
  }, [activeUser.friends, refreshKey]);

  const followingList = useMemo(() => {
    return (activeUser.following || [])
      .map(id => UserDatabase.findById(id))
      .filter(f => f) as User[];
  }, [activeUser.following, refreshKey]);

  const followersList = useMemo(() => {
    return (activeUser.followers || [])
      .map(id => UserDatabase.findById(id))
      .filter(f => f) as User[];
  }, [activeUser.followers, refreshKey]);

  const activeSocialList = useMemo(() => {
    if (socialTab === 'aliados') return friendsList;
    if (socialTab === 'seguindo') return followingList;
    return followersList;
  }, [socialTab, friendsList, followingList, followersList]);

  const filteredSocialList = useMemo(() => {
    if (!friendSearchTerm.trim()) return activeSocialList;
    const term = friendSearchTerm.toLowerCase();
    return activeSocialList.filter(f =>
      f.name.toLowerCase().includes(term) || f.username.toLowerCase().includes(term)
    );
  }, [activeSocialList, friendSearchTerm]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24 px-4">
      
      {/* Hero Section e Busca */}
      <section className="relative overflow-hidden rounded-[4rem] bg-zinc-900 border border-white/5 p-12 md:p-16 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <Users size={300} className="text-emerald-500 rotate-12" />
        </div>
        
        <div className="relative z-10 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-12 h-1.5 bg-emerald-500 rounded-full"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500">Conexões Soberanas</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">CONSTRUA SUA<br/><span className="text-emerald-500 italic">TRIBO</span></h2>
            <p className="mt-4 text-zinc-400 font-bold text-xl max-w-xl">Conecte-se com mentes livres. O poder da rede está na qualidade das suas alianças.</p>
          </div>

          <div className="relative group max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-emerald-500 transition-colors" size={24} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por @username ou nome real..."
              className="w-full bg-black/40 border border-white/10 rounded-[2rem] py-6 pl-16 pr-6 text-lg font-bold outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-800"
            />
          </div>
        </div>
      </section>

      {/* Sub-Navegação de Geolocalização / Radar */}
      <div className="flex bg-zinc-900 border border-white/5 p-2 rounded-[3.5rem] max-w-lg mx-auto shadow-2xl relative z-10 transition-all duration-500">
        <button 
          onClick={() => setMainTab('conexoes')} 
          className={`flex-1 py-5 rounded-[3rem] text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500 flex items-center justify-center gap-3 ${mainTab === 'conexoes' ? 'bg-emerald-500 text-black shadow-xl font-extrabold' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Users size={18} />
          Conexões
        </button>
        <button 
          onClick={() => setMainTab('radar')} 
          className={`flex-1 py-5 rounded-[3rem] text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500 flex items-center justify-center gap-3 ${mainTab === 'radar' ? 'bg-emerald-500 text-black shadow-xl font-extrabold' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Compass size={18} className={mainTab === 'radar' ? 'animate-spin' : ''} />
          Radar da Tribo
        </button>
      </div>

      {mainTab === 'conexoes' ? (
        <>
          {/* Seção de Sugestões Inteligentes */}
          {!searchTerm && (
            <section className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between px-6">
                 <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-amber-400" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">Aliados Sugeridos para Você</h3>
                 </div>
                 <div className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-700 tracking-widest bg-zinc-900/50 px-4 py-2 rounded-xl">
                   <Zap size={12} className="text-emerald-500" /> Algoritmo TRIBO 2026
                 </div>
              </div>
              
              <div className="flex gap-6 overflow-x-auto pb-10 px-2 scrollbar-hide snap-x">
                 {suggestions.map(({ user, mutuals }) => (
                   <div key={user.id} className="flex-none w-72 bg-zinc-900/40 border border-white/5 rounded-[3.5rem] p-10 flex flex-col items-center text-center group hover:border-emerald-500/30 transition-all duration-500 shadow-2xl snap-center font-bold">
                      <div className="relative mb-8">
                        <div className="w-28 h-28 rounded-[2.8rem] overflow-hidden border-4 border-zinc-800 group-hover:scale-110 transition-transform duration-700 shadow-2xl cursor-pointer" onClick={() => navigate(`/profile/${user.id}`)}>
                           <img src={user.avatar || null} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-zinc-950 p-1.5 rounded-full border-2 border-zinc-800 font-bold">
                          <StatusMarker status={user.status} size={10} />
                        </div>
                      </div>

                      <h4 className="font-black text-white text-xl tracking-tighter truncate w-full mb-1 cursor-pointer" onClick={() => navigate(`/profile/${user.id}`)}>{user.name}</h4>
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-6">@{user.username}</p>
                      
                      <div className="flex flex-col gap-2 w-full mb-8">
                        {mutuals.length > 0 ? (
                          <div className="bg-emerald-500/5 px-4 py-2 rounded-2xl border border-emerald-500/10 flex items-center justify-center gap-2">
                            <Users size={12} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{mutuals.length} em comum</span>
                          </div>
                        ) : (
                          <div className="bg-blue-500/5 px-4 py-2 rounded-2xl border border-blue-500/10 flex items-center justify-center gap-2">
                            <MapPin size={12} className="text-blue-500" />
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{user.location || 'TRIBO Global'}</span>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => sendRequest(user.id)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-[1.8rem] text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <UserPlus size={16} strokeWidth={3} /> Conectar
                      </button>
                   </div>
                 ))}

                 {suggestions.length === 0 && (
                   <div className="w-full py-20 text-center bg-zinc-900/10 rounded-[4rem] border-2 border-dashed border-white/5 flex flex-col items-center">
                      <Compass size={48} className="text-zinc-800 mb-6" />
                      <p className="text-zinc-600 font-black uppercase text-[10px] tracking-widest">A Tribo está crescendo. Volte em breve para novas sugestões.</p>
                   </div>
                 )}
              </div>
            </section>
          )}

          {/* Resultados da Busca */}
          {searchTerm && (
            <section className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 px-6">
                 <TrendingUp size={16} className="text-emerald-500" />
                 <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">Resultados da Exploração</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <MemberCard key={user.id} user={user} currentUser={currentUser} onSendRequest={sendRequest} onCancelRequest={cancelRequest} />
                  ))
                ) : !isSearching && (
                  <div className="col-span-full py-24 text-center bg-zinc-900/10 border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center gap-6">
                    <SearchX size={60} className="text-zinc-800" />
                    <div>
                      <p className="text-xl font-black text-zinc-600 tracking-tight uppercase">Nenhum rastro encontrado</p>
                      <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest mt-2">Certifique-se de que digitou o @username corretamente.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Convites e Aliados Existentes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 font-bold text-zinc-400">
            
            {/* Gestão de Convites */}
            <div className="space-y-8">
              {/* Meu Status de Conexão */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Radio size={80} className="text-emerald-500 animate-pulse" />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">Definir Meu Status</h3>
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                    <StatusMarker status={currentUser.status} size={8} />
                    <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider">Sincronizado</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-black relative z-10">
                  {[
                    { value: UserStatus.ONLINE, label: 'Online', bg: 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/10' },
                    { value: UserStatus.AWAY, label: 'Ausente', bg: 'bg-amber-500/5 text-amber-400 border-amber-500/10 hover:bg-amber-500/10' },
                    { value: UserStatus.BUSY, label: 'Ocupado', bg: 'bg-rose-500/5 text-rose-400 border-rose-500/10 hover:bg-rose-500/10' },
                    { value: UserStatus.OFFLINE, label: 'Invisível', bg: 'bg-zinc-850 text-zinc-500 border-white/5 hover:bg-zinc-800' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        const updated = { ...currentUser, status: item.value };
                        UserDatabase.updateUser(updated);
                        if (onUpdate) onUpdate();
                        triggerRefresh();
                      }}
                      className={`py-3.5 px-4 rounded-2xl border text-center transition-all duration-300 flex items-center justify-center gap-2 ${
                        currentUser.status === item.value 
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-4 ring-emerald-500/10' 
                          : item.bg
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.value === UserStatus.ONLINE ? 'bg-emerald-500' :
                        item.value === UserStatus.AWAY ? 'bg-amber-500' :
                        item.value === UserStatus.BUSY ? 'bg-rose-500' : 'bg-zinc-600'
                      }`} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900/60 p-2 rounded-[2.5rem] border border-white/5 flex w-full shadow-inner">
                  <button onClick={() => setInviteTab('recebidos')} className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${inviteTab === 'recebidos' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-600'}`}>Pedidos ({incomingRequests.length})</button>
                  <button onClick={() => setInviteTab('enviados')} className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${inviteTab === 'enviados' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-600'}`}>Enviados ({sentRequests.length})</button>
              </div>

              <div className="space-y-4">
                {inviteTab === 'recebidos' ? (
                  incomingRequests.length > 0 ? incomingRequests.map((req, idx) => (
                    <div key={idx} className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group hover:border-emerald-500/20 transition-all shadow-2xl animate-in slide-in-from-left duration-500">
                      <div className="flex items-center gap-5 cursor-pointer" onClick={() => navigate(`/profile/${req.sender?.id}`)}>
                        <img src={req.sender?.avatar || null} className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-800" />
                        <div>
                          <p className="font-black text-sm text-white truncate w-24 leading-none">@{req.sender?.username}</p>
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1 block">Recebido agora</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => acceptRequest(req.fromId)} className="w-12 h-12 bg-emerald-500 text-black rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all"><Check size={22} strokeWidth={3} /></button>
                        <button onClick={() => triggerRefresh()} className="w-12 h-12 bg-zinc-800 text-zinc-500 rounded-2xl flex items-center justify-center hover:text-rose-500 hover:bg-rose-500/10 transition-all"><X size={22} /></button>
                      </div>
                    </div>
                  )) : <p className="text-center text-[9px] font-black uppercase text-zinc-700 py-12">Nenhum pedido de conexão pendente.</p>
                ) : (
                  sentRequests.length > 0 ? sentRequests.map((req, idx) => (
                    <div key={idx} className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group hover:border-amber-500/20 transition-all shadow-2xl">
                      <div className="flex items-center gap-5 cursor-pointer" onClick={() => navigate(`/profile/${req.target?.id}`)}>
                        <img src={req.target?.avatar || null} className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-800" />
                        <div>
                          <p className="font-black text-sm text-white truncate w-24">@{req.target?.username}</p>
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1 block">Aguardando aceite</span>
                        </div>
                      </div>
                      <button onClick={() => cancelRequest(req.target.id)} className="w-12 h-12 bg-zinc-800 text-zinc-500 rounded-2xl flex items-center justify-center hover:text-rose-500 hover:bg-rose-500/10 transition-all"><RotateCcw size={18} /></button>
                    </div>
                  )) : <p className="text-center text-[9px] font-black uppercase text-zinc-700 py-12">Você não enviou pedidos recentemente.</p>
                )}
              </div>
            </div>

            {/* Lista de Aliados / Seguidores / Seguindo */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex bg-zinc-950/80 p-1.5 rounded-2xl border border-white/5 gap-1 shadow-inner flex-wrap">
                  <button
                    onClick={() => setSocialTab('aliados')}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      socialTab === 'aliados' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Aliados ({friendsList.length})
                  </button>
                  <button
                    onClick={() => setSocialTab('seguindo')}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      socialTab === 'seguindo' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Seguindo ({followingList.length})
                  </button>
                  <button
                    onClick={() => setSocialTab('seguidores')}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      socialTab === 'seguidores' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Seguidores ({followersList.length})
                  </button>
                </div>
                <div className="relative w-full max-w-xs">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={friendSearchTerm}
                    onChange={(e) => setFriendSearchTerm(e.target.value)}
                    placeholder="Filtrar por nome ou @username..."
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-700"
                  />
                  {friendSearchTerm && (
                    <button
                      onClick={() => setFriendSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSocialList.map(friend => (
                  <div key={friend.id} className="bg-zinc-900/40 border border-white/5 rounded-[3.5rem] p-8 flex items-center justify-between group hover:border-emerald-500/30 transition-all duration-700 shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity">
                       <ShieldCheck size={100} className="text-emerald-500" />
                     </div>
                     <div 
                      className="flex items-center gap-6 cursor-pointer relative z-10 animate-in"
                      onClick={() => navigate(`/profile/${friend.id}`)}
                     >
                        <div className="relative">
                          <img src={friend.avatar || null} className="w-20 h-20 rounded-[2rem] object-cover border-2 border-zinc-800 group-hover:border-emerald-500/40 transition-colors" />
                          <div className="absolute -bottom-1 -right-1 bg-zinc-950 p-1 rounded-full border-2 border-zinc-800">
                            <StatusMarker status={friend.status} size={10} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-black text-xl text-white tracking-tighter leading-none">{friend.name}</h4>
                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                              friend.status === UserStatus.ONLINE ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              friend.status === UserStatus.BUSY ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              friend.status === UserStatus.AWAY ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}>
                              {friend.status === UserStatus.ONLINE ? 'Online' :
                               friend.status === UserStatus.BUSY ? 'Ocupado' :
                               friend.status === UserStatus.AWAY ? 'Ausente' : 'Offline'}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">@{friend.username}</p>
                        </div>
                     </div>
                     <div className="flex flex-col gap-2 relative z-10">
                        <button onClick={() => navigate('/chat')} className="p-4 bg-zinc-950 text-zinc-500 rounded-2xl hover:text-emerald-500 hover:bg-emerald-500/5 transition-all shadow-inner"><MessageCircle size={22} /></button>
                        
                        {socialTab === 'aliados' && (
                          <button onClick={(e) => { e.stopPropagation(); if(window.confirm("Romper aliança?")) { UserDatabase.removeFriend(currentUser.id, friend.id); triggerRefresh(); } }} className="p-4 bg-zinc-950 text-zinc-500 rounded-2xl hover:text-rose-500 hover:bg-rose-500/5 transition-all shadow-inner" title="Romper aliança"><UserMinus size={22} /></button>
                        )}

                        {socialTab === 'seguindo' && (
                          <button onClick={(e) => { e.stopPropagation(); UserDatabase.unfollowUser(currentUser.id, friend.id); triggerRefresh(); }} className="p-4 bg-zinc-950 text-zinc-500 rounded-2xl hover:text-rose-500 hover:bg-rose-500/5 transition-all shadow-inner" title="Deixar de seguir"><UserMinus size={22} /></button>
                        )}

                        {socialTab === 'seguidores' && (
                          !activeUser.following?.includes(friend.id) ? (
                            <button onClick={(e) => { e.stopPropagation(); UserDatabase.followUser(currentUser.id, friend.id); triggerRefresh(); }} className="p-4 bg-zinc-950 text-zinc-500 rounded-2xl hover:text-emerald-500 hover:bg-emerald-500/5 transition-all shadow-inner" title="Seguir de volta"><UserPlus size={22} /></button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); UserDatabase.unfollowUser(currentUser.id, friend.id); triggerRefresh(); }} className="p-4 bg-zinc-950 text-emerald-500/50 rounded-2xl hover:text-rose-500 hover:bg-rose-500/5 transition-all shadow-inner" title="Deixar de seguir"><UserMinus size={22} /></button>
                          )
                        )}
                     </div>
                  </div>
                ))}
                {filteredSocialList.length === 0 && (
                  <div className="col-span-full py-32 text-center bg-zinc-900/10 rounded-[5rem] border-4 border-dashed border-white/5 flex flex-col items-center">
                    <Compass size={64} className="text-zinc-800 mb-8" />
                    <p className="text-xl font-black text-zinc-650 tracking-tight uppercase">
                      {friendSearchTerm.trim() 
                        ? "Nenhum resultado encontrado" 
                        : socialTab === 'aliados' 
                          ? "Sua rede de aliados está vazia" 
                          : socialTab === 'seguindo' 
                            ? "Você não segue ninguém ainda" 
                            : "Você não possui seguidores ainda"}
                    </p>
                    <p className="text-[10px] font-black text-zinc-550 uppercase tracking-widest mt-4 max-w-xs leading-relaxed">
                      {friendSearchTerm.trim() 
                        ? `Limpe ou ajuste os termos para encontrar "${friendSearchTerm}".`
                        : socialTab === 'aliados' 
                          ? "Explore as sugestões ou use a busca acima para encontrar seus primeiros aliados."
                          : "Encontre membros interessantes e comece a segui-los para receber novidades."}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          
          {/* Fluxo de Consentimento e Explicação de Dados */}
          {!consentAccepted ? (
            <div className="bg-zinc-900 border border-white/5 rounded-[4rem] p-10 md:p-14 space-y-10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                 <ShieldCheck size={400} className="text-emerald-500" />
               </div>
               
               <div className="max-w-3xl space-y-6">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-1 bg-emerald-500 rounded-full"></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Transparência Tribo GPS</span>
                 </div>
                 
                 <h3 className="text-4xl font-extrabold text-white tracking-tight leading-tight">Você está no Controle Total de Seus Passos</h3>
                 
                 <p className="text-zinc-400 font-bold text-lg leading-relaxed">
                   Na Tribo, a privacidade é um direito soberano inviolável. Por isso, nosso Radar da Tribo foi construído com foco em segurança, <span className="text-emerald-500 font-extrabold">soberania de dados</span> e transparência absoluta.
                 </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-black/30 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                     <Radio size={24} />
                   </div>
                   <h4 className="text-lg font-black text-white tracking-tight">Sem Rastreamento de Fundo</h4>
                   <p className="text-sm text-zinc-500 font-semibold leading-relaxed">
                     Seu dispositivo nunca transmite sua geolocalização de forma automática ou em segundo plano. Toda atualização só ocorre quando você clica ativamente em "Transmitir".
                   </p>
                 </div>

                 <div className="bg-black/30 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                     <Users size={24} />
                   </div>
                   <h4 className="text-lg font-black text-white tracking-tight">Sinal Público ou Limitado</h4>
                   <p className="text-sm text-zinc-500 font-semibold leading-relaxed">
                     Você escolhe quem visualizará suas informações: somente seus aliados aprovados individualmente ou canais específicos das Tribos/Comunidades que participa.
                   </p>
                 </div>

                 <div className="bg-black/30 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                     <Clock size={24} />
                   </div>
                   <h4 className="text-lg font-black text-white tracking-tight">Sem Retenção Histórica</h4>
                   <p className="text-sm text-zinc-500 font-semibold leading-relaxed">
                     Não guardamos logs de onde você esteve. Um novo rastro substitui completamente suas coordenadas anteriores de forma permanente do banco local.
                   </p>
                 </div>

                 <div className="bg-black/30 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                   <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                     <EyeOff size={24} />
                   </div>
                   <h4 className="text-lg font-black text-white tracking-tight">Desconexão Súbita Total</h4>
                   <p className="text-sm text-zinc-500 font-semibold leading-relaxed">
                     O botão "Desativar tudo" remove na mesma hora qualquer ponto do seu mapa, limpa os rastros salvos no navegador e congela todas as permissões GPS no seu perfil instantaneamente.
                   </p>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                 <p className="text-xs text-zinc-500 font-bold max-w-md leading-normal">
                   Ao prosseguir, você concede autorização expressa para a Tribo usar a API do navegador para obter suas coordenadas quando requisitado de forma ativa.
                 </p>
                 <div className="flex gap-4 w-full sm:w-auto">
                   <button 
                     onClick={handleDeactivateEverything}
                     className="flex-1 sm:flex-none px-8 py-5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black text-xs uppercase tracking-widest transition-all text-center"
                     id="btn-recusar"
                   >
                     Desativar tudo
                   </button>
                   <button 
                     onClick={handleAcceptConsent}
                     className="flex-1 sm:flex-none px-12 py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/15 text-center flex items-center justify-center gap-2"
                     id="btn-aceitar"
                   >
                     <Check size={16} strokeWidth={3} /> Desbloquear Radar
                   </button>
                 </div>
               </div>
            </div>
          ) : (
            <>
              {/* Card de Transparência que fica fixo no topo do radar, explicativo e com 'Desativar tudo' */}
              <div className="bg-zinc-900/60 border border-white/5 rounded-[3rem] p-8 space-y-6 relative overflow-hidden backdrop-blur-md">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Privacidade Ativa & Soberania</span>
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight">Sua localização está de acordo com as Diretrizes Tribo</h3>
                    <p className="text-zinc-500 text-xs font-semibold leading-relaxed max-w-2xl">
                      Não coletamos nem rastreamos de plano de fundo. Você pode rever as diretrizes ou utilizar o botão descriminado para desativar qualquer transmissão e limpar todo seu histórico de GPS imediatamente.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => setConsentAccepted(false)}
                      className="flex-1 md:flex-none px-5 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-400 font-semibold text-xs active:scale-95 transition-all text-center"
                    >
                      Ver Diretrizes
                    </button>
                    <button 
                      onClick={handleDeactivateEverything}
                      className="flex-1 md:flex-none px-6 py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg text-center"
                      id="btn-desativar-tudo-radar"
                    >
                      <EyeOff size={14} /> Desativar tudo
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Painel Central de Controle de Privacidade */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-zinc-900 border border-white/5 rounded-[3.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Radio size={160} className="text-emerald-500 animate-pulse" />
              </div>

              <div>
                <span className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.3em] bg-emerald-500/5 border border-emerald-500/10 px-4 py-2 rounded-xl">Estação Terrestre</span>
                <h3 className="text-3xl font-black text-white tracking-tight mt-4">Sinalizador GPS</h3>
                <p className="text-sm text-zinc-400 font-bold mt-2">Controle de localização soberana do modo Tribo.</p>
              </div>

              {/* Status de Privacidade Integrativo */}
              <div className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-6">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" /> Diretrizes de Privacidade
                </h4>

                <div className="space-y-4">
                  {/* Toggle Incógnito */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider">Modo Incógnito</p>
                      <p className="text-[10px] font-bold text-zinc-500 mt-0.5">Oculta temporariamente seu rastro</p>
                    </div>
                    <button 
                      onClick={handleToggleIncognito}
                      className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        incognitoMode 
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)] font-bold' 
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {incognitoMode ? 'Incógnito Ativo' : 'Ativar'}
                    </button>
                  </div>

                  <div className="w-full h-px bg-white/5"></div>

                  {/* Toggle Show Location */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider">Compartilhar Localização</p>
                      <p className="text-[10px] font-bold text-zinc-500 mt-0.5">Permitir transmissão GPS</p>
                    </div>
                    <button 
                      onClick={handleToggleShowLocation}
                      className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        showLocation 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)] font-bold' 
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}
                    >
                      {showLocation ? 'Transmitindo' : 'Bloqueado'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Botão de Transmissão */}
              {isLocAllowed ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">O que você está fazendo neste ponto?</label>
                    <input 
                      type="text" 
                      value={statusText}
                      onChange={(e) => setStatusText(e.target.value)}
                      placeholder="Ex: Tomando café, plantando soja, reunido..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4.5 px-6 font-bold text-sm outline-none focus:border-emerald-500/30 transition-all placeholder:text-zinc-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setSharingTarget('friends')}
                      className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        sharingTarget === 'friends' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-bold' 
                          : 'bg-transparent text-zinc-600 border-white/5'
                      }`}
                    >
                      Com Aliados
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSharingTarget('community')}
                      className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        sharingTarget === 'community' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-bold' 
                          : 'bg-transparent text-zinc-600 border-white/5'
                      }`}
                    >
                      Com Tribo (Canal)
                    </button>
                  </div>

                  {sharingTarget === 'community' && (
                    <div className="space-y-3 animate-in slide-in-from-top-4 duration-300 font-bold">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Selecione uma de suas Tribos</label>
                      {userCommunities.length > 0 ? (
                        <select 
                          value={selectedCommunityId} 
                          onChange={(e) => setSelectedCommunityId(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 text-zinc-300 rounded-2xl py-4.5 px-6 font-bold text-sm outline-none focus:border-emerald-500/20"
                        >
                          {userCommunities.map(c => (
                            <option key={c.id} value={c.id} className="bg-zinc-900 text-white font-bold">{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest py-2 bg-rose-500/5 px-4 rounded-xl">Você ainda não faz parte de nenhuma Tribo.</p>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={handleTransmitLocation}
                    disabled={isLocLoading || (sharingTarget === 'community' && userCommunities.length === 0)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isLocLoading ? (
                      <>
                        <RotateCcw className="animate-spin" size={16} /> Resolvendo GPS...
                      </>
                    ) : (
                      <>
                        <Radio size={16} className="animate-pulse" /> Transmitir Sinal GPS
                      </>
                    )}
                  </button>

                  {shareSuccess && (
                     <div className="bg-emerald-500/5 text-emerald-400 p-4 rounded-2xl border border-emerald-500/15 text-[10px] font-black uppercase tracking-widest text-center animate-in face-in">
                       Sinalizado com Sucesso! Seu farol está brilhando na rede.
                     </div>
                  )}

                  {location && (
                    <div className="text-[10px] font-bold text-zinc-500 text-center flex items-center justify-center gap-2">
                      <MapPin size={12} className="text-emerald-500" />
                      Sua última resolução: {location.address}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-rose-500/5 text-rose-500 border border-rose-500/10 p-8 rounded-3xl text-center space-y-4 animate-in slide-in-from-bottom-4">
                  <EyeOff size={32} className="mx-auto text-rose-500" />
                  <p className="font-black uppercase tracking-widest text-xs">Sua Estação está Desligada</p>
                  <p className="text-[11px] font-medium text-zinc-500 max-w-sm mx-auto leading-relaxed">
                    Você ativou o Modo Incógnito ou desabilitou o compartilhamento de localização nas diretrizes. Mude as opções acima para restabelecer os faróis.
                  </p>
                </div>
              )}

              {locError && (
                <div className="bg-amber-500/5 text-amber-500 border border-amber-500/10 p-5 rounded-2xl text-[10px] font-extrabold text-center uppercase tracking-widest">
                  {locError}
                </div>
              )}
            </div>
          </div>

          {/* Radar Scanner e Sinais Próximos */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-zinc-900 border border-white/5 rounded-[3.5rem] p-10 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Sinais Recebidos ({visibleSharedLocations.length})</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Transmissões de Aliados e Tribos de que você participa</p>
                </div>
                <div className="relative">
                  <div className="absolute w-4 h-4 bg-emerald-500 rounded-full animate-ping opacity-60"></div>
                  <div className="w-4 h-4 bg-emerald-500 rounded-full relative z-10"></div>
                </div>
              </div>

              {/* Dynamic Radar Sweeper Graphic SVG */}
              <div className="w-full flex justify-center py-6">
                <div className="relative w-72 h-72 rounded-full border border-zinc-800 flex items-center justify-center">
                  <div className="absolute w-56 h-56 rounded-full border border-zinc-900/40 flex items-center justify-center font-bold">
                    <div className="absolute w-40 h-40 rounded-full border border-zinc-800/60 flex items-center justify-center">
                      <div className="absolute w-24 h-24 rounded-full border border-zinc-900/40 flex items-center justify-center">
                        <div className="absolute w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Circle size={4} className="text-emerald-500 fill-emerald-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Radar sweep light overlay */}
                  <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-tr from-transparent via-transparent to-emerald-500/5 animate-spin duration-10000 opacity-70 pointer-events-none"></div>
                  <div className="absolute top-1/2 left-0 w-full h-px bg-zinc-800/40 transform -translate-y-1/2"></div>
                  <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-800/40 transform -translate-x-1/2"></div>

                  {/* Scatter actual visible dots on the radar wheel based on their lat/long */}
                  {visibleSharedLocations.slice(0, 5).map((l, idx) => {
                    const angle = (idx * 72 + 30) * (Math.PI / 180);
                    const radius = 35 + (idx * 22) % 65; // pixels away from center
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    return (
                      <div 
                        key={l.id}
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                        className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full cursor-pointer group flex items-center justify-center"
                        title={l.userName}
                        onClick={() => {
                          const element = document.getElementById(`share-card-${l.id}`);
                          if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <div className="absolute w-4 h-4 bg-emerald-500/30 rounded-full animate-ping opacity-60"></div>
                        <img src={l.userAvatar || null} className="w-5 h-5 rounded-full object-cover border border-emerald-500 relative z-10 transition-transform group-hover:scale-125" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid of Shared Location Signals */}
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin">
                {visibleSharedLocations.map(sig => {
                  const isOwn = sig.userId === currentUser.id;
                  const comm = sig.targetType === 'community' && sig.targetId 
                    ? UserDatabase.getCommunities().find(c => c.id === sig.targetId)
                    : null;
                  
                  return (
                    <div 
                      key={sig.id} 
                      id={`share-card-${sig.id}`}
                      className="bg-zinc-900/40 hover:bg-zinc-900 border border-white/5 hover:border-emerald-500/20 rounded-3xl p-6 transition-all duration-300 flex items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <img src={sig.userAvatar || null} className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-800" />
                          <div className="absolute -bottom-1 -right-1">
                            <Circle size={10} className="text-emerald-500 fill-emerald-500 animate-pulse animate-duration-500" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-white text-base tracking-tight">{sig.userName}</h4>
                            {sig.targetType === 'community' && comm && (
                              <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/10">
                                {comm.name}
                              </span>
                            )}
                            {isOwn && (
                              <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-500/5 px-2.5 py-1 rounded-md border border-emerald-500/10">
                                Você
                              </span>
                            )}
                          </div>

                          {sig.statusText && (
                            <p className="text-xs text-zinc-300 font-semibold italic">
                              "{sig.statusText}"
                            </p>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[10px] text-zinc-500 font-bold">
                            <span className="flex items-center gap-1">
                              <MapPin size={10} className="text-emerald-500" /> {sig.address}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a 
                          href={`https://www.openstreetmap.org/?mlat=${sig.latitude}&mlon=${sig.longitude}#map=16/${sig.latitude}/${sig.longitude}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="w-12 h-12 bg-black/40 hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-500 rounded-xl flex items-center justify-center transition-all border border-white/5 active:scale-95"
                          title="Abrir no OpenStreetMap"
                        >
                          <Map size={18} />
                        </a>
                        {isOwn && (
                          <button 
                            onClick={() => { deleteShared(sig.id); triggerRefresh(); }}
                            className="w-12 h-12 bg-black/40 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all border border-white/5 active:scale-95"
                            title="Desativar Sinal"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {visibleSharedLocations.length === 0 && (
                  <div className="py-20 text-center bg-zinc-900/10 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center gap-4">
                    <Compass size={40} className="text-zinc-800 animate-pulse" />
                    <div>
                      <p className="text-sm font-black text-zinc-600 tracking-tight uppercase">Radar Silencioso</p>
                      <p className="text-[10px] font-black text-zinc-855 uppercase tracking-widest mt-1 font-bold">Nenhum rastro GPS detectado no momento</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

              </div>
            </>
          )}

        </div>
      )}

      {/* Floating Success Toast for Absolute Stealth Deactivation */}
      {deactivatedToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-rose-500 text-white font-black px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom duration-300">
          <ShieldCheck size={20} className="text-white animate-bounce" />
          <div className="text-left">
            <p className="text-sm font-black uppercase tracking-wider">Diretiva de Invisibilidade Ativa</p>
            <p className="text-[10px] font-bold opacity-80 mt-0.5">Sua geolocalização foi 100% apagada e a transmissão congelada.</p>
          </div>
          <button onClick={() => setDeactivatedToast(false)} className="hover:opacity-60 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}

    </div>
  );
};

const MemberCard: React.FC<{ user: User; currentUser: User; onSendRequest: (id: string) => void; onCancelRequest: (id: string) => void }> = ({ user, currentUser, onSendRequest, onCancelRequest }) => {
  const isFriend = currentUser.friends.includes(user.id);
  const navigate = useNavigate();
  const [justInvited, setJustInvited] = useState(false);
  
  const hasSentReq = useMemo(() => {
    return UserDatabase.hasSentRequest(currentUser.id, user.id);
  }, [currentUser.id, user.id, user.friendRequests.length]);

  const handleSendRequest = () => {
    setJustInvited(true);
    onSendRequest(user.id);
    setTimeout(() => {
      setJustInvited(false);
    }, 1500);
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-8 flex items-center justify-between group shadow-2xl hover:border-emerald-500/30 transition-all duration-500 font-bold">
      <div 
        className="flex items-center gap-6 cursor-pointer"
        onClick={() => navigate(`/profile/${user.id}`)}
      >
        <div className="relative animate-in">
           <img src={user.avatar || null} className="w-16 h-16 rounded-[1.8rem] object-cover border-2 border-zinc-800" />
           <div className="absolute -bottom-1 -right-1"><StatusMarker status={user.status} size={10} /></div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-black text-lg text-white tracking-tight leading-none">{user.name}</p>
            {user.verified && <ShieldCheck size={16} className="text-emerald-500" />}
          </div>
          <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-1">@{user.username}</p>
        </div>
      </div>
      
      {isFriend ? (
        <div className="bg-emerald-500/10 text-emerald-500 px-6 py-3 rounded-2xl border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">Aliado</div>
      ) : justInvited ? (
        <div className="bg-emerald-500/20 text-emerald-400 px-6 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border border-emerald-500/30 flex items-center gap-2 animate-[bounce_0.5s_ease-in-out_1]">
          <Check size={14} className="text-emerald-400 stroke-[3] animate-[scale-in_0.2s_ease-out]" /> Enviado!
        </div>
      ) : hasSentReq ? (
        <button 
          onClick={() => onCancelRequest(user.id)} 
          className="bg-amber-500/10 text-amber-500 px-6 py-3 rounded-2xl border border-amber-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all flex items-center gap-2"
        >
          <Clock size={14}/> Pendente
        </button>
      ) : (
        <button 
          onClick={handleSendRequest} 
          className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2"
        >
          <UserPlus size={14} strokeWidth={3} /> Convidar
        </button>
      )}
    </div>
  );
};

export default FriendsView;
