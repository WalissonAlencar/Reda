import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PartnerSchool } from '../types';
import {
  BookOpen,
  GraduationCap,
  Building2,
  Coins,
  ArrowRight,
  Check,
  ChevronDown,
  Sparkles,
  TrendingUp,
  PenTool,
  HelpCircle,
  Lock,
  Layers,
  Award,
  Users
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

interface CreditPackage {
  id: string;
  title: string;
  description: string;
  credits: number;
  price: number;
  popular?: boolean;
  discount?: string;
}

export function LandingPage({ onNavigateToLogin }: LandingPageProps) {
  const [partnerSchools, setPartnerSchools] = useState<PartnerSchool[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Demo Essay Interactive State
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);

  // SEO Update
  useEffect(() => {
    document.title = "Redarum | Correção feita por gente!";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Eleve sua nota no ENEM com a Redarum. Correção rápida, detalhada e em sistema de avaliação dupla cega.");
    }
  }, []);

  // Fetch dynamic data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch partner schools
        const { data: schoolsData } = await supabase
          .from('partner_schools')
          .select('*')
          .order('name');
        if (schoolsData) setPartnerSchools(schoolsData);
      } catch (e) {
        console.error("Error fetching schools", e);
      } finally {
        setLoadingSchools(false);
      }

      try {
        // Fetch credit packages
        const { data: pkgsData } = await supabase
          .from('credit_packages')
          .select('*')
          .order('credits');
        if (pkgsData && pkgsData.length > 0) {
          setPackages(pkgsData);
        } else {
          // Fallback static packages
          setPackages([
            {
              id: 'fallback-1',
              title: 'Plano Essencial',
              description: 'Ideal para quem quer testar e iniciar seus treinos semanais.',
              credits: 3,
              price: 29.90,
              popular: false,
              discount: 'R$ 9,96/redação'
            },
            {
              id: 'fallback-2',
              title: 'Plano Foco ENEM',
              description: 'Nossa melhor recomendação para garantir a nota 900+ no exame.',
              credits: 10,
              price: 79.90,
              popular: true,
              discount: 'R$ 7,99/redação'
            },
            {
              id: 'fallback-3',
              title: 'Plano Avançado',
              description: 'Cronograma intenso de escrita com correções aprofundadas.',
              credits: 20,
              price: 139.90,
              popular: false,
              discount: 'R$ 6,99/redação'
            }
          ]);
        }
      } catch (e) {
        console.error("Error fetching packages", e);
      } finally {
        setLoadingPackages(false);
      }
    }
    fetchData();
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Como funciona o sistema de correção dupla cega?",
      answer: "Cada redação é enviada para dois corretores diferentes de forma 100% anônima (eles não sabem quem é o aluno nem quem é o outro corretor). Se as notas forem convergentes, a média é calculada. Em caso de divergência significativa, um terceiro avaliador sênior define a nota final, garantindo a máxima precisão alinhada ao ENEM."
    },
    {
      question: "Qual o prazo para receber a redação corrigida?",
      answer: "Nosso prazo médio é de 24 a 48 horas. Garantimos que sua redação será corrigida detalhadamente, com apontamentos específicos em cada uma das 5 competências do ENEM."
    },
    {
      question: "Quem são os corretores da plataforma?",
      answer: "Toda a nossa equipe é composta por corretores profissionais graduados em Letras, com ampla experiência na banca oficial do ENEM."
    },
    {
      question: "Posso utilizar a Redarum de forma avulsa ou preciso de mensalidade?",
      answer: "Não trabalhamos com mensalidades obrigatórias. Você adquire créditos de redação quando precisar e eles não expiram enquanto sua conta estiver ativa. Você escreve e envia no seu próprio ritmo!"
    },
    {
      question: "O sistema aceita redação digitada ou apenas manuscrita?",
      answer: "Recomendamos fortemente o envio da folha manuscrita (tirando uma foto nítida do seu celular ou fazendo upload do arquivo em PDF/PNG), pois isso simula as condições reais do dia da prova oficial do ENEM."
    }
  ];

  const highlights = [
    {
      id: 1,
      title: "Desvio Gramatical",
      desc: "Inadequação na concordância nominal. Deve-se concordar o adjetivo com o substantivo.",
      type: "error",
      coord: "top-[25%] left-[20%]"
    },
    {
      id: 2,
      title: "Excelente Conectivo",
      desc: "Excelente uso do elemento coesivo interparágrafo para iniciar a argumentação.",
      type: "success",
      coord: "top-[50%] left-[5%]"
    },
    {
      id: 3,
      title: "Proposta de Intervenção",
      desc: "Ótimo detalhamento do agente e do meio/modo na proposta de intervenção social.",
      type: "info",
      coord: "bottom-[20%] left-[45%]"
    }
  ];

  return (
    <div className="bg-slate-950 text-slate-100 font-sans min-h-screen selection:bg-brand-orange selection:text-white overflow-x-hidden">

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center font-bold text-white italic text-xl shadow-lg shadow-brand-orange/20">
              R
            </div>
            <span className="text-2xl font-black tracking-tight text-white font-display">Redarum</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#demo" className="hover:text-white transition-colors">Visualizar Painel</a>
            <a href="#plans" className="hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="hover:text-white transition-colors">Dúvidas</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              id="btn_header_login"
              onClick={onNavigateToLogin}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-all flex items-center gap-2"
            >
              <Lock size={14} />
              Área Restrita
            </button>
            <button
              id="btn_header_cta"
              onClick={onNavigateToLogin}
              className="px-6 py-2.5 bg-brand-orange hover:bg-orange-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-orange/15 hover:-translate-y-0.5"
            >
              Começar Agora
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:py-32 overflow-hidden bg-[radial-gradient(circle_at_30%_20%,_rgba(30,58,138,0.15),_transparent_40%),_radial-gradient(circle_at_70%_60%,_rgba(251,146,60,0.06),_transparent_45%)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-brand-orange text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} />
              Sistema Dupla Cega ENEM
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight font-display tracking-tight">
              A redação nota <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-amber-400">1000</span> ao seu alcance.
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Escreva suas redações, envie de forma manuscrita e receba análises aprofundadas com foco total nos critérios do ENEM. Correção feita por pessoas!.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                id="btn_hero_primary"
                onClick={onNavigateToLogin}
                className="w-full sm:w-auto px-8 py-4 bg-brand-orange hover:bg-orange-500 text-white font-bold rounded-xl shadow-xl shadow-brand-orange/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                Cadastrar Grátis
                <ArrowRight size={18} />
              </button>
              <a
                href="#plans"
                className="w-full sm:w-auto px-8 py-4 text-center border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5"
              >
                Ver Planos
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-900 text-left max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-2xl font-black text-white">24h</p>
                <p className="text-xs text-slate-500 uppercase font-semibold">Prazo de Correção</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">900+</p>
                <p className="text-xs text-slate-500 uppercase font-semibold">Média dos Alunos</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-xs text-slate-500 uppercase font-semibold">Banca Credenciada</p>
              </div>
            </div>
          </div>

          {/* Interactive CSS Demo Essay Mockup */}
          <div className="lg:col-span-6 relative flex justify-center animate-in fade-in zoom-in-95 duration-500">
            <div className="relative w-full max-w-lg aspect-[4/3] bg-slate-900/60 rounded-3xl border border-slate-800 p-6 shadow-2xl backdrop-blur-sm overflow-hidden flex flex-col gap-4">

              {/* Fake Interface Headers */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono">
                  redacao_enem_2024.pdf
                </div>
                <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs text-brand-orange font-bold font-mono">
                  960
                </div>
              </div>

              {/* Essay Body Simulation */}
              <div className="relative flex-1 bg-white rounded-2xl p-6 text-slate-800 overflow-hidden flex flex-col justify-between">

                {/* Fake Handwriting Lines */}
                <div className="space-y-4">
                  <div className="h-4 bg-slate-100 rounded w-full flex items-center justify-between px-2 text-[10px] text-slate-400 select-none">
                    <span>Linha 1: No que tange à democratização do acesso ao cinema no Brasil...</span>
                  </div>
                  <div className="relative">
                    <div className="h-4 bg-slate-100 rounded w-[95%]"></div>
                    {/* Highlight Marker 1 */}
                    <span
                      onMouseEnter={() => setActiveHighlight(1)}
                      onMouseLeave={() => setActiveHighlight(null)}
                      className={`absolute right-4 -top-0.5 px-2 py-0.5 rounded text-[8px] font-bold text-white cursor-pointer select-none transition-all duration-300 ${activeHighlight === 1 ? 'bg-red-500 scale-110 shadow-lg' : 'bg-red-500/70 hover:bg-red-500'}`}
                    >
                      Competência 1
                    </span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-[88%]"></div>
                  <div className="relative">
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    {/* Highlight Marker 2 */}
                    <span
                      onMouseEnter={() => setActiveHighlight(2)}
                      onMouseLeave={() => setActiveHighlight(null)}
                      className={`absolute left-[30%] -top-0.5 px-2 py-0.5 rounded text-[8px] font-bold text-white cursor-pointer select-none transition-all duration-300 ${activeHighlight === 2 ? 'bg-emerald-500 scale-110 shadow-lg' : 'bg-emerald-500/70 hover:bg-emerald-500'}`}
                    >
                      Competência 4
                    </span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-[92%]"></div>
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="relative">
                    <div className="h-4 bg-slate-100 rounded w-[96%]"></div>
                    {/* Highlight Marker 3 */}
                    <span
                      onMouseEnter={() => setActiveHighlight(3)}
                      onMouseLeave={() => setActiveHighlight(null)}
                      className={`absolute right-[20%] -top-0.5 px-2 py-0.5 rounded text-[8px] font-bold text-white cursor-pointer select-none transition-all duration-300 ${activeHighlight === 3 ? 'bg-blue-500 scale-110 shadow-lg' : 'bg-blue-500/70 hover:bg-blue-500'}`}
                    >
                      Competência 5
                    </span>
                  </div>
                </div>

                {/* Score Summary Panel at bottom */}
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center bg-slate-50/50 p-3 rounded-xl mt-4">
                  <div className="flex gap-2">
                    <div className="px-2 py-1 bg-white rounded border border-slate-200 text-[9px] font-bold text-slate-700">C1: 160</div>
                    <div className="px-2 py-1 bg-white rounded border border-slate-200 text-[9px] font-bold text-slate-700">C2: 200</div>
                    <div className="px-2 py-1 bg-white rounded border border-slate-200 text-[9px] font-bold text-slate-700">C3: 200</div>
                    <div className="px-2 py-1 bg-white rounded border border-slate-200 text-[9px] font-bold text-slate-700">C4: 200</div>
                    <div className="px-2 py-1 bg-white rounded border border-slate-200 text-[9px] font-bold text-slate-700">C5: 200</div>
                  </div>
                  <span className="text-[10px] font-extrabold text-brand-orange">ENEM 2024</span>
                </div>

                {/* Active Tooltip Popups */}
                {activeHighlight !== null && (
                  <div className="absolute top-[30%] left-[20%] right-[20%] bg-slate-900 text-white rounded-xl p-4 shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeHighlight === 1 ? 'bg-red-500/10 text-red-400' :
                          activeHighlight === 2 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                        {highlights.find(h => h.id === activeHighlight)?.title}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">Feedback do Corretor</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {highlights.find(h => h.id === activeHighlight)?.desc}
                    </p>
                  </div>
                )}
              </div>

              {/* Float helper tag */}
              <div className="absolute bottom-4 right-4 bg-slate-950/90 text-[10px] text-slate-400 border border-slate-800 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Passe o mouse nos marcadores
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schools Section (Institutional partners carousel) */}
      <section className="py-12 bg-slate-950 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
            Instituições e Escolas Parceiras que Confiam no Nosso Método
          </p>

          {loadingSchools ? (
            <div className="h-10 flex items-center justify-center">
              <span className="text-xs text-slate-500">Buscando escolas parceiras...</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60 hover:opacity-85 transition-opacity">
              {partnerSchools.length > 0 ? (
                partnerSchools.map(school => (
                  <div key={school.id} className="flex items-center gap-2">
                    <Building2 size={16} className="text-brand-orange" />
                    <span className="text-sm font-extrabold text-white tracking-tight">{school.name}</span>
                  </div>
                ))
              ) : (
                // Fallbacks
                <>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-brand-orange" />
                    <span className="text-sm font-extrabold text-white tracking-tight">Colégio Elite Nacional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-brand-orange" />
                    <span className="text-sm font-extrabold text-white tracking-tight">Instituto de Ensino Alfa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-brand-orange" />
                    <span className="text-sm font-extrabold text-white tracking-tight">Escola São Francisco</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-brand-orange" />
                    <span className="text-sm font-extrabold text-white tracking-tight">Colégio Progresso</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
            Tudo o que você precisa para alcançar a nota <span className="text-brand-orange">900+</span>
          </h2>
          <p className="text-slate-400">
            Combinamos corretores profissionais experientes com uma plataforma de acompanhamento estatístico avançada para acelerar a sua evolução no ENEM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800/80 p-8 rounded-3xl transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Layers size={24} className="text-brand-orange" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Correção Dupla Cega</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sua redação avaliada de forma independente por dois professores. Exatamente como a banca oficial do ENEM faz para assegurar a imparcialidade do processo.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800/80 p-8 rounded-3xl transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Gráfico de Evolução</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Monitore a evolução de suas notas gerais e por competência. Veja exatamente onde está errando e trace metas reais de melhora semana após semana.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800/80 p-8 rounded-3xl transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <PenTool size={24} className="text-teal-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Biblioteca de Temas</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Acesso ilimitado a um banco dinâmico de temas atualizados e alinhados com possíveis eixos do ENEM, completos com textos motivadores de apoio.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / Packages Section */}
      <section id="plans" className="py-24 bg-slate-900/25 border-y border-slate-900/80">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
              Adquira créditos de redação e comece a treinar
            </h2>
            <p className="text-slate-400">
              Preços flexíveis e pacotes que se adaptam à sua rotina de estudos. Compre e utilize quando e como quiser.
            </p>
          </div>

          {loadingPackages ? (
            <div className="flex justify-center py-12">
              <span className="text-slate-400 text-sm">Carregando planos de crédito...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative bg-slate-900/50 border rounded-3xl p-8 flex flex-col justify-between transition-all hover:scale-[1.02] ${pkg.popular
                      ? 'border-brand-orange shadow-xl shadow-brand-orange/5 bg-slate-900'
                      : 'border-slate-900 hover:border-slate-800'
                    }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-orange text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-brand-orange/20">
                      Recomendado
                    </span>
                  )}

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">{pkg.title}</h3>
                      <Coins className={pkg.popular ? "text-brand-orange" : "text-slate-500"} size={22} />
                    </div>

                    <p className="text-sm text-slate-400 min-h-[44px]">
                      {pkg.description}
                    </p>

                    <div className="space-y-1 pt-4 border-t border-slate-800/80">
                      <p className="text-xs text-slate-500 font-semibold">Valor do Pacote</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-slate-400">R$</span>
                        <span className="text-4xl font-black text-white">{pkg.price.toFixed(2).split('.')[0]}</span>
                        <span className="text-lg font-bold text-slate-400">,{pkg.price.toFixed(2).split('.')[1]}</span>
                      </div>
                      {pkg.discount && (
                        <p className="text-xs text-brand-orange font-bold mt-1 inline-block px-2.5 py-0.5 rounded-full bg-brand-orange/10">
                          {pkg.discount}
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 pt-6 border-t border-slate-800/80 text-sm">
                      <li className="flex items-center gap-2.5 text-slate-300">
                        <Check size={16} className="text-emerald-400 shrink-0" />
                        <span><strong>{pkg.credits} Créditos</strong> de Redação</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-slate-300">
                        <Check size={16} className="text-emerald-400 shrink-0" />
                        <span>Avaliação dupla cega garantida</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-slate-300">
                        <Check size={16} className="text-emerald-400 shrink-0" />
                        <span>Créditos sem data de expiração</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-slate-300">
                        <Check size={16} className="text-emerald-400 shrink-0" />
                        <span>Suporte a foto manuscrita e PDF</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    id={`btn_plan_buy_${pkg.id}`}
                    onClick={onNavigateToLogin}
                    className={`w-full py-4 mt-8 font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 ${pkg.popular
                        ? 'bg-brand-orange hover:bg-orange-500 text-white shadow-brand-orange/10'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                  >
                    Adquirir Créditos
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-slate-400">
            Dúvidas comuns sobre como funciona o nosso ecossistema de aprendizado e correções.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden transition-colors duration-200"
              >
                <button
                  id={`btn_faq_toggle_${index}`}
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-slate-900/10"
                >
                  <span className="font-bold text-white text-base">{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-orange' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-slate-900 pt-4 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="relative rounded-[2.5rem] bg-gradient-to-r from-blue-900/50 via-slate-900 to-orange-950/20 border border-slate-800/80 p-8 md:p-16 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
              Pronto para evoluir a sua escrita?
            </h2>
            <p className="text-slate-300">
              Crie sua conta agora mesmo em menos de 2 minutos e comece a enviar suas redações para correção profissional.
            </p>
          </div>

          <button
            id="btn_cta_final"
            onClick={onNavigateToLogin}
            className="px-8 py-4 bg-brand-orange hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-brand-orange/20 whitespace-nowrap hover:-translate-y-0.5"
          >
            Cadastrar Gratuitamente
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-orange rounded-lg flex items-center justify-center font-bold text-white italic text-xs">
              R
            </div>
            <span className="font-extrabold text-white font-display">Redarum Education</span>
          </div>

          <p>&copy; {new Date().getFullYear()} Redarum. Todos os direitos reservados.</p>

          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Políticas de Privacidade</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
