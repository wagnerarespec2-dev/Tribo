
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Community, User } from '../types';
import { 
  Users, 
  Lock, 
  Award, 
  Search,
  Plus,
  X,
  Camera,
  CheckCircle,
  Shield,
  Loader2,
  AlertCircle,
  Zap,
  ChevronRight,
  TrendingUp,
  Globe,
  Star,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { UserDatabase } from '../services/db';

const CATEGORIES = ['Tecnologia', 'Finanças', 'Estilo de Vida', 'Jurídico', 'Educação', 'Artes', 'Esportes', 'Culinária'];

const CommunitiesView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tudo');
  const [viewMode, setViewMode] = useState<'all' | 'joined' | 'owned'>('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    icon: '',
    isPrivate: false,
    isPremium: false
  });

  const [imageError, setImageError] = useState('');

  useEffect(() => {
    refreshCommunities();
  }, []);

  const refreshCommunities = () => {
    setCommunities(UserDatabase.getCommunities());
  };

  const filteredCommunities = useMemo(() => {
    let list = communities;
    if (viewMode === 'joined') list = communities.filter(c => c.members.includes(currentUser.id));
    else if (viewMode === 'owned') list = communities.filter(c => c.ownerId === currentUser.id);

    return list.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Tudo' || c.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [communities, searchTerm, selectedCategory, viewMode, currentUser.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError('');
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setImageError('O ícone é muito pesado. Máximo 2MB.');
        return;
      }
      const base64 = await UserDatabase.uploadFile(file);
      setFormData(prev => ({ ...prev, icon: base64 }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return;
    
    setLoading(true);
    const newComm: Community = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      description: formData.description,
      category: formData.category,
      icon: formData.icon || '🚀',
      ownerId: currentUser.id,
      members: [currentUser.id],
      ranking: communities.length + 1,
      isPrivate: formData.isPrivate,
      isPremium: formData.isPremium,
      createdAt: Date.now()
    };

    await new Promise(resolve => setTimeout(resolve, 1500));
    UserDatabase.saveCommunity(newComm);
    UserDatabase.toggleJoinCommunity(currentUser.id, newComm.id); // Add to user's list
    
    setLoading(false);
    setIsCreateModalOpen(false);
    setFormData({ name: '', description: '', category: '', icon: '', isPrivate: false, isPremium: false });
    refreshCommunities();
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleJoin = (e: React.MouseEvent, communityId: string) => {
    e.stopPropagation();
    UserDatabase.toggleJoinCommunity(currentUser.id, communityId);
    refreshCommunities();
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700 px-4">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-[4rem] bg-zinc-900 border border-white/5 shadow-2xl p-12 md:p-20">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Globe size={300} className="rotate-12 text-emerald-500" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-8">
          <div className="flex items-center gap-3">
             <div className="w-12 h-1.5 bg-emerald-500 rounded-full"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500">O Coração da Rede</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]">TRIBO<br/><span className="text-emerald-500 italic">NETWORKS</span></h1>
          <p className="text-zinc-400 font-bold text-xl leading-relaxed">Pessoas reais, conversas reais. Encontre seu nicho ou crie o seu próprio ecossistema livre.</p>
          
          <div className="flex flex-wrap gap-4">
             <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-10 py-5 rounded-[2rem] flex items-center gap-3 transition-all shadow-xl shadow-emerald-500/10 uppercase tracking-widest text-[10px] active:scale-95"
             >
               <Plus size={20} strokeWidth={3} /> Criar Nova Tribo
             </button>
             <div className="flex bg-black/40 p-1.5 rounded-[2.2rem] border border-white/5">
                <button onClick={() => setViewMode('all')} className={`px-6 py-3.5 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>Tudo</button>
                <button onClick={() => setViewMode('joined')} className={`px-6 py-3.5 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'joined' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>Minhas</button>
             </div>
          </div>
        </div>
      </section>

      {/* Busca e Filtros */}
      <div className="flex flex-col lg:flex-row gap-6 sticky top-20 z-[50] py-4 bg-black/60 backdrop-blur-3xl px-2 -mx-2">
         <div className="relative flex-grow group">
           <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-emerald-500 transition-all" size={24} />
           <input 
             type="text" 
             placeholder="Explorar novas comunidades..."
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full bg-zinc-900 border border-white/10 rounded-[2.5rem] py-6 pl-20 pr-8 focus:outline-none focus:border-emerald-500/40 text-lg font-medium transition-all shadow-xl placeholder:text-zinc-800"
           />
         </div>

         <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setSelectedCategory('Tudo')}
              className={`px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${selectedCategory === 'Tudo' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-zinc-900 border-white/10 text-zinc-500'}`}
            >
              Tudo
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${selectedCategory === cat ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-zinc-900 border-white/10 text-zinc-500'}`}
              >
                {cat}
              </button>
            ))}
         </div>
      </div>

      {/* Grid de Tribos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCommunities.length > 0 ? filteredCommunities.map(comm => (
          <div 
            key={comm.id} 
            className="group bg-zinc-900/40 border border-white/5 rounded-[4rem] p-8 hover:border-emerald-500/30 transition-all duration-500 shadow-2xl relative overflow-hidden flex flex-col"
          >
            {comm.isPremium && (
              <div className="absolute top-0 right-0 bg-amber-400 text-black text-[9px] font-black px-6 py-2 rounded-bl-3xl uppercase tracking-widest shadow-lg">
                Premium
              </div>
            )}
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-zinc-950 rounded-[2rem] flex items-center justify-center text-4xl border border-white/5 group-hover:scale-110 transition-transform duration-700 overflow-hidden shadow-2xl">
                {comm.icon.length > 5 ? <img src={comm.icon} className="w-full h-full object-cover" /> : comm.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-white tracking-tighter truncate group-hover:text-emerald-400 transition-colors">{comm.name}</h3>
                  {comm.isPrivate && <Lock size={16} className="text-zinc-600" />}
                </div>
                <div className="flex items-center gap-2 mt-2">
                   <Users size={14} className="text-emerald-500" />
                   <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{comm.members.length.toLocaleString()} Membros</span>
                </div>
              </div>
            </div>

            <p className="text-zinc-400 text-lg leading-relaxed font-medium mb-10 flex-grow line-clamp-3">
              {comm.description || 'Uma comunidade vibrante crescendo na Tribo.'}
            </p>

            <div className="flex items-center justify-between pt-8 border-t border-white/5">
              <div className="flex items-center gap-2">
                 <div className={`p-2 rounded-xl bg-zinc-950 border border-white/5 text-amber-500`}>
                    <Award size={14} />
                 </div>
                 <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Rank #{comm.ranking}</span>
              </div>
              
              <button 
                onClick={(e) => handleJoin(e, comm.id)}
                className={`px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl ${
                  comm.members.includes(currentUser.id) 
                  ? 'bg-zinc-800 text-zinc-400 border border-white/5 hover:text-rose-500 hover:border-rose-500/20' 
                  : 'bg-emerald-500 text-black hover:bg-emerald-400'
                }`}
              >
                {comm.members.includes(currentUser.id) ? (
                  <>Sair <UserMinus size={14} /></>
                ) : (
                  <>Entrar <UserPlus size={14} /></>
                )}
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-32 text-center bg-zinc-900/10 rounded-[5rem] border-4 border-dashed border-white/5">
             <TrendingUp size={80} className="mx-auto text-zinc-800 mb-8" />
             <p className="text-2xl font-black text-zinc-600 tracking-tight">Nenhuma tribo encontrada nesta categoria</p>
             <button onClick={() => { setSelectedCategory('Tudo'); setViewMode('all'); }} className="mt-6 text-emerald-500 font-black uppercase tracking-widest text-[10px]">Ver Todas as Tribos</button>
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[4rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-zinc-950/20">
              <div>
                <h3 className="text-4xl font-black italic tracking-tighter uppercase">FUNDAR <span className="text-emerald-500">TRIBO</span></h3>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2">Defina seu nicho e lidere a conversa</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-600 hover:text-white p-4 transition-colors"><X size={40} /></button>
            </div>
            
            <form onSubmit={handleCreate} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative w-32 h-32 rounded-[2.5rem] border-4 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all ${formData.icon ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10' : 'border-zinc-800 hover:border-emerald-500/40 bg-zinc-950'}`}
                >
                  {formData.icon ? (
                    <img src={formData.icon} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-600">
                      <Camera size={32} />
                      <span className="text-[9px] font-black uppercase mt-2">Logo</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
                {imageError && <p className="text-rose-500 text-[9px] font-black uppercase mt-2 tracking-widest">{imageError}</p>}
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Nome da Comunidade</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} type="text" placeholder="Ex: Desenvolvedores Free" className="w-full bg-zinc-950 border border-white/5 rounded-3xl px-8 py-5 text-xl font-bold outline-none focus:border-emerald-500/40" required />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Categoria</label>
                       <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-5 font-bold outline-none appearance-none" required>
                          <option value="">Selecionar...</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="flex items-end pb-1">
                       <label className={`flex-grow flex items-center justify-between px-6 py-5 rounded-2xl border cursor-pointer transition-all ${formData.isPrivate ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-950 border-white/5'}`}>
                          <div className="flex items-center gap-3">
                             <Lock size={18} className={formData.isPrivate ? 'text-emerald-500' : 'text-zinc-600'} />
                             <span className="text-[10px] font-black uppercase tracking-widest">Privada</span>
                          </div>
                          <input type="checkbox" name="isPrivate" checked={formData.isPrivate} onChange={handleInputChange} className="hidden" />
                          <div className={`w-10 h-5 rounded-full relative ${formData.isPrivate ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                             <div className={`absolute top-1 w-3 h-3 bg-black rounded-full transition-all ${formData.isPrivate ? 'left-6' : 'left-1'}`} />
                          </div>
                       </label>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Manifesto da Tribo</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Quais são as regras e o propósito deste grupo?" className="w-full h-32 bg-zinc-950 border border-white/5 rounded-[2.5rem] px-8 py-6 outline-none focus:border-emerald-500/40 resize-none font-medium"></textarea>
                 </div>

                 <label className={`flex items-center justify-between p-8 rounded-[2.5rem] border cursor-pointer transition-all ${formData.isPremium ? 'bg-amber-400/10 border-amber-400/30' : 'bg-zinc-950 border-white/5'}`}>
                    <div className="flex items-center gap-6">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${formData.isPremium ? 'bg-amber-400 text-black border-amber-400 shadow-xl' : 'bg-zinc-900 text-zinc-600 border-white/5'}`}>
                          <Zap size={24} fill={formData.isPremium ? "currentColor" : "none"} />
                       </div>
                       <div>
                          <span className={`text-sm font-black uppercase tracking-widest block ${formData.isPremium ? 'text-amber-400' : 'text-zinc-500'}`}>Membro Premium</span>
                          <p className="text-[9px] font-black text-zinc-600 uppercase mt-1">Acesso exclusivo para apoiadores</p>
                       </div>
                    </div>
                    <input type="checkbox" name="isPremium" checked={formData.isPremium} onChange={handleInputChange} className="hidden" />
                    <div className={`w-12 h-6 rounded-full relative ${formData.isPremium ? 'bg-amber-400' : 'bg-zinc-800'}`}>
                       <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-all ${formData.isPremium ? 'left-7' : 'left-1'}`} />
                    </div>
                 </label>
              </div>
              
              <div className="bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/10 flex gap-6 items-center">
                 <Shield size={40} className="text-emerald-500 shrink-0" />
                 <p className="text-[10px] font-black text-zinc-500 uppercase leading-relaxed">Fundar uma tribo gera responsabilidade. Você será o moderador soberano. Respeite as leis fundamentais de liberdade e privacidade.</p>
              </div>

              <button 
                type="submit"
                disabled={loading || !formData.name || !formData.category}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 text-black font-black py-8 rounded-[2.5rem] transition-all shadow-2xl shadow-emerald-500/20 uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : (
                  <><Star size={24} fill="currentColor"/> Fundar Comunidade</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitiesView;
