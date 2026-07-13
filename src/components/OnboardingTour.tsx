import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Sparkles, ShoppingBag, Users, Check, ChevronRight, ChevronLeft, X, Radio, ArrowRight, HeartHandshake } from 'lucide-react';

interface OnboardingTourProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ userId, isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  // Define steps
  const steps = [
    {
      title: "O Feed Sem Algoritmos",
      subtitle: "Linha do Tempo Soberana",
      route: "/",
      icon: <Sparkles className="text-emerald-400 w-8 h-8" />,
      description: "Sua linha do tempo, organizada de forma puramente cronológica. Sem algoritmos viciantes e sem manipulação de atenção.",
      ownership: "🔒 Seus dados são salvos localmente em seu aparelho e transmitidos ponto a ponto (P2P). Ninguém pode vender sua atenção ou rastrear seus passos.",
      highlightSelector: "feed-nav"
    },
    {
      title: "Comércio Local & Escambo",
      subtitle: "Mercado Sem Intermediários",
      route: "/mercado",
      icon: <ShoppingBag className="text-blue-400 w-8 h-8" />,
      description: "Negocie alimentos frescos, sementes, ferramentas e serviços direto com pessoas da sua vizinhança.",
      ownership: "💰 Sem intermediários corporativos, taxas de plataforma ou anúncios invasivos. Suas trocas e conversas pertencem exclusivamente a você.",
      highlightSelector: "mercado-nav"
    },
    {
      title: "Tribos Descentralizadas",
      subtitle: "Comunidades Autônomas",
      route: "/communities",
      icon: <Users className="text-purple-400 w-8 h-8" />,
      description: "Crie ou participe de cooperativas locais, bairros, mutirões ou grupos de debates com total liberdade.",
      ownership: "🛡️ Você é dono de todo o conteúdo gerado. Apague ou exporte seus dados de comunidade instantaneamente com total controle de privacidade.",
      highlightSelector: "communities-nav"
    }
  ];

  // Sync route with current step
  useEffect(() => {
    if (isOpen) {
      const targetRoute = steps[currentStep].route;
      if (location.pathname !== targetRoute) {
        navigate(targetRoute);
      }
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      if (navigator.vibrate) navigator.vibrate(20);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      if (navigator.vibrate) navigator.vibrate(15);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`tribo_tour_completed_${userId}`, 'true');
    onClose();
    if (navigator.vibrate) navigator.vibrate([30, 50]);
  };

  const activeStep = steps[currentStep];

  return (
    <div className="absolute inset-0 z-[120] bg-black/85 backdrop-blur-md flex flex-col justify-between p-6 animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-safe shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-black italic text-xs">T</div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Tour Interativo</span>
        </div>
        <button 
          onClick={handleComplete}
          className="w-8 h-8 rounded-full bg-zinc-900/80 border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-colors text-zinc-400 active:scale-95"
        >
          <X size={14} />
        </button>
      </div>

      {/* Main Card */}
      <div className="my-auto flex flex-col items-center text-center max-w-sm mx-auto space-y-6 animate-in zoom-in-95 duration-500">
        
        {/* Glow Background Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full scale-150 animate-pulse" />
          <div className="w-16 h-16 rounded-[2rem] bg-zinc-900/90 border border-white/10 flex items-center justify-center relative shadow-2xl">
            {activeStep.icon}
          </div>
        </div>

        {/* Step details */}
        <div className="space-y-2">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">
            {activeStep.subtitle}
          </span>
          <h2 className="text-xl font-black text-white tracking-tight leading-none">
            {activeStep.title}
          </h2>
          <p className="text-zinc-400 text-[11px] leading-relaxed px-2 font-medium">
            {activeStep.description}
          </p>
        </div>

        {/* Dynamic Highlight Card for Data Ownership */}
        <div className="w-full bg-emerald-950/20 border border-emerald-500/25 p-4 rounded-[2rem] text-left relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex gap-2.5">
            <Shield className="text-emerald-400 w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <h4 className="text-[9px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                Sua Soberania de Dados
              </h4>
              <p className="text-[10px] leading-normal text-emerald-200/90 font-semibold">
                {activeStep.ownership}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="space-y-5 pb-4 shrink-0">
        
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-6 bg-emerald-500' : 'w-1.5 bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              className="flex-1 py-3 px-4 rounded-2xl bg-zinc-900 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-1"
            >
              <ChevronLeft size={12} strokeWidth={3} /> Voltar
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex-1 py-3 px-4 rounded-2xl bg-transparent border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-400 transition-all active:scale-95 text-center"
            >
              Pular
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1"
          >
            {currentStep === steps.length - 1 ? (
              <>
                Concluir <Check size={12} strokeWidth={3} />
              </>
            ) : (
              <>
                Avançar <ChevronRight size={12} strokeWidth={3} />
              </>
            )}
          </button>
        </div>

        {/* Spotlight Navigation Guide - subtle prompt */}
        <p className="text-center text-[8px] font-black uppercase tracking-widest text-zinc-600 animate-pulse">
          Navegando automaticamente para a aba correspondente
        </p>
      </div>
    </div>
  );
};
