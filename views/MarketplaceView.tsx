
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, User } from '../types';
import { 
  Plus, 
  MapPin, 
  Tag, 
  Search, 
  Filter,
  MessageCircle,
  X,
  Camera,
  CheckCircle,
  Package,
  TrendingUp,
  Award,
  Zap,
  Loader2,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Heart,
  Eye,
  Calendar,
  Info,
  ExternalLink,
  ChevronLeft,
  Store,
  Star
} from 'lucide-react';
import { UserDatabase } from '../services/db';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Eletrônicos', 'Serviços Pro', 'Móveis', 'Moda', 'Veículos', 'Imóveis', 'Esportes', 'Arte', 'Outros'];
const CONDITIONS = ['Novo', 'Usado - Excelente', 'Usado - Bom', 'Usado - Razoável'];

interface MarketplaceViewProps {
  currentUser: User;
  syncTrigger?: number;
}

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ currentUser, syncTrigger }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tudo');
  const [viewMode, setViewMode] = useState<'grid' | 'my-ads' | 'wishlist'>('grid');
  
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    location: currentUser.location || '',
    description: '',
    condition: 'Usado - Excelente' as Product['condition'],
    image: ''
  });

  useEffect(() => {
    refreshProducts();
  }, [syncTrigger]);

  const refreshProducts = () => {
    setProducts(UserDatabase.getProducts());
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (viewMode === 'my-ads') list = products.filter(p => p.sellerId === currentUser.id);
    else if (viewMode === 'wishlist') list = products.filter(p => currentUser.wishlist?.includes(p.id));

    return list.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Tudo' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory, viewMode, currentUser.id, currentUser.wishlist]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await UserDatabase.uploadFile(file);
      setFormData(prev => ({ ...prev, image: base64 }));
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.image) return;

    setIsPublishing(true);
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      price: parseFloat(formData.price),
      location: formData.location,
      category: formData.category || 'Outros',
      image: formData.image,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      status: 'active',
      condition: formData.condition,
      description: formData.description,
      views: 0,
      createdAt: Date.now()
    };

    await new Promise(r => setTimeout(r, 1200));
    UserDatabase.saveProduct(newProduct);
    setIsPublishing(false);
    setIsSellModalOpen(false);
    setFormData({ name: '', price: '', category: '', location: currentUser.location || '', description: '', condition: 'Usado - Excelente', image: '' });
    refreshProducts();
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleToggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    UserDatabase.toggleWishlist(currentUser.id, productId);
    refreshProducts();
    if (navigator.vibrate) navigator.vibrate(5);
  };

  const openDetails = (product: Product) => {
    UserDatabase.incrementProductViews(product.id);
    setSelectedProduct(product);
  };

  const handleContact = (sellerId: string) => {
    if (sellerId === currentUser.id) {
      alert("Você não pode negociar consigo mesmo!");
      return;
    }
    navigate('/chat');
  };

  const handleUpdateStatus = (productId: string, status: 'active' | 'sold') => {
    UserDatabase.updateProductStatus(productId, status);
    refreshProducts();
    if (selectedProduct) {
      const updated = UserDatabase.getProducts().find(p => p.id === productId);
      if (updated) setSelectedProduct(updated);
    }
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Deseja remover este anúncio permanentemente?")) {
      UserDatabase.deleteProduct(productId);
      setSelectedProduct(null);
      refreshProducts();
      if (navigator.vibrate) navigator.vibrate([30, 30]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700 px-4">
      {/* Header Premium com Blur Dinâmico */}
      <section className="relative overflow-hidden rounded-[4rem] bg-zinc-900 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
          <Store size={300} className="rotate-12" />
        </div>
        <div className="flex flex-col md:flex-row items-center p-12 md:p-20 gap-16 relative z-10">
           <div className="flex-1 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Mercado Verificado</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]">MERCADO<br/><span className="text-emerald-500 italic">PRO</span></h1>
              <p className="text-zinc-400 font-bold text-xl max-w-lg leading-relaxed">Economia circular impulsionada pela Tribo. Sem taxas extras, 100% livre.</p>
              
              <div className="flex flex-wrap gap-4 pt-6">
                 <button 
                  onClick={() => setIsSellModalOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-10 py-5 rounded-[2rem] flex items-center gap-3 transition-all shadow-xl shadow-emerald-500/10 uppercase tracking-widest text-[10px] active:scale-95"
                 >
                   <Plus size={20} strokeWidth={3} /> Anunciar Agora
                 </button>
                 <button 
                  onClick={() => setViewMode(viewMode === 'my-ads' ? 'grid' : 'my-ads')}
                  className={`px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all border ${viewMode === 'my-ads' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'}`}
                 >
                   Meus Anúncios
                 </button>
              </div>
           </div>

           <div className="hidden lg:grid grid-cols-2 gap-4 w-full max-w-sm">
              {[
                { label: 'Ativos', val: products.length, icon: Package },
                { label: 'Vendas', val: '45k+', icon: TrendingUp },
                { label: 'Score', val: '9.8', icon: Award },
                { label: 'Seguro', val: '100%', icon: ShieldCheck }
              ].map((s, i) => (
                <div key={i} className="bg-zinc-950/40 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-emerald-500/5 transition-all">
                   <s.icon className="text-emerald-500 mb-4 group-hover:scale-110 transition-transform" size={24} />
                   <p className="text-2xl font-black text-white">{s.val}</p>
                   <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mt-1">{s.label}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Controles Avançados */}
      <div className="flex flex-col lg:flex-row gap-6 sticky top-20 z-[100] py-4 bg-black/60 backdrop-blur-3xl px-2 -mx-2">
         <div className="relative flex-grow group">
           <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-emerald-500 transition-all" size={24} />
           <input 
             type="text" 
             placeholder="O que você deseja encontrar hoje?"
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

      {/* Grid de Produtos Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.length > 0 ? filteredProducts.map(product => (
          <div 
            key={product.id} 
            onClick={() => openDetails(product)}
            className={`group bg-zinc-900/40 border border-white/5 rounded-[3.5rem] overflow-hidden hover:border-emerald-500/30 transition-all duration-700 cursor-pointer flex flex-col shadow-2xl hover:-translate-y-2 ${product.status === 'sold' ? 'opacity-75' : ''}`}
          >
             <div className="aspect-[4/5] relative overflow-hidden bg-zinc-950">
               <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-90 group-hover:opacity-100" />
               <div className="absolute top-6 left-6 flex flex-col gap-2">
                 {product.status === 'sold' ? (
                   <div className="bg-rose-500 text-white px-5 py-2.5 rounded-2xl text-xl font-black border border-rose-400 shadow-2xl uppercase tracking-tighter">
                     Vendido
                   </div>
                 ) : (
                   <div className="bg-black/80 backdrop-blur-2xl text-emerald-400 px-5 py-2.5 rounded-2xl text-xl font-black border border-white/10 shadow-2xl">
                     R$ {product.price.toLocaleString('pt-BR')}
                   </div>
                 )}
                 <div className="bg-white/10 backdrop-blur-xl text-white px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/5 self-start">
                   {product.condition}
                 </div>
               </div>
               
               <button 
                 onClick={(e) => handleToggleWishlist(e, product.id)}
                 className={`absolute top-6 right-6 p-4 rounded-2xl backdrop-blur-2xl transition-all border ${currentUser.wishlist?.includes(product.id) ? 'bg-rose-500 text-white border-rose-400' : 'bg-black/40 text-white border-white/10 hover:bg-rose-500/20'}`}
               >
                 <Heart size={20} fill={currentUser.wishlist?.includes(product.id) ? 'currentColor' : 'none'} />
               </button>

               {product.sellerId === currentUser.id && (
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     handleDeleteProduct(product.id);
                   }}
                   className="absolute bottom-6 right-6 p-4 bg-zinc-950/80 backdrop-blur-2xl text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-2xl"
                   title="Excluir Anúncio"
                 >
                   <Trash2 size={20} />
                 </button>
               )}
             </div>

             <div className="p-8 flex flex-col flex-grow">
               <div className="flex-grow">
                 <h3 className="text-2xl font-black text-white tracking-tighter truncate group-hover:text-emerald-400 transition-colors mb-2">{product.name}</h3>
                 <div className="flex items-center gap-4 text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-6">
                    <span className="flex items-center gap-1"><MapPin size={12}/> {product.location}</span>
                    <span className="flex items-center gap-1"><Eye size={12}/> {product.views || 0}</span>
                 </div>
               </div>

               <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <img src={`https://picsum.photos/seed/${product.sellerId}/100`} className="w-10 h-10 rounded-xl border border-white/10 object-cover" />
                    <div>
                      <p className="text-[8px] font-black text-zinc-500 uppercase">Vendedor</p>
                      <p className="text-[10px] font-black text-white">@{product.sellerName.split(' ')[0]}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-zinc-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" size={20} />
               </div>
             </div>
          </div>
        )) : (
          <div className="col-span-full py-32 text-center bg-zinc-900/10 rounded-[4rem] border-4 border-dashed border-white/5">
             <ShoppingBag size={80} className="mx-auto text-zinc-800 mb-8" />
             <p className="text-2xl font-black text-zinc-600 tracking-tight">Nenhum item encontrado</p>
             <button onClick={() => { setSelectedCategory('Tudo'); setViewMode('grid'); }} className="mt-6 text-emerald-500 font-black uppercase tracking-widest text-[10px]">Limpar Filtros</button>
          </div>
        )}
      </div>

      {/* Modal de Detalhes Profissional */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="w-full max-w-6xl h-full md:h-auto bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-500 relative">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 z-50 p-4 bg-black/60 text-white rounded-2xl backdrop-blur-xl border border-white/10 hover:bg-emerald-500 hover:text-black transition-all"><X size={24}/></button>
              
              <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-zinc-950 flex items-center justify-center">
                 <img src={selectedProduct.image} className="w-full h-full object-contain" />
              </div>

              <div className="w-full md:w-1/2 p-10 md:p-16 overflow-y-auto scrollbar-hide flex flex-col">
                 <div className="space-y-8 flex-grow">
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em]">{selectedProduct.category}</span>
                       <h2 className="text-5xl font-black text-white tracking-tighter leading-none">{selectedProduct.name}</h2>
                    </div>

                    <div className="flex flex-wrap gap-4">
                       <div className="bg-zinc-900 border border-white/5 px-6 py-4 rounded-3xl flex flex-col">
                          <span className="text-[8px] font-black text-zinc-500 uppercase mb-1">Preço Sugerido</span>
                          <span className="text-3xl font-black text-emerald-400">R$ {selectedProduct.price.toLocaleString('pt-BR')}</span>
                       </div>
                       <div className="bg-zinc-900 border border-white/5 px-6 py-4 rounded-3xl flex flex-col">
                          <span className="text-[8px] font-black text-zinc-500 uppercase mb-1">Condição</span>
                          <span className="text-lg font-black text-white">{selectedProduct.condition}</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"><Info size={14}/> Descrição do Item</h4>
                       <p className="text-zinc-400 text-lg leading-relaxed font-medium">{selectedProduct.description || 'O vendedor não forneceu uma descrição detalhada.'}</p>
                    </div>

                    <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                       <div className="flex items-center gap-6">
                          <div className="relative">
                            <img src={`https://picsum.photos/seed/${selectedProduct.sellerId}/200`} className="w-20 h-20 rounded-[1.8rem] border-2 border-emerald-500/30 object-cover" />
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1 rounded-lg"><CheckCircle size={12} /></div>
                          </div>
                          <div>
                            <p className="text-xl font-black text-white tracking-tight">{selectedProduct.sellerName}</p>
                            <div className="flex items-center gap-2 text-amber-400">
                               <Star size={12} fill="currentColor"/> <span className="text-xs font-black">4.9 Reputação</span>
                            </div>
                          </div>
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-[9px] font-black text-zinc-600 uppercase mb-1">Desde</span>
                          <span className="text-sm font-black text-zinc-400">Março 2026</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                       <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-2xl"><MapPin size={14}/> {selectedProduct.location}</div>
                       <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-2xl"><Calendar size={14}/> Postado {new Date(selectedProduct.createdAt).toLocaleDateString()}</div>
                    </div>
                 </div>

                 <div className="pt-12 flex flex-col gap-4">
                    {selectedProduct.sellerId === currentUser.id ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                          {selectedProduct.status === 'active' ? (
                            <button 
                              onClick={() => handleUpdateStatus(selectedProduct.id, 'sold')}
                              className="flex-grow bg-rose-500 hover:bg-rose-400 text-white font-black py-7 rounded-[2.5rem] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-rose-500/20 uppercase tracking-[0.2em] text-xs active:scale-95"
                            >
                              <CheckCircle size={22} /> Marcar como Vendido
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUpdateStatus(selectedProduct.id, 'active')}
                              className="flex-grow bg-emerald-500 hover:bg-emerald-400 text-black font-black py-7 rounded-[2.5rem] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-emerald-500/20 uppercase tracking-[0.2em] text-xs active:scale-95"
                            >
                              <Package size={22} /> Marcar como Disponível
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteProduct(selectedProduct.id)}
                            className="p-7 rounded-[2.5rem] bg-zinc-800 hover:bg-rose-500 text-white transition-all border border-white/10"
                            title="Excluir Anúncio"
                          >
                            <Trash2 size={24} />
                          </button>
                        </div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase text-center tracking-widest">Você é o proprietário deste anúncio</p>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleContact(selectedProduct.sellerId)}
                          disabled={selectedProduct.status === 'sold'}
                          className={`flex-grow font-black py-7 rounded-[2.5rem] flex items-center justify-center gap-3 transition-all shadow-2xl uppercase tracking-[0.2em] text-xs active:scale-95 ${selectedProduct.status === 'sold' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'}`}
                        >
                          <MessageCircle size={22} fill={selectedProduct.status === 'sold' ? 'none' : 'currentColor'} /> 
                          {selectedProduct.status === 'sold' ? 'Item Vendido' : 'Chamar no Papo'}
                        </button>
                        <button 
                          onClick={(e) => handleToggleWishlist(e, selectedProduct.id)}
                          className={`p-7 rounded-[2.5rem] transition-all border ${currentUser.wishlist?.includes(selectedProduct.id) ? 'bg-rose-500 text-white border-rose-400' : 'bg-white/5 text-zinc-500 border-white/10 hover:border-white/30'}`}
                        >
                          <Heart size={24} fill={currentUser.wishlist?.includes(selectedProduct.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    )}
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Anúncio (Vender) */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[4rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-zinc-950/20">
                <div>
                  <h3 className="text-4xl font-black italic tracking-tighter">ANUNCIAR <span className="text-emerald-500">ITEM</span></h3>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2">Converta seus objetos em créditos ou dinheiro</p>
                </div>
                <button onClick={() => setIsSellModalOpen(false)} className="text-zinc-600 hover:text-white p-4 transition-colors"><X size={40} /></button>
              </div>

              <form onSubmit={handleCreateAd} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className={`aspect-video rounded-[3rem] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${formData.image ? 'border-emerald-500' : 'border-zinc-800 hover:border-emerald-500/40 bg-zinc-950'}`}
                 >
                    {formData.image ? (
                      <img src={formData.image} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-8">
                        <Camera size={48} className="text-zinc-800 mb-4 mx-auto" />
                        <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Adicionar Foto Principal</span>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                 </div>

                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Nome do Produto</label>
                          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Mac Studio 2026" className="w-full bg-zinc-950 border border-white/5 rounded-3xl px-8 py-5 text-lg font-bold outline-none focus:border-emerald-500/40" required />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Preço (R$)</label>
                          <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="w-full bg-zinc-950 border border-white/5 rounded-3xl px-8 py-5 text-2xl font-black text-emerald-500 outline-none focus:border-emerald-500/40" required />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Categoria</label>
                          <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-5 font-bold outline-none appearance-none">
                             <option value="">Escolher...</option>
                             {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Condição</label>
                          <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as any})} className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-5 font-bold outline-none appearance-none">
                             {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Descrição</label>
                       <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Venda o seu peixe! Fale sobre o estado, tempo de uso e detalhes extras." className="w-full h-32 bg-zinc-950 border border-white/5 rounded-[2rem] px-8 py-6 outline-none focus:border-emerald-500/40 resize-none font-medium"></textarea>
                    </div>
                 </div>

                 <button 
                  type="submit"
                  disabled={isPublishing || !formData.name || !formData.price || !formData.image}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 text-black font-black py-8 rounded-[2.5rem] transition-all shadow-2xl shadow-emerald-500/20 uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-3"
                 >
                    {isPublishing ? <Loader2 className="animate-spin" size={24} /> : (
                      <><Zap size={24} fill="currentColor"/> Publicar Anúncio</>
                    )}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceView;
