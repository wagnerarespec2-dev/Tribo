
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Post, IdentityType, Story, Comment, User, Community, SharedLocation } from '../types';
import { 
  X, 
  Loader2, 
  Send, 
  MessageCircle, 
  Plus, 
  Compass, 
  ChevronRight, 
  Flame,
  ChevronLeft,
  ShieldCheck,
  Heart,
  Image as ImageIcon,
  MoreHorizontal,
  Bookmark,
  Video as VideoIcon,
  Camera,
  Flag,
  Share2,
  Reply,
  MapPin,
  UserPlus,
  Radio,
  Sparkles,
  Check,
  Navigation,
  Globe
} from 'lucide-react';
import { UserDatabase } from '../services/db';
import { SyncClient } from '../services/syncClient';

import { StoriesBar } from '../src/components/StoriesBar';
import { FeedPost } from '../src/components/FeedPost';
import { VideoRecorder } from '../src/components/VideoRecorder';
import { CameraCapture } from '../src/components/CameraCapture';

const playSubtleSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(550, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
};

const FeedView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [mode, setMode] = useState<'global' | 'tribo'>('global');
  const [newPostText, setNewPostText] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => { setPosts(UserDatabase.getFeed(currentUser.id, mode)); }, [mode, currentUser.id, refreshKey]);

  useEffect(() => {
    const unsubscribe = SyncClient.addUpdateCallback(() => {
      setRefreshKey(k => k + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const allComms = UserDatabase.getCommunities();
    setUserCommunities(allComms.filter(c => c.members.includes(currentUser.id)));
  }, [currentUser.id]);

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { alert("Vídeo muito grande. Máximo 15MB."); return; }
      const base64 = await UserDatabase.uploadFile(file);
      setSelectedVideo(base64);
      setSelectedImage(null);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { alert("Imagem muito grande. Máximo 10MB."); return; }
      const base64 = await UserDatabase.uploadFile(file);
      setSelectedImage(base64);
      setSelectedVideo(null);
    }
  };

  const handlePost = async () => {
    if (!newPostText.trim() && !selectedVideo && !selectedImage) return;
    setIsPosting(true);
    const selectedComm = userCommunities.find(c => c.id === selectedCommunityId);
    const postType = selectedVideo ? 'video' : selectedImage ? 'image' : 'text';
    const postContent = selectedVideo || selectedImage || newPostText;

    const post: Post = { 
      id: Math.random().toString(36).substr(2, 9), 
      authorId: currentUser.id, 
      authorName: currentUser.name, 
      authorAvatar: currentUser.avatar, 
      authorIdentity: currentUser.identityType, 
      type: postType, 
      content: postContent, 
      timestamp: 'Agora', 
      likes: 0, 
      likedBy: [], 
      lovedBy: [], 
      comments: [],
      communityId: selectedCommunityId || undefined,
      communityName: selectedComm?.name || undefined
    };
    await new Promise(r => setTimeout(r, 800));
    UserDatabase.savePost(post);
    setNewPostText(''); setSelectedVideo(null); setSelectedImage(null); setSelectedCommunityId(null); setIsPosting(false); setRefreshKey(k => k + 1); playSubtleSound();
  };

  const handleReact = (postId: string) => {
    UserDatabase.reactToPost(postId, currentUser.id);
    setRefreshKey(k => k + 1);
    playSubtleSound();
    if (navigator.vibrate) navigator.vibrate(25);
  };

  const handleAddComment = (postId: string, text: string) => {
    const newComment: Comment = { 
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

  // Algorithm for Geolocation-based Friend Recommendations
  const [sharingGPS, setSharingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const mySharedLocation = useMemo(() => {
    const allShared = UserDatabase.getSharedLocations();
    return allShared.find(l => l.userId === currentUser.id);
  }, [currentUser.id, refreshKey]);

  const localSuggestions = useMemo(() => {
    const allUsers = UserDatabase.getUsers();
    const myFriendsSet = new Set(currentUser.friends);
    const allShared = UserDatabase.getSharedLocations();

    // Map of unique newest shared location per user
    const uniqueShared: Record<string, SharedLocation> = {};
    allShared.forEach(loc => {
      const userObj = allUsers.find(u => u.id === loc.userId);
      if (userObj?.privacy?.incognitoMode === true || userObj?.privacy?.showLocation === false) {
        return;
      }
      if (!uniqueShared[loc.userId] || uniqueShared[loc.userId].timestamp < loc.timestamp) {
        uniqueShared[loc.userId] = loc;
      }
    });

    const candidates = allUsers.filter(u => {
      if (u.id === currentUser.id) return false;
      if (myFriendsSet.has(u.id)) return false;
      if (u.privacy?.incognitoMode === true) return false;
      return true;
    });

    const mapped = candidates.map(u => {
      let distanceKm: number | null = null;
      let matchType: 'gps' | 'text' | 'general' = 'general';
      let matchScore = 0; // Higher is closer/better
      let locationLabel = u.location || 'Sem localização';

      const uLoc = uniqueShared[u.id];
      if (mySharedLocation && uLoc) {
        distanceKm = calculateDistance(
          mySharedLocation.latitude,
          mySharedLocation.longitude,
          uLoc.latitude,
          uLoc.longitude
        );
        matchType = 'gps';
        // Proximity scoring: users within 100km get matched, closer is higher score
        matchScore = Math.max(0, 100 - distanceKm * 2);
        locationLabel = uLoc.address || u.location || 'Região Próxima';
      } else if (currentUser.location && u.location) {
        const myCity = currentUser.location.split(',')[0].trim().toLowerCase();
        const uCity = u.location.split(',')[0].trim().toLowerCase();
        if (myCity && uCity && (myCity.includes(uCity) || uCity.includes(myCity))) {
          matchType = 'text';
          matchScore = 50;
          locationLabel = u.location;
        }
      }

      return { user: u, distanceKm, matchType, matchScore, locationLabel };
    });

    return mapped
      .filter(item => item.matchType !== 'general' || item.user.location)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  }, [currentUser, mySharedLocation, refreshKey]);

  const handleActivateRadar = async () => {
    setSharingGPS(true);
    setGpsError(null);
    try {
      if (!navigator.geolocation) {
        setGpsError('Geolocalização não é suportada por este dispositivo.');
        setSharingGPS(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let addressString = currentUser.location || 'Minha Região';
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`
            );
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.suburb || 'Minha Região';
            const road = data.address.road || '';
            addressString = road ? `${road}, ${city}` : city;
          } catch (e) {
            console.error('Erro de geocodificação reversa:', e);
          }

          const newLoc: SharedLocation = {
            id: Math.random().toString(36).substring(2, 11),
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            latitude,
            longitude,
            address: addressString,
            timestamp: Date.now(),
            targetType: 'friends',
            statusText: 'Ativo via Feed',
            incognito: false,
          };
          UserDatabase.saveSharedLocation(newLoc);

          const u = UserDatabase.findById(currentUser.id);
          if (u) {
            if (!u.privacy) u.privacy = {} as any;
            u.privacy.showLocation = true;
            u.privacy.incognitoMode = false;
            UserDatabase.updateUser(u);
          }
          setRefreshKey(k => k + 1);
          setSharingGPS(false);
          playSubtleSound();
          if (navigator.vibrate) navigator.vibrate([50, 100]);
        },
        (err) => {
          console.error(err);
          setGpsError('Permissão negada ou sinal de GPS indisponível.');
          setSharingGPS(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (e) {
      console.error(e);
      setSharingGPS(false);
    }
  };

  const handleSendRequest = (toId: string) => {
    UserDatabase.sendFriendRequest(currentUser.id, toId);
    setRefreshKey(k => k + 1);
    playSubtleSound();
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleCancelRequest = (toId: string) => {
    UserDatabase.cancelFriendRequest(currentUser.id, toId);
    setRefreshKey(k => k + 1);
    playSubtleSound();
    if (navigator.vibrate) navigator.vibrate(15);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <section className="space-y-6">
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 px-4">Instantâneos</h4>
        <StoriesBar currentUser={currentUser} onRefresh={() => setRefreshKey(k => k + 1)} />
      </section>

      {/* Seção de Conexões Locais & Radar */}
      <section className="space-y-6 animate-in fade-in duration-700">
        <div className="flex items-center justify-between px-4">
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 flex items-center gap-1.5">
              <MapPin size={12} className="text-emerald-500 animate-pulse shrink-0" />
              Radar da Tribo: Alianças Locais
            </h4>
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">
              {mySharedLocation 
                ? `Radar Ativo • ${mySharedLocation.address}`
                : "Construa comunidades reais com pessoas da sua região"}
            </p>
          </div>
          {!mySharedLocation && (
            <button 
              onClick={handleActivateRadar}
              disabled={sharingGPS}
              className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 select-none shrink-0"
            >
              {sharingGPS ? (
                <>
                  <Loader2 size={10} className="animate-spin" /> Ativando...
                </>
              ) : (
                <>
                  <Radio size={10} className="animate-pulse text-emerald-500" /> Ativar GPS
                </>
              )}
            </button>
          )}
        </div>

          {gpsError && (
            <div className="mx-4 text-[9px] font-black text-rose-500 bg-rose-500/5 border border-rose-500/10 p-3 rounded-2xl animate-shake">
              {gpsError}
            </div>
          )}

          <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-1 snap-x">
            {localSuggestions.length > 0 ? (
              localSuggestions.map(({ user, distanceKm, matchType, locationLabel }) => {
                const hasSent = UserDatabase.hasSentRequest(currentUser.id, user.id);
                const isFriend = currentUser.friends.includes(user.id);
                
                return (
                  <div 
                    key={user.id}
                    className="flex-none w-[170px] bg-zinc-900 border border-white/5 rounded-[2.5rem] p-5 flex flex-col items-center justify-between relative snap-center group hover:border-emerald-500/20 transition-all"
                  >
                    <div className="flex flex-col items-center text-center w-full">
                      {/* Avatar do Usuário */}
                      <div 
                        onClick={() => navigate(`/profile/${user.id}`)}
                        className="w-16 h-16 rounded-2xl overflow-hidden mb-3 border border-white/5 shadow-lg group-hover:scale-105 transition-transform duration-300 cursor-pointer relative shrink-0"
                      >
                        <img src={user.avatar || null} className="w-full h-full object-cover animate-in fade-in duration-500" alt={user.name} />
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 bg-emerald-500 shadow-md" />
                      </div>

                      <h5 
                        onClick={() => navigate(`/profile/${user.id}`)}
                        className="text-xs font-black text-white truncate w-full hover:text-emerald-400 cursor-pointer mb-0.5"
                      >
                        {user.name}
                      </h5>
                      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-3 truncate w-full">@{user.username}</p>

                      {/* Badge de Distância/Localização */}
                      <div className="w-full mb-4">
                        {matchType === 'gps' && distanceKm !== null ? (
                          <div className="bg-emerald-500/5 border border-emerald-500/10 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 select-none">
                            <Navigation size={8} className="text-emerald-500 rotate-45 shrink-0 animate-pulse" />
                            <span className="text-[7.5px] font-black text-emerald-400 uppercase tracking-widest truncate">
                              {distanceKm < 1 ? 'Menos de 1 km' : `A ${distanceKm.toFixed(1)} km`}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-blue-500/5 border border-blue-500/10 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 select-none">
                            <Globe size={8} className="text-blue-500 shrink-0" />
                            <span className="text-[7.5px] font-black text-blue-400 uppercase tracking-widest truncate">
                              {locationLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ação de Conectar */}
                    <div className="w-full">
                      {isFriend ? (
                        <div className="w-full bg-zinc-950 text-zinc-600 text-center py-2.5 rounded-xl text-[7px] font-black uppercase tracking-widest border border-white/5 select-none">
                          Aliado ✔
                        </div>
                      ) : hasSent ? (
                        <button 
                          onClick={() => handleCancelRequest(user.id)}
                          className="w-full bg-zinc-950 text-zinc-400 hover:text-rose-500 text-center py-2.5 rounded-xl text-[7px] font-black uppercase tracking-widest border border-white/5 transition-all"
                        >
                          Pendente
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleSendRequest(user.id)}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-center py-2.5 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-1"
                        >
                          <UserPlus size={10} strokeWidth={2.5} /> Conectar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full py-8 text-center bg-zinc-900/40 rounded-[2.5rem] border border-white/5 px-6 flex flex-col items-center justify-center gap-2">
                <Compass size={24} className="text-zinc-700 animate-spin duration-3000" />
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest max-w-[240px] leading-relaxed">
                  Ative o GPS acima ou configure sua cidade no perfil para descobrir aliados ao seu redor!
                </p>
              </div>
            )}
          </div>
      </section>

      {userCommunities.length === 0 && (
        <section className="space-y-6 animate-in slide-in-from-right duration-700">
          <div className="flex items-center justify-between px-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Tribos Sugeridas</h4>
            <NavLink to="/communities" className="text-[8px] font-black uppercase text-emerald-500 hover:underline">Ver Todas</NavLink>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide px-1">
            {UserDatabase.getCommunities().slice(0, 5).map(comm => (
              <div 
                key={comm.id}
                onClick={() => navigate('/communities')}
                className="flex-none w-48 bg-zinc-900 border border-white/5 rounded-[2.5rem] p-6 cursor-pointer hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {comm.icon.length > 5 ? <img src={comm.icon} className="w-full h-full object-cover rounded-2xl" /> : comm.icon}
                </div>
                <h5 className="text-sm font-black text-white truncate mb-1">{comm.name}</h5>
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{comm.members.length} Membros</p>
              </div>
            ))}
          </div>
        </section>
      )}
      
      <div className="bg-zinc-900 border border-white/5 rounded-[3.5rem] p-8 shadow-2xl focus-within:border-emerald-500/30 transition-all">
        <textarea value={newPostText} onChange={(e) => setNewPostText(e.target.value)} placeholder="O que está rolando agora?" className="w-full bg-transparent border-none text-xl font-bold text-white outline-none placeholder:text-zinc-800 resize-none min-h-[100px]" />
        
        {userCommunities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button 
              onClick={() => setSelectedCommunityId(null)}
              className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${!selectedCommunityId ? 'bg-white text-black' : 'bg-zinc-950 text-zinc-600 hover:text-white'}`}
            >
              Público
            </button>
            {userCommunities.map(comm => (
              <button 
                key={comm.id}
                onClick={() => setSelectedCommunityId(comm.id)}
                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${selectedCommunityId === comm.id ? 'bg-emerald-500 text-black' : 'bg-zinc-950 text-zinc-600 hover:text-white'}`}
              >
                {comm.name}
              </button>
            ))}
          </div>
        )}
        
        {selectedVideo && (
          <div className="relative mt-6 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95">
            <video src={selectedVideo || null} className="w-full aspect-video object-cover" controls />
            <button onClick={() => setSelectedVideo(null)} className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-xl text-white rounded-2xl transition-all hover:bg-rose-500 shadow-xl">
              <X size={20} />
            </button>
          </div>
        )}

        {selectedImage && (
          <div className="relative mt-6 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95">
            <img src={selectedImage || null} className="w-full aspect-video object-cover" referrerPolicy="no-referrer" alt="Prévia" />
            <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-xl text-white rounded-2xl transition-all hover:bg-rose-500 shadow-xl">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
           <div className="flex gap-4">
              <button 
                onClick={() => imageInputRef.current?.click()}
                className={`p-4 rounded-3xl transition-all ${selectedImage ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-zinc-950 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/5 shadow-inner'}`}
                title="Subir Foto"
              >
                <ImageIcon size={20}/>
              </button>
              
              <button 
                onClick={() => setIsCameraCaptureOpen(true)}
                className={`p-4 rounded-3xl transition-all ${selectedImage ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-zinc-950 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/5 shadow-inner'}`}
                title="Tirar Foto"
              >
                <Camera size={20}/>
              </button>

              <button 
                onClick={() => setIsRecordingModalOpen(true)}
                className={`p-4 rounded-3xl transition-all ${selectedVideo ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-zinc-950 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/5 shadow-inner'}`}
                title="Gravar Vídeo"
              >
                <VideoIcon size={20}/>
              </button>

              <button 
                onClick={() => videoInputRef.current?.click()} 
                className={`p-4 rounded-3xl transition-all ${selectedVideo ? 'bg-emerald-500 text-black shadow-lg' : 'bg-zinc-950 text-zinc-500 hover:text-emerald-500 shadow-inner'}`}
                title="Subir Vídeo"
              >
                <VideoIcon size={20} className="rotate-90" />
              </button>
              
              <input type="file" ref={videoInputRef} accept="video/*" onChange={handleVideoSelect} className="hidden" />
              <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />
           </div>
           
           <button 
            onClick={handlePost} 
            disabled={(!newPostText.trim() && !selectedVideo && !selectedImage) || isPosting} 
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-10 py-4 rounded-3xl transition-all shadow-xl shadow-emerald-500/20 text-[10px] uppercase tracking-widest flex items-center gap-2 disabled:opacity-20 active:scale-95"
           >
            {isPosting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} fill="currentColor"/> Postar</>}
           </button>
        </div>
      </div>

      <div className="flex bg-zinc-900/40 p-1.5 rounded-[2.5rem] border border-white/5 w-fit mx-auto shadow-inner">
         <button onClick={() => setMode('global')} className={`px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'global' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-600'}`}>Global</button>
         <button onClick={() => setMode('tribo')} className={`px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'tribo' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-600'}`}>Minha Tribo</button>
      </div>

      <div className="space-y-8 pb-20">
        {posts.length > 0 ? posts.map((post, idx) => (
          <FeedPost key={post.id} post={post} currentUser={currentUser} index={idx} onReact={handleReact} onAddComment={handleAddComment} onToggleBookmark={handleToggleBookmark} onRefresh={() => setRefreshKey(k => k + 1)} />
        )) : (
          <div className="py-24 text-center bg-zinc-900/10 rounded-[4rem] border-4 border-dashed border-white/5">
            <Compass size={60} className="mx-auto text-zinc-800 mb-6" />
            <p className="text-xl font-black text-zinc-600 tracking-tight">O silêncio reina na TRIBO</p>
          </div>
        )}
      </div>

      {isRecordingModalOpen && (
        <VideoRecorder 
          onCapture={(base64) => {
            setSelectedVideo(base64);
            setIsRecordingModalOpen(false);
          }}
          onClose={() => setIsRecordingModalOpen(false)}
        />
      )}

      {isCameraCaptureOpen && (
        <CameraCapture 
          onCapture={(base64) => {
            setSelectedImage(base64);
            setIsCameraCaptureOpen(false);
          }}
          onClose={() => setIsCameraCaptureOpen(false)}
        />
      )}
    </div>
  );
};

export default FeedView;
