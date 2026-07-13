import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Post, Story, User } from '../../types';
import { 
  X, 
  Plus, 
  Flame,
  ChevronLeft,
  Trash2,
  Loader2,
  Camera,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Clock,
  Sparkles
} from 'lucide-react';
import { UserDatabase } from '../../services/db';
import { useNavigate } from 'react-router-dom';

// Componente visualizador de Status com progresso, reprodução de mídia e exclusão
export const StoryViewer: React.FC<{ 
  stories: Story[]; 
  initialIndex: number; 
  currentUser: User; 
  onClose: () => void; 
  onRefresh: () => void 
}> = ({ stories, initialIndex, currentUser, onClose, onRefresh }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const story = stories[currentIndex];

  const handleDelete = () => {
    if (story.userId !== currentUser.id) {
      alert("Você só pode apagar os seus próprios status!");
      return;
    }
    if (window.confirm("Deseja apagar definitivamente este status? Seus amigos não o verão mais.")) {
      UserDatabase.deleteStory(story.id, currentUser.id);
      onRefresh();
      
      if (stories.length === 1) {
        onClose();
      } else {
        const nextIndex = currentIndex === stories.length - 1 ? currentIndex - 1 : currentIndex;
        setCurrentIndex(nextIndex);
        setProgress(0);
      }
      if (navigator.vibrate) navigator.vibrate([30, 30]);
    }
  };

  useEffect(() => {
    setProgress(0);
    // Vídeos podem durar mais (ex: 8s), imagens duram 5s
    const duration = story?.mediaType === 'video' ? 8000 : 5000;
    const interval = 50; 
    const step = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) { 
            setCurrentIndex(prevIdx => prevIdx + 1); 
            return 0; 
          } else { 
            onClose(); 
            return 100; 
          }
        }
        return prev + step;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [currentIndex, stories.length, onClose, story]);

  if (!story) return null;

  // Cálculo de horas restantes de visualização (limite máximo de 24h)
  const elapsedTime = Date.now() - story.timestamp;
  const remainingHours = Math.max(0, Math.ceil((24 * 60 * 60 * 1000 - elapsedTime) / (60 * 60 * 1000)));

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col justify-between animate-in fade-in duration-300 select-none">
      
      {/* Container Principal de Mídia ou Cor */}
      <div className={`flex-grow flex flex-col justify-between relative overflow-hidden ${!story.mediaType || story.mediaType === 'text' ? `bg-gradient-to-br ${story.color}` : 'bg-black'}`}>
        
        {/* Renderizador de Imagem se for foto */}
        {story.mediaType === 'image' && story.mediaUrl && (
          <img 
            src={story.mediaUrl} 
            className="absolute inset-0 w-full h-full object-contain md:object-cover z-10" 
            alt="Status do usuário"
          />
        )}

        {/* Renderizador de Vídeo se for vídeo */}
        {story.mediaType === 'video' && story.mediaUrl && (
          <video 
            autoPlay 
            playsInline 
            loop 
            muted 
            src={story.mediaUrl} 
            className="absolute inset-0 w-full h-full object-contain md:object-cover z-10"
          />
        )}

        {/* Sombra de Legibilidade */}
        {story.mediaType && story.mediaType !== 'text' && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/70 z-20" />
        )}

        {/* Barras de Progresso no topo */}
        <div className="absolute top-safe pt-4 left-4 right-4 flex gap-1.5 z-50">
          {stories.map((_, i) => (
            <div key={i} className="h-1 flex-grow bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 transition-all duration-75" 
                style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }} 
              />
            </div>
          ))}
        </div>

        {/* Cabeçalho do Status */}
        <div className="absolute top-safe pt-10 left-6 right-6 flex justify-between items-center z-50">
          <div 
            onClick={() => { onClose(); navigate(`/profile/${story.userId}`); }}
            className="flex items-center gap-3 cursor-pointer bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/5"
          >
            <img src={story.userAvatar} className="w-9 h-9 rounded-xl border-2 border-emerald-500/30 object-cover" alt="" />
            <div>
              <p className="font-black text-xs text-white tracking-tight">{story.userName}</p>
              <span className="text-[7px] font-black uppercase text-zinc-300 tracking-widest flex items-center gap-1 mt-0.5">
                <Clock size={8} /> Restam {remainingHours}h (Temporário)
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {story.userId === currentUser.id && (
              <button 
                onClick={handleDelete} 
                className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 backdrop-blur-md transition-all active:scale-95 flex items-center gap-1"
                title="Apagar este Status agora"
              >
                <Trash2 size={16} />
                <span className="text-[8px] font-black uppercase tracking-wider hidden sm:inline">Excluir</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-xl backdrop-blur-md border border-white/5 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Conteúdo de Texto Central / Legenda */}
        <div className="flex-grow flex items-center justify-center p-8 text-center relative z-35 z-30">
          {(!story.mediaType || story.mediaType === 'text') ? (
            <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter drop-shadow-2xl animate-in zoom-in duration-500 max-w-lg leading-snug px-4">
              {story.content}
            </h2>
          ) : (
            story.content && (
              <div className="absolute bottom-16 left-6 right-6 p-5 bg-black/60 backdrop-blur-md border border-white/5 rounded-3rem max-w-md mx-auto z-40 text-center animate-in slide-in-from-bottom duration-300">
                <p className="text-xs font-black text-white leading-relaxed tracking-wide">
                  {story.content}
                </p>
              </div>
            )
          )}
        </div>

        {/* Zonas de Toque Invisíveis para Navegação Esquerda/Direita */}
        <div className="absolute inset-0 flex z-25">
          <div 
            className="w-1/3 h-full cursor-pointer" 
            onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)} 
          />
          <div 
            className="w-2/3 h-full cursor-pointer" 
            onClick={() => currentIndex < stories.length - 1 ? setCurrentIndex(currentIndex + 1) : onClose()} 
          />
        </div>
      </div>
    </div>
  );
};

// Componente Criador de Status com suporte a Texto, Foto e Vídeo
export const StoryCreator: React.FC<{ 
  currentUser: User; 
  onClose: () => void; 
  onCreated: () => void 
}> = ({ currentUser, onClose, onCreated }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const colors = ['from-emerald-500 to-teal-600', 'from-rose-500 to-orange-500', 'from-purple-600 to-pink-500', 'from-blue-600 to-indigo-700', 'from-zinc-900 to-black'];
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  // Estados de mídia
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      // Limitar tamanho do arquivo (máx 15MB)
      if (file.size > 15 * 1024 * 1024) {
        alert("O arquivo de mídia é muito grande. Escolha algo até 15MB.");
        return;
      }
      setLoading(true);
      try {
        const base64 = await UserDatabase.uploadFile(file);
        setMediaUrl(base64);
        setMediaType(type);
      } catch (error) {
        console.error("Erro ao converter arquivo de mídia: ", error);
        alert("Não foi possível carregar a mídia.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePost = async () => {
    if (mediaType === 'text' && !text.trim()) return;
    setLoading(true);

    const newStory: Story = { 
      id: Math.random().toString(36).substr(2, 9), 
      userId: currentUser.id, 
      userName: currentUser.name, 
      userAvatar: currentUser.avatar, 
      userIdentity: currentUser.identityType, 
      content: text, 
      color: selectedColor, 
      timestamp: Date.now(),
      mediaType,
      mediaUrl: mediaUrl || undefined
    };

    await new Promise(r => setTimeout(r, 800));
    UserDatabase.saveStory(newStory);
    
    setLoading(false);
    onCreated();
    onClose();
  };

  const removeMedia = () => {
    setMediaUrl(null);
    setMediaType('text');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col animate-in slide-in-from-bottom duration-500 select-none">
      
      {/* Área de Criação Principal */}
      <div className={`flex-grow flex flex-col justify-between p-8 relative overflow-hidden transition-all duration-700 ${mediaType === 'text' ? `bg-gradient-to-br ${selectedColor}` : 'bg-zinc-950'}`}>
        
        {/* Renderização de Preview da Imagem Carregada */}
        {mediaType === 'image' && mediaUrl && (
          <img 
            src={mediaUrl} 
            className="absolute inset-0 w-full h-full object-contain md:object-cover opacity-80 z-10" 
            alt="Preview do status"
          />
        )}

        {/* Renderização de Preview do Vídeo Carregado */}
        {mediaType === 'video' && mediaUrl && (
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            src={mediaUrl} 
            className="absolute inset-0 w-full h-full object-contain md:object-cover opacity-80 z-10"
          />
        )}

        {/* Máscara de degrade para legibilidade de legenda */}
        {mediaType !== 'text' && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 z-20" />
        )}

        {/* Inputs de arquivo ocultos */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={(e) => handleMediaUpload(e, 'image')}
          accept="image/*"
          className="hidden" 
        />
        <input 
          type="file" 
          id="video-status-input"
          onChange={(e) => handleMediaUpload(e, 'video')}
          accept="video/*"
          className="hidden" 
        />

        {/* Cabeçalho de Controles com Botões */}
        <div className="flex items-center justify-between w-full relative z-50">
          <button 
            type="button"
            onClick={onClose} 
            className="p-3 bg-black/40 text-white rounded-2xl border border-white/5 backdrop-blur-xl transition-all active:scale-95"
          >
            <ChevronLeft size={20} className="stroke-[3]" />
          </button>

          {/* Seletor de cores ou indicador de mídia */}
          {mediaType === 'text' ? (
            <div className="flex gap-1.5 bg-black/30 backdrop-blur-md p-2 rounded-2xl border border-white/5">
              {colors.map(c => (
                <button 
                  key={c} 
                  type="button"
                  onClick={() => setSelectedColor(c)} 
                  className={`w-7 h-7 rounded-full border-2 ${selectedColor === c ? 'border-emerald-400 scale-110 shadow-lg shadow-emerald-500/20' : 'border-white/10'} bg-gradient-to-br ${c} transition-all`} 
                />
              ))}
            </div>
          ) : (
            <button 
              type="button"
              onClick={removeMedia} 
              className="px-4 py-2 bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider rounded-full border border-rose-400/25 flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <Trash2 size={12} /> Remover Mídia
            </button>
          )}

          <div className="w-10 h-10 invisible" /> {/* Espaçador */}
        </div>

        {/* Bloco de Editor de Texto centralizado */}
        <div className="flex-grow flex flex-col items-center justify-center p-4 relative z-30">
          {mediaType === 'text' ? (
            <textarea 
              autoFocus 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              placeholder="O que está rolando agora?" 
              className="w-full bg-transparent border-none text-white text-3xl md:text-5xl font-black text-center outline-none placeholder:text-white/30 resize-none max-w-lg scrollbar-hide" 
              maxLength={120} 
            />
          ) : (
            <div className="w-full max-w-sm bg-black/60 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-6 space-y-4 animate-in zoom-in-95 duration-300">
              <span className="text-[8px] font-black uppercase text-emerald-400 tracking-widest block text-center">
                Legenda do Status ({mediaType === 'image' ? 'Foto' : 'Vídeo'})
              </span>
              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                placeholder="Insira uma legenda para sua foto/vídeo..." 
                className="w-full bg-zinc-950/60 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white text-center outline-none placeholder:text-zinc-600 resize-none"
                maxLength={100}
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Escolha das Opções de Mídia no Rodapé */}
        <div className="relative z-50 flex flex-col gap-4 mt-auto">
          {mediaType === 'text' && (
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full px-4">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-4 bg-zinc-900 hover:bg-zinc-850 text-white border border-white/5 rounded-3rem text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Camera size={14} className="text-emerald-450 text-emerald-400" /> Tirar / Foto
              </button>
              <button 
                type="button"
                onClick={() => document.getElementById('video-status-input')?.click()}
                className="py-4 bg-zinc-900 hover:bg-zinc-850 text-white border border-white/5 rounded-3rem text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <VideoIcon size={14} className="text-emerald-450 text-emerald-400" /> Gravar / Vídeo
              </button>
            </div>
          )}

          {/* Botão de Envio Principal ("Incendiar") */}
          <button 
            type="button"
            onClick={handlePost} 
            disabled={(mediaType === 'text' && !text.trim()) || loading} 
            className="w-full bg-white text-black font-black py-5 rounded-[2.5rem] text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-20 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            {loading ? (
              <Loader2 className="animate-spin text-black" size={18} />
            ) : (
              <>
                <Flame size={16} fill="currentColor" /> 
                {mediaType === 'text' ? 'Incendiar Tribo' : 'Publicar Status de 24h'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

// Barra de Status na página de Início superior
export const StoriesBar: React.FC<{ 
  currentUser: User; 
  onRefresh: () => void 
}> = ({ currentUser, onRefresh }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [viewGroupIndex, setViewGroupIndex] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Carrega os stories válidos (menos de 24h)
  const loadStories = () => {
    setStories(UserDatabase.getStories());
  };

  useEffect(() => { 
    loadStories(); 
  }, [refreshKey]);

  const groupedStories = useMemo(() => {
    const groups: { [key: string]: Story[] } = {};
    stories.forEach(s => { 
      if (!groups[s.userId]) groups[s.userId] = []; 
      groups[s.userId].push(s); 
    });
    return Object.values(groups);
  }, [stories]);

  const hasUnseenStory = (group: Story[]) => {
    return group.some(s => s.timestamp > (currentUser.ultima_atividade || 0));
  };

  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1 select-none">
      
      {/* Botão para postar novo status */}
      <div 
        onClick={() => setIsCreating(true)} 
        className="flex-none w-28 h-40 rounded-[2.5rem] bg-zinc-900 border border-white/5 relative overflow-hidden group cursor-pointer shadow-lg hover:border-emerald-500/20 transition-all"
      >
        <img 
          src={currentUser.avatar} 
          className="w-full h-full object-cover opacity-25 group-hover:scale-110 transition-transform duration-700" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent z-10" />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
           <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center text-black mb-2 shadow-xl shadow-emerald-500/10 hover:scale-115 transition-transform duration-300">
             <Plus size={20} strokeWidth={3} />
           </div>
           <span className="text-[8px] font-black uppercase text-white tracking-widest">Postar</span>
        </div>
      </div>

      {/* Renderização dos grupos de status dos amigos */}
      {groupedStories.map((group, idx) => {
        const latest = group[group.length - 1];
        const isSelf = latest.userId === currentUser.id;
        
        return (
          <div 
            key={latest.userId} 
            onClick={() => setViewGroupIndex(idx)} 
            className={`flex-none w-28 h-40 rounded-[2.5rem] border-2 relative overflow-hidden cursor-pointer active:scale-95 transition-all shadow-xl bg-gradient-to-br ${latest.color} ${hasUnseenStory(group) ? 'border-emerald-500 shadow-emerald-500/10' : 'border-white/10'}`}
          >
            {/* Se houver mídia (foto ou vídeo), exibe como miniatura de fundo */}
            {latest.mediaType === 'image' && latest.mediaUrl ? (
              <img 
                src={latest.mediaUrl} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 z-10 transition-transform duration-700 hover:scale-105" 
                alt="" 
              />
            ) : latest.mediaType === 'video' && latest.mediaUrl ? (
              <div className="absolute inset-0 w-full h-full opacity-60 z-10 overflow-hidden bg-black flex items-center justify-center">
                {/* Ícone de vídeo/filme na miniatura */}
                <div className="absolute top-3 right-3 text-white/50 z-30 bg-black/60 p-1.5 rounded-lg border border-white/5">
                  <VideoIcon size={10} />
                </div>
                <video 
                  src={latest.mediaUrl} 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/20 z-10" />
            )}

            {/* Avatar do Autor */}
            <div className="absolute top-4 left-4 z-30">
              <img 
                src={latest.userAvatar} 
                className={`w-9 h-9 rounded-xl border-2 object-cover ${isSelf ? 'border-white' : 'border-emerald-500'}`} 
                alt="" 
              />
            </div>

            {/* Nome do Autor e Título */}
            <div className="absolute bottom-4 left-4 right-4 z-30">
              <p className="text-[9px] font-black text-white leading-tight truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {isSelf ? 'Meu Status' : latest.userName}
              </p>
              {latest.mediaType && latest.mediaType !== 'text' && (
                <span className="text-[6px] font-black uppercase tracking-widest text-emerald-450 text-emerald-300 block mt-0.5 opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {latest.mediaType === 'image' ? '📸 Foto' : '🎥 Vídeo'}
                </span>
              )}
            </div>
            
            {/* Indicador de quantidade de status ativos se houver mais de 1 no grupo */}
            {group.length > 1 && (
              <div className="absolute top-4 right-4 bg-emerald-500/90 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full z-35 z-30 border border-white/10 uppercase shadow-md">
                +{group.length - 1}
              </div>
            )}
          </div>
        );
      })}

      {/* Janela de criação de status */}
      {isCreating && (
        <StoryCreator 
          currentUser={currentUser} 
          onClose={() => setIsCreating(false)} 
          onCreated={() => { 
            setRefreshKey(k => k + 1); 
            onRefresh(); 
          }} 
        />
      )}

      {/* Janela de visualização de status */}
      {viewGroupIndex !== null && (
        <StoryViewer 
          stories={groupedStories[viewGroupIndex]} 
          initialIndex={0} 
          currentUser={currentUser} 
          onClose={() => setViewGroupIndex(null)} 
          onRefresh={() => { 
            setRefreshKey(k => k + 1); 
            onRefresh(); 
          }} 
        />
      )}
    </div>
  );
};
