import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  Building2,
  ArrowRight,
  ChevronDown,
  Sparkles,
  TrendingUp,
  PenTool,
  Lock,
  Layers
} from 'lucide-react';

interface TiradentesLandingPageProps {
  onNavigateToLogin: () => void;
}

export function TiradentesLandingPage({ onNavigateToLogin }: TiradentesLandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Redarum | Colégio Militar Tiradentes";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Portal exclusivo de correção de redações para alunos do Colégio Militar Tiradentes em parceria com a Redarum.");
    }
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Como acesso minha conta?",
      answer: "Basta clicar em 'Entrar / Cadastrar' e utilizar o seu e-mail institucional ou e-mail cadastrado pela coordenação para ter acesso imediato à plataforma de correções."
    },
    {
      question: "Quantas redações posso enviar?",
      answer: "O limite de envios mensais é definido pela coordenação pedagógica do Colégio Militar Tiradentes. Consulte seus professores para entender o cronograma da sua turma."
    },
    {
      question: "Quem corrige minhas redações?",
      answer: "Sua redação passará pelo rigoroso sistema da Redarum, com corretores especializados na banca do ENEM, garantindo um feedback focado no seu desenvolvimento."
    }
  ];

  const highlights = [
    {
      id: 1,
      title: "Desvio Gramatical",
      desc: "Atenção à concordância exigida na norma padrão.",
      type: "error"
    },
    {
      id: 2,
      title: "Repertório Sociocultural",
      desc: "Excelente uso de citação alinhada ao tema.",
      type: "success"
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen selection:bg-red-700 selection:text-white overflow-x-hidden">
      
      {/* Header Militar */}
      <header className="sticky top-0 z-50 bg-indigo-950 border-b-4 border-red-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Placeholder para Logo do Colégio */}
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-indigo-950 border-2 border-amber-400 shadow-md">
              CMT
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white uppercase leading-none">Colégio Militar</span>
              <span className="text-amber-400 font-bold tracking-widest text-sm uppercase">Tiradentes</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-indigo-200 text-sm font-medium mr-4">
              Parceria Técnica: <span className="font-bold text-white">Redarum</span>
            </span>
            <button
              onClick={onNavigateToLogin}
              className="px-6 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-all shadow-md flex items-center gap-2 border border-red-500"
            >
              <Lock size={14} />
              Acesso do Aluno
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:py-32 overflow-hidden bg-indigo-900">
        {/* Pattern de fundo */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-800 border border-indigo-700 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-inner">
              <Building2 size={14} />
              Portal Exclusivo
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
              Excelência na escrita para o <span className="text-red-500">ENEM</span>.
            </h1>

            <p className="text-lg text-indigo-200 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              Ambiente de correção de redações dedicado aos alunos do Colégio Militar Tiradentes. Desenvolva seu potencial com correções detalhadas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onNavigateToLogin}
                className="w-full sm:w-auto px-8 py-4 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 text-lg border border-red-500"
              >
                Entrar na Plataforma
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          {/* Interactive Mockup */}
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-lg aspect-[4/3] bg-white rounded-xl p-2 shadow-2xl border-4 border-indigo-950/20 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="w-full h-full bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-indigo-900 text-sm">Painel do Aluno - CMT</span>
                  <div className="px-2 py-1 bg-amber-400 text-indigo-950 text-xs font-bold rounded">Nota: 960</div>
                </div>
                
                <div className="flex-1 space-y-4 pt-2">
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="relative">
                    <div className="h-3 bg-slate-200 rounded w-[90%]"></div>
                    <span className="absolute right-0 -top-2 px-2 py-0.5 bg-red-600 text-white text-[8px] font-bold rounded shadow-sm">Correção C1</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-[95%]"></div>
                  <div className="h-3 bg-slate-200 rounded w-[80%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl font-black text-indigo-950">
            Apoio Pedagógico Completo
          </h2>
          <p className="text-slate-600 font-medium">
            A parceria CMT e Redarum garante que você tenha as melhores ferramentas para alcançar sua aprovação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border-2 border-slate-100 hover:border-indigo-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-6">
              <Layers size={24} className="text-indigo-800" />
            </div>
            <h3 className="text-lg font-bold text-indigo-950 mb-2">Padrão ENEM</h3>
            <p className="text-sm text-slate-600">
              Avaliação rigorosa nas 5 competências oficiais do exame, preparando o aluno para a realidade da prova.
            </p>
          </div>

          <div className="bg-white border-2 border-slate-100 hover:border-red-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-6">
              <TrendingUp size={24} className="text-red-700" />
            </div>
            <h3 className="text-lg font-bold text-indigo-950 mb-2">Relatórios de Desempenho</h3>
            <p className="text-sm text-slate-600">
              Seus professores do CMT acompanham seu progresso de perto através dos nossos painéis educacionais.
            </p>
          </div>

          <div className="bg-white border-2 border-slate-100 hover:border-amber-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-6">
              <PenTool size={24} className="text-amber-700" />
            </div>
            <h3 className="text-lg font-bold text-indigo-950 mb-2">Temas Atualizados</h3>
            <p className="text-sm text-slate-600">
              Acesso a temas selecionados pela coordenação para manter o foco nos assuntos mais relevantes.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-100 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-black text-indigo-950 mb-4">Dúvidas Frequentes</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-slate-50"
                >
                  <span className="font-bold text-indigo-900">{faq.question}</span>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${activeFaq === index ? 'rotate-180 text-red-600' : ''}`} />
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6 text-sm text-slate-600 border-t border-slate-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-950 py-8 text-center text-indigo-200 text-sm border-t-4 border-amber-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-white">
            <span>Colégio Militar Tiradentes</span>
            <span className="text-indigo-400">|</span>
            <span>Plataforma Redarum</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
