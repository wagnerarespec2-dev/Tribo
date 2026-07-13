
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Post, IdentityType, Story, Comment, User, Community } from '../types';
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
  Reply
} from 'lucide-react';
import { UserDatabase } from '../services/db';

import { StoriesBar } from '../src/components/StoriesBar';
import { FeedPost } from '../src/components/FeedPost';
import { VideoRecorder } from '../src/components/VideoRecorder';

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
  const [isPosting, setIsPosting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => { setPosts(UserDatabase.getFeed(currentUser.id, mode)); }, [mode, currentUser.id, refreshKey]);

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
    }
  };

  const handlePost = async () => {
    if (!newPostText.trim() && !selectedVideo) return;
    setIsPosting(true);
    const selectedComm = userCommunities.find(c => c.id === selectedCommunityId);
    const post: Post = { 
      id: Math.random().toString(36).substr(2, 9), 
      authorId: currentUser.id, 
      authorName: currentUser.name, 
      authorAvatar: currentUser.avatar, 
      authorIdentity: currentUser.identityType, 
      type: selectedVideo ? 'video' : 'text', 
      content: selectedVideo || newPostText, 
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
    setNewPostText(''); setSelectedVideo(null); setSelectedCommunityId(null); setIsPosting(false); setRefreshKey(k => k + 1); playSubtleSound();
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

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <section className="space-y-6">
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 px-4">Instantâneos</h4>
        <StoriesBar currentUser={currentUser} onRefresh={() => setRefreshKey(k => k + 1)} />
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
            <video src={selectedVideo} className="w-full aspect-video object-cover" controls />
            <button onClick={() => setSelectedVideo(null)} className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-xl text-white rounded-2xl transition-all hover:bg-rose-500 shadow-xl">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
           <div className="flex gap-4">
              <button className="p-4 bg-zinc-950 text-zinc-500 rounded-3xl hover:text-emerald-500 transition-all shadow-inner"><ImageIcon size={20}/></button>
              
              <div className="relative group">
                <button 
                  onClick={() => setIsRecordingModalOpen(true)}
                  className={`p-4 rounded-3xl transition-all ${selectedVideo ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-zinc-950 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/5 shadow-inner'}`}
                  title="Gravar Vídeo"
                >
                  <Camera size={20}/>
                </button>
              </div>

              <button 
                onClick={() => videoInputRef.current?.click()} 
                className={`p-4 rounded-3xl transition-all ${selectedVideo ? 'bg-emerald-500 text-black shadow-lg' : 'bg-zinc-950 text-zinc-500 hover:text-emerald-500 shadow-inner'}`}
                title="Subir Vídeo"
              >
                <VideoIcon size={20}/>
              </button>
              
              <input type="file" ref={videoInputRef} accept="video/*" onChange={handleVideoSelect} className="hidden" />
           </div>
           
           <button 
            onClick={handlePost} 
            disabled={(!newPostText.trim() && !selectedVideo) || isPosting} 
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
    </div>
  );
};

export default FeedView;
