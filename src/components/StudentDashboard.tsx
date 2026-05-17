import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Upload, 
  History, 
  TrendingUp, 
  Award,
  ChevronRight,
  Target
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export function StudentDashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { user, userData } = useAuth();
  const [essays, setEssays] = useState<any[]>([]);
  const [globalAverages, setGlobalAverages] = useState({c1: 120, c2: 120, c3: 120, c4: 120, c5: 120}); // Default fallback
  const [suggestedTheme, setSuggestedTheme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchEssays();
      fetchGlobalStats();
      fetchSuggestedTheme();
    }
  }, [user]);

  const fetchSuggestedTheme = async () => {
    try {
      const { data } = await supabase.from('essay_themes').select('title').eq('is_active', true);
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setSuggestedTheme(data[randomIndex].title);
      } else {
        setSuggestedTheme("Aguardando novos temas...");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const { data, error } = await supabase.from('essay_corrections').select('comp_1, comp_2, comp_3, comp_4, comp_5');
      if (data && data.length > 0) {
        setGlobalAverages({
          c1: Math.round(data.reduce((a,c) => a + (c.comp_1 || 0), 0) / data.length),
          c2: Math.round(data.reduce((a,c) => a + (c.comp_2 || 0), 0) / data.length),
          c3: Math.round(data.reduce((a,c) => a + (c.comp_3 || 0), 0) / data.length),
          c4: Math.round(data.reduce((a,c) => a + (c.comp_4 || 0), 0) / data.length),
          c5: Math.round(data.reduce((a,c) => a + (c.comp_5 || 0), 0) / data.length)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEssays = async () => {
    try {
      setLoading(true);
      let dataToProcess: any[] = [];
      const { data, error } = await supabase
        .from('essays')
        .select(`
          *,
          essay_corrections (
            id, score, comp_1, comp_2, comp_3, comp_4, comp_5, feedback, teacher_id
          )
        `)
        .eq('student_id', user!.id)
        .order('submitted_at', { ascending: true }); // Ascending for the evolution chart

      if (error) {
        const { data: fallbackData } = await supabase
          .from('essays')
          .select('*')
          .eq('student_id', user!.id)
          .order('submitted_at', { ascending: true });
        dataToProcess = fallbackData || [];
      } else {
        dataToProcess = data || [];
      }
      
      const processed = dataToProcess.map(essay => {
        const inFallbackMode = !('essay_corrections' in essay);
        if (inFallbackMode) {
          return {
            ...essay,
            numCorrections: 1,
            correctionsList: []
          };
        }
        
        const corrections = essay.essay_corrections || [];
        const numCorrections = corrections.length;
        
        if (numCorrections === 2) {
           return {
             ...essay,
             score: Math.round((corrections[0].score + corrections[1].score) / 2),
             comp_1: Math.round((corrections[0].comp_1 + corrections[1].comp_1) / 2),
             comp_2: Math.round((corrections[0].comp_2 + corrections[1].comp_2) / 2),
             comp_3: Math.round((corrections[0].comp_3 + corrections[1].comp_3) / 2),
             comp_4: Math.round((corrections[0].comp_4 + corrections[1].comp_4) / 2),
             comp_5: Math.round((corrections[0].comp_5 + corrections[1].comp_5) / 2),
             numCorrections,
             correctionsList: corrections
           };
        } else if (numCorrections === 1) {
           return {
             ...essay,
             score: corrections[0].score,
             comp_1: corrections[0].comp_1,
             comp_2: corrections[0].comp_2,
             comp_3: corrections[0].comp_3,
             comp_4: corrections[0].comp_4,
             comp_5: corrections[0].comp_5,
             feedback: corrections[0].feedback,
             numCorrections,
             correctionsList: corrections
           };
        }
        return {
          ...essay,
          numCorrections: 0,
          correctionsList: []
        };
      });
      
      setEssays(processed);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const correctedEssays = essays.filter(e => e.status === 'corrected' && (e.numCorrections > 0 || !('essay_corrections' in e)));
  
  // Calculate Averages
  const currentAverage = correctedEssays.length > 0 
    ? Math.round(correctedEssays.reduce((acc, curr) => acc + (curr.score || 0), 0) / correctedEssays.length)
    : 0;

  // Evolution Calculation
  let evolutionDiff = 0;
  if (correctedEssays.length >= 2) {
     const last = correctedEssays[correctedEssays.length - 1].score || 0;
     const prev = correctedEssays[correctedEssays.length - 2].score || 0;
     evolutionDiff = last - prev;
  }

  // Radar Chart Data
  const c1Avg = correctedEssays.length > 0 ? Math.round(correctedEssays.reduce((acc, c) => acc + (c.comp_1 || 0), 0) / correctedEssays.length) : 0;
  const c2Avg = correctedEssays.length > 0 ? Math.round(correctedEssays.reduce((acc, c) => acc + (c.comp_2 || 0), 0) / correctedEssays.length) : 0;
  const c3Avg = correctedEssays.length > 0 ? Math.round(correctedEssays.reduce((acc, c) => acc + (c.comp_3 || 0), 0) / correctedEssays.length) : 0;
  const c4Avg = correctedEssays.length > 0 ? Math.round(correctedEssays.reduce((acc, c) => acc + (c.comp_4 || 0), 0) / correctedEssays.length) : 0;
  const c5Avg = correctedEssays.length > 0 ? Math.round(correctedEssays.reduce((acc, c) => acc + (c.comp_5 || 0), 0) / correctedEssays.length) : 0;

  const radarData = [
    { subject: `C1: ${c1Avg}`, A: c1Avg, B: globalAverages.c1, fullMark: 200 },
    { subject: `C2: ${c2Avg}`, A: c2Avg, B: globalAverages.c2, fullMark: 200 },
    { subject: `C3: ${c3Avg}`, A: c3Avg, B: globalAverages.c3, fullMark: 200 },
    { subject: `C4: ${c4Avg}`, A: c4Avg, B: globalAverages.c4, fullMark: 200 },
    { subject: `C5: ${c5Avg}`, A: c5Avg, B: globalAverages.c5, fullMark: 200 },
  ];

  // Evolution Line Chart
  const evolutionData = correctedEssays.map((e, idx) => ({
    name: `Red. ${idx + 1}`,
    score: e.score || 0,
    comp_1: e.comp_1 || 0,
    comp_2: e.comp_2 || 0,
    comp_3: e.comp_3 || 0,
    comp_4: e.comp_4 || 0,
    comp_5: e.comp_5 || 0,
  }));

  const latestEssay = correctedEssays[correctedEssays.length - 1];
  let latestFeedback = latestEssay?.feedback || 'Nenhum feedback disponível ainda.';
  if (latestEssay?.numCorrections === 2 && latestEssay.correctionsList) {
     latestFeedback = latestEssay.correctionsList[0]?.feedback || latestFeedback;
  }

  const firstName = userData?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Aluno';
  
  // Display latest essays (top 3)
  const recentEssays = [...essays].reverse().slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Olá, {firstName}! 👋</h1>
          <p className="text-slate-500 mt-1">Pronto para elevar o nível da sua escrita?</p>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('send')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-brand-orange/90 transition-all shadow-xl shadow-brand-orange/20">
          <Upload size={20} />
          Enviar Nova Redação
        </button>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-brand-blue to-indigo-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-indigo-200 text-sm font-medium mb-1">Média Atual</p>
            <h3 className="text-5xl font-bold mb-4 tracking-tighter">{currentAverage}</h3>
            {evolutionDiff !== 0 && (
              <div className={cn(
                "flex items-center gap-2 text-sm font-bold bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm",
                evolutionDiff > 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                <TrendingUp size={16} className={evolutionDiff < 0 ? "rotate-180" : ""} />
                {evolutionDiff > 0 ? "+" : ""}{evolutionDiff} pts {evolutionDiff > 0 ? "evolução" : "queda"}
              </div>
            )}
          </div>
          <Target className="absolute right--4 bottom--4 w-40 h-40 text-white/5" />
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-slate-500 text-sm font-medium mb-4">Último Feedback</p>
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                    <Award size={24} />
                </div>
                <div>
                   <h4 className="font-bold text-slate-800 leading-tight line-clamp-3">
                     "{latestFeedback}"
                   </h4>
                   {latestEssay && (
                     <p className="text-xs text-slate-400 mt-1 italic">Em: {latestEssay.title} • {new Date(latestEssay.submitted_at).toLocaleDateString('pt-BR')}</p>
                   )}
                </div>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-slate-500 text-sm font-medium mb-2">Próximo Desafio</p>
            <h4 className="font-bold text-slate-800">Tema Sugerido:</h4>
            <p className="text-slate-600 text-sm mt-1 leading-relaxed">"{suggestedTheme || 'Carregando...'}"</p>
            <button 
                onClick={() => onNavigate && onNavigate('themes_library')}
                className="flex items-center gap-1 text-sm font-bold text-brand-orange mt-4 hover:gap-2 transition-all w-fit"
            >
                Acessar Proposta <ChevronRight size={16} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Evolution Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-8">Evolução de Nota</h3>
          <div className="h-[280px]">
            {evolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis domain={[0, 1000]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                      type="monotone" 
                      dataKey="score" 
                      name="Nota Geral"
                      stroke="#1e3a8a" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: "#fb923c", strokeWidth: 3, stroke: "#fff" }}
                      activeDot={{ r: 8 }}
                  />
                  <Line type="monotone" dataKey="comp_1" name="Comp. 1" stroke="#cbd5e1" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="comp_2" name="Comp. 2" stroke="#cbd5e1" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="comp_3" name="Comp. 3" stroke="#cbd5e1" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="comp_4" name="Comp. 4" stroke="#cbd5e1" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="comp_5" name="Comp. 5" stroke="#cbd5e1" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Ainda não há dados suficientes para gerar o gráfico.
              </div>
            )}
          </div>
        </div>

        {/* Competencies Radar */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-8">Desempenho por Competência</h3>
            <div className="relative h-[280px]">
                {correctedEssays.length > 0 ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                       <div className="flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-full w-16 h-16 shadow-sm border border-slate-100">
                          <span className="text-xl font-black text-brand-blue leading-none">{currentAverage}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-1">Média</span>
                       </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke="#f1f5f9" />
                            <PolarAngleAxis dataKey="subject" tick={{fill: '#475569', fontSize: 11, fontWeight: 700}} />
                            <PolarRadiusAxis angle={30} domain={[0, 200]} tick={false} axisLine={false} />
                            <Radar
                                name="Média dos Demais Usuários"
                                dataKey="B"
                                stroke="#94a3b8"
                                fill="#cbd5e1"
                                fillOpacity={0.2}
                            />
                            <Radar
                                name="Sua Média"
                                dataKey="A"
                                stroke="#fb923c"
                                fill="#fb923c"
                                fillOpacity={0.4}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    Aguarde sua primeira correção para ver o radar.
                  </div>
                )}
            </div>
            {correctedEssays.length > 0 && (
              <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                      <span className="text-xs text-slate-500 font-medium">Média dos Demais Usuários</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-brand-orange"></div>
                      <span className="text-xs text-slate-500 font-medium">Sua Média</span>
                  </div>
              </div>
            )}
        </div>
      </div>

      {/* History */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold">Últimas Redações</h3>
            <button 
              onClick={() => onNavigate && onNavigate('history')}
              className="text-sm font-bold text-brand-blue hover:underline">Ver tudo
            </button>
          </div>
          <div className="space-y-4">
            {recentEssays.length === 0 ? (
              <p className="text-slate-500 text-center py-6">Nenhuma redação enviada ainda.</p>
            ) : (
              recentEssays.map((essay) => (
                <div key={essay.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-brand-blue/20 transition-all">
                  <div className="flex items-center gap-4">
                      <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                          essay.status === 'corrected' ? 'bg-emerald-100 text-emerald-600' : 
                          'bg-amber-100 text-amber-600'
                      )}>
                          <FileText size={24} />
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-800 truncate max-w-xs md:max-w-sm">{essay.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(essay.submitted_at).toLocaleDateString('pt-BR')}</span>
                              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                              <span className={cn(
                                  "text-[10px] font-bold uppercase",
                                  essay.status === 'corrected' ? 'text-emerald-600' : 'text-amber-600'
                              )}>
                                  {essay.status === 'corrected' ? 'Corrigida' : 'Em correção'}
                              </span>
                              {essay.numCorrections === 2 && essay.status === 'corrected' && (
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded-sm font-bold">Dupla Correção</span>
                              )}
                          </div>
                      </div>
                  </div>
                  {essay.status === 'corrected' ? (
                      <div className="text-right shrink-0 ml-2">
                          <p className="text-2xl font-black text-slate-800">{essay.score}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pontos</p>
                      </div>
                  ) : (
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden shrink-0 ml-2">
                          <div className="w-3/4 h-full bg-amber-400 animate-pulse"></div>
                      </div>
                  )}
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
}
