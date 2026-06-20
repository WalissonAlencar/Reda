import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Layers,
  Award
} from 'lucide-react';

interface TiradentesLandingPageProps {
  onNavigateToLogin: () => void;
}

export function TiradentesLandingPage({ onNavigateToLogin }: TiradentesLandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
      answer: "Basta clicar em 'Acesso do Aluno' e utilizar o seu e-mail institucional ou e-mail cadastrado pela coordenação para ter acesso imediato à plataforma de correções."
    },
    {
      question: "Quantas redações posso enviar?",
      answer: "O limite de envios mensais é definido pela coordenação pedagógica do Colégio Militar Tiradentes. Consulte seus professores para entender o cronograma da sua turma."
    },
    {
      question: "Quem corrige minhas redações?",
      answer: "Sua redação passará pelo rigoroso sistema da Redarum, com corretores especializados na banca do ENEM, garantindo um feedback focado no seu desenvolvimento e melhoria de nota."
    }
  ];

  return (
    <div className="bg-slate-950 text-slate-100 font-sans min-h-screen selection:bg-red-600 selection:text-white overflow-x-hidden relative">
      
      {/* Background animado e gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/30 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-red-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-amber-900/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_1px,_transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      {/* Header Militar - Glassmorphism */}
      <header className="fixed top-0 w-full z-50 bg-slate-950/60 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            {/* Logo */}
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-900 rounded-xl flex items-center justify-center font-bold text-white border border-white/10 shadow-lg shadow-indigo-900/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              CMT
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white uppercase leading-none">Colégio Militar</span>
              <span className="text-amber-400 font-bold tracking-widest text-sm uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500">Tiradentes</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <span className="hidden md:inline text-slate-400 text-sm font-medium">
              Parceria: <span className="font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Redarum</span>
            </span>
            <button
              onClick={onNavigateToLogin}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center gap-2 border border-red-500/50 hover:scale-105 active:scale-95"
            >
              <Lock size={16} />
              Acesso do Aluno
            </button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left z-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-xl"
            >
              <Award size={14} className="text-amber-400" />
              Ambiente Exclusivo
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight"
            >
              Excelência na escrita para o <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]">ENEM</span>.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium"
            >
              Plataforma de correção de redações para os alunos do <strong className="text-white font-bold">Colégio Militar Tiradentes</strong>. Acompanhe sua evolução e conquiste o 1000.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
            >
              <button
                onClick={onNavigateToLogin}
                className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-950 font-black rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-3 text-lg hover:-translate-y-1 group"
              >
                Entrar na Plataforma
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>

          {/* Interactive Mockup Aprimorado */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 50 }}
            className="relative flex justify-center z-10 perspective-1000"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/30 to-red-500/30 blur-3xl -z-10 rounded-full animate-pulse-slow"></div>
            
            <div className="relative w-full max-w-lg bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10 shadow-indigo-900/50 hover:-translate-y-2 transition-transform duration-500">
              
              {/* Header do Mockup */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-full">
                  Painel do Aluno - CMT
                </div>
              </div>
              
              {/* Corpo do Mockup */}
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Última Redação</div>
                    <div className="text-white font-semibold text-lg">Os Desafios da Educação...</div>
                  </div>
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                    className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 w-16 h-16 rounded-2xl shadow-lg shadow-amber-500/20 border border-amber-300/30"
                  >
                    <span className="text-xs text-amber-950 font-bold opacity-80 uppercase">Nota</span>
                    <span className="text-xl font-black text-amber-950 leading-none">960</span>
                  </motion.div>
                </div>

                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <GraduationCap size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-slate-700 rounded-full w-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '96%' }}
                          transition={{ delay: 1, duration: 1 }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full"
                        ></motion.div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-300 w-12 text-right">C1: 200</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <BookOpen size={16} className="text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-slate-700 rounded-full w-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '80%' }}
                          transition={{ delay: 1.2, duration: 1 }}
                          className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                        ></motion.div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-300 w-12 text-right">C2: 160</span>
                  </div>
                </div>

                {/* Floating Elements (Feedback cards) */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2 }}
                  className="absolute -right-12 -bottom-6 bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-2xl flex items-center gap-3"
                >
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <Sparkles size={16} className="text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Ótima Argumentação!</div>
                    <div className="text-[10px] text-slate-400">Excelente uso de repertório.</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6 space-y-16 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-4xl font-black text-white">
            Apoio Pedagógico <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">Completo</span>
          </h2>
          <p className="text-slate-400 font-medium text-lg">
            Ferramentas modernas para garantir a excelência dos alunos do CMT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
              <Layers size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Padrão ENEM</h3>
            <p className="text-slate-400 leading-relaxed">
              Avaliação rigorosa nas 5 competências oficiais do exame, preparando o aluno para a realidade da prova.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all"></div>
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-6 text-red-400 group-hover:scale-110 transition-transform">
              <TrendingUp size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Relatórios Detalhados</h3>
            <p className="text-slate-400 leading-relaxed">
              Professores do CMT acompanham o progresso da turma de perto através dos nossos painéis educacionais.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-6 text-amber-400 group-hover:scale-110 transition-transform">
              <PenTool size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Temas Atualizados</h3>
            <p className="text-slate-400 leading-relaxed">
              Acesso a temas selecionados criteriosamente pela coordenação para manter o foco em assuntos relevantes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Moderno */}
      <section className="py-24 relative z-10 border-t border-white/5 bg-slate-950/50">
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white mb-4">Dúvidas Frequentes</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div 
                key={index} 
                initial={false}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-white text-lg">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: activeFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300"
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-slate-400 leading-relaxed pt-2 border-t border-white/5">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/40 py-8 text-center text-slate-400 text-sm border-t border-white/10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 font-bold text-white">
            <span className="opacity-80">Colégio Militar Tiradentes</span>
            <span className="text-indigo-500">•</span>
            <span className="opacity-80">Plataforma Redarum</span>
          </div>
          <p className="opacity-60">&copy; {new Date().getFullYear()} Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

