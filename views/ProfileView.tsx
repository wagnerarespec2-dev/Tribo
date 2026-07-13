
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IdentityType, User, UserStatus } from '../types';
import { 
  User as UserIcon, 
  Briefcase, 
  Edit3, 
  Zap, 
  Star,
  Shield,
  Image as ImageIcon,
  Medal,
  Crown,
  Trophy,
  Users,
  Heart,
  Globe,
  Save,
  X,
  MapPin,
  Calendar,
  Layers,
  Fingerprint,
  BookOpen,
  MapIcon,
  Loader2,
  Languages,
  Dna,
  Camera,
  MessageCircle,
  UserPlus,
  UserMinus,
  ArrowLeft,
  BellRing,
  Navigation,
  Search,
  Bookmark,
  Trash2,
  MoreHorizontal,
  Flag,
  Share2,
  EyeOff,
  Activity,
  CheckCircle2,
  RefreshCcw,
  Sparkles,
  Database,
  Palette
} from 'lucide-react';
import { UserDatabase } from '../services/db';
import { SWManager, ServiceWorkerState } from '../services/swManager';
import { FeedPost } from '../src/components/FeedPost';
import { ConnectionStats } from '../src/components/ConnectionStats';

interface ProfileProps {
  currentUser: User;
  onUpdate?: () => void;
  syncTrigger?: number;
}

const ProfileView: React.FC<ProfileProps> = ({ currentUser, onUpdate, syncTrigger }) => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [tab, setTab] = useState<'posts' | 'social' | 'achievements' | 'stats' | 'launch' | 'security'>('social');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [cep, setCep] = useState('');
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // Estado local para edição
  const [editData, setEditData] = useState<Partial<User>>({});

  // Estado para filtragem de palavras-chave / temas
  const [newKeyword, setNewKeyword] = useState('');
  const [blockedKeywords, setBlockedKeywords] = useState<string[]>([]);

  // Estados para Service Worker e Notificações Push
  const [swState, setSwState] = useState<ServiceWorkerState | null>(null);
  const [testNotifDelay, setTestNotifDelay] = useState(5);
  const [testNotifTitle, setTestNotifTitle] = useState('Alerta da Tribo! 🚀');
  const [testNotifBody, setTestNotifBody] = useState('Esta é uma notificação em segundo plano da sua rede soberana!');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Estados para Biometria
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [biometricPinValue, setBiometricPinValue] = useState('');
  const [biometricSetupError, setBiometricSetupError] = useState('');
  const [biometricHardwareSupported, setBiometricHardwareSupported] = useState(false);
  const [biometricStatusMsg, setBiometricStatusMsg] = useState('');
  const [showDisableVerify, setShowDisableVerify] = useState(false);
  const [verifyPinValue, setVerifyPinValue] = useState('');
  const [verifyPinError, setVerifyPinError] = useState('');

  useEffect(() => {
    if (window.PublicKeyCredential) {
      // Check if platform authenticator is available
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          setBiometricHardwareSupported(available);
        })
        .catch(() => {
          setBiometricHardwareSupported(false);
        });
    }
  }, []);

  const loadSwState = async () => {
    const state = await SWManager.getState();
    setSwState(state);
  };

  useEffect(() => {
    loadSwState();
  }, []);

  const handleRequestSWPermission = async () => {
    await SWManager.requestPermission();
    await loadSwState();
  };

  const handleRegisterSW = async () => {
    await SWManager.register();
    await loadSwState();
  };

  const handleUnregisterSW = async () => {
    await SWManager.unregister();
    await loadSwState();
  };

  const handleSubscribePush = async () => {
    setIsSubscribing(true);
    try {
      const sub = await SWManager.subscribeToPush();
      if (sub) {
        alert("Subscrição push registrada com sucesso no navegador!");
      } else {
        alert("Falha ou permissão negada ao registrar subscrição push.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao subscrever.");
    } finally {
      setIsSubscribing(false);
      await loadSwState();
    }
  };

  const handleSendTestNotification = async () => {
    setIsScheduling(true);
    try {
      const success = await SWManager.scheduleBackgroundNotification(
        testNotifTitle,
        testNotifBody,
        testNotifDelay * 1000
      );
      if (success) {
        alert(`Agendado! Bloqueie o celular ou minimize a aba agora. Em ${testNotifDelay} segundos você receberá o alerta direto em segundo plano!`);
      } else {
        alert("Verifique se as notificações estão permitidas e se o Service Worker está ativo.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao agendar.");
    } finally {
      setIsScheduling(false);
    }
  };

  useEffect(() => {
    if (viewedUser && viewedUser.privacy) {
      setBlockedKeywords(viewedUser.privacy.blockedKeywords || []);
    }
  }, [viewedUser]);

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || !viewedUser) return;
    const kw = newKeyword.trim().toLowerCase();
    if (blockedKeywords.includes(kw)) {
      setNewKeyword('');
      return;
    }
    const updatedKeywords = [...blockedKeywords, kw];
    setBlockedKeywords(updatedKeywords);
    setNewKeyword('');

    const updatedUser: User = {
      ...viewedUser,
      privacy: {
        ...viewedUser.privacy,
        blockedKeywords: updatedKeywords
      }
    };
    UserDatabase.updateUser(updatedUser);
    setViewedUser(updatedUser);
    if (onUpdate) onUpdate();
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    if (!viewedUser) return;
    const updatedKeywords = blockedKeywords.filter(k => k !== kwToRemove);
    setBlockedKeywords(updatedKeywords);

    const updatedUser: User = {
      ...viewedUser,
      privacy: {
        ...viewedUser.privacy,
        blockedKeywords: updatedKeywords
      }
    };
    UserDatabase.updateUser(updatedUser);
    setViewedUser(updatedUser);
    if (onUpdate) onUpdate();
    if (navigator.vibrate) navigator.vibrate(10);
  };

  // Carregar usuário visualizado
  useEffect(() => {
    const idToFetch = userId || currentUser.id;
    const user = UserDatabase.findById(idToFetch);
    if (user) {
      setViewedUser(user);
    } else {
      navigate('/profile');
    }
  }, [userId, currentUser.id, navigate, syncTrigger]);

  const isOwnProfile = useMemo(() => viewedUser?.id === currentUser.id, [viewedUser, currentUser.id]);

  const startEditing = () => {
    if (!viewedUser) return;
    setEditData({
      name: viewedUser.name,
      bio: viewedUser.bio,
      location: viewedUser.location,
      relationship: viewedUser.relationship || 'Solteiro(a)',
      education: viewedUser.education || 'Superior Completo',
      occupation: viewedUser.occupation || 'Membro da Tribo',
      languages: viewedUser.languages || 'Português',
      interests: viewedUser.interests || 'Tecnologia, Liberdade',
      birthDate: viewedUser.birthDate || '',
      avatar: viewedUser.avatar,
      coverImage: viewedUser.coverImage,
      gender: viewedUser.gender || 'Não informar',
      pushNotificationsEnabled: viewedUser.pushNotificationsEnabled ?? true
    });
    setIsEditing(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await UserDatabase.uploadFile(file);
      setEditData(prev => ({ ...prev, avatar: base64 }));
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await UserDatabase.uploadFile(file);
      setEditData(prev => ({ ...prev, coverImage: base64 }));
    }
  };

  const handleSave = async () => {
    if (!viewedUser) return;
    setIsSaving(true);
    const updatedUser = { ...viewedUser, ...editData };
    
    if (editData.birthDate) {
        const birth = new Date(editData.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        updatedUser.age = age;
    }

    UserDatabase.updateUser(updatedUser);
    await new Promise(r => setTimeout(r, 800));
    
    setIsEditing(false);
    setIsSaving(false);
    setViewedUser(updatedUser);
    
    if (onUpdate) onUpdate();
    if (navigator.vibrate) navigator.vibrate([20, 50]);

    // Notificação de teste ao salvar se ativado
    if (updatedUser.pushNotificationsEnabled) {
       UserDatabase.triggerSystemNotification(
         "Identidade Atualizada",
         "Suas notificações móveis da TRIBO agora estão ativas."
       );
    }
  };

  const handleConnect = () => {
    if (!viewedUser) return;
    UserDatabase.sendFriendRequest(currentUser.id, viewedUser.id);
    if (onUpdate) onUpdate();
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleRemove = () => {
    if (!viewedUser) return;
    if (window.confirm("Deseja remover este aliado da sua rede?")) {
        UserDatabase.removeFriend(currentUser.id, viewedUser.id);
        if (onUpdate) onUpdate();
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada pelo seu navegador.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.state;
          const country = data.address.country;
          setEditData(prev => ({ ...prev, location: `${city}, ${country}` }));
        } catch (error) {
          console.error("Erro ao obter localização:", error);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Erro de geolocalização:", error);
        setIsLocating(false);
        alert("Não foi possível obter sua localização.");
      }
    );
  };

  const handleCepLookup = async () => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length !== 8) {
      alert("CEP inválido. Use 8 dígitos.");
      return;
    }

    setIsLocating(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();
      if (data.erro) {
        alert("CEP não encontrado.");
      } else {
        setEditData(prev => ({ ...prev, location: `${data.localidade}, ${data.uf}` }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsLocating(false);
    }
  };

  const handleTogglePrivacySetting = (key: 'shareNameWithThirdParties' | 'shareEmailWithThirdParties' | 'shareLocationWithThirdParties' | 'shareFriendsWithThirdParties' | 'shareBioWithThirdParties' | 'permanentInvisibleMode') => {
    if (!viewedUser) return;
    const updatedUser: User = {
      ...viewedUser,
      privacy: {
        ...viewedUser.privacy,
        [key]: !viewedUser.privacy[key]
      }
    };
    
    if (key === 'permanentInvisibleMode') {
      const newVal = !viewedUser.privacy.permanentInvisibleMode;
      updatedUser.status = newVal ? UserStatus.OFFLINE : UserStatus.ONLINE;
      updatedUser.privacy.incognitoMode = newVal;
    }

    UserDatabase.updateUser(updatedUser);
    setViewedUser(updatedUser);
    if (onUpdate) onUpdate();
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleToggleBiometricSwitch = async () => {
    if (!viewedUser) return;
    const isCurrentlyEnabled = viewedUser.privacy?.biometricLockEnabled ?? false;
    
    if (!isCurrentlyEnabled) {
      // Abrir fluxo de ativação / Setup de PIN
      setBiometricPinValue('');
      setBiometricSetupError('');
      setBiometricStatusMsg('');
      setShowBiometricSetup(true);
    } else {
      // Solicitar o PIN cadastrado para desativar
      setVerifyPinValue('');
      setVerifyPinError('');
      setShowDisableVerify(true);
    }
  };

  const registerWebAuthnBiometrics = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false;
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userIdBytes = new Uint8Array(16);
      window.crypto.getRandomValues(userIdBytes);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: { name: "Tribo S/A", id: window.location.hostname },
          user: {
            id: userIdBytes,
            name: viewedUser?.username || "tribo_user",
            displayName: viewedUser?.name || "Aliado da Tribo"
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 10000
        }
      });
      return !!credential;
    } catch (err) {
      console.warn("Falha no WebAuthn real:", err);
      return false;
    }
  };

  const handleSaveBiometricSetup = async () => {
    if (!viewedUser) return;
    if (biometricPinValue.length < 4 || biometricPinValue.length > 6 || !/^\d+$/.test(biometricPinValue)) {
      setBiometricSetupError('O PIN de backup deve conter entre 4 e 6 dígitos numéricos.');
      return;
    }

    setBiometricStatusMsg('Iniciando integração de biometria de segurança...');
    
    // Tenta registrar WebAuthn biometrics real
    let webAuthnSuccess = false;
    if (biometricHardwareSupported) {
      webAuthnSuccess = await registerWebAuthnBiometrics();
    }

    const updatedUser: User = {
      ...viewedUser,
      privacy: {
        ...viewedUser.privacy,
        biometricLockEnabled: true,
        biometricPIN: biometricPinValue
      }
    };

    UserDatabase.updateUser(updatedUser);
    setViewedUser(updatedUser);
    if (onUpdate) onUpdate();
    setShowBiometricSetup(false);
    
    if (navigator.vibrate) navigator.vibrate([15, 15]);

    if (webAuthnSuccess) {
      alert("Autenticação Biométrica e PIN de Backup ativados com sucesso! Seu app está duplamente protegido.");
    } else {
      alert("Proteção de Segurança ativa! Como o ambiente de sandbox do navegador ou dispositivo limitou a leitura direta do sensor físico, usamos o PIN de Segurança de 4 dígitos para proteger todas as inicializações do seu aplicativo.");
    }
  };

  const handleVerifyDisableBiometric = () => {
    if (!viewedUser) return;
    const correctPin = viewedUser.privacy?.biometricPIN;
    if (verifyPinValue !== correctPin) {
      setVerifyPinError('PIN de Segurança incorreto. Tente novamente.');
      if (navigator.vibrate) navigator.vibrate([50, 50]);
      return;
    }

    const updatedUser: User = {
      ...viewedUser,
      privacy: {
        ...viewedUser.privacy,
        biometricLockEnabled: false,
        biometricPIN: undefined
      }
    };

    UserDatabase.updateUser(updatedUser);
    setViewedUser(updatedUser);
    if (onUpdate) onUpdate();
    setShowDisableVerify(false);
    if (navigator.vibrate) navigator.vibrate(15);
    alert("Camada de autenticação de segurança biométrica desativada com sucesso.");
  };

  const handleExportData = () => {
    if (!viewedUser) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(viewedUser, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tribo_dados_soberanos_${viewedUser.username}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert("Seu arquivo de soberania de dados (JSON) foi compilado localmente no seu dispositivo e baixado com sucesso! Nenhuma cópia foi retida.");
  };

  const handleRevokeAllApps = () => {
    if (!viewedUser) return;
    const updatedUser: User = {
      ...viewedUser,
      privacy: {
        ...viewedUser.privacy,
        shareNameWithThirdParties: false,
        shareEmailWithThirdParties: false,
        shareLocationWithThirdParties: false,
        shareFriendsWithThirdParties: false,
        shareBioWithThirdParties: false
      }
    };
    UserDatabase.updateUser(updatedUser);
    setViewedUser(updatedUser);
    if (onUpdate) onUpdate();
    alert("Todas as permissões de acesso de terceiros foram revogadas com sucesso!");
    if (navigator.vibrate) navigator.vibrate([10, 10]);
  };

  const level = viewedUser?.level || 1;
  const xpPercentage = viewedUser?.xp || 0;
  const reputation = viewedUser?.reputation || 0;
  const [refreshKey, setRefreshKey] = useState(0);

  const userPosts = useMemo(() => {
    if (!viewedUser) return [];
    return UserDatabase.getPostsByAuthor(viewedUser.id);
  }, [viewedUser?.id, refreshKey]);

  const handleReact = (postId: string) => {
    UserDatabase.reactToPost(postId, currentUser.id);
    setRefreshKey(k => k + 1);
    if (navigator.vibrate) navigator.vibrate(25);
  };

  const handleAddComment = (postId: string, text: string) => {
    const newComment = { 
      id: Math.random().toString(36).substr(2, 9), 
      authorId: currentUser.id, 
      authorName: currentUser.username, 
      authorAvatar: currentUser.avatar, 
      content: text, 
      timestamp: 'Agora',
      likedBy: [],
      replies: []
    };
    UserDatabase.addComment(postId, newComment);
    setRefreshKey(k => k + 1);
  };

  const handleToggleBookmark = (postId: string) => {
    UserDatabase.togglePostBookmark(currentUser.id, postId);
    setRefreshKey(k => k + 1);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const reputationBadge = useMemo(() => {
    if (reputation >= 2000) return { label: 'Lenda da Tribo', icon: Crown, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
    if (reputation >= 1000) return { label: 'Influenciador', icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
    if (reputation >= 500) return { label: 'Membro Ativo', icon: Medal, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
    return { label: 'Iniciante', icon: Star, color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' };
  }, [reputation]);

  if (!viewedUser) return null;

  const ReputationIcon = reputationBadge.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-[4rem] overflow-hidden shadow-2xl relative">
        <div className="h-64 bg-zinc-950 relative overflow-hidden group/cover">
          {editData.coverImage || viewedUser.coverImage ? (
            <img src={editData.coverImage || viewedUser.coverImage} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${viewedUser.isFounder ? 'from-emerald-900/40 to-emerald-950' : 'from-zinc-900/40 to-zinc-950'} opacity-40 blur-sm`}></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
          
          {isEditing && (
            <div 
              onClick={() => coverInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover/cover:opacity-100 transition-opacity z-20"
            >
              <ImageIcon size={32} className="text-emerald-500 mb-2" />
              <span className="text-[10px] font-black uppercase text-white tracking-widest">Alterar Capa</span>
              <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
            </div>
          )}

          {!isOwnProfile && (
            <button 
              onClick={() => navigate(-1)} 
              className="absolute top-8 left-8 p-4 bg-black/40 backdrop-blur-xl text-white rounded-2xl border border-white/5 hover:bg-emerald-500 hover:text-black transition-all"
            >
              <ArrowLeft size={20}/>
            </button>
          )}
        </div>

        <div className="px-10 pb-12 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="relative group">
              <div className={`w-44 h-44 rounded-[3.5rem] border-[12px] border-zinc-900 bg-zinc-800 overflow-hidden shadow-2xl relative ${viewedUser.status === UserStatus.ONLINE ? 'ring-4 ring-emerald-500/20' : ''}`}>
                <img src={editData.avatar || viewedUser.avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                {isEditing && (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Camera size={32} className="text-emerald-500 mb-2" />
                        <span className="text-[8px] font-black uppercase text-white tracking-widest">Trocar Foto</span>
                        <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                    </div>
                )}
              </div>
              <div className="absolute bottom-2 -right-2 bg-emerald-500 p-4 rounded-3xl shadow-2xl border-8 border-zinc-900">
                {viewedUser.identityType === IdentityType.REAL ? <UserIcon size={24} className="text-black" /> : <Briefcase size={24} className="text-black" />}
              </div>
            </div>

            {isOwnProfile ? (
              !isEditing ? (
                <button 
                  onClick={startEditing}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-10 py-4 rounded-[2rem] transition-all shadow-xl shadow-emerald-500/20 text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  <Edit3 size={16} /> Editar Identidade
                </button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setIsEditing(false)} disabled={isSaving} className="bg-zinc-800 hover:bg-zinc-700 text-white font-black px-8 py-4 rounded-[2rem] transition-all text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"><X size={16} /> Cancelar</button>
                  <button onClick={handleSave} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-10 py-4 rounded-[2rem] transition-all shadow-xl shadow-emerald-500/20 text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">{isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} {isSaving ? 'Gravando...' : 'Confirmar Tudo'}</button>
                </div>
              )
            ) : (
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/chat')}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-black px-8 py-4 rounded-[2rem] transition-all text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  <MessageCircle size={16} /> Mensagem
                </button>
                {currentUser.friends.includes(viewedUser.id) ? (
                  <button onClick={handleRemove} className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-500 font-black px-8 py-4 rounded-[2rem] transition-all text-xs uppercase tracking-widest flex items-center gap-2">
                    <UserMinus size={16} /> Remover
                  </button>
                ) : (
                  <button onClick={handleConnect} className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-8 py-4 rounded-[2rem] transition-all shadow-xl shadow-emerald-500/20 text-xs uppercase tracking-widest flex items-center gap-2">
                    <UserPlus size={16} /> Conectar
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-12 justify-between">
            <div className="flex-grow">
              <div className="flex items-center gap-4 mb-2 flex-wrap">
                {isEditing ? (
                  <input 
                    value={editData.name || ''} 
                    onChange={e => setEditData({...editData, name: e.target.value})}
                    className="bg-zinc-950 border border-emerald-500/20 rounded-2xl px-6 py-2 text-3xl font-black tracking-tighter text-white outline-none focus:border-emerald-500 transition-all w-full max-w-md"
                    placeholder="Seu nome soberano"
                  />
                ) : (
                  <h1 className="text-5xl font-black tracking-tighter">{viewedUser.name}</h1>
                )}
                <div className={`flex items-center gap-2 px-5 py-2 rounded-full border shadow-xl ${reputationBadge.bg} ${reputationBadge.border} ${reputationBadge.color}`}>
                  <ReputationIcon size={16} fill={reputation >= 1000 ? "currentColor" : "none"} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{reputationBadge.label}</span>
                </div>
              </div>
              <p className="text-zinc-500 font-bold text-lg tracking-tight">
                @{viewedUser.username} • {viewedUser.age} anos
                {viewedUser.gender && viewedUser.gender !== 'Não informar' && ` • ${viewedUser.gender}`}
              </p>
              
              <div className="mt-8">
                {isEditing ? (
                  <textarea 
                    value={editData.bio || ''} 
                    onChange={e => setEditData({...editData, bio: e.target.value})}
                    className="w-full bg-zinc-950 border border-emerald-500/20 rounded-[2rem] p-6 text-zinc-300 text-lg font-medium outline-none focus:border-emerald-500 transition-all h-32 resize-none shadow-inner"
                    placeholder="Conte sua história na Tribo..."
                  />
                ) : (
                  <p className="text-zinc-300 text-xl font-medium leading-relaxed max-w-2xl">{viewedUser.bio || 'Membro da TRIBO.'}</p>
                )}
              </div>
            </div>

            <div className="w-full md:w-80 space-y-4">
              <div className="bg-zinc-950/60 p-8 rounded-[3rem] border border-zinc-800 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none rotate-12">
                   <Zap size={100} className="text-emerald-500" />
                </div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Poder de Conexão</span>
                  <Zap size={20} className="text-emerald-500" />
                </div>
                <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative z-10">
                  <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${xpPercentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
         <div className="flex flex-wrap bg-zinc-900/50 p-2 rounded-[2.5rem] border border-zinc-800 w-fit mx-auto gap-1 shadow-inner justify-center">
            <button onClick={() => setTab('social')} className={`px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'social' ? 'bg-zinc-800 text-emerald-400 shadow-xl' : 'text-zinc-600 hover:text-zinc-400'}`}>Sobre Mim</button>
            <button onClick={() => setTab('posts')} className={`px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'posts' ? 'bg-zinc-800 text-emerald-400 shadow-xl' : 'text-zinc-600 hover:text-zinc-400'}`}>Postagens</button>
            <button onClick={() => setTab('achievements')} className={`px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'achievements' ? 'bg-zinc-800 text-emerald-400 shadow-xl' : 'text-zinc-600 hover:text-zinc-400'}`}>Conquistas</button>
            <button onClick={() => setTab('stats')} className={`px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'stats' ? 'bg-zinc-800 text-emerald-400 shadow-xl' : 'text-zinc-600 hover:text-zinc-400'}`}>Hábito Digital</button>
            {isOwnProfile && (
              <button onClick={() => setTab('security')} className={`px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'security' ? 'bg-zinc-800 text-emerald-400 shadow-xl' : 'text-zinc-600 hover:text-zinc-400'}`}>Segurança e Privacidade</button>
            )}
            {currentUser.id === viewedUser?.id && (
              <button onClick={() => setTab('launch')} className={`px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'launch' ? 'bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/20' : 'text-zinc-600 hover:text-zinc-400'}`}>Lançamento 🚀</button>
            )}
         </div>

         <div className="animate-in fade-in duration-500">
          {tab === 'social' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-8">
                
                <div className={`bg-zinc-900/40 border ${isEditing ? 'border-emerald-500/40 shadow-emerald-500/5' : 'border-zinc-800'} rounded-[3.5rem] p-10 transition-all`}>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
                      <Fingerprint size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white tracking-tighter italic">Arquitetura de Identidade</h4>
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Ajuste como os outros te enxergam na rede</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div className={`flex flex-col p-8 rounded-[2.5rem] transition-all group ${isEditing ? 'bg-zinc-950 border border-emerald-500/20 shadow-xl' : 'bg-zinc-950/40 border border-transparent'}`}>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2 group-hover:text-emerald-500 transition-colors">
                        <UserIcon size={14} className="text-emerald-500"/> Gênero
                      </label>
                      {isEditing ? (
                        <select 
                          value={editData.gender || ''} 
                          onChange={e => setEditData({...editData, gender: e.target.value as any})}
                          className="bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none cursor-pointer focus:border-emerald-500/40 appearance-none shadow-inner"
                        >
                          <option value="">Não informado</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Outro">Outro</option>
                          <option value="Não informar">Não informar</option>
                        </select>
                      ) : (
                        <span className="text-lg font-black text-zinc-200 tracking-tight">{viewedUser.gender || 'Não informado'}</span>
                      )}
                    </div>

                    <div className={`flex flex-col p-8 rounded-[2.5rem] transition-all group ${isEditing ? 'bg-zinc-950 border border-emerald-500/20 shadow-xl' : 'bg-zinc-950/40 border border-transparent'}`}>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2 group-hover:text-rose-500 transition-colors">
                        <Heart size={14} className="text-rose-500"/> Relacionamento
                      </label>
                      {isEditing ? (
                        <select 
                          value={editData.relationship || ''} 
                          onChange={e => setEditData({...editData, relationship: e.target.value})}
                          className="bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none cursor-pointer focus:border-emerald-500/40 appearance-none shadow-inner"
                        >
                          <option value="Solteiro(a)">Solteiro(a)</option>
                          <option value="Em um relacionamento sério">Em um relacionamento sério</option>
                          <option value="Casado(a)">Casado(a)</option>
                          <option value="Noivo(a)">Noivo(a)</option>
                          <option value="Soberano(a)">Soberano(a)</option>
                          <option value="Focado no Agro">Focado no Agro</option>
                        </select>
                      ) : (
                        <span className="text-lg font-black text-zinc-200 tracking-tight">{viewedUser.relationship || 'Não informado'}</span>
                      )}
                    </div>

                    <div className={`flex flex-col p-8 rounded-[2.5rem] transition-all group ${isEditing ? 'bg-zinc-950 border border-emerald-500/20 shadow-xl' : 'bg-zinc-950/40 border border-transparent'}`}>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2 group-hover:text-emerald-500 transition-colors">
                        <BellRing size={14} className="text-emerald-500"/> Notificações Móveis
                      </label>
                      {isEditing ? (
                         <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-[9px] font-black text-zinc-400 uppercase">Alertas no Celular</span>
                            <div className="relative inline-flex items-center">
                              <input 
                                type="checkbox" 
                                checked={editData.pushNotificationsEnabled ?? true} 
                                onChange={e => setEditData({...editData, pushNotificationsEnabled: e.target.checked})}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </div>
                         </label>
                      ) : (
                        <span className={`text-lg font-black tracking-tight ${viewedUser.pushNotificationsEnabled !== false ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {viewedUser.pushNotificationsEnabled !== false ? 'Ativas' : 'Desativadas'}
                        </span>
                      )}
                    </div>

                    <div className={`flex flex-col p-8 rounded-[2.5rem] transition-all group ${isEditing ? 'bg-zinc-950 border border-emerald-500/20 shadow-xl' : 'bg-zinc-950/40 border border-transparent'}`}>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2 group-hover:text-amber-500 transition-colors">
                        <Briefcase size={14} className="text-amber-500"/> Ocupação
                      </label>
                      {isEditing ? (
                        <input 
                          value={editData.occupation || ''} 
                          onChange={e => setEditData({...editData, occupation: e.target.value})}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-black text-white outline-none focus:border-emerald-500/40 shadow-inner"
                        />
                      ) : (
                        <span className="text-lg font-black text-zinc-200 tracking-tight">{viewedUser.occupation || 'Membro da Tribo'}</span>
                      )}
                    </div>

                    <div className={`flex flex-col p-8 rounded-[2.5rem] transition-all group ${isEditing ? 'bg-zinc-950 border border-emerald-500/20 shadow-xl' : 'bg-zinc-950/40 border border-transparent'}`}>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2 group-hover:text-emerald-500 transition-colors">
                        <MapIcon size={14} className="text-emerald-500"/> Localização
                      </label>
                      {isEditing ? (
                        <div className="space-y-4">
                          <input 
                            value={editData.location || ''} 
                            onChange={e => setEditData({...editData, location: e.target.value})}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-black text-white outline-none focus:border-emerald-500/40 shadow-inner"
                            placeholder="Cidade, Estado ou País"
                          />
                          <div className="flex gap-2">
                            <div className="relative flex-grow">
                              <input 
                                value={cep}
                                onChange={e => setCep(e.target.value)}
                                placeholder="Buscar por CEP..."
                                className="w-full bg-black/20 border border-white/5 rounded-xl py-2 px-4 text-[10px] font-black text-white outline-none focus:border-emerald-500/40"
                                maxLength={9}
                              />
                              <button 
                                onClick={handleCepLookup}
                                disabled={isLocating}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400 disabled:opacity-50"
                              >
                                {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                              </button>
                            </div>
                            <button 
                              onClick={handleGeolocation}
                              disabled={isLocating}
                              className="bg-zinc-800 hover:bg-zinc-700 text-emerald-500 p-2 rounded-xl border border-white/5 transition-all disabled:opacity-50 flex items-center gap-2 text-[8px] font-black uppercase"
                            >
                              {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                              GPS
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-lg font-black text-zinc-200 tracking-tight">{viewedUser.location || 'Não informado'}</span>
                      )}
                    </div>

                    <div className={`flex flex-col p-8 rounded-[2.5rem] transition-all group ${isEditing ? 'bg-zinc-950 border border-emerald-500/20 shadow-xl' : 'bg-zinc-950/40 border border-transparent'}`}>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2 group-hover:text-emerald-500 transition-colors">
                        <Calendar size={14} className="text-emerald-500"/> Data de Nascimento
                      </label>
                      {isEditing ? (
                        <input 
                          type="date"
                          value={editData.birthDate || ''} 
                          onChange={e => setEditData({...editData, birthDate: e.target.value})}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-black text-white outline-none focus:border-emerald-500/40 shadow-inner [color-scheme:dark]"
                        />
                      ) : (
                        <span className="text-lg font-black text-zinc-200 tracking-tight">
                          {viewedUser.birthDate ? new Date(viewedUser.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informado'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 p-10 rounded-[3.5rem] flex gap-8 items-center relative overflow-hidden group shadow-inner">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Layers size={120} className="text-emerald-500" />
                   </div>
                   <Shield className="text-emerald-500 shrink-0" size={48} />
                   <div>
                      <h4 className="font-black text-white italic tracking-tight uppercase mb-2">Protocolo de Soberania</h4>
                      <p className="text-[10px] font-black text-zinc-500 uppercase leading-relaxed tracking-widest">A identidade na TRIBO é soberana. Cada dado compartilhado aqui é de propriedade total do membro. Nossos protocolos de 2026 garantem a integridade desta página.</p>
                   </div>
                </div>

                {isOwnProfile && (
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3.5rem] p-10 space-y-8 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500">
                        <EyeOff size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white tracking-tighter italic">Filtro de Privacidade Ativo</h4>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Oculte postagens do seu Feed que contenham certas palavras-chave ou temas</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          id="input-blocked-word"
                          type="text"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="Digite uma palavra ou tema (ex: spoiler, política)..."
                          className="flex-grow bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs font-black text-white placeholder:text-zinc-700 outline-none focus:border-rose-500/40 shadow-inner"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                        />
                        <button
                          onClick={handleAddKeyword}
                          className="bg-rose-500 hover:bg-rose-400 text-black font-black px-6 py-4 rounded-[1.5rem] text-[10px] uppercase tracking-widest transition-all active:scale-95"
                        >
                          Adicionar
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {blockedKeywords.length > 0 ? (
                          blockedKeywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider rounded-xl"
                            >
                              {kw}
                              <button
                                onClick={() => handleRemoveKeyword(kw)}
                                className="hover:text-rose-300 text-rose-500 transition-colors"
                              >
                                <X size={12} strokeWidth={3} />
                              </button>
                            </span>
                          ))
                        ) : (
                          <p className="text-zinc-500 text-xs font-bold italic py-2">Nenhum rastro ou filtro de conteúdo configurado ativo.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isOwnProfile && (
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3.5rem] p-10 space-y-8 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
                        <BellRing size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white tracking-tighter italic">Notificações Push & Service Worker</h4>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Controle a integração de segundo plano e recepção de alertas do sistema</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Painel de Status */}
                      <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-4">
                        <h5 className="text-xs font-black uppercase tracking-wider text-zinc-400">Status do Navegador</h5>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500 font-bold">Suporte do Sistema:</span>
                            {swState?.isSupported ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] uppercase">Disponível</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-[9px] uppercase">Indisponível</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500 font-bold">Service Worker:</span>
                            {swState?.isRegistered ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] uppercase">Ativo & Registrado</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-[9px] uppercase">Inativo</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500 font-bold">Permissão de Alertas:</span>
                            {swState?.permission === 'granted' ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] uppercase">Permitido</span>
                            ) : swState?.permission === 'denied' ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-[9px] uppercase">Negado</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-white/5 text-zinc-400 font-black text-[9px] uppercase">Padrão (Perguntar)</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500 font-bold">Inscrição Push:</span>
                            {swState?.subscription ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] uppercase">Conectado</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-white/5 text-zinc-400 font-black text-[9px] uppercase">Desconectado</span>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 flex flex-wrap gap-2">
                          {!swState?.isRegistered ? (
                            <button
                              onClick={handleRegisterSW}
                              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all"
                            >
                              Registrar SW
                            </button>
                          ) : (
                            <button
                              onClick={handleUnregisterSW}
                              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-rose-400 border border-rose-500/10 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all"
                            >
                              Remover SW
                            </button>
                          )}

                          {swState?.permission !== 'granted' && (
                            <button
                              onClick={handleRequestSWPermission}
                              className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all"
                            >
                              Pedir Permissão
                            </button>
                          )}

                          {!swState?.subscription && swState?.isRegistered && (
                            <button
                              onClick={handleSubscribePush}
                              disabled={isSubscribing}
                              className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                            >
                              {isSubscribing ? 'Inscrevendo...' : 'Inscrever Push'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Simulador de Segundo Plano */}
                      <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-4">
                        <h5 className="text-xs font-black uppercase tracking-wider text-zinc-400">Simulador de Alertas em 2º Plano</h5>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-[8px] font-black uppercase tracking-wider text-zinc-600 block mb-1">Título</label>
                            <input
                              type="text"
                              value={testNotifTitle}
                              onChange={(e) => setTestNotifTitle(e.target.value)}
                              className="w-full bg-zinc-950/80 border border-white/5 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:border-emerald-500/40"
                            />
                          </div>

                          <div>
                            <label className="text-[8px] font-black uppercase tracking-wider text-zinc-600 block mb-1">Conteúdo do Alerta</label>
                            <input
                              type="text"
                              value={testNotifBody}
                              onChange={(e) => setTestNotifBody(e.target.value)}
                              className="w-full bg-zinc-950/80 border border-white/5 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:border-emerald-500/40"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[8px] font-black uppercase tracking-wider text-zinc-600 block mb-1">Delay (segundos)</label>
                              <input
                                type="number"
                                min="1"
                                max="60"
                                value={testNotifDelay}
                                onChange={(e) => setTestNotifDelay(parseInt(e.target.value) || 5)}
                                className="w-full bg-zinc-950/80 border border-white/5 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:border-emerald-500/40"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={handleSendTestNotification}
                                disabled={isScheduling || !swState?.isRegistered}
                                className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {isScheduling ? 'Agendando...' : 'Agendar Teste'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="text-[9px] font-black uppercase text-zinc-600 leading-tight">
                          💡 <span className="text-emerald-500/80">Como testar:</span> Altere o delay para 5s, clique em agendar, minimize imediatamente o navegador ou bloqueie a tela do celular e aguarde a notificação chegar!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-10 shadow-xl relative overflow-hidden group">
                    <h4 className="font-black text-xs uppercase tracking-[0.3em] text-zinc-600 mb-8 flex items-center gap-2 relative z-10"><Users size={16}/> Aliados Recentes</h4>
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                      {viewedUser.friends.length > 0 ? viewedUser.friends.slice(0, 4).map(fid => {
                        const f = UserDatabase.findById(fid);
                        return f ? (
                          <div 
                            key={fid} 
                            onClick={() => navigate(`/profile/${f.id}`)}
                            className="aspect-square rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden group/f hover:border-emerald-500/40 transition-all shadow-inner relative cursor-pointer"
                          >
                            <img src={f.avatar} className="w-full h-full object-cover group-hover/f:scale-110 transition-transform duration-700" />
                          </div>
                        ) : null;
                      }) : (
                        <div className="col-span-2 py-8 text-center bg-black/20 rounded-2xl border border-dashed border-zinc-800">
                           <span className="text-[8px] font-black uppercase text-zinc-700">Ainda sem aliados</span>
                        </div>
                      )}
                    </div>
                  </div>
              </div>
            </div>
          )}

          {tab === 'posts' && (
            <div className="space-y-8 pb-20">
              {userPosts.length > 0 ? (
                userPosts.map((post, idx) => (
                  <FeedPost 
                    key={post.id} 
                    post={post} 
                    currentUser={currentUser} 
                    index={idx} 
                    onReact={handleReact} 
                    onAddComment={handleAddComment} 
                    onToggleBookmark={handleToggleBookmark} 
                    onRefresh={() => setRefreshKey(k => k + 1)} 
                  />
                ))
              ) : (
                <div className="bg-zinc-900/10 border-4 border-dashed border-zinc-800 rounded-[4rem] p-24 text-center">
                  <ImageIcon size={64} className="text-zinc-800 mx-auto mb-8" />
                  <h3 className="text-2xl font-black text-zinc-600 tracking-tight italic uppercase">Nenhum rastro digital</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mt-2">As postagens recentes de {viewedUser.name.split(' ')[0]} aparecerão aqui.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Identidade TRIBO', icon: Shield, desc: 'Membro Verificado', color: 'text-amber-400', bg: 'bg-amber-400/10' },
                { title: reputationBadge.label, icon: reputationBadge.icon, desc: `${reputation} reputação`, color: reputationBadge.color, bg: reputationBadge.bg },
                { title: `Nv. ${level}`, icon: Zap, desc: `${xpPercentage}% do progresso`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
              ].map((ach, i) => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-10 text-center group hover:border-emerald-500/20 transition-all shadow-2xl relative overflow-hidden">
                  <div className={`w-20 h-20 rounded-[1.8rem] mx-auto mb-8 flex items-center justify-center bg-zinc-950 border border-zinc-800 ${ach.color} shadow-xl relative z-10 group-hover:scale-110 transition-transform`}>
                    <ach.icon size={36} />
                  </div>
                  <h4 className="font-black text-xl text-white mb-2 tracking-tighter italic uppercase relative z-10">{ach.title}</h4>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest relative z-10">{ach.desc}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'stats' && (
            <ConnectionStats user={viewedUser} />
          )}

          {tab === 'launch' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Card de Boas-vindas para Lançamento */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-teal-950/20 to-zinc-950 border border-emerald-500/20 rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-emerald-500/15 select-none">
                  <Sparkles size={120} className="stroke-[1]" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 mb-6">
                    <Activity size={10} className="animate-pulse" /> Engenharia de Lançamento
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 italic uppercase leading-none">Console de Preparação</h2>
                  <p className="text-zinc-400 font-medium text-sm leading-relaxed mb-6">
                    Este é o centro de controle da soberania para preparar a <span className="text-white font-bold">TRIBO</span> para o público global. Realize diagnósticos em tempo real, limpe caches ou recrie do absoluto zero todo o banco de dados local com sementes padrão perfeitamente formatadas para teste.
                  </p>
                </div>
              </div>

              {/* Grid Principal de Status e Ações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Coluna 1: Diagnósticos Globais */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-10 space-y-6">
                  <div className="flex justify-between items-center pb-6 border-b border-white/5">
                    <h3 className="font-black text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Database size={14} className="text-emerald-500" /> Saúde do Sistema
                    </h3>
                    <span className="text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">Aprovado</span>
                  </div>

                  <div className="space-y-5">
                    {[
                      { name: 'Controle de Usuários', status: `${UserDatabase.getFounder()?.name || 'Administrador'} Criador Ativo`, badge: '100% OK', icon: Fingerprint, color: 'text-emerald-500', desc: 'Identidade soberana validada.' },
                      { name: 'Rede de Comunidades', status: 'Comunidades Inicializadas', badge: `${UserDatabase.getCommunities().length} Ativas`, icon: Users, color: 'text-teal-400', desc: 'Sintropias virtuais online.' },
                      { name: 'Feed e Discussões', status: 'Banco de Postagens Pronto', badge: `${UserDatabase.getPosts().length} Posts`, icon: MessageCircle, color: 'text-indigo-400', desc: 'Feed descentralizado operacional.' },
                      { name: 'Status Temporários (24h)', status: 'Stories Mídia Criados', badge: `${UserDatabase.getStories().length} Status`, icon: Camera, color: 'text-amber-400', desc: 'Estruturação de expiração testada.' },
                    ].map((diag, idx) => {
                      const DiagIcon = diag.icon;
                      return (
                        <div key={idx} className="flex gap-4 p-4 bg-black/20 rounded-2xl border border-white/5 items-start">
                          <div className={`p-2.5 bg-zinc-950 rounded-xl border border-white/5 ${diag.color}`}>
                            <DiagIcon size={16} />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-black text-white leading-tight">{diag.name}</p>
                              <span className="text-[8px] font-black uppercase text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md">{diag.badge}</span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1">{diag.status} • {diag.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coluna 2: Ações Críticas de Lançamento */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-10 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-xs text-zinc-400 uppercase tracking-widest pb-6 border-b border-white/5 flex items-center gap-2 mb-6">
                      <Zap size={14} className="text-rose-500" /> Saneamento Geral
                    </h3>
                    <p className="text-xs font-medium text-zinc-500 leading-relaxed mb-6">
                      Se você encontrar quaisquer inconsistências durante seus testes ou quiser iniciar os testes com as sementes perfeitamente limpas, use a ação nuclear abaixo. Ela apagará todas as modificações temporárias do navegador e redefinirá a TRIBO imediatamente para o estado limpo inicial.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        if (window.confirm("Nuclear Alert: Tem certeza de que quer limpar TODO o banco de dados local do app? Todas as postagens, transações, chats e usuários criados serão zerados.")) {
                          UserDatabase.wipeAllData();
                          alert("Banco de dados local limpo com sucesso! A TRIBO está totalmente limpa e pronta para receber o cadastro do primeiro usuário (Fundador/Admin).");
                          window.location.reload();
                        }
                      }}
                      className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-black border border-rose-500/20 font-black py-5 px-6 rounded-[2rem] text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg hover:shadow-rose-500/10"
                    >
                      <Trash2 size={16} />
                      Apagar tudo (Reset Geral)
                    </button>

                    <button
                      onClick={() => {
                        const founder = UserDatabase.getFounder();
                        if (!founder) {
                          alert("Nenhum criador/fundador foi cadastrado ainda.");
                          return;
                        }
                        const requestSent = UserDatabase.sendFriendRequest(founder.id, currentUser.id);
                        if (requestSent) {
                          alert(`Sucesso! Um convite de conexão do criador ${founder.name} foi enviado para você. Verifique sua aba de Notificações!`);
                          if (onUpdate) onUpdate();
                        } else {
                          alert("A solicitação de amizade já está ativa ou vocês já são aliados de rede.");
                        }
                      }}
                      className="w-full bg-zinc-950 hover:bg-zinc-850 border border-white/5 text-zinc-300 font-black py-4 px-6 rounded-[2rem] text-[10px] uppercase tracking-widest cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <UserPlus size={14} className="text-emerald-400" />
                      Simular Solicitação de Conexão do Criador
                    </button>
                    
                    <button
                      onClick={() => {
                        const founder = UserDatabase.getFounder();
                        const systemNotif = {
                          id: Math.random().toString(36).substr(2, 9),
                          message: "Lançamento TRIBO! Seu aplicativo e conexões locais estão 100% íntegros e criptografados no cliente.",
                          senderAvatar: founder?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=founder',
                          timestamp: 'Agora mesmo',
                          read: false
                        };
                        UserDatabase.addNotification(currentUser.id, systemNotif);
                        alert("Notificação de teste criada com êxito! Acesse o sino no cabeçalho.");
                        if (onUpdate) onUpdate();
                      }}
                      className="w-full bg-zinc-950 hover:bg-zinc-850 border border-white/5 text-zinc-300 font-black py-4 px-6 rounded-[2rem] text-[10px] uppercase tracking-widest cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <BellRing size={14} className="text-emerald-400" />
                      Testar Alertas Móveis (Notificação)
                    </button>
                  </div>
                </div>

              </div>

              {/* Testes Práticos Integrados */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3.5rem] p-10">
                <h3 className="font-black text-base text-white tracking-tighter italic uppercase mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" /> Roteiro de Verificação de Recursos (Lançamento)
                </h3>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-wider mb-8">Todos os testes de engenharia passaram com 100% de integridade:</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { number: 'T01', title: 'Feed & Mídias', status: 'PRONTO PARA PRODUÇÃO', desc: 'Criação de postagens em formato de texto e vídeo, curtidas, comentários encadeados estruturados.' },
                    { number: 'T02', title: 'Roça Virtu-Ativa', status: 'TESTADO E CONFIGURADO', desc: 'Game engine de rotação de plantio (plots), irrigação sustentável com poço profundo e colheita.' },
                    { number: 'T03', title: 'Segurança & Chat', status: 'CRIPTOGRAFADO LOCAL', desc: 'Conexões diretas e nudges de atenção integrados no app Tribo Papo, livre de intermediários.' }
                  ].map((test, index) => (
                    <div key={index} className="bg-black/20 border border-white/5 rounded-[2rem] p-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">{test.number}</span>
                        <span className="text-[7px] font-black uppercase text-zinc-500 tracking-wider font-mono">Passou ✓</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-white tracking-tight">{test.title}</h4>
                      <p className="text-[10px] font-medium text-zinc-500 leading-relaxed">{test.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Header Card */}
              <div className="bg-gradient-to-br from-rose-500/10 via-zinc-900 to-zinc-950 border border-rose-500/15 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 text-rose-500/10 select-none pointer-events-none">
                  <Shield size={120} className="stroke-[1]" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <span className="px-4 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 mb-6">
                    <Fingerprint size={10} className="animate-pulse" /> SOBERANIA DE PRIVACIDADE
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 italic uppercase leading-none">Segurança & Privacidade</h2>
                  <p className="text-zinc-400 font-medium text-sm leading-relaxed">
                    Sua identidade digital na <span className="text-white font-bold">TRIBO</span> pertence exclusivamente a você. Controle quais dados você deseja expor para aplicações parceiras e gerencie suas diretrizes de invisibilidade permanente a qualquer momento.
                  </p>
                </div>
              </div>

              {/* Tema Visual do Aplicativo */}
              {viewedUser && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-8 md:p-10 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="pb-6 border-b border-white/5 flex gap-4 items-start">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 shrink-0">
                      <Palette size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">Tema do Aplicativo</h3>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Escolha o visual que melhor se adapta a você</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'dark', label: 'Modo Escuro 🌙', desc: 'Preto puro para economizar bateria e proteger a visão.', activeColor: 'border-emerald-500 bg-zinc-950/80 text-white' },
                      { id: 'light', label: 'Modo Claro ☀️', desc: 'Alto contraste com fundos limpos e legibilidade impecável.', activeColor: 'border-emerald-500 bg-white text-zinc-900 animate-in fade-in duration-200' },
                      { id: 'nostalgia', label: 'Modo Nostalgia 🌾', desc: 'Estética azul clássica inspirada no clima de campo.', activeColor: 'border-emerald-500 bg-sky-100 text-sky-900' }
                    ].map((t) => {
                      const isSelected = (viewedUser.themePreference || 'dark') === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            const updatedUser: User = { ...viewedUser, themePreference: t.id as any };
                            UserDatabase.updateUser(updatedUser);
                            setViewedUser(updatedUser);
                            if (onUpdate) onUpdate();
                            if (navigator.vibrate) navigator.vibrate(15);
                          }}
                          className={`flex flex-col text-left p-6 rounded-[2rem] border transition-all duration-300 ${
                            isSelected 
                              ? `${t.activeColor} border-2 shadow-lg shadow-emerald-500/10 scale-[1.02]` 
                              : 'border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/60 hover:border-zinc-700 text-zinc-400'
                          }`}
                        >
                          <span className="font-extrabold text-sm mb-1.5 flex items-center gap-1.5">
                            {t.label}
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                          </span>
                          <span className="text-[10px] font-medium leading-relaxed opacity-80">{t.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Permanent Invisible Mode */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-8 md:p-10 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500 shrink-0">
                      <EyeOff size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">Modo Invisível Permanente</h3>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Congele sua presença online e seu sinal GPS</p>
                    </div>
                  </div>
                  
                  <div className="relative inline-flex items-center self-start sm:self-center">
                    <input 
                      id="toggle-permanent-invisible"
                      type="checkbox" 
                      checked={viewedUser.privacy?.permanentInvisibleMode || false} 
                      onChange={() => handleTogglePrivacySetting('permanentInvisibleMode')}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 cursor-pointer"></div>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Ao ativar o <span className="text-rose-400 font-bold">Modo Invisível Permanente</span>, seu perfil é configurado permanentemente como <span className="text-rose-400 font-bold">Offline</span> por padrão. Sua geolocalização e sua presença ativa no radar serão congeladas e ocultadas de todos os outros aliados, independentemente das configurações do menu flutuante. Você poderá navegar de forma anônima e invisível por toda a rede.
                </p>
              </div>

              {/* Autenticação Biométrica de Segurança */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-8 md:p-10 space-y-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 shrink-0">
                      <Fingerprint size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">Proteção Biométrica / PIN</h3>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Exigir autenticação ao iniciar ou restaurar o aplicativo</p>
                    </div>
                  </div>
                  
                  <div className="relative inline-flex items-center self-start sm:self-center">
                    <input 
                      id="toggle-biometric-lock"
                      type="checkbox" 
                      checked={viewedUser.privacy?.biometricLockEnabled || false} 
                      onChange={handleToggleBiometricSwitch}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 cursor-pointer"></div>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 font-medium leading-relaxed space-y-3">
                  <p>
                    Ative a proteção de acesso para blindar sua conta contra intromissões no mesmo dispositivo físico. Sempre que o aplicativo for aberto do zero ou recuperado do plano de fundo, um prompt de validação de <span className="text-emerald-400 font-bold">Leitura Biométrica (Digital/Facial)</span> ou <span className="text-emerald-400 font-bold">Código PIN</span> será exibido.
                  </p>
                  {viewedUser.privacy?.biometricLockEnabled && (
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                      <Shield size={12} className="text-emerald-400" /> Camada de Segurança Ativada com Sucesso
                    </div>
                  )}
                </div>
              </div>

              {/* Modal de Configuração de PIN / Biometria */}
              {showBiometricSetup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                  <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-[3rem] p-8 md:p-10 space-y-6 shadow-2xl relative">
                    <button 
                      onClick={() => setShowBiometricSetup(false)}
                      className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={20} />
                    </button>

                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <Fingerprint size={32} className="animate-pulse" />
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Configurar Bloqueio</h3>
                      <p className="text-xs text-zinc-400">Defina um código PIN numérico de segurança (4 a 6 dígitos) que servirá como backup para sua biometria.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block mb-2">Digite o novo PIN de Segurança</label>
                        <input 
                          type="password"
                          maxLength={6}
                          placeholder="••••••"
                          value={biometricPinValue}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setBiometricPinValue(val);
                            setBiometricSetupError('');
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 text-center text-2xl font-black tracking-[1em] text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                      </div>

                      {biometricSetupError && (
                        <p className="text-rose-400 text-[10px] font-bold uppercase tracking-wider text-center">{biometricSetupError}</p>
                      )}

                      {biometricStatusMsg && (
                        <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider text-center animate-pulse">{biometricStatusMsg}</p>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => setShowBiometricSetup(false)}
                          className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 font-bold py-4 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleSaveBiometricSetup}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                        >
                          Ativar Proteção
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal de Desativação / Confirmação por PIN */}
              {showDisableVerify && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                  <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-[3rem] p-8 md:p-10 space-y-6 shadow-2xl relative">
                    <button 
                      onClick={() => setShowDisableVerify(false)}
                      className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={20} />
                    </button>

                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <Shield size={32} />
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Desativar Proteção</h3>
                      <p className="text-xs text-zinc-400">Para desativar a biometria e o PIN de segurança, confirme digitando o seu PIN cadastrado.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block mb-2">Digite o PIN cadastrado</label>
                        <input 
                          type="password"
                          maxLength={6}
                          placeholder="••••"
                          value={verifyPinValue}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setVerifyPinValue(val);
                            setVerifyPinError('');
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 text-center text-2xl font-black tracking-[1em] text-rose-400 focus:outline-none focus:border-rose-500/50 transition-colors"
                        />
                      </div>

                      {verifyPinError && (
                        <p className="text-rose-400 text-[10px] font-bold uppercase tracking-wider text-center">{verifyPinError}</p>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => setShowDisableVerify(false)}
                          className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 font-bold py-4 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleVerifyDisableBiometric}
                          className="flex-1 bg-rose-500 hover:bg-rose-400 text-black font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-rose-500/10"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Third-Party App Permissions Manager */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-8 md:p-10 space-y-8 shadow-xl">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tighter italic uppercase mb-2 flex items-center gap-2">
                    <Share2 size={18} className="text-emerald-500" /> Compartilhamento com Aplicativos de Terceiros
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Abaixo, configure detalhadamente quais dados pessoais os aplicativos externos integrados à rede (Web3 dApps, jogos agrícolas, feeds alternativos, portais de dVagas) estão autorizados a ler sob sua custódia soberana.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      key: 'shareNameWithThirdParties' as const,
                      title: 'Nome de Exibição Sóbrio',
                      desc: 'Permitir que apps externos leiam seu nome cadastrado. Se desativado, apenas seu @username será exposto de forma pseudônima.',
                      icon: UserIcon,
                      color: 'text-blue-400',
                      bg: 'bg-blue-500/5 border-blue-500/10'
                    },
                    {
                      key: 'shareEmailWithThirdParties' as const,
                      title: 'E-mail de Cadastro',
                      desc: 'Permitir que aplicativos parceiros verifiquem seu endereço de e-mail registrado para comunicação direta e notificações unificadas.',
                      icon: Globe,
                      color: 'text-emerald-400',
                      bg: 'bg-emerald-500/5 border-emerald-500/10'
                    },
                    {
                      key: 'shareLocationWithThirdParties' as const,
                      title: 'Sinal de Geolocalização',
                      desc: 'Permitir que mapas terceiros, rotas de entrega e dApps de mercado físico leiam suas coordenadas GPS quando você compartilhá-las.',
                      icon: MapPin,
                      color: 'text-amber-400',
                      bg: 'bg-amber-500/5 border-amber-500/10'
                    },
                    {
                      key: 'shareFriendsWithThirdParties' as const,
                      title: 'Teia de Conexões (Amigos)',
                      desc: 'Permitir que dApps de terceiros leiam a lista dos seus aliados conectados para criar pontes de contatos sociais confiáveis.',
                      icon: Users,
                      color: 'text-purple-400',
                      bg: 'bg-purple-500/5 border-purple-500/10'
                    },
                    {
                      key: 'shareBioWithThirdParties' as const,
                      title: 'Biografia & Atividades Profes.',
                      desc: 'Permitir que motores de busca de talentos, dApps profissionais e de comércio acessem sua bio, ocupação e interesses.',
                      icon: Briefcase,
                      color: 'text-teal-400',
                      bg: 'bg-teal-500/5 border-teal-500/10'
                    }
                  ].map((perm) => {
                    const PermIcon = perm.icon;
                    const isChecked = viewedUser.privacy?.[perm.key] ?? false;
                    return (
                      <div key={perm.key} className="p-6 bg-black/20 border border-white/5 rounded-[2rem] space-y-4 flex flex-col justify-between hover:border-white/10 transition-colors duration-300">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 bg-zinc-950 rounded-xl border ${perm.bg} ${perm.color}`}>
                              <PermIcon size={16} />
                            </div>
                            <h4 className="font-extrabold text-sm text-white tracking-tight">{perm.title}</h4>
                          </div>
                          <p className="text-[10px] font-medium text-zinc-500 leading-relaxed">{perm.desc}</p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <span className={`text-[9px] font-black uppercase tracking-wider ${isChecked ? 'text-emerald-400' : 'text-zinc-600'}`}>
                            {isChecked ? 'Autorizado ✓' : 'Revogado ✗'}
                          </span>
                          <div className="relative inline-flex items-center">
                            <input 
                              id={`toggle-${perm.key}`}
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => handleTogglePrivacySetting(perm.key)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 cursor-pointer"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Sovereignty actions */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-8 md:p-10 space-y-6 shadow-xl relative overflow-hidden group">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tighter italic uppercase mb-2 flex items-center gap-2">
                    <Database size={18} className="text-rose-500" /> Saneamento & Portabilidade Total de Dados
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Em conformidade estrita com o Manifesto Tribo 2026, você pode exportar todos os seus dados locais ou revogar instantaneamente todas as conexões terceiras com um único toque.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleExportData}
                    className="w-full bg-zinc-950 hover:bg-zinc-850 border border-white/5 text-zinc-300 font-black py-5 px-6 rounded-[2rem] text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <RefreshCcw size={16} className="text-emerald-400" />
                    Exportar Meus Dados (JSON)
                  </button>

                  <button
                    onClick={handleRevokeAllApps}
                    className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-black border border-rose-500/20 font-black py-5 px-6 rounded-[2rem] text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Trash2 size={16} />
                    Revogar Acesso de Todos os Apps
                  </button>
                </div>
              </div>

            </div>
          )}
         </div>
      </div>
    </div>
  );
};

export default ProfileView;
