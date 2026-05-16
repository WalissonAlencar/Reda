import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Essay } from '../types';
import { FileText, Loader2, Clock, CheckCircle, AlertCircle, Calendar, MessageSquare, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

export function StudentEssayHistory() {
  const { user } = useAuth();
  const [essays, setEssays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEssays();
    }
  }, [user]);

  const fetchEssays = async () => {
    try {
      setLoading(true);
      let dataToProcess: any[] = [];
      const { data, error } = await supabase
        .from('essays')
        .select(`
          *,
          essay_corrections (
            id, score, comp_1, comp_2, comp_3, comp_4, comp_5, feedback, corrected_pdf_url
          )
        `)
        .eq('student_id', user!.id)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar, tabela essay_corrections pode não existir. Fazendo fallback...', error);
        // Fallback: fetch without the join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('essays')
          .select('*')
          .eq('student_id', user!.id)
          .order('submitted_at', { ascending: false });
          
        if (fallbackError) throw fallbackError;
        dataToProcess = fallbackData || [];
      } else {
        dataToProcess = data || [];
      }
      
      const processed = dataToProcess.map(essay => {
        const corrections = essay.essay_corrections || [];
        const numCorrections = corrections.length;
        
        if (numCorrections === 0) {
          // Backward compatibility se a nota estiver na tabela `essays`
          if (essay.status === 'corrected' && essay.score != null) {
            return {
               ...essay,
               numCorrections: 1,
               correctionsList: [{
                 feedback: essay.feedback,
                 corrected_pdf_url: essay.corrected_pdf_url
               }]
            };
          }
          return { ...essay, status: 'sent', numCorrections: 0, correctionsList: [] };
        }
        
        const avg = (field: string) => Math.round(corrections.reduce((sum: number, c: any) => sum + (c[field] || 0), 0) / numCorrections);
        
        return {
          ...essay,
          status: 'corrected',
          numCorrections,
          score: avg('score'),
          comp_1: avg('comp_1'),
          comp_2: avg('comp_2'),
          comp_3: avg('comp_3'),
          comp_4: avg('comp_4'),
          comp_5: avg('comp_5'),
          correctionsList: corrections
        };
      });

      setEssays(processed);
    } catch (error) {
      console.error('Erro ao buscar redações:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Minhas Redações</h1>
          <p className="text-slate-500 mt-1">Acompanhe o status e as correções das suas redações enviadas.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 size={32} className="animate-spin text-brand-blue" />
          <p>Carregando seu histórico...</p>
        </div>
      ) : essays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300">
          <FileText size={48} className="text-slate-300 mb-2" />
          <p className="font-bold text-slate-500">Nenhuma redação enviada ainda.</p>
          <p className="text-sm">Vá até a aba "Enviar Redação" para começar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {essays.map((essay) => (
            <div key={essay.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header / Summary Row */}
              <div 
                className={cn(
                  "p-6 cursor-pointer flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-colors",
                  expandedId === essay.id ? "bg-slate-50/50" : "hover:bg-slate-50"
                )}
                onClick={() => toggleExpand(essay.id)}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    essay.status === 'corrected' ? "bg-emerald-100 text-emerald-600" :
                    essay.status === 'sent' ? "bg-amber-100 text-amber-600" :
                    "bg-brand-blue/10 text-brand-blue"
                  )}>
                    {essay.status === 'corrected' ? <CheckCircle size={24} /> : 
                     essay.status === 'sent' ? <Clock size={24} /> : 
                     <AlertCircle size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{essay.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> 
                        Enviado em {new Date(essay.submitted_at || '').toLocaleDateString('pt-BR')}
                      </span>
                      {essay.status === 'sent' && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100/50 text-amber-700 font-bold text-xs ml-2">Pendente</span>
                      )}
                      {essay.status === 'corrected' && (
                        <span className={cn("px-2 py-0.5 rounded-md font-bold text-xs ml-2", essay.numCorrections === 2 ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700")}>
                          {essay.numCorrections === 2 ? "Dupla Correção" : "1 Correção"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-100">
                  {essay.status === 'corrected' && (
                    <>
                      <div className="hidden md:flex gap-4 lg:gap-6 mr-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        {[
                          { label: 'C1', score: essay.comp_1 },
                          { label: 'C2', score: essay.comp_2 },
                          { label: 'C3', score: essay.comp_3 },
                          { label: 'C4', score: essay.comp_4 },
                          { label: 'C5', score: essay.comp_5 },
                        ].map(comp => (
                          <div key={comp.label} className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{comp.label}</p>
                            <p className="text-sm font-bold text-slate-700">{comp.score}</p>
                          </div>
                        ))}
                      </div>
                      <div className="text-center ml-auto xl:ml-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nota Geral</p>
                        <p className="text-2xl font-black text-brand-blue leading-none">{essay.score}</p>
                        {essay.numCorrections === 2 && (
                          <p className="text-[9px] font-bold text-purple-500 uppercase mt-1">Média</p>
                        )}
                      </div>
                    </>
                  )}
                  <div className="p-2 text-slate-400 rounded-full hover:bg-slate-100 transition-colors ml-auto xl:ml-0">
                    {expandedId === essay.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === essay.id && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                  {essay.status === 'sent' ? (
                    <div className="text-center py-8 text-slate-500">
                      <Clock size={32} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">Sua redação está na fila de correção.</p>
                      <p className="text-sm">Assim que um professor avaliá-la, sua nota e feedback aparecerão aqui.</p>
                      <div className="mt-6 flex justify-center">
                        <a 
                          href={essay.pdf_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm font-bold text-brand-blue bg-brand-blue/10 px-4 py-2 rounded-lg hover:bg-brand-blue/20 transition-colors"
                        >
                          <Download size={16} /> Ver Arquivo Enviado
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Competencies Breakdown */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CheckCircle size={16} className={essay.numCorrections === 2 ? "text-purple-500" : "text-emerald-500"} /> 
                            {essay.numCorrections === 2 ? "Média por Competência" : "Notas por Competência"}
                          </h4>
                          <div className="space-y-3">
                            {[
                              { id: 1, key: 'comp_1', label: 'C1: Domínio da Escrita', score: essay.comp_1 },
                              { id: 2, key: 'comp_2', label: 'C2: Compreensão do Tema', score: essay.comp_2 },
                              { id: 3, key: 'comp_3', label: 'C3: Organização das Ideias', score: essay.comp_3 },
                              { id: 4, key: 'comp_4', label: 'C4: Coesão e Coerência', score: essay.comp_4 },
                              { id: 5, key: 'comp_5', label: 'C5: Proposta de Intervenção', score: essay.comp_5 },
                            ].map((comp) => (
                              <div key={comp.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-slate-200 rounded-xl gap-3">
                                <span className="text-sm font-medium text-slate-700">{comp.label}</span>
                                
                                {essay.numCorrections === 2 && essay.correctionsList?.length >= 2 ? (
                                  <div className="flex items-center gap-3 self-end sm:self-auto">
                                    <div className="flex flex-col items-center">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Aval. 1</span>
                                      <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md min-w-[2.5rem] text-center text-xs mt-0.5">
                                        {essay.correctionsList[0][comp.key]}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Aval. 2</span>
                                      <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md min-w-[2.5rem] text-center text-xs mt-0.5">
                                        {essay.correctionsList[1][comp.key]}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-center ml-1 border-l border-slate-200 pl-3">
                                      <span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">Média</span>
                                      <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md min-w-[2.5rem] text-center text-sm mt-0.5">
                                        {comp.score}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-bold text-brand-blue bg-brand-blue/10 px-2 py-1 rounded-md min-w-[3rem] text-center self-end sm:self-auto">
                                    {comp.score}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Feedback & Actions */}
                        <div className="flex flex-col">
                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <MessageSquare size={16} className="text-brand-orange" /> Comentários dos Professores
                          </h4>
                          <div className="flex-1 space-y-3">
                            {essay.correctionsList?.map((corr: any, idx: number) => (
                               <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-600 leading-relaxed shadow-inner">
                                 {essay.numCorrections === 2 && (
                                   <p className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Avaliador {idx + 1}</p>
                                 )}
                                 <p className="italic">{corr.feedback ? `"${corr.feedback}"` : "Nenhum comentário adicional fornecido."}</p>
                                 
                                 {corr.corrected_pdf_url && (
                                   <div className="mt-3">
                                     <a 
                                       href={corr.corrected_pdf_url} 
                                       target="_blank" 
                                       rel="noreferrer"
                                       className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                                     >
                                       <FileText size={14} /> Ver PDF Corrigido {essay.numCorrections === 2 ? `(Aval. ${idx + 1})` : ''}
                                     </a>
                                   </div>
                                 )}
                               </div>
                            ))}
                          </div>
                          
                          <div className="mt-6 flex flex-wrap gap-3">
                            <a 
                              href={essay.pdf_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <Download size={16} /> Arquivo Original Enviado
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* PDF Inline Viewers */}
                      {essay.correctionsList && essay.correctionsList.some((c: any) => c.corrected_pdf_url) && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText size={16} className="text-brand-blue" /> Visualização das Correções
                          </h4>
                          <div className={cn(
                            "grid gap-6",
                            essay.correctionsList.length === 2 ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
                          )}>
                            {essay.correctionsList.map((corr: any, idx: number) => corr.corrected_pdf_url ? (
                              <div key={idx} className="flex flex-col h-[600px]">
                                {essay.correctionsList.length === 2 && (
                                  <div className="bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-t-xl text-center shadow-sm z-10">
                                    Avaliador {idx + 1}
                                  </div>
                                )}
                                <div className={cn(
                                  "w-full flex-1 bg-slate-200 border-2 border-slate-200 overflow-hidden shadow-inner",
                                  essay.correctionsList.length === 2 ? "rounded-b-xl" : "rounded-xl"
                                )}>
                                  <iframe 
                                    src={`${corr.corrected_pdf_url}#view=FitH`}
                                    className="w-full h-full border-0"
                                    title={`Redação Corrigida Avaliador ${idx + 1}`}
                                  />
                                </div>
                              </div>
                            ) : null)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
