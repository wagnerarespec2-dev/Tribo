import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  User as UserIcon, 
  Users, 
  MessageSquare, 
  Trash2, 
  Heart, 
  Send, 
  MessageCircle, 
  MapPin, 
  Sparkles, 
  Clock, 
  Plus, 
  Check,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { User, Community, Post, Comment } from '../../types';
import { UserDatabase } from '../../services/db';

interface GlobalSearchProps {
  currentUser: User;
  onUpdate?: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ currentUser, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'communities' | 'posts'>('all');
  const [history, setHistory] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar histórico do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('tribo_search_history_v1');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    }
  }, []);

  // Monitorar teclas globais (Ctrl+K ou Cmd+K para abrir)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSelectedPost(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocar no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      setActiveTab('all');
      setSelectedPost(null);
    }
  }, [isOpen]);

  // Salvar termo no histórico
  const saveToHistory = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    const filtered = history.filter(h => h.toLowerCase() !== cleaned.toLowerCase());
    const updated = [cleaned, ...filtered].slice(0, 6);
    setHistory(updated);
    localStorage.setItem('tribo_search_history_v1', JSON.stringify(updated));
  };

  // Excluir termo do histórico
  const deleteHistoryItem = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = history.filter(h => h !== term);
    setHistory(updated);
    localStorage.setItem('tribo_search_history_v1', JSON.stringify(updated));
  };

  // Limpar todo histórico
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tribo_search_history_v1');
  };

  // Obter coleções de dados para filtragem
  const dbUsers = useMemo(() => UserDatabase.getUsers(), []);
  const dbCommunities = useMemo(() => UserDatabase.getCommunities(), [isOpen]);
  const dbPosts = useMemo(() => UserDatabase.getPosts(), [isOpen]);

  // Filtragem dinâmica
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { people: [], communities: [], posts: [] };
    }

    const people = dbUsers.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.username.toLowerCase().includes(q) || 
      (u.bio && u.bio.toLowerCase().includes(q)) ||
      (u.location && u.location.toLowerCase().includes(q))
    );

    const communities = dbCommunities.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.description.toLowerCase().includes(q) || 
      c.category.toLowerCase().includes(q)
    );

    const posts = dbPosts.filter(p => 
      p.content.toLowerCase().includes(q) || 
      p.authorName.toLowerCase().includes(q) ||
      (p.communityName && p.communityName.toLowerCase().includes(q))
    );

    return { people, communities, posts };
  }, [query, dbUsers, dbCommunities, dbPosts]);

  // Recomendações caso a busca esteja vazia
  const suggestions = useMemo(() => {
    // Retorna algumas comunidades ativas e usuários em destaque
    const topComms = dbCommunities.slice(0, 3);
    const topPeople = dbUsers.filter(u => u.id !== currentUser.id).slice(0, 3);
    return { topComms, topPeople };
  }, [dbCommunities, dbUsers, currentUser.id]);

  const handleSelectPerson = (userId: string) => {
    saveToHistory(query || dbUsers.find(u => u.id === userId)?.name || '');
    setIsOpen(false);
    navigate(`/profile/${userId}`);
  };

  const handleToggleJoinComm = (commId: string) => {
    UserDatabase.toggleJoinCommunity(currentUser.id, commId);
    if (onUpdate) onUpdate();
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleLikePost = (postId: string) => {
    UserDatabase.reactToPost(postId, currentUser.id);
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    
    // Atualiza o post selecionado se estiver aberto
    if (selectedPost && selectedPost.id === postId) {
      const posts = UserDatabase.getPosts();
      const updated = posts.find(p => p.id === postId);
      if (updated) setSelectedPost(updated);
    }
    if (onUpdate) onUpdate();
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const handleAddComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Math.random().toString(36).substring(2, 9),
      authorId: currentUser.id,
      authorName: currentUser.username,
      authorAvatar: currentUser.avatar,
      content: commentText,
      timestamp: 'Agora',
      likedBy: [],
      replies: []
    };

    UserDatabase.addComment(postId, newComment);
    setCommentText('');

    // Recarregar post
    const posts = UserDatabase.getPosts();
    const updated = posts.find(p => p.id === postId);
    if (updated) setSelectedPost(updated);
    if (onUpdate) onUpdate();
  };

  // Highlight termo pesquisado no texto
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) 
            ? <mark key={i} className="bg-emerald-500/30 text-emerald-400 font-bold px-0.5 rounded">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  const totalResults = filteredResults.people.length + filteredResults.communities.length + filteredResults.posts.length;

  return (
    <>
      {/* Botão de Busca no Header (Desktop) */}
      <div 
        onClick={() => setIsOpen(true)} 
        className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl w-64 lg:w-80 cursor-pointer transition-all duration-300 group"
      >
        <Search size={16} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
        <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors select-none">Pesquisar na Tribo...</span>
        <span className="ml-auto text-[8px] font-black px-1.5 py-0.5 bg-white/10 rounded-lg text-zinc-500 tracking-wider">CTRL K</span>
      </div>

      {/* Botão de Busca no Header (Mobile) */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="md:hidden p-2.5 bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all"
        title="Buscar na Tribo"
      >
        <Search size={18} />
      </button>

      {/* Modal/Overlay de Busca Global */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-xl flex flex-col pt-safe px-4 md:px-8 pb-8 overflow-hidden select-none">
            {/* Header da Busca */}
            <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4 py-6 border-b border-white/5 shrink-0">
              <div className="flex-grow flex items-center bg-white/5 border border-white/10 focus-within:border-emerald-500/50 rounded-2xl px-4 py-3.5 gap-3 transition-all duration-300">
                <Search size={20} className="text-zinc-400" />
                <input 
                  ref={inputRef}
                  type="text" 
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value.trim() && activeTab !== 'all' && totalResults === 0) {
                      // Se trocar a busca e o tab estiver em vazio, reseta para tudo
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      saveToHistory(query);
                    }
                  }}
                  placeholder="Pesquisar por pessoas, comunidades ou postagens..."
                  className="bg-transparent text-white placeholder-zinc-500 text-sm w-full outline-none border-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X size={16} className="text-zinc-400 hover:text-white" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-3.5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all font-black text-xs uppercase tracking-wider shrink-0 flex items-center gap-2"
              >
                <X size={16} /> <span className="hidden sm:inline">Fechar</span>
              </button>
            </div>

            {/* Abas de Categoria (Só mostra se houver query) */}
            {query.trim() && (
              <div className="max-w-4xl mx-auto w-full py-4 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
                {[
                  { id: 'all', label: `Todos (${totalResults})` },
                  { id: 'people', label: `Pessoas (${filteredResults.people.length})` },
                  { id: 'communities', label: `Comunidades (${filteredResults.communities.length})` },
                  { id: 'posts', label: `Postagens (${filteredResults.posts.length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 ${
                      activeTab === tab.id 
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Conteúdo Principal (Scrollável) */}
            <div className="max-w-4xl mx-auto w-full flex-grow overflow-y-auto scrollbar-hide py-6 space-y-8">
              {/* ESTADO VAZIO: Mostrar Histórico de Busca e Sugestões */}
              {!query.trim() ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Histórico */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Clock size={12} /> Buscas Recentes
                      </h4>
                      {history.length > 0 && (
                        <button 
                          onClick={clearHistory} 
                          className="text-[9px] font-black uppercase text-rose-500/80 hover:text-rose-400 tracking-wider transition-colors"
                        >
                          Limpar Tudo
                        </button>
                      )}
                    </div>

                    {history.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {history.map((term, i) => (
                          <div 
                            key={i}
                            onClick={() => setQuery(term)}
                            className="group flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer text-xs font-bold text-zinc-300 hover:text-white transition-all border border-white/5"
                          >
                            <span>{term}</span>
                            <button 
                              onClick={(e) => deleteHistoryItem(e, term)} 
                              className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-white/5 rounded-[2rem] text-center text-zinc-600 font-bold text-xs">
                        Nenhuma busca recente realizada.
                      </div>
                    )}

                    {/* Dica */}
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] space-y-2">
                      <h5 className="text-xs font-black text-emerald-400 flex items-center gap-2"><Sparkles size={14} /> Atalho Rápido</h5>
                      <p className="text-[10px] font-medium text-zinc-400 leading-relaxed">
                        Pressione <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-zinc-300">Ctrl + K</kbd> em qualquer lugar do aplicativo para ativar a busca instantânea de forma rápida.
                      </p>
                    </div>
                  </div>

                  {/* Sugestões de Destaque */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <TrendingUp size={12} /> Sugestões
                    </h4>

                    {/* Comunidades Sugeridas */}
                    {suggestions.topComms.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block">Tribos Populares</span>
                        {suggestions.topComms.map(comm => (
                          <div 
                            key={comm.id}
                            onClick={() => {
                              setQuery(comm.name);
                              setActiveTab('communities');
                            }}
                            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl cursor-pointer transition-all border border-white/5"
                          >
                            <span className="text-xl shrink-0">{comm.icon}</span>
                            <div className="overflow-hidden">
                              <p className="text-xs font-black text-white truncate">{comm.name}</p>
                              <p className="text-[9px] font-bold text-zinc-500 truncate">{comm.members.length} membros</p>
                            </div>
                            <ChevronRight size={14} className="text-zinc-600 ml-auto" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pessoas Sugeridas */}
                    {suggestions.topPeople.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block">Quem Seguir</span>
                        {suggestions.topPeople.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => handleSelectPerson(p.id)}
                            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl cursor-pointer transition-all border border-white/5"
                          >
                            <img src={p.avatar} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-xs font-black text-white truncate">{p.name}</p>
                              <p className="text-[9px] font-bold text-zinc-500 truncate">@{p.username}</p>
                            </div>
                            <ChevronRight size={14} className="text-zinc-600 ml-auto" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* EXIBIR RESULTADOS DA BUSCA */
                <div className="space-y-8 animate-in fade-in duration-300">
                  {totalResults === 0 ? (
                    <div className="p-16 text-center border border-dashed border-white/5 rounded-[3rem] space-y-4">
                      <div className="text-3xl">🏜️</div>
                      <h3 className="text-sm font-black text-white">Nenhum resultado encontrado</h3>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Não encontramos nada para "{query}". Tente ajustar os termos ou pesquise por palavras mais simples.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Categoria: PESSOAS */}
                      {(activeTab === 'all' || activeTab === 'people') && filteredResults.people.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 pb-2 border-b border-white/5">
                            <UserIcon size={12} /> Pessoas ({filteredResults.people.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredResults.people.map(u => (
                              <div 
                                key={u.id}
                                onClick={() => handleSelectPerson(u.id)}
                                className="p-5 bg-white/5 hover:bg-white/10 rounded-[2rem] cursor-pointer border border-white/5 flex gap-4 transition-all duration-300 hover:scale-[1.01]"
                              >
                                <div className="relative shrink-0">
                                  <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover" />
                                  <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black ${
                                    u.status === 'ONLINE' ? 'bg-emerald-500' :
                                    u.status === 'BUSY' ? 'bg-rose-500' : 'bg-zinc-600'
                                  }`} />
                                </div>
                                <div className="min-w-0 flex-grow">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-xs text-white truncate">{highlightText(u.name, query)}</span>
                                    {u.verified && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                                  </div>
                                  <span className="text-[9px] font-bold text-zinc-500 block">@{highlightText(u.username, query)}</span>
                                  {u.bio && (
                                    <p className="text-[10px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                                      {highlightText(u.bio, query)}
                                    </p>
                                  )}
                                  {u.location && (
                                    <div className="flex items-center gap-1 text-[8px] font-black text-zinc-500 uppercase tracking-wider mt-2.5">
                                      <MapPin size={10} /> {highlightText(u.location, query)}
                                    </div>
                                  )}
                                </div>
                                <button className="self-center p-2.5 bg-white/5 hover:bg-emerald-500 hover:text-black rounded-xl text-zinc-400 transition-all shrink-0">
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Categoria: COMUNIDADES */}
                      {(activeTab === 'all' || activeTab === 'communities') && filteredResults.communities.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 pb-2 border-b border-white/5">
                            <Users size={12} /> Comunidades ({filteredResults.communities.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredResults.communities.map(comm => {
                              const isJoined = comm.members.includes(currentUser.id);
                              return (
                                <div 
                                  key={comm.id}
                                  className="p-5 bg-white/5 rounded-[2rem] border border-white/5 flex gap-4 items-center transition-all duration-300"
                                >
                                  <span className="text-3xl shrink-0 p-3 bg-white/5 rounded-2xl">{comm.icon}</span>
                                  <div className="min-w-0 flex-grow">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-xs text-white truncate">{highlightText(comm.name, query)}</span>
                                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[8px] font-black uppercase text-zinc-500 tracking-wider shrink-0">{highlightText(comm.category, query)}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                      {highlightText(comm.description, query)}
                                    </p>
                                    <span className="text-[9px] font-bold text-zinc-500 mt-2.5 block">{comm.members.length} membros</span>
                                  </div>
                                  <button 
                                    onClick={() => handleToggleJoinComm(comm.id)}
                                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                                      isJoined 
                                        ? 'bg-zinc-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-white/5' 
                                        : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/10'
                                    }`}
                                  >
                                    {isJoined ? 'Sair' : 'Entrar'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Categoria: POSTAGENS */}
                      {(activeTab === 'all' || activeTab === 'posts') && filteredResults.posts.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 pb-2 border-b border-white/5">
                            <MessageSquare size={12} /> Postagens ({filteredResults.posts.length})
                          </h4>
                          <div className="space-y-4">
                            {filteredResults.posts.map(post => (
                              <div 
                                key={post.id}
                                onClick={() => {
                                  saveToHistory(query);
                                  setSelectedPost(post);
                                }}
                                className="p-5 bg-white/5 hover:bg-white/10 rounded-[2.5rem] cursor-pointer border border-white/5 space-y-4 transition-all duration-300"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <img src={post.authorAvatar} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                                    <div>
                                      <p className="text-xs font-extrabold text-white">{highlightText(post.authorName, query)}</p>
                                      <p className="text-[9px] font-medium text-zinc-500 mt-0.5">{post.timestamp}</p>
                                    </div>
                                  </div>
                                  {post.communityName && (
                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-wider">
                                      {highlightText(post.communityName, query)}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line line-clamp-3">
                                  {highlightText(post.content, query)}
                                </p>

                                <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLikePost(post.id);
                                    }}
                                    className={`flex items-center gap-1.5 transition-colors ${post.likedBy?.includes(currentUser.id) ? 'text-rose-500' : 'hover:text-white'}`}
                                  >
                                    <Heart size={14} className={post.likedBy?.includes(currentUser.id) ? 'fill-current' : ''} />
                                    <span>{post.likes}</span>
                                  </button>
                                  <div className="flex items-center gap-1.5">
                                    <MessageCircle size={14} />
                                    <span>{post.comments?.length || 0} comentários</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL INTERATIVO PARA PREVER E COMENTAR NO POST SELECIONADO */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header do Post */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-950/40">
                <div className="flex items-center gap-3">
                  <img src={selectedPost.authorAvatar} className="w-10 h-10 rounded-2xl object-cover" />
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{selectedPost.authorName}</h4>
                    <p className="text-[9px] font-bold text-zinc-500 mt-0.5">{selectedPost.timestamp}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Corpo do Post */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-hide">
                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                  {selectedPost.content}
                </p>

                {/* Curtidas & Contadores */}
                <div className="flex items-center gap-4 py-4 border-y border-white/5 text-xs font-black text-zinc-400 uppercase tracking-wider">
                  <button 
                    onClick={() => handleLikePost(selectedPost.id)}
                    className={`flex items-center gap-1.5 transition-colors ${selectedPost.likedBy?.includes(currentUser.id) ? 'text-rose-500' : 'hover:text-white'}`}
                  >
                    <Heart size={16} className={selectedPost.likedBy?.includes(currentUser.id) ? 'fill-current' : ''} />
                    <span>{selectedPost.likes} Curtidas</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle size={16} />
                    <span>{selectedPost.comments?.length || 0} Comentários</span>
                  </div>
                </div>

                {/* Comentários */}
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block">Comentários</span>
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    <div className="space-y-4">
                      {selectedPost.comments.map(comment => (
                        <div key={comment.id} className="p-4 bg-white/5 border border-white/5 rounded-[2rem] flex gap-3">
                          <img src={comment.authorAvatar} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-extrabold text-white mr-1.5">{comment.authorName}</span>
                            <span className="text-[9px] text-zinc-500">{comment.timestamp}</span>
                            <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-white/5 rounded-[2rem] text-zinc-600 font-bold text-xs">
                      Seja o primeiro a comentar esta publicação!
                    </div>
                  )}
                </div>
              </div>

              {/* Input de Comentário */}
              <form onSubmit={(e) => handleAddComment(e, selectedPost.id)} className="p-5 border-t border-white/5 bg-zinc-950/40 flex items-center gap-3">
                <input 
                  type="text" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva seu comentário..."
                  className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                />
                <button 
                  type="submit"
                  disabled={!commentText.trim()}
                  className="p-3 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500"
                >
                  <Send size={16} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
