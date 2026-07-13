
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, Send, Phone, Video, MoreVertical, Paperclip, Zap, ShieldCheck, 
  Smile, Mic, ChevronLeft, Volume2, VolumeX, MessageCircle, Music, 
  ImageIcon, Check, Circle, X, Plus, Edit3, Timer, Play, 
  Sticker, CheckCheck, Loader2, Palette, Sun, Moon, Coffee, Settings2, Save
} from 'lucide-react';
import { User, Message, Conversation, UserStatus } from '../types';
import { UserDatabase } from '../services/db';
import { SyncClient } from '../services/syncClient';

const StatusMarker: React.FC<{ status: UserStatus; size?: number }> = ({ status, size = 12 }) => {
  const colors = {
    [UserStatus.ONLINE]: 'text-emerald-500 fill-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]',
    [UserStatus.BUSY]: 'text-rose-500 fill-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    [UserStatus.AWAY]: 'text-amber-400 fill-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]',
    [UserStatus.INVISIBLE]: 'text-zinc-400 fill-zinc-400 shadow-[0_0_10px_rgba(161,161,170,0.4)]',
    [UserStatus.OFFLINE]: 'text-zinc-800 fill-zinc-800',
  };
  return <Circle size={size} className={`${colors[status]} transition-all duration-500`} />;
};

const ChatView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isNudging, setIsNudging] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [nudgeCooldown, setNudgeCooldown] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isEditingPresence, setIsEditingPresence] = useState(false);
  
  // States for status editing
  const [tempStatus, setTempStatus] = useState<UserStatus>(currentUser.status);
  const [tempPhrase, setTempPhrase] = useState(currentUser.statusPhrase || '');
  const [tempMusic, setTempMusic] = useState(currentUser.currentMusic || '');

  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = useMemo(() => conversations.find(c => c.id === activeConvId), [conversations, activeConvId]);
  const targetUser = useMemo(() => {
    if (!activeConv) return null;
    const targetParticipant = activeConv.participantes.find(p => p.user_id !== currentUser.id);
    return UserDatabase.findById(targetParticipant?.user_id || '');
  }, [activeConv, currentUser.id]);

  useEffect(() => {
    const refreshData = () => {
      setConversations(UserDatabase.getConversations(currentUser.id));
      if (activeConvId) {
        UserDatabase.markMessagesAsRead(activeConvId, currentUser.id);
        const { messages: paginatedMsgs, hasMore: more } = UserDatabase.getMessagesPaginated(activeConvId, 30 + offset);
        setMessages(paginatedMsgs);
        setHasMore(more);
      }
    };
    refreshData();

    // Assinar atualizações em tempo real do SyncClient para mensagens instantâneas
    const unsubscribe = SyncClient.addUpdateCallback(() => {
      refreshData();
    });

    const interval = setInterval(refreshData, 3000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentUser.id, activeConvId, messages.length, offset]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, activeConvId]);

  const handleSendMessage = async (type: Message['tipo'] = 'texto', content?: string) => {
    if (!activeConvId || (type === 'texto' && !inputText.trim())) return;
    if (type === 'nudge' && nudgeCooldown > 0) return;

    const newMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      conversa_id: activeConvId,
      remetente_id: currentUser.id,
      tipo: type,
      conteudo: content || (type === 'nudge' ? 'NUDGE' : inputText),
      data_envio: Date.now(),
      lida: false,
      editada: false,
    };

    UserDatabase.sendMessage(newMsg);
    if (type === 'texto') setInputText('');
    if (type === 'nudge') setNudgeCooldown(15);
  };

  const saveStatus = () => {
    const updatedUser = {
      ...currentUser,
      status: tempStatus,
      statusPhrase: tempPhrase,
      currentMusic: tempMusic
    };
    UserDatabase.updateUser(updatedUser);
    setIsEditingPresence(false);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  return (
    <div className={`h-[calc(100dvh-180px)] flex bg-[var(--msn-bg)] border border-[var(--msn-border)] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-300 ${isNudging ? 'animate-nudge' : ''}`}>
      
      {/* Sidebar MSN Style */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-[var(--msn-border)] flex flex-col bg-[var(--msn-sidebar)] ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6">
          <h2 className="text-2xl font-black italic tracking-tighter text-[var(--msn-text)] mb-6">PAPO</h2>
          
          <div className="relative group">
            <div 
              onClick={() => setIsEditingPresence(!isEditingPresence)}
              className="bg-white/5 p-4 rounded-3xl border border-[var(--msn-border)] mb-6 cursor-pointer hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={currentUser.avatar} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="absolute -bottom-1 -right-1"><StatusMarker status={currentUser.status} size={10} /></div>
                </div>
                <div className="min-w-0 flex-grow">
                  <p className="font-black text-xs text-[var(--msn-text)] truncate">{currentUser.name}</p>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase truncate">{currentUser.statusPhrase || 'Diga algo...'}</p>
                </div>
                <Settings2 size={14} className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
              </div>
              {currentUser.currentMusic && (
                <div className="mt-3 flex items-center gap-2 text-emerald-500/60 bg-emerald-500/5 px-3 py-1.5 rounded-xl">
                  <Music size={10} />
                  <span className="text-[8px] font-black uppercase tracking-widest truncate">{currentUser.currentMusic}</span>
                </div>
              )}
            </div>

            {/* Status Edit Popover */}
            {isEditingPresence && (
              <div className="absolute top-0 left-0 right-0 bg-zinc-900 border border-emerald-500/20 rounded-[2.5rem] p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Ajustar Presença</h4>
                  <button onClick={() => setIsEditingPresence(false)} className="text-zinc-600 hover:text-white"><X size={16}/></button>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-around bg-black/40 p-2 rounded-2xl border border-white/5">
                    {[UserStatus.ONLINE, UserStatus.BUSY, UserStatus.AWAY, UserStatus.INVISIBLE].map(s => (
                      <button 
                        key={s} 
                        onClick={() => setTempStatus(s)}
                        className={`p-3 rounded-xl transition-all ${tempStatus === s ? 'bg-white/10 scale-110' : 'opacity-40 hover:opacity-100'}`}
                        title={s}
                      >
                        <StatusMarker status={s} size={14} />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-zinc-600 ml-2">Frase de Status</label>
                      <div className="relative">
                        <Edit3 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                        <input 
                          value={tempPhrase} 
                          onChange={e => setTempPhrase(e.target.value)}
                          placeholder="No que está pensando?"
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-emerald-500/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-zinc-600 ml-2">Ouvindo Agora</label>
                      <div className="relative">
                        <Music size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                        <input 
                          value={tempMusic} 
                          onChange={e => setTempMusic(e.target.value)}
                          placeholder="Música ou Podcast"
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-emerald-500/30"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={saveStatus}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Save size={14} /> Salvar Presença
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-4 pb-4 space-y-1 scrollbar-hide">
          {conversations.map(conv => {
            const friend = UserDatabase.findById(conv.participantes.find(p => p.user_id !== currentUser.id)?.user_id || '');
            const isActive = activeConvId === conv.id;
            return (
              <div 
                key={conv.id} onClick={() => setActiveConvId(conv.id)}
                className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${isActive ? 'bg-emerald-500/10' : 'hover:bg-white/5'}`}
              >
                <div className="relative">
                  <img src={friend?.avatar} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="absolute -bottom-1 -right-1"><StatusMarker status={friend?.status || UserStatus.OFFLINE} size={8} /></div>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black truncate text-[var(--msn-text)]">{friend?.name}</h4>
                  <p className="text-[9px] text-zinc-500 truncate">{conv.lastMessage}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeConvId ? (
        <div className="flex-grow flex flex-col relative">
          <header className="px-6 py-4 border-b border-[var(--msn-border)] bg-[var(--msn-sidebar)]/80 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveConvId(null)} className="md:hidden p-2 -ml-2 text-zinc-500"><ChevronLeft size={20}/></button>
              <div className="relative">
                <img src={targetUser?.avatar} className="w-10 h-10 rounded-xl object-cover" />
                <div className="absolute -bottom-1 -right-1"><StatusMarker status={targetUser?.status || UserStatus.OFFLINE} size={8} /></div>
              </div>
              <div>
                <h3 className="text-sm font-black text-[var(--msn-text)]">{targetUser?.name}</h3>
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">
                  {targetUser?.statusPhrase || 'Criptografado'}
                </span>
              </div>
            </div>
            {targetUser?.currentMusic && (
              <div className="hidden lg:flex items-center gap-2 text-[9px] font-black uppercase text-zinc-500 tracking-widest bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                <Music size={12} className="text-emerald-500" />
                Ouvindo: {targetUser.currentMusic}
              </div>
            )}
          </header>

          <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-6 scrollbar-hide">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.remetente_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl text-xs max-w-[85%] ${m.remetente_id === currentUser.id ? 'bg-emerald-500 text-black font-bold rounded-tr-none' : 'bg-[var(--msn-bubble-them)] text-[var(--msn-text)] rounded-tl-none border border-[var(--msn-border)]'}`}>
                  {m.conteudo}
                </div>
              </div>
            ))}
          </div>

          <footer className="p-4 bg-[var(--msn-sidebar)]/90 border-t border-[var(--msn-border)]">
            <div className="bg-black/20 rounded-2xl p-2 flex items-center gap-2">
              <input 
                type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Mensagem..."
                className="flex-grow bg-transparent outline-none text-sm px-3 py-2 text-[var(--msn-text)]"
              />
              <button onClick={() => handleSendMessage()} className="bg-emerald-500 text-black p-2 rounded-xl active:scale-95 transition-all"><Send size={18} fill="currentColor" /></button>
            </div>
          </footer>
        </div>
      ) : (
        <div className="hidden md:flex flex-grow items-center justify-center p-10 bg-black/5">
           <div className="text-center space-y-6 max-w-sm">
             <MessageCircle size={80} className="text-zinc-800 mx-auto" />
             <h3 className="text-2xl font-black text-zinc-700 italic tracking-tighter uppercase">Escolha um aliado para começar a revolução.</h3>
             <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest leading-relaxed">Suas mensagens são protegidas por soberania criptográfica de ponta-a-ponta.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;
