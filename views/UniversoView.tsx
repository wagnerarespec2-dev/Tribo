
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, Plus, X, Tractor, Coins, Lock, TrendingUp, TrendingDown,
  Sprout, Trophy, Loader2, BarChart3, Droplets, Target, Sparkles, 
  RefreshCcw, Bird, Waves, Droplet, ShieldCheck, Package, 
  Globe, Truck, Ship, Store, Award, Zap, Settings2, Hammer
} from 'lucide-react';
import { User, AgroCrop, AgroGameState, AgroPlot, PlotStatus, AgroAnimal, AgroPen, AgroMachine } from '../types';
import { UserDatabase } from '../services/db';

const CROPS: AgroCrop[] = [
  { id: 'milho', name: 'Milho Híbrido', emoji: '🌽', growthTime: 60, cost: 50, waterNeed: 20, baseYield: 80, xp: 100, minLevel: 1 },
  { id: 'pimenta', name: 'Pimenta Malagueta', emoji: '🌶️', growthTime: 180, cost: 200, waterNeed: 45, baseYield: 180, xp: 350, minLevel: 10 },
  { id: 'soja', name: 'Soja Transgênica', emoji: '🌱', growthTime: 600, cost: 1000, waterNeed: 120, baseYield: 600, xp: 1200, minLevel: 25 },
  { id: 'cana', name: 'Cana Caiana', emoji: '🎋', growthTime: 1200, cost: 5000, waterNeed: 300, baseYield: 4500, xp: 5000, minLevel: 40 },
  { id: 'laranja', name: 'Laranja Pêra', emoji: '🍊', growthTime: 3600, cost: 20000, waterNeed: 800, baseYield: 25000, xp: 15000, minLevel: 60 },
  { id: 'cafe', name: 'Café Arábica Special', emoji: '☕', growthTime: 7200, cost: 100000, waterNeed: 2000, baseYield: 150000, xp: 80000, minLevel: 85 },
];

const ANIMALS: AgroAnimal[] = [
  { id: 'galinha', name: 'Galinha Caipira', emoji: '🐔', productionTime: 300, cost: 800, baseYield: 50, xp: 500, product: 'Ovo', minLevel: 5 },
  { id: 'porco', name: 'Porco Duroc', emoji: '🐖', productionTime: 900, cost: 4000, baseYield: 300, xp: 2000, product: 'Carne', minLevel: 20 },
  { id: 'ovelha', name: 'Ovelha Merino', emoji: '🐑', productionTime: 1800, cost: 15000, baseYield: 1200, xp: 7500, product: 'Lã', minLevel: 35 },
  { id: 'vaca', name: 'Vaca Holandesa', emoji: '🐄', productionTime: 3600, cost: 50000, baseYield: 6000, xp: 25000, product: 'Leite', minLevel: 55 },
  { id: 'touro', name: 'Touro Nelore PO', emoji: '🐂', productionTime: 10800, cost: 500000, baseYield: 150000, xp: 250000, product: 'Genética', minLevel: 90 },
];

const MACHINES: AgroMachine[] = [
  { id: 'drill', name: 'Semeadeira Manual', description: '+20% de Rendimento nas colheitas.', cost: 10000, minLevel: 5, bonusType: 'yield', bonusValue: 1.2 },
  { id: 'tractor', name: 'Trator Compacto', description: '-25% no Tempo de crescimento.', cost: 45000, minLevel: 20, bonusType: 'time', bonusValue: 0.75 },
  { id: 'drone', name: 'Drone de Análise', description: '+50% na Qualidade (Bônus de venda).', cost: 150000, minLevel: 45, bonusType: 'quality', bonusValue: 1.5 },
  { id: 'harvester', name: 'Colheitadeira Industrial', description: '+100% de XP e Rendimento.', cost: 800000, minLevel: 75, bonusType: 'yield', bonusValue: 2.0 },
];

const SALE_TIERS = [
  { id: 'local', name: 'Comércio Local', minLevel: 1, multiplier: 1.0, icon: Store, desc: 'Venda rápida na região.' },
  { id: 'market', name: 'Mercado Nacional', minLevel: 30, multiplier: 2.5, icon: Truck, desc: 'Contratos com grandes redes.' },
  { id: 'export', name: 'Exportação Soberana', minLevel: 70, multiplier: 6.0, icon: Ship, desc: 'Acordos internacionais de elite.' },
];

const WELL_UPGRADES = [
  { level: 1, name: 'Poço Manual', cost: 5000, refill: 5, minLevel: 3 },
  { level: 2, name: 'Semi-Artesiano', cost: 30000, refill: 15, minLevel: 25 },
  { level: 3, name: 'Artesiano Industrial', cost: 150000, refill: 60, minLevel: 50 },
];

const UniversoView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [isLobby, setIsLobby] = useState(true);
  const [activeTab, setActiveTab] = useState<'fazenda' | 'pecuaria' | 'oficina' | 'mercado' | 'status'>('fazenda');
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [selectedPen, setSelectedPen] = useState<number | null>(null);
  const [selectedSaleItem, setSelectedSaleItem] = useState<{id: string, name: string, emoji: string} | null>(null);

  const [gameState, setGameState] = useState<AgroGameState>(() => 
    UserDatabase.getAgroState(currentUser.id)
  );

  const bonusYield = useMemo(() => {
    return gameState.unlockedMachines.reduce((acc, mid) => {
      const machine = MACHINES.find(m => m.id === mid);
      return machine?.bonusType === 'yield' ? acc * machine.bonusValue : acc;
    }, 1.0);
  }, [gameState.unlockedMachines]);

  const bonusTime = useMemo(() => {
    return gameState.unlockedMachines.reduce((acc, mid) => {
      const machine = MACHINES.find(m => m.id === mid);
      return machine?.bonusType === 'time' ? acc * machine.bonusValue : acc;
    }, 1.0);
  }, [gameState.unlockedMachines]);

  // Loop de Sincronização e Regeneração
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setGameState(prev => {
        const well = WELL_UPGRADES.find(w => w.level === prev.wellLevel);
        const waterRegen = (well?.refill || 2);
        
        const nextPlots = prev.plots.map(p => {
          if (!p.cropId || !p.plantedAt) return p;
          const crop = CROPS.find(c => c.id === p.cropId);
          if (!crop) return p;
          const totalTime = crop.growthTime * bonusTime * 1000;
          const progress = (now - p.plantedAt) / totalTime;
          if (progress >= 1.0) return { ...p, status: 'ready' as PlotStatus };
          if (progress > 0.05) return { ...p, status: 'growing' as PlotStatus };
          return p;
        });

        const nextPens = prev.pens.map(p => {
          if (!p.animalId || !p.startedAt) return p;
          const animal = ANIMALS.find(a => a.id === p.animalId);
          if (!animal) return p;
          const progress = (now - p.startedAt) / (animal.productionTime * 1000);
          if (progress >= 1.0) return { ...p, status: 'ready' as any };
          return p;
        });

        const newState = {
          ...prev,
          water: Math.min(prev.level * 1000, prev.water + waterRegen),
          plots: nextPlots,
          pens: nextPens,
          lastCheck: now
        };
        UserDatabase.saveAgroState(currentUser.id, newState);
        return newState;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser.id, bonusTime]);

  const handlePlant = (plotId: number, cropId: string) => {
    const crop = CROPS.find(c => c.id === cropId);
    if (!crop || gameState.credits < crop.cost || gameState.water < crop.waterNeed) return;
    
    setGameState(prev => ({
      ...prev,
      credits: prev.credits - crop.cost,
      water: prev.water - crop.waterNeed,
      plots: prev.plots.map(p => p.id === plotId ? { ...p, cropId, plantedAt: Date.now(), status: 'planted' } : p)
    }));
    setSelectedPlot(null);
  };

  const handleHarvest = (plotId: number) => {
    const plot = gameState.plots.find(p => p.id === plotId);
    if (!plot || plot.status !== 'ready' || !plot.cropId) return;
    const crop = CROPS.find(c => c.id === plot.cropId)!;
    
    const yieldAmount = Math.floor(crop.baseYield * bonusYield);
    
    setGameState(prev => {
      let newXp = prev.xp + crop.xp;
      let newLevel = prev.level;
      while (newXp >= newLevel * 500) {
        newXp -= (newLevel * 500);
        newLevel = Math.min(100, newLevel + 1);
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        inventory: { ...prev.inventory, [crop.id]: (prev.inventory[crop.id] || 0) + yieldAmount },
        plots: prev.plots.map(p => p.id === plotId ? { ...p, cropId: null, plantedAt: null, status: 'empty' } : p)
      };
    });
  };

  const buyMachine = (machineId: string) => {
    const machine = MACHINES.find(m => m.id === machineId);
    if (!machine || gameState.credits < machine.cost || gameState.unlockedMachines.includes(machineId)) return;
    setGameState(prev => ({
      ...prev,
      credits: prev.credits - machine.cost,
      unlockedMachines: [...prev.unlockedMachines, machineId]
    }));
  };

  const sellItem = (itemId: string, tierId: string) => {
    // Fixed: explicit type conversion to number to avoid unknown operator application error
    const amount = Number(gameState.inventory[itemId]) || 0;
    const tier = SALE_TIERS.find(t => t.id === tierId);
    if (amount <= 0 || !tier) return;

    const basePrice = (CROPS.find(c => c.id === itemId)?.cost || ANIMALS.find(a => a.id === itemId)?.cost || 100) / 10;
    const profit = Math.floor(basePrice * amount * tier.multiplier);

    setGameState(prev => ({
      ...prev,
      credits: prev.credits + profit,
      inventory: { ...prev.inventory, [itemId]: 0 }
    }));
    setSelectedSaleItem(null);
  };

  // Fixed: implemented missing upgradeWell function
  const upgradeWell = (level: number) => {
    const upgrade = WELL_UPGRADES.find(w => w.level === level);
    if (!upgrade || gameState.credits < upgrade.cost || gameState.level < upgrade.minLevel) return;
    
    setGameState(prev => ({
      ...prev,
      credits: prev.credits - upgrade.cost,
      wellLevel: level
    }));
  };

  // Fixed: implemented missing handleBuyAnimal function
  const handleBuyAnimal = (penId: number, animalId: string) => {
    const animal = ANIMALS.find(a => a.id === animalId);
    if (!animal || gameState.credits < animal.cost || gameState.level < animal.minLevel) return;
    
    setGameState(prev => ({
      ...prev,
      credits: prev.credits - animal.cost,
      pens: prev.pens.map(p => p.id === penId ? { ...p, animalId, startedAt: Date.now(), status: 'active' } : p) as any
    }));
    setSelectedPen(null);
  };

  if (isLobby) {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-700">
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] animate-pulse"></div>
          <Tractor size={180} className="text-emerald-500 relative z-10 drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]" />
        </div>
        <h1 className="text-8xl font-black italic tracking-tighter text-white uppercase leading-none mb-6">FAZENDA<br/><span className="text-emerald-500">SISTEMA 2026</span></h1>
        <p className="text-zinc-500 font-black uppercase tracking-[0.5em] text-[10px] mb-16">Terminal de Soberania Alimentar</p>
        <button 
          onClick={() => setIsLobby(false)}
          className="group relative bg-emerald-500 hover:bg-emerald-400 text-black font-black px-24 py-10 rounded-[3rem] text-sm uppercase tracking-[0.4em] transition-all active:scale-95 shadow-2xl shadow-emerald-500/20"
        >
          INICIAR SAFRA
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden relative">
      {/* Barra de Status (HUD) */}
      <header className="p-8 bg-zinc-950/40 backdrop-blur-3xl border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsLobby(true)} className="p-5 bg-zinc-900 text-zinc-500 rounded-3xl hover:text-emerald-500 transition-all border border-white/5"><ChevronLeft size={24}/></button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">FAZENDA <span className="text-emerald-500">PÁGINAS</span></h2>
              {gameState.level >= 70 && <div className="bg-amber-400 text-black px-4 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-2 animate-pulse"><Award size={12}/> Soberano Exportador</div>}
            </div>
            <div className="flex items-center gap-6 mt-4">
               <div className="flex items-center gap-3 bg-emerald-500/10 px-6 py-2 rounded-full border border-emerald-500/20 shadow-inner">
                  <Coins size={16} className="text-emerald-500" />
                  <span className="text-sm font-black text-white">R$ {gameState.credits.toLocaleString()}</span>
               </div>
               <div className="flex items-center gap-3 bg-blue-500/10 px-6 py-2 rounded-full border border-blue-500/20 shadow-inner">
                  <Droplets size={16} className="text-blue-500" />
                  <span className="text-sm font-black text-white">{Math.floor(gameState.water)}L</span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 w-full md:w-auto">
           <div className="flex-1 md:w-64 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                 <span className="text-zinc-500">Expansão de Domínio</span>
                 <span className="text-emerald-500">Nível {gameState.level} / 100</span>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                 <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ width: `${(gameState.xp / (gameState.level * 500)) * 100}%` }}></div>
              </div>
           </div>
        </div>
      </header>

      {/* Menu Principal */}
      <nav className="flex bg-zinc-950 p-2 border-b border-white/5 shadow-2xl">
        {[
          { id: 'fazenda', icon: Sprout, label: 'Lavouras' },
          { id: 'pecuaria', icon: Bird, label: 'Rebanhos' },
          { id: 'oficina', icon: Settings2, label: 'Maquinário' },
          { id: 'mercado', icon: Globe, label: 'Bolsa' },
          { id: 'status', icon: Package, label: 'Carga' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-6 rounded-[2rem] text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === t.id ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20' : 'text-zinc-600 hover:text-white'}`}
          >
            <t.icon size={20} /> <span className="hidden lg:inline">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Grid de Atividades */}
      <div className="flex-grow overflow-y-auto p-12 scrollbar-hide bg-zinc-950/20">
        
        {activeTab === 'fazenda' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 animate-in fade-in duration-500">
            {gameState.plots.map(plot => (
              <div 
                key={plot.id}
                onClick={() => {
                  if (plot.status === 'empty') setSelectedPlot(plot.id);
                  if (plot.status === 'ready') handleHarvest(plot.id);
                }}
                className={`aspect-square rounded-[3.5rem] border-2 transition-all relative flex flex-col items-center justify-center cursor-pointer group shadow-2xl ${
                  plot.status === 'locked' ? 'bg-zinc-950/40 border-zinc-900 opacity-40' :
                  plot.status === 'empty' ? 'bg-zinc-900/40 border-zinc-800 hover:border-emerald-500/40' :
                  plot.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500 animate-pulse' :
                  'bg-zinc-900/60 border-emerald-500/20'
                }`}
              >
                {plot.status === 'locked' ? <Lock size={32} className="text-zinc-800" /> : 
                 plot.status === 'empty' ? <Plus size={32} className="text-zinc-700 group-hover:text-emerald-500" /> :
                 (
                   <div className="text-center">
                     <span className="text-7xl mb-4 block drop-shadow-2xl group-hover:scale-110 transition-transform">{CROPS.find(c => c.id === plot.cropId)?.emoji}</span>
                     <span className="text-[8px] font-black uppercase text-zinc-500 absolute top-6 right-8">{plot.status}</span>
                   </div>
                 )
                }
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pecuaria' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-in fade-in duration-500">
             {gameState.pens.map(pen => (
                <div 
                  key={pen.id}
                  onClick={() => pen.status === 'empty' && setSelectedPen(pen.id)}
                  className={`h-72 rounded-[4.5rem] border-2 transition-all flex flex-col items-center justify-center cursor-pointer group shadow-2xl ${
                    pen.status === 'locked' ? 'bg-zinc-950 border-zinc-900 opacity-40' :
                    pen.status === 'empty' ? 'bg-zinc-900 border-zinc-800 hover:border-amber-500/40' :
                    pen.status === 'ready' ? 'bg-amber-500/10 border-amber-500 animate-pulse' :
                    'bg-zinc-900 border-amber-500/20'
                  }`}
                >
                  {pen.status === 'locked' ? <Lock size={40} className="text-zinc-800" /> :
                   pen.status === 'empty' ? (
                      <div className="text-center space-y-3">
                         <div className="w-20 h-20 bg-zinc-950 rounded-[2rem] flex items-center justify-center mx-auto border border-zinc-800 group-hover:border-amber-500/30 transition-all shadow-xl">
                            <Bird size={40} className="text-zinc-700" />
                         </div>
                         <span className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.3em]">Módulo de Criação</span>
                      </div>
                   ) :
                   <div className="text-center relative">
                      <span className="text-9xl block mb-6 drop-shadow-2xl group-hover:scale-110 transition-transform">{ANIMALS.find(a => a.id === pen.animalId)?.emoji}</span>
                      <p className="text-[10px] font-black uppercase text-amber-500 mt-6 tracking-widest">{pen.status === 'ready' ? 'COLETAR PRODUTO' : 'GERANDO CARGA'}</p>
                   </div>
                  }
                </div>
             ))}
           </div>
        )}

        {activeTab === 'oficina' && (
           <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
             <div className="bg-zinc-900/60 p-16 rounded-[5rem] border border-white/5 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
                <div className="p-12 bg-emerald-500/10 rounded-[4rem] border border-emerald-500/20 text-emerald-500 shadow-2xl">
                   <Hammer size={80} />
                </div>
                <div>
                   <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">OFICINA DE <span className="text-emerald-500">MAQUINÁRIO</span></h3>
                   <p className="text-zinc-500 font-medium text-xl max-w-xl leading-relaxed">Adquira tecnologias para otimizar o rendimento e a qualidade de sua produção industrial.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {MACHINES.map(m => {
                  const isOwned = gameState.unlockedMachines.includes(m.id);
                  const isLocked = gameState.level < m.minLevel;
                  return (
                    <div key={m.id} className={`p-10 rounded-[4.5rem] border-2 transition-all flex items-center gap-8 shadow-2xl ${isOwned ? 'bg-emerald-500/5 border-emerald-500' : isLocked ? 'bg-zinc-950 border-zinc-900 opacity-40' : 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/20'}`}>
                       <div className={`p-8 rounded-[2.5rem] ${isOwned ? 'bg-emerald-500 text-black shadow-xl' : 'bg-zinc-950 text-zinc-600'}`}>
                          <Tractor size={40} />
                       </div>
                       <div className="flex-grow">
                          <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-1">{m.name}</h4>
                          <p className="text-xs text-zinc-500 font-medium mb-6">{m.description}</p>
                          {isOwned ? (
                             <div className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-2"><ShieldCheck size={16}/> Operacional</div>
                          ) : (
                             <div className="flex items-center justify-between">
                                <span className="text-xl font-black text-white">R$ {m.cost.toLocaleString()}</span>
                                <button 
                                  disabled={isLocked || gameState.credits < m.cost}
                                  onClick={() => buyMachine(m.id)}
                                  className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${isLocked || gameState.credits < m.cost ? 'bg-zinc-800 text-zinc-600' : 'bg-white text-black hover:bg-emerald-500'}`}
                                >
                                  {isLocked ? `Nível ${m.minLevel}` : 'Adquirir'}
                                </button>
                             </div>
                          )}
                       </div>
                    </div>
                  );
                })}
             </div>
           </div>
        )}

        {activeTab === 'mercado' && (
           <div className="space-y-12 animate-in fade-in duration-500">
             <div className="bg-emerald-500/10 border border-emerald-500/20 p-16 rounded-[5rem] flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl">
                <div className="flex items-center gap-10">
                   <div className="p-10 bg-emerald-500 text-black rounded-[3rem] shadow-2xl">
                      <Truck size={48} />
                   </div>
                   <div>
                      <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">PROTOCOLO DE <span className="text-emerald-500">ESCOAMENTO</span></h3>
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-4 leading-none">Selecione suas mercadorias para negociar nos mercados</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Câmbio Soberano</p>
                   <p className="text-3xl font-black text-emerald-500 uppercase tracking-widest">Global • Estável</p>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {Object.entries(gameState.inventory).map(([id, amount]) => {
                  if ((amount as number) <= 0) return null;
                  const item = CROPS.find(c => c.id === id) || ANIMALS.find(a => a.id === id);
                  return (
                    <div 
                      key={id}
                      onClick={() => setSelectedSaleItem({ id, name: item?.name || id, emoji: item?.emoji || '📦' })}
                      className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3.5rem] text-center hover:border-emerald-500/30 transition-all cursor-pointer shadow-2xl group"
                    >
                      <span className="text-7xl block mb-6 group-hover:scale-110 transition-transform">{item?.emoji}</span>
                      <p className="text-4xl font-black text-white tracking-tighter">{amount.toLocaleString()}</p>
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-3">{item?.name}</p>
                    </div>
                  );
                })}
             </div>
           </div>
        )}

        {activeTab === 'status' && (
           <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="bg-zinc-900/40 border border-white/5 p-12 rounded-[4.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={120} className="text-emerald-500" /></div>
                    <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-10 flex items-center gap-3"><Settings2 size={16}/> Eficiência Industrial</h3>
                    <div className="space-y-8">
                       <div className="flex justify-between items-center"><span className="text-sm font-bold text-zinc-400">Rendimento de Safra</span><span className="text-2xl font-black text-emerald-500">+{Math.round((bonusYield - 1) * 100)}%</span></div>
                       <div className="flex justify-between items-center"><span className="text-sm font-bold text-zinc-400">Tempo de Ciclo</span><span className="text-2xl font-black text-emerald-500">-{Math.round((1 - bonusTime) * 100)}%</span></div>
                    </div>
                 </div>

                 <div className="bg-zinc-900/40 border border-white/5 p-12 rounded-[4.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Droplet size={120} className="text-blue-500" /></div>
                    <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-10 flex items-center gap-3"><Droplets size={16}/> Rede Hídrica</h3>
                    <div className="space-y-8">
                       {WELL_UPGRADES.map(w => {
                         const isOwned = gameState.wellLevel >= w.level;
                         const isUnlocked = gameState.level >= w.minLevel;
                         return (
                           <div key={w.level} className="flex justify-between items-center">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-zinc-400">{w.name}</span>
                                <span className="text-[8px] font-black text-zinc-600 uppercase">Vazão: {w.refill}L/s</span>
                              </div>
                              {isOwned ? <ShieldCheck className="text-blue-500" /> : 
                               <button 
                                 disabled={!isUnlocked || gameState.credits < w.cost || gameState.wellLevel !== w.level - 1}
                                 onClick={() => upgradeWell(w.level)}
                                 className={`px-6 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${isUnlocked && gameState.credits >= w.cost ? 'bg-blue-500 text-black' : 'bg-zinc-800 text-zinc-600'}`}
                               >
                                 R$ {w.cost.toLocaleString()}
                               </button>
                              }
                           </div>
                         );
                       })}
                    </div>
                 </div>
              </div>
           </div>
        )}

      </div>

      {/* Modais (Plantio, Pecuária, Venda) */}
      
      {/* Modal de Plantio */}
      {selectedPlot !== null && (
        <div className="fixed inset-0 z-[150] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="p-12 border-b border-white/5 flex justify-between items-center bg-zinc-950/20">
                 <div>
                    <h3 className="text-4xl font-black italic uppercase text-white tracking-tighter">BIO-SEMEADURA <span className="text-emerald-500">DIGITAL</span></h3>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-3">Inicie um novo ciclo de produção soberana</p>
                 </div>
                 <button onClick={() => setSelectedPlot(null)} className="p-6 text-zinc-600 hover:text-white transition-colors"><X size={48}/></button>
              </div>
              <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[65vh] overflow-y-auto scrollbar-hide">
                 {CROPS.map(crop => {
                   const isLocked = gameState.level < crop.minLevel;
                   return (
                     <div 
                      key={crop.id} 
                      onClick={() => !isLocked && handlePlant(selectedPlot, crop.id)}
                      className={`p-10 rounded-[4rem] border-2 transition-all cursor-pointer group relative shadow-inner ${isLocked ? 'bg-zinc-950 border-zinc-900 opacity-40' : 'bg-zinc-950 border-zinc-800 hover:border-emerald-500 shadow-2xl'}`}
                     >
                        {isLocked && <Lock size={24} className="absolute top-10 right-10 text-zinc-900" />}
                        <div className="flex items-center gap-8">
                           <span className="text-8xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">{crop.emoji}</span>
                           <div>
                              <h4 className="font-black text-white text-3xl uppercase tracking-tighter italic leading-none">{crop.name}</h4>
                              <div className="flex flex-col gap-2 mt-4">
                                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Custo: R$ {crop.cost}</span>
                                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">H2O: {crop.waterNeed}L</span>
                                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ciclo: {Math.round(crop.growthTime * bonusTime / 60)}m</span>
                              </div>
                           </div>
                        </div>
                        {isLocked && <p className="mt-8 text-[9px] font-black text-rose-600 uppercase text-center tracking-[0.5em] leading-none">Desbloqueia no Nível {crop.minLevel}</p>}
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      )}

      {/* Modal de Venda (Escoamento) */}
      {selectedSaleItem && (
        <div className="fixed inset-0 z-[200] bg-black/99 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="w-full max-w-6xl bg-[#080808] border border-white/10 rounded-[6rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="p-16 border-b border-white/5 flex justify-between items-center bg-zinc-950/20">
                 <div className="flex items-center gap-10">
                    <span className="text-9xl drop-shadow-2xl">{selectedSaleItem.emoji}</span>
                    <div>
                      <h3 className="text-6xl font-black italic uppercase text-white tracking-tighter leading-none">PROTOCOLO DE <span className="text-emerald-500">VENDA</span></h3>
                      <p className="text-zinc-600 font-black uppercase text-[12px] tracking-widest mt-4">Escoando lote de {selectedSaleItem.name} ({gameState.inventory[selectedSaleItem.id]})</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedSaleItem(null)} className="p-8 text-zinc-700 hover:text-white transition-all"><X size={60}/></button>
              </div>

              <div className="p-16 grid grid-cols-1 md:grid-cols-3 gap-10">
                 {SALE_TIERS.map(tier => {
                   const isUnlocked = gameState.level >= tier.minLevel;
                   return (
                     <div key={tier.id} className={`p-12 rounded-[5rem] border-2 transition-all flex flex-col items-center text-center relative shadow-inner ${isUnlocked ? 'bg-zinc-950 border-zinc-800 hover:border-emerald-500 shadow-3xl' : 'bg-zinc-950 border-zinc-900 opacity-40'}`}>
                        {!isUnlocked && <Lock size={24} className="absolute top-12 right-12 text-zinc-900" />}
                        <div className={`p-10 rounded-[3rem] mb-10 shadow-2xl ${tier.id === 'export' ? 'bg-amber-400 text-black shadow-amber-400/20' : 'bg-zinc-900 text-emerald-500'} border border-white/5`}>
                           <tier.icon size={56} />
                        </div>
                        <h4 className={`text-2xl font-black uppercase italic leading-none ${tier.id === 'export' ? 'text-amber-400' : 'text-white'}`}>{tier.name}</h4>
                        <p className="text-sm font-medium text-zinc-600 mt-6 leading-relaxed">{tier.desc}</p>
                        
                        <div className="mt-10 mb-12">
                           <span className={`text-[11px] font-black uppercase tracking-[0.4em] px-8 py-3 rounded-full border shadow-inner ${tier.id === 'export' ? 'bg-amber-400/20 text-amber-400 border-amber-400/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>Lucro {Math.round(tier.multiplier * 100)}%</span>
                        </div>
                        
                        <button 
                          disabled={!isUnlocked}
                          onClick={() => sellItem(selectedSaleItem.id, tier.id)}
                          className={`w-full py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-xl ${isUnlocked ? (tier.id === 'export' ? 'bg-amber-400 text-black shadow-amber-400/30' : 'bg-emerald-500 text-black shadow-emerald-500/30') : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'}`}
                        >
                          {isUnlocked ? 'Confirmar Carga' : `Nível ${tier.minLevel}`}
                        </button>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      )}

      {/* Modal de Animais */}
      {selectedPen !== null && (
        <div className="fixed inset-0 z-[150] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="p-12 border-b border-white/5 flex justify-between items-center bg-zinc-950/20">
                 <div>
                    <h3 className="text-4xl font-black italic uppercase text-white tracking-tighter">RECRUTAMENTO <span className="text-amber-500">PECUÁRIO</span></h3>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-3">Selecione uma espécie para o seu rebanho industrial</p>
                 </div>
                 <button onClick={() => setSelectedPen(null)} className="p-6 text-zinc-600 hover:text-white transition-colors"><X size={48}/></button>
              </div>
              <div className="p-12 space-y-6 max-h-[65vh] overflow-y-auto scrollbar-hide">
                 {ANIMALS.map(animal => {
                   const isLocked = gameState.level < animal.minLevel;
                   return (
                     <div 
                      key={animal.id} 
                      onClick={() => !isLocked && handleBuyAnimal(selectedPen, animal.id)}
                      className={`p-10 rounded-[4rem] border-2 flex items-center justify-between transition-all cursor-pointer group shadow-inner ${isLocked ? 'bg-zinc-950 border-zinc-900 opacity-40' : 'bg-zinc-950 border-zinc-800 hover:border-amber-500 shadow-2xl'}`}
                     >
                        <div className="flex items-center gap-12">
                           <span className="text-8xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">{animal.emoji}</span>
                           <div className="space-y-2">
                              <h4 className="font-black text-white text-3xl uppercase tracking-tighter italic leading-none">{animal.name}</h4>
                              <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Produto: {animal.product} • Ciclo: {animal.productionTime / 60}m</p>
                              {isLocked && <p className="text-[9px] font-black text-rose-600 uppercase tracking-[0.4em] leading-none">Nível {animal.minLevel} Requerido</p>}
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-3xl font-black text-amber-500 italic tracking-tighter leading-none">R$ {animal.cost.toLocaleString()}</p>
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default UniversoView;
