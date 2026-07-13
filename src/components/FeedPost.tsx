
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, IdentityType, User, Comment } from '../../types';
import { 
  X, 
  Loader2, 
  Send, 
  MessageCircle, 
  ShieldCheck,
  Heart,
  Bookmark,
  MoreHorizontal,
  Flag,
  Share2,
  Reply,
  Trash2,
  Edit3
} from 'lucide-react';
import { UserDatabase } from '../../services/db';

export const CommentItem: React.FC<{ 
  postId: string;
  comment: Comment; 
  currentUser: User; 
  depth?: number; 
  onRefresh: () => void;
}> = ({ postId, comment, currentUser, depth = 0, onRefresh }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editedCommentText, setEditedCommentText] = useState(comment.content);
  const navigate = useNavigate();

  const isLiked = comment.likedBy?.includes(currentUser.id);

  const handleLike = () => {
    UserDatabase.reactToComment(postId, comment.id, currentUser.id);
    onRefresh();
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const newReply: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      authorId: currentUser.id,
      authorName: currentUser.username,
      authorAvatar: currentUser.avatar,
      content: replyText,
      timestamp: 'Agora',
      likedBy: [],
      replies: []
    };
    UserDatabase.addReplyToComment(postId, comment.id, newReply);
    setReplyText('');
    setShowReplyInput(false);
    onRefresh();
  };

  const handleEditCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedCommentText.trim()) return;
    UserDatabase.editComment(postId, comment.id, editedCommentText);
    setIsEditingComment(false);
    onRefresh();
  };

  const handleDeleteComment = () => {
    if (window.confirm("Deseja apagar este comentário?")) {
      UserDatabase.deleteComment(postId, comment.id);
      onRefresh();
      if (navigator.vibrate) navigator.vibrate([20, 20]);
    }
  };

  return (
    <div className={`space-y-4 animate-in slide-in-from-left duration-300 ${depth > 0 ? 'ml-8 pl-4 border-l-2 border-white/5' : ''}`}>
      <div className="bg-zinc-950/40 p-5 rounded-[2rem] border border-white/5 flex gap-4">
        <img 
          src={comment.authorAvatar} 
          onClick={() => navigate(`/profile/${comment.authorId}`)}
          className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:scale-110 transition-transform" 
          alt="" 
        />
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p 
              onClick={() => navigate(`/profile/${comment.authorId}`)}
              className="text-[10px] font-black text-white cursor-pointer hover:text-emerald-500 transition-colors"
            >@{comment.authorName}</p>
            <span className="text-[7px] font-black uppercase text-zinc-600">{comment.timestamp}</span>
          </div>
          
          {isEditingComment ? (
            <form onSubmit={handleEditCommentSubmit} className="mt-2 mb-4 flex gap-2 animate-in fade-in">
              <input 
                autoFocus
                value={editedCommentText} 
                onChange={e => setEditedCommentText(e.target.value)} 
                className="flex-grow bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-emerald-500/40"
              />
              <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-xl transition-all">Salvar</button>
              <button type="button" onClick={() => { setIsEditingComment(false); setEditedCommentText(comment.content); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase rounded-xl transition-all">Cancelar</button>
            </form>
          ) : (
            <p className="text-sm text-zinc-400 font-medium leading-relaxed mb-4">{comment.content}</p>
          )}
          
          <div className="flex items-center gap-6">
             <button onClick={handleLike} className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all ${isLiked ? 'text-rose-500' : 'text-zinc-600 hover:text-white'}`}>
                <Heart size={14} fill={isLiked ? "currentColor" : "none"} className={isLiked ? 'animate-heart-pulse text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : ''} />
                Curtir • {comment.likedBy?.length || 0}
             </button>
             <button onClick={() => setShowReplyInput(!showReplyInput)} className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all ${showReplyInput ? 'text-emerald-500' : 'text-zinc-600 hover:text-white'}`}>
                <Reply size={14} />
                Responder
             </button>
             {comment.authorId === currentUser.id && (
                <>
                  <button onClick={() => setIsEditingComment(true)} className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-all">
                    <Edit3 size={14} />
                    Editar
                  </button>
                  <button onClick={handleDeleteComment} className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-rose-500/80 hover:text-rose-500 transition-all">
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </>
             )}
          </div>
        </div>
      </div>

      {showReplyInput && (
        <form onSubmit={handleReply} className="ml-8 flex gap-2 animate-in fade-in slide-in-from-top-2">
           <input 
            autoFocus
            value={replyText} 
            onChange={e => setReplyText(e.target.value)} 
            placeholder={`Respondendo a @${comment.authorName}...`} 
            className="flex-grow bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-emerald-500/40"
           />
           <button type="submit" className="p-2 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-all"><Send size={14} fill="currentColor" /></button>
        </form>
      )}

      {comment.replies && comment.replies.map(reply => (
        <CommentItem key={reply.id} postId={postId} comment={reply} currentUser={currentUser} depth={depth + 1} onRefresh={onRefresh} />
      ))}
    </div>
  );
};

export const FeedPost: React.FC<{ 
  post: Post; 
  currentUser: User; 
  index: number; 
  onReact: (id: string) => void; 
  onAddComment: (postId: string, text: string) => void; 
  onToggleBookmark: (id: string) => void; 
  onRefresh: () => void 
}> = ({ post, currentUser, index, onReact, onAddComment, onToggleBookmark, onRefresh }) => {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editedPostText, setEditedPostText] = useState(post.content);
  const navigate = useNavigate();
  
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  const isLiked = post.likedBy?.includes(currentUser.id);
  const isBookmarked = currentUser.bookmarks?.includes(post.id);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleSubmitComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  const handleSaveToggle = () => {
    onToggleBookmark(post.id);
    setShowMenu(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: `TRIBO - Post de ${post.authorName}`,
      text: post.type === 'text' ? post.content : `Confira este rastro digital de ${post.authorName} na TRIBO.`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        alert('Link da TRIBO copiado para a área de transferência!');
      }
      if (navigator.vibrate) navigator.vibrate(10);
    } catch (err) {
      console.log('Erro ao compartilhar:', err);
    }
  };

  const handleEditPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedPostText.trim()) return;
    UserDatabase.editPost(post.id, editedPostText);
    setIsEditingPost(false);
    onRefresh();
  };

  return (
    <div 
      ref={domRef}
      className={`bg-zinc-900/40 border border-white/5 rounded-[3.5rem] p-8 space-y-6 shadow-2xl relative transition-all duration-700 ${isVisible ? `post-animation stagger-${(index % 5) + 1}` : 'opacity-0 translate-y-20 scale-95 blur-sm'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => navigate(`/profile/${post.authorId}`)}
            className={`w-14 h-14 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-500 shadow-xl ${isLiked ? 'border-rose-500 scale-110 shadow-rose-500/20' : 'border-white/10'}`}
          >
            <img src={post.authorAvatar} className="w-full h-full object-cover" alt="" />
          </div>
          <div onClick={() => navigate(`/profile/${post.authorId}`)} className="cursor-pointer">
            <div className="flex items-center gap-2">
               <h4 className={`font-black tracking-tight transition-colors duration-500 ${isLiked ? 'text-rose-500' : 'text-white'}`}>{post.authorName}</h4>
               {post.authorIdentity === IdentityType.PROFESSIONAL && <ShieldCheck size={14} className="text-emerald-500" />}
               {post.communityName && (
                 <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                   {post.communityName}
                 </span>
               )}
            </div>
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{post.timestamp}</p>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} className="p-3 text-zinc-600 hover:text-white transition-colors"><MoreHorizontal size={20}/></button>
          {showMenu && (
            <div className="absolute top-12 right-0 w-48 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
              <button onClick={handleSaveToggle} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-left">
                <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} className={isBookmarked ? "text-emerald-500" : ""} />
                {isBookmarked ? 'Remover dos Salvos' : 'Salvar Post'}
              </button>
              {post.authorId === currentUser.id && (
                <>
                  <button 
                    onClick={() => {
                      setIsEditingPost(true);
                      setShowMenu(false);
                      setEditedPostText(post.content);
                    }} 
                    className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-left"
                  >
                    <Edit3 size={16} />
                    Editar Postagem
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm("Deseja remover esta postagem?")) {
                        UserDatabase.deletePost(post.id);
                        onRefresh();
                        setShowMenu(false);
                        if (navigator.vibrate) navigator.vibrate([30, 30]);
                      }
                    }} 
                    className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-500/5 transition-all text-left"
                  >
                    <Trash2 size={16} />
                    Excluir Postagem
                  </button>
                </>
              )}
              <button onClick={() => setShowMenu(false)} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase text-zinc-500 hover:bg-white/5 transition-all text-left">
                <Flag size={16} />
                Denunciar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-2 space-y-4">
        {isEditingPost ? (
          <form onSubmit={handleEditPostSubmit} className="space-y-3 animate-in fade-in">
            <textarea
              autoFocus
              value={editedPostText}
              onChange={e => setEditedPostText(e.target.value)}
              className="w-full h-32 bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/40 resize-none font-medium leading-relaxed"
            />
            <div className="flex gap-2 justify-end">
              <button 
                type="button" 
                onClick={() => { setIsEditingPost(false); setEditedPostText(post.content); }} 
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        ) : (
          <>
            {post.content && post.type === 'text' && <p className="text-zinc-200 text-lg font-medium leading-relaxed">{post.content}</p>}
            {post.type === 'video' && (
              <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-inner group">
                <video src={post.content} className="w-full max-h-[500px] object-cover" controls playsInline />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors pointer-events-none" />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/5 px-2">
         <div className="flex items-center gap-6">
            <button onClick={() => onReact(post.id)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-125 ${isLiked ? 'text-rose-500' : 'text-zinc-500 hover:text-white'}`}>
              <Heart 
                size={22} 
                fill={isLiked ? "currentColor" : "none"} 
                className={`transition-all duration-300 ${isLiked ? 'animate-heart-pulse text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] scale-125' : 'hover:scale-110'}`} 
              />
              <span className={`transition-colors duration-300 ${isLiked ? 'text-rose-500 font-black' : ''}`}>Curtir • {post.likedBy?.length || 0}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${showComments ? 'text-emerald-500' : 'text-zinc-500 hover:text-white'}`}>
              <MessageCircle size={20} />
              Comentar ({post.comments?.length || 0})
            </button>
            <button onClick={handleShare} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all active:scale-110">
              <Share2 size={20} />
              <span className="hidden md:inline">Propagar</span>
            </button>
         </div>
         <button onClick={() => onToggleBookmark(post.id)} className={`transition-all active:scale-125 ${isBookmarked ? 'text-emerald-500' : 'text-zinc-500 hover:text-white'}`}>
           <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
         </button>
      </div>

      {showComments && (
        <div className="pt-6 space-y-8 animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleSubmitComment} className="flex gap-3 mb-6">
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Escreva algo na Tribo..." className="flex-grow bg-zinc-950 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/40" />
            <button type="submit" className="p-3 bg-emerald-500 text-black rounded-2xl hover:bg-emerald-400 transition-all active:scale-95"><Send size={18} fill="currentColor" /></button>
          </form>
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-6">
              {post.comments.map(comment => (
                <CommentItem key={comment.id} postId={post.id} comment={comment} currentUser={currentUser} onRefresh={onRefresh} />
              ))}
            </div>
          ) : <p className="text-center text-[9px] font-black uppercase text-zinc-700 py-4">Sua voz importa. Comente primeiro.</p>}
        </div>
      )}
    </div>
  );
};
