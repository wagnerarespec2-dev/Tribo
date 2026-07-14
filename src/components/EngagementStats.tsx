import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  TrendingUp, 
  MessageSquare, 
  ThumbsUp, 
  Users, 
  Sparkles, 
  Calendar,
  Share2,
  Tv,
  Zap,
  RefreshCw
} from 'lucide-react';
import { User, Post, Community } from '../../types';
import { UserDatabase } from '../../services/db';

interface EngagementStatsProps {
  user: User;
  onRefresh?: () => void;
}

interface EngagementDayData {
  name: string;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
}

interface CommunityActivityData {
  name: string;
  postagens: number;
  interacoes: number;
  xpGanhos: number;
}

export const EngagementStats: React.FC<EngagementStatsProps> = ({ user, onRefresh }) => {
  const [selectedWeek, setSelectedWeek] = useState<'current' | 'previous'>('current');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [feedback, setFeedback] = useState<string>('');
  
  // Fetch real data from UserDatabase
  const userPosts = UserDatabase.getPostsByAuthor(user.id);
  const totalPostsCount = userPosts.length;
  
  // Calculate total real likes and comments on user's posts
  const realLikesCount = userPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const realCommentsCount = userPosts.reduce((acc, p) => acc + (p.comments?.length || 0), 0);
  const totalRealInteractions = realLikesCount + realCommentsCount;

  // Let's create some weekly distribution data based on actual posts or realistic seeds
  const [currentWeekData, setCurrentWeekData] = useState<EngagementDayData[]>([]);
  const [previousWeekData, setPreviousWeekData] = useState<EngagementDayData[]>([]);
  const [communityData, setCommunityData] = useState<CommunityActivityData[]>([]);

  // Initialize data on component mount or user change
  useEffect(() => {
    // Current Week Seed (Base numbers + real post metrics integrated for authenticity)
    const baseCurrent: EngagementDayData[] = [
      { name: 'Seg', curtidas: 12 + Math.min(realLikesCount, 3), comentarios: 4 + Math.min(realCommentsCount, 2), compartilhamentos: 2 },
      { name: 'Ter', curtidas: 19 + Math.min(realLikesCount, 5), comentarios: 8 + Math.min(realCommentsCount, 3), compartilhamentos: 5 },
      { name: 'Qua', curtidas: 15 + Math.min(realLikesCount, 4), comentarios: 6 + Math.min(realCommentsCount, 2), compartilhamentos: 3 },
      { name: 'Qui', curtidas: 22 + Math.min(realLikesCount, 6), comentarios: 11 + Math.min(realCommentsCount, 4), compartilhamentos: 7 },
      { name: 'Sex', curtidas: 35 + Math.min(realLikesCount, 10), comentarios: 18 + Math.min(realCommentsCount, 8), compartilhamentos: 12 },
      { name: 'Sáb', curtidas: 48 + Math.min(realLikesCount, 15), comentarios: 25 + Math.min(realCommentsCount, 12), compartilhamentos: 18 },
      { name: 'Dom', curtidas: 40 + Math.min(realLikesCount, 12), comentarios: 20 + Math.min(realCommentsCount, 10), compartilhamentos: 14 },
    ];

    // Previous Week Seed
    const basePrevious: EngagementDayData[] = [
      { name: 'Seg', curtidas: 8, comentarios: 2, compartilhamentos: 1 },
      { name: 'Ter', curtidas: 14, comentarios: 5, compartilhamentos: 3 },
      { name: 'Qua', curtidas: 11, comentarios: 4, compartilhamentos: 2 },
      { name: 'Qui', curtidas: 17, comentarios: 7, compartilhamentos: 4 },
      { name: 'Sex', curtidas: 28, comentarios: 12, compartilhamentos: 9 },
      { name: 'Sáb', curtidas: 38, comentarios: 19, compartilhamentos: 14 },
      { name: 'Dom', curtidas: 32, comentarios: 15, compartilhamentos: 11 },
    ];

    // Fetch user's joined communities
    const allCommunities = UserDatabase.getCommunities();
    const joinedComms = allCommunities.filter(c => user.joinedCommunities?.includes(c.id));
    
    // Map joined communities or use fallback communities if none joined
    let commActivity: CommunityActivityData[] = [];
    if (joinedComms.length > 0) {
      commActivity = joinedComms.map((c, idx) => ({
        name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
        postagens: Math.max(1, totalPostsCount - idx),
        interacoes: 15 + (idx * 8) + (realLikesCount + realCommentsCount),
        xpGanhos: 150 + (idx * 50) + (user.xp % 100)
      }));
    } else {
      // Fallback preview communities
      commActivity = [
        { name: 'Agroecologia', postagens: 2, interacoes: 18, xpGanhos: 180 },
        { name: 'Tecnologia Livre', postagens: 1, interacoes: 12, xpGanhos: 120 },
        { name: 'Arte Independente', postagens: 3, interacoes: 24, xpGanhos: 250 },
      ];
    }

    setCurrentWeekData(baseCurrent);
    setPreviousWeekData(basePrevious);
    setCommunityData(commActivity);
  }, [user.id, realLikesCount, realCommentsCount, totalPostsCount, user.xp, user.joinedCommunities]);

  // Handle simulation of real-time interactions
  const handleSimulateInteraction = () => {
    // Randomly choose a day to add engagement
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const randomDayIndex = Math.floor(Math.random() * days.length);
    const isLike = Math.random() > 0.4;
    
    setCurrentWeekData(prev => prev.map((d, idx) => {
      if (idx === randomDayIndex) {
        return {
          ...d,
          curtidas: isLike ? d.curtidas + 3 : d.curtidas,
          comentarios: !isLike ? d.comentarios + 1 : d.comentarios,
          compartilhamentos: Math.random() > 0.7 ? d.compartilhamentos + 1 : d.compartilhamentos
        };
      }
      return d;
    }));

    // Choose random community to boost
    setCommunityData(prev => prev.map((c, idx) => {
      if (idx === Math.floor(Math.random() * prev.length)) {
        return {
          ...c,
          interacoes: c.interacoes + 2,
          xpGanhos: c.xpGanhos + 20
        };
      }
      return c;
    }));

    // Trigger haptic if available
    if (navigator.vibrate) navigator.vibrate(30);

    setFeedback(isLike ? '🚀 Nova curtida simulada no gráfico!' : '💬 Novo comentário simulado no gráfico!');
    setTimeout(() => setFeedback(''), 3000);
  };

  // Helper calculations based on current vs previous
  const activeData = selectedWeek === 'current' ? currentWeekData : previousWeekData;
  const totalLikes = activeData.reduce((acc, d) => acc + d.curtidas, 0);
  const totalComments = activeData.reduce((acc, d) => acc + d.comentarios, 0);
  const totalShares = activeData.reduce((acc, d) => acc + d.compartilhamentos, 0);
  const totalEngagementScore = totalLikes + (totalComments * 2) + (totalShares * 3);
  
  // Custom tooltips
  const renderEngagementTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-white/15 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-2 border-b border-white/5 pb-1">
            {payload[0].payload.name}
          </p>
          <div className="space-y-1.5">
            {payload.map((p: any) => (
              <div key={p.name} className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.stroke }} />
                  <span className="text-[10px] font-bold text-zinc-400 capitalize">{p.name}</span>
                </div>
                <span className="text-xs font-black text-white">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCommunityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950 border border-white/15 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-black text-emerald-400 uppercase tracking-wide mb-2 border-b border-white/5 pb-1">
            {data.name}
          </p>
          <div className="space-y-1 text-[10px]">
            <p className="text-zinc-400">Postagens: <span className="font-black text-white">{data.postagens}</span></p>
            <p className="text-zinc-400">Interações: <span className="font-black text-white">{data.interacoes}</span></p>
            <p className="text-emerald-400 font-bold">XP Acumulado: <span className="font-black">+{data.xpGanhos} XP</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Bento Grid Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Card 1: Total Engagement Score */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <TrendingUp size={100} className="text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Score de Engajamento</span>
              <Zap size={18} className="text-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-white tracking-tight">{totalEngagementScore}</span>
              <span className="text-xs font-bold text-emerald-500/80">pontos</span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
              Ponderação: Likes (1x), Comentários (2x), Shares (3x)
            </p>
          </div>
        </div>

        {/* Card 2: Total Likes */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <ThumbsUp size={100} className="text-teal-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Total de Curtidas</span>
              <ThumbsUp size={18} className="text-teal-400" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-white tracking-tight">{totalLikes}</span>
              <span className="text-xs font-bold text-zinc-500">recebidas</span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
              {totalPostsCount} postagem{totalPostsCount !== 1 ? 'ns' : ''} ativa{totalPostsCount !== 1 ? 's' : ''} no feed
            </p>
          </div>
        </div>

        {/* Card 3: Total Comments */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <MessageSquare size={100} className="text-indigo-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Total de Comentários</span>
              <MessageSquare size={18} className="text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-white tracking-tight">{totalComments}</span>
              <span className="text-xs font-bold text-zinc-500">respostas</span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
              Média de {totalPostsCount > 0 ? (totalComments / totalPostsCount).toFixed(1) : 0} por publicação
            </p>
          </div>
        </div>

        {/* Card 4: Active Communities joined */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Users size={100} className="text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Comunidades Ativas</span>
              <Users size={18} className="text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-white tracking-tight">{user.joinedCommunities?.length || 0}</span>
              <span className="text-xs font-bold text-zinc-500">filiadas</span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
              Interação direta com tribos locais
            </p>
          </div>
        </div>

      </div>

      {/* Week Selector & Simulators Bar */}
      <div className="flex items-center justify-between bg-zinc-900/40 border border-white/5 p-4 rounded-[2rem] gap-4 flex-wrap">
        <div className="flex bg-zinc-950 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setSelectedWeek('current')} 
            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedWeek === 'current' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-400'}`}
          >
            Semana Atual
          </button>
          <button 
            onClick={() => setSelectedWeek('previous')} 
            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedWeek === 'previous' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-400'}`}
          >
            Semana Passada
          </button>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {feedback && (
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-wider animate-bounce">
              {feedback}
            </span>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Tipo de Gráfico:</span>
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setChartType('area')}
                className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${chartType === 'area' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500'}`}
              >
                Área
              </button>
              <button 
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${chartType === 'line' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500'}`}
              >
                Linha
              </button>
            </div>
          </div>

          <button 
            onClick={handleSimulateInteraction}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-6 py-3 rounded-2xl transition-all shadow-md active:scale-95 text-[9px] uppercase tracking-widest flex items-center gap-2"
          >
            <RefreshCw size={12} className="animate-spin-slow" /> Simular Interação
          </button>
        </div>
      </div>

      {/* Recharts Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Chart 1: Daily Post Engagement (AreaChart / LineChart) (7 Columns) */}
        <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800 rounded-[3.5rem] p-8 space-y-6 shadow-2xl relative">
          <div>
            <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2 select-none">
              <TrendingUp size={18} className="text-emerald-500" /> Curva de Engajamento Diário
            </h4>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">
              Curtidas e comentários recebidos nas postagens ao longo da semana
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#52525b" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip content={renderEngagementTooltip} />
                  <Legend 
                    wrapperStyle={{ paddingTop: 10, fontSize: 10, fontWeight: 'bold' }} 
                    iconType="circle"
                  />
                  <Area 
                    name="curtidas" 
                    type="monotone" 
                    dataKey="curtidas" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorLikes)" 
                  />
                  <Area 
                    name="comentarios" 
                    type="monotone" 
                    dataKey="comentarios" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorComments)" 
                  />
                </AreaChart>
              ) : (
                <LineChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#52525b" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip content={renderEngagementTooltip} />
                  <Legend 
                    wrapperStyle={{ paddingTop: 10, fontSize: 10, fontWeight: 'bold' }} 
                    iconType="circle"
                  />
                  <Line 
                    name="curtidas" 
                    type="monotone" 
                    dataKey="curtidas" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    name="comentarios" 
                    type="monotone" 
                    dataKey="comentarios" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Community Interactions and Activity (BarChart) (5 Columns) */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800 rounded-[3.5rem] p-8 space-y-6 shadow-2xl relative">
          <div>
            <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2 select-none">
              <Users size={18} className="text-emerald-500" /> Presença nas Comunidades
            </h4>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">
              Engajamento e ganho de reputação por comunidade ativa
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={communityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#52525b" 
                  fontSize={9} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip content={renderCommunityTooltip} />
                <Legend 
                  wrapperStyle={{ paddingTop: 10, fontSize: 10, fontWeight: 'bold' }} 
                  iconType="circle"
                />
                <Bar name="interacoes" dataKey="interacoes" radius={[8, 8, 0, 0]} fill="#0ea5e9" barSize={16}>
                  {communityData.map((entry, index) => {
                    const colors = ['#0ea5e9', '#0284c7', '#0369a1'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
                <Bar name="postagens" dataKey="postagens" radius={[8, 8, 0, 0]} fill="#2dd4bf" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Sinergy Footnote */}
      <div className="p-8 bg-zinc-950/40 rounded-[2.5rem] border border-white/5 flex items-center gap-4">
        <Sparkles size={24} className="text-emerald-500 shrink-0 animate-pulse" />
        <p className="text-[10px] leading-relaxed text-zinc-400 font-bold uppercase tracking-wider">
          As métricas de engajamento mostram a sintropia da sua voz na rede descentralizada da <span className="text-white font-extrabold">TRIBO</span>. Continue compartilhando saberes e expandindo conexões para impulsionar sua reputação.
        </p>
      </div>

    </div>
  );
};
