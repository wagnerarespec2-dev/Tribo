import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  Legend
} from 'recharts';
import { 
  Clock, 
  Activity, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Moon, 
  Sun, 
  Sunset, 
  Sunrise, 
  Plus, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { User } from '../../types';

interface ConnectionStatsProps {
  user: User;
}

interface DayData {
  dia: string;
  horas: number;
}

interface PeriodData {
  periodo: string;
  acessos: number;
}

export const ConnectionStats: React.FC<ConnectionStatsProps> = ({ user }) => {
  const statsKey = `tribo_wellbeing_stats_${user.id}`;

  // Default values
  const defaultDays: DayData[] = [
    { dia: 'Qui', horas: 1.8 },
    { dia: 'Sex', horas: 2.2 },
    { dia: 'Sáb', horas: 3.5 },
    { dia: 'Dom', horas: 4.1 },
    { dia: 'Seg', horas: 1.5 },
    { dia: 'Ter', horas: 1.9 },
    { dia: 'Qua (Hoje)', horas: 2.4 }
  ];

  const defaultPeriods: PeriodData[] = [
    { periodo: 'Manhã', acessos: 12 },
    { periodo: 'Tarde', acessos: 25 },
    { periodo: 'Noite', acessos: 38 },
    { periodo: 'Madrugada', acessos: 5 }
  ];

  const [daysData, setDaysData] = useState<DayData[]>(defaultDays);
  const [periodsData, setPeriodsData] = useState<PeriodData[]>(defaultPeriods);
  const [dailyLimit, setDailyLimit] = useState<number>(3.0); // em horas
  const [inputTodayHours, setInputTodayHours] = useState<number>(2.4);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Carregar dados salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(statsKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.daysData) setDaysData(parsed.daysData);
        if (parsed.periodsData) setPeriodsData(parsed.periodsData);
        if (parsed.dailyLimit) setDailyLimit(parsed.dailyLimit);
        if (parsed.daysData && parsed.daysData.length > 0) {
          setInputTodayHours(parsed.daysData[parsed.daysData.length - 1].horas);
        }
      } catch (e) {
        console.error('Erro ao ler estatísticas de bem-estar', e);
      }
    } else {
      // Salvar os padrões no localStorage
      const initial = { daysData: defaultDays, periodsData: defaultPeriods, dailyLimit: 3.0 };
      localStorage.setItem(statsKey, JSON.stringify(initial));
    }
  }, [user.id, statsKey]);

  // Salvar no localStorage sempre que houver alteração
  const saveStats = (newDays: DayData[], newPeriods: PeriodData[], newLimit: number) => {
    localStorage.setItem(statsKey, JSON.stringify({
      daysData: newDays,
      periodsData: newPeriods,
      dailyLimit: newLimit
    }));
  };

  const handleUpdateTodayHours = (newVal: number) => {
    const cleanVal = parseFloat(newVal.toFixed(1));
    setInputTodayHours(cleanVal);
    
    const updatedDays = [...daysData];
    // O último item é hoje
    if (updatedDays.length > 0) {
      updatedDays[updatedDays.length - 1].horas = cleanVal;
    }
    setDaysData(updatedDays);
    saveStats(updatedDays, periodsData, dailyLimit);

    setFeedbackMsg('Histórico de uso atualizado em tempo real!');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleUpdateLimit = (newLimit: number) => {
    const cleanLimit = parseFloat(newLimit.toFixed(1));
    setDailyLimit(cleanLimit);
    saveStats(daysData, periodsData, cleanLimit);
  };

  const handleSimulateAccess = (periodName: string) => {
    const updatedPeriods = periodsData.map(p => {
      if (p.periodo === periodName) {
        return { ...p, acessos: p.acessos + 1 };
      }
      return p;
    });
    setPeriodsData(updatedPeriods);
    saveStats(daysData, updatedPeriods, dailyLimit);

    setFeedbackMsg(`Acesso simulado no período da ${periodName}!`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleResetData = () => {
    if (confirm("Deseja restaurar as estatísticas para os valores de fábrica da Tribo?")) {
      setDaysData(defaultDays);
      setPeriodsData(defaultPeriods);
      setDailyLimit(3.0);
      setInputTodayHours(2.4);
      localStorage.removeItem(statsKey);
      setFeedbackMsg('Dados restaurados!');
      setTimeout(() => setFeedbackMsg(''), 3000);
    }
  };

  // Cálculos de bem-estar
  const todayHours = daysData[daysData.length - 1]?.horas || 0;
  const isOverLimit = todayHours > dailyLimit;
  const percentageOfLimit = Math.min(Math.round((todayHours / dailyLimit) * 100), 100);
  const weeklyAverage = parseFloat((daysData.reduce((acc, d) => acc + d.horas, 0) / daysData.length).toFixed(1));
  const totalWeeklyHours = parseFloat(daysData.reduce((acc, d) => acc + d.horas, 0).toFixed(1));
  const totalAccesses = periodsData.reduce((acc, p) => acc + p.acessos, 0);

  // Custom tooltips para os gráficos
  const renderAreaTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-1">{payload[0].payload.dia}</p>
          <p className="text-sm font-black text-emerald-400">{payload[0].value} h de tela</p>
        </div>
      );
    }
    return null;
  };

  const renderBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-1">{payload[0].payload.periodo}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-sm font-black text-white">{payload[0].value} aberturas de app</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Resumo executivo em Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Progresso Limite Diário */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Clock size={100} className="text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Limite Diário</span>
              <Target size={18} className="text-emerald-400" />
            </div>
            
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-black text-white tracking-tight">{todayHours}</span>
              <span className="text-sm font-bold text-zinc-650">/ {dailyLimit}h hoje</span>
            </div>

            {/* Barra de Progresso Realista */}
            <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850 p-[2px] mb-4">
              <div 
                className={`h-full rounded-full transition-all duration-1000 shadow-lg ${
                  isOverLimit 
                    ? 'bg-gradient-to-r from-rose-500 to-rose-400 shadow-rose-500/20' 
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-emerald-500/20'
                }`}
                style={{ width: `${percentageOfLimit}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-2">
            {isOverLimit ? (
              <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-2xl w-full">
                <AlertTriangle size={14} className="shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-wider">Limite Excedido! Faça uma pausa.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl w-full">
                <CheckCircle size={14} className="shrink-0 text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-wider">Hábito equilibrado e saudável</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Média de Uso Semanal */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Activity size={100} className="text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Média Semanal</span>
              <Activity size={18} className="text-zinc-500" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-white tracking-tight">{weeklyAverage}h</span>
              <span className="text-xs font-bold text-zinc-500">por dia</span>
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-2">
              Total acumulado de <span className="text-emerald-400">{totalWeeklyHours}h</span> nos últimos 7 dias.
            </p>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6 flex items-center justify-between text-[10px] font-bold text-zinc-500">
            <span>Foco e Conexão Sincronizados</span>
            <span className="text-emerald-500 font-extrabold flex items-center gap-1">
              <Sparkles size={10} className="animate-pulse" /> Tribo OS 2026
            </span>
          </div>
        </div>

        {/* Card 3: Frequência ou Aberturas de APP */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Target size={100} className="text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Frequência Semanal</span>
              <div className="flex gap-1.5">
                <Sunset size={14} className="text-amber-500" />
                <Moon size={14} className="text-zinc-500" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-white tracking-tight">{totalAccesses}</span>
              <span className="text-xs font-bold text-zinc-500">acessos</span>
            </div>

            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-2">
              Pico de uso concentrado no período da <span className="text-emerald-400">Noite</span>.
            </p>
          </div>

          <div className="mt-6">
            <button 
              onClick={() => handleSimulateAccess('Noite')}
              className="w-full bg-zinc-950/80 hover:bg-zinc-900 text-white hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus size={12} className="stroke-[3]" /> Registrar Novo Acesso
            </button>
          </div>
        </div>

      </div>

      {/* Seção Gráfica Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Gráfico 1: Tempo de Tela dos últimos 7 dias (AreaChart) (8 Colunas no desk) */}
        <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800 rounded-[3.5rem] p-8 space-y-6 shadow-2xl relative">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2 select-none">
                <Clock size={18} className="text-emerald-500" /> Registro Diário de Tempo de Tela
              </h4>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">Sua trajetória off-line e on-line de bem-estar</p>
            </div>
            {feedbackMsg && (
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider animate-bounce">
                {feedbackMsg}
              </span>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="dia" 
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
                  unit="h"
                />
                <Tooltip content={renderAreaTooltip} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
                <Area 
                  type="monotone" 
                  dataKey="horas" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Frequência Segmentada por Período (BarChart) (5 Colunas no desk) */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800 rounded-[3.5rem] p-8 space-y-6 shadow-2xl relative">
          <div>
            <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2 select-none">
              <Sunset size={18} className="text-emerald-500" /> Freqüência por Turno
            </h4>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">Distribuição de engajamento diário</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="periodo" 
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
                <Tooltip content={renderBarTooltip} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="acessos" radius={[12, 12, 0, 0]} barSize={28}>
                  {periodsData.map((entry, index) => {
                    const colors = ['#34d399', '#10b981', '#059669', '#047857'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Painel Interativo de Personalização e Controle */}
      <div className="bg-zinc-900/20 border border-zinc-850 rounded-[3.5rem] p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Coluna 1: Ajustador de Habit Tracker e Metas */}
        <div className="space-y-6">
          <h4 className="text-base font-black text-white tracking-tight flex items-center gap-2">
            <Target size={16} className="text-emerald-500" /> Configurar Metas Digitais
          </h4>
          <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
            Use os controles abaixo para definir seu limite máximo diário tolerado de conexão e para atualizar as estatísticas de hoje, exercendo auto-governança digital.
          </p>

          <div className="space-y-5">
            {/* Slider de Limite Diário */}
            <div className="space-y-2 bg-black/45 border border-white/5 p-5 rounded-2xl shadow-inner">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                <span>Meta Máxima Diária</span>
                <span className="text-emerald-400 font-black">{dailyLimit} horas</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="8" 
                step="0.5" 
                value={dailyLimit} 
                onChange={(e) => handleUpdateLimit(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-bold text-zinc-600 mt-1">
                <span>0.5h (Foco total)</span>
                <span>4.0h</span>
                <span>8.0h (Excessivo)</span>
              </div>
            </div>

            {/* Inseridor interativo para hoje */}
            <div className="space-y-2 bg-black/45 border border-white/5 p-5 rounded-2xl shadow-inner">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                <span>Registrar Tempo de Tela de Hoje</span>
                <span className="text-emerald-400 font-black">{inputTodayHours} horas</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={inputTodayHours} 
                onChange={(e) => handleUpdateTodayHours(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-bold text-zinc-600 mt-1">
                <span>Filtrado / Clean</span>
                <span>5.0h</span>
                <span>10.0h (Imersão profunda)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Conselhos de Bem-Estar e Botão de Reset */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h4 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <Info size={16} className="text-emerald-500" /> Recomendações da Tribo
            </h4>
            
            <div className="space-y-3 pt-1">
              {[
                { 
                  icon: Sun, 
                  title: 'Manhã Sem Telas', 
                  desc: 'Evite checar redes na primeira hora do dia. Comece seu amanhecer focado na sua soberania física.', 
                  color: 'text-amber-500' 
                },
                { 
                  icon: Moon, 
                  title: 'Higienização do Sono', 
                  desc: 'Ative o modo invisível e desligue as telas pelo menos 30 minutos antes de se deitar para um descanso reparador.', 
                  color: 'text-zinc-500' 
                }
              ].map((rec, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-zinc-950/20 border border-white/5 shadow-sm">
                  <div className={`p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 ${rec.color} shrink-0 h-fit`}>
                    <rec.icon size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white uppercase tracking-wider mb-1">{rec.title}</h5>
                    <p className="text-[10px] leading-relaxed text-zinc-500 font-medium">{rec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-6 flex-wrap">
            <span className="text-[9px] font-bold text-zinc-600 max-w-xs leading-tight uppercase">
              As estatísticas são armazenadas exclusivamente no ambiente local do seu navegador para manter sua total privacidade.
            </span>
            <button 
              onClick={handleResetData}
              className="px-6 py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-550 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
            >
              <RotateCcw size={12} className="stroke-[3]" /> Restaurar Padrões
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
