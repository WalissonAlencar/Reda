import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FileText, Search, Trash2, Eye, Info, CheckCircle, 
  Clock, Loader2, AlertCircle, Calendar, X, ShieldAlert,
  ChevronRight, Sparkles, MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  avatar?: string;
}

interface CorrectionInfo {
  id: string;
  score: number;
  comp_1: number;
  comp_2: number;
  comp_3: number;
  comp_4: number;
  comp_5: number;
  feedback: string;
  corrected_pdf_url?: string;
  created_at: string;
  teacher_id: string;
  users?: {
    name: string;
  } | null;
}

interface EssayWithDetails {
  id: string;
  student_id: string;
  title: string;
  status: string;
  pdf_url: string;
  submitted_at: string;
  score?: number;
  comp_1?: number;
  comp_2?: number;
  comp_3?: number;
  comp_4?: number;
  comp_5?: number;
  feedback?: string;
  users: UserInfo | null;
  essay_corrections: CorrectionInfo[];
  numCorrections: number;
}

export function AdminEssays() {
  const [essays, setEssays] = useState<EssayWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | '0' | '1' | '2'>('all');
  const [selectedEssay, setSelectedEssay] = useState<EssayWithDetails | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchEssays();
  }, []);

  const fetchEssays = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('essays')
        .select(`
          *,
          users!essays_student_id_fkey (
            id,
            name,
            email,
            avatar_url,
            avatar
          ),
          essay_corrections (
            id,
            score,
            comp_1,
            comp_2,
            comp_3,
            comp_4,
            comp_5,
            feedback,
            corrected_pdf_url,
            created_at,
            teacher_id,
            users:essay_corrections_teacher_id_fkey (
              name
            )
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const processed = (data || []).map((essay: any) => {
        const corrections = essay.essay_corrections || [];
        const numCorrections = corrections.length;

        // Process final scores/feedback
        let finalScore = essay.score;
        let c1 = essay.comp_1;
        let c2 = essay.comp_2;
        let c3 = essay.comp_3;
        let c4 = essay.comp_4;
        let c5 = essay.comp_5;
        let finalFeedback = essay.feedback;

        if (numCorrections > 0) {
          const avg = (field: string) => Math.round(corrections.reduce((sum: number, c: any) => sum + (c[field] || 0), 0) / numCorrections);
          finalScore = avg('score');
          c1 = avg('comp_1');
          c2 = avg('comp_2');
          c3 = avg('comp_3');
          c4 = avg('comp_4');
          c5 = avg('comp_5');
        } else if (essay.status === 'corrected' && essay.score != null) {
          // Backward compatibility if single correction resides in essays table
          return {
            ...essay,
            numCorrections: 1,
            users: essay.users,
            essay_corrections: [{
              id: 'compat-mode',
              score: essay.score,
              comp_1: essay.comp_1 || 0,
              comp_2: essay.comp_2 || 0,
              comp_3: essay.comp_3 || 0,
              comp_4: essay.comp_4 || 0,
              comp_5: essay.comp_5 || 0,
              feedback: essay.feedback || '',
              corrected_pdf_url: essay.corrected_pdf_url,
              created_at: essay.corrected_at || essay.submitted_at,
              teacher_id: essay.teacher_id || '',
              users: { name: 'Avaliador Sistema' }
            }]
          };
        }

        return {
          ...essay,
          score: finalScore,
          comp_1: c1,
          comp_2: c2,
          comp_3: c3,
          comp_4: c4,
          comp_5: c5,
          feedback: finalFeedback,
          numCorrections,
          users: essay.users,
          essay_corrections: corrections
        };
      });

      setEssays(processed);
    } catch (error) {
      console.error('Erro ao carregar redações:', error);
      alert('Erro ao carregar lista de redações.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEssay = async (essayId: string) => {
    try {
      setDeletingId(essayId);

      // 1. Delete associated corrections first due to foreign keys
      const { error: corrError } = await supabase
        .from('essay_corrections')
        .delete()
        .eq('essay_id', essayId);

      if (corrError) throw corrError;

      // 2. Delete the essay record itself
      const { error: essayError } = await supabase
        .from('essays')
        .delete()
        .eq('id', essayId);

      if (essayError) throw essayError;

      // Update state
      setEssays(prev => prev.filter(e => e.id !== essayId));
      if (selectedEssay?.id === essayId) {
        setSelectedEssay(null);
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao deletar redação:', error);
      alert('Falha ao apagar a redação. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter & Search Logic
  const filteredEssays = essays.filter(essay => {
    const studentName = (essay.users?.name || '').toLowerCase();
    const studentEmail = (essay.users?.email || '').toLowerCase();
    const essayTitle = (essay.title || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = studentName.includes(query) || studentEmail.includes(query) || essayTitle.includes(query);
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === '0') return matchesSearch && essay.numCorrections === 0;
    if (activeFilter === '1') return matchesSearch && essay.numCorrections === 1;
    if (activeFilter === '2') return matchesSearch && essay.numCorrections === 2;

    return matchesSearch;
  });

  // Count metrics for the stats headers
  const totalCount = essays.length;
  const zeroCount = essays.filter(e => e.numCorrections === 0).length;
  const oneCount = essays.filter(e => e.numCorrections === 1).length;
  const twoCount = essays.filter(e => e.numCorrections === 2).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Gerenciamento de Redações</h1>
          <p className="text-slate-500 mt-1">Supervisão, auditoria e controle das redações enviadas pelos estudantes.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Recebidas', value: totalCount, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Sem Correção', value: zeroCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Com 1 Correção', value: oneCount, icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Com 2 Correções', value: twoCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={cn("p-3.5 rounded-xl shrink-0", card.bg, card.color)}>
              <card.icon size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{card.label}</p>
              <h3 className="text-2xl font-black mt-0.5 text-slate-800">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto select-none gap-1 shrink-0">
          {[
            { id: 'all', label: 'Todas' },
            { id: '0', label: 'Sem Correção' },
            { id: '1', label: '1 Correção' },
            { id: '2', label: '2 Correções' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                activeFilter === tab.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por aluno, email ou tema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:bg-white transition-all placeholder:text-slate-400 font-medium text-slate-700"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Buscando redações...</p>
        </div>
      ) : filteredEssays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3 text-center">
          <FileText size={48} className="text-slate-300" />
          <p className="text-slate-500 text-sm font-semibold">Nenhuma redação encontrada para este filtro.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Estudante</th>
                  <th className="px-6 py-4">Tema da Redação</th>
                  <th className="px-6 py-4">Enviado em</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Nota Média</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEssays.map((essay) => (
                  <tr key={essay.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Student Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-500 text-xs select-none">
                          {essay.users?.avatar || essay.users?.avatar_url ? (
                            <img src={essay.users.avatar || essay.users.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            essay.users?.name?.slice(0, 2).toUpperCase() || 'ST'
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{essay.users?.name || 'Estudante Desconhecido'}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[150px]">{essay.users?.email || ''}</p>
                        </div>
                      </div>
                    </td>

                    {/* Essay Title */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700 truncate max-w-[240px]" title={essay.title}>
                        {essay.title || 'Sem Título'}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar size={14} className="shrink-0" />
                        <span className="text-xs font-medium">
                          {new Date(essay.submitted_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full inline-flex items-center gap-1",
                        essay.numCorrections === 0 ? 'bg-amber-50 text-amber-600 border border-amber-200/50' : 
                        essay.numCorrections === 1 ? 'bg-blue-50 text-blue-600 border border-blue-200/50' : 
                        'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
                      )}>
                        {essay.numCorrections === 0 && <Clock size={10} />}
                        {essay.numCorrections === 1 && <Info size={10} />}
                        {essay.numCorrections === 2 && <CheckCircle size={10} />}
                        
                        {essay.numCorrections === 0 ? 'Pendente' : 
                         essay.numCorrections === 1 ? '1 Correção' : 'Concluída'}
                      </span>
                    </td>

                    {/* Score / Note */}
                    <td className="px-6 py-4">
                      {essay.numCorrections > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black text-slate-800">{essay.score}</span>
                          <span className="text-[10px] text-slate-400 font-medium">pts</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 font-bold select-none">-</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Original PDF */}
                        <a
                          href={essay.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/50"
                          title="Visualizar Redação Original"
                        >
                          <Eye size={16} />
                        </a>

                        {/* View Details Modal button */}
                        <button
                          onClick={() => setSelectedEssay(essay)}
                          className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-brand-orange bg-slate-50 hover:bg-orange-50 rounded-lg transition-colors border border-slate-200/50 flex items-center gap-1"
                        >
                          Ver Detalhes <ChevronRight size={14} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setShowDeleteConfirm(essay.id)}
                          className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors border border-slate-200/50"
                          title="Apagar Redação"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Detail/Auditing Modal --- */}
      {selectedEssay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col my-8 max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-6 flex justify-between items-center select-none shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-brand-orange/20 p-2.5 rounded-xl text-brand-orange flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">Auditoria de Correções</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">ID: {selectedEssay.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEssay(null)}
                className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Essay Details Row */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tema do Estudante</span>
                  <h4 className="text-base font-black text-slate-800 mt-0.5">{selectedEssay.title}</h4>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estudante</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-500">
                      {selectedEssay.users?.avatar ? (
                        <img src={selectedEssay.users.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedEssay.users?.name?.slice(0, 2).toUpperCase() || 'ST'
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 leading-tight">{selectedEssay.users?.name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{selectedEssay.users?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Corrections Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" /> Correções Recebidas ({selectedEssay.numCorrections})
                </h4>

                {selectedEssay.numCorrections === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 gap-2">
                    <Clock size={32} className="text-slate-300 animate-pulse" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Redação na Fila de Pendentes</p>
                    <p className="text-[10px] text-slate-400 leading-none">Nenhum avaliador corrigiu este arquivo ainda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedEssay.essay_corrections.map((corr, idx) => {
                      let pageNotes: Record<number, string> = {};
                      let generalFeedback = corr.feedback;
                      try {
                        const parsed = JSON.parse(corr.feedback);
                        generalFeedback = parsed.general || '';
                        pageNotes = parsed.pageNotes || {};
                      } catch (e) {}

                      return (
                        <div key={corr.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                          
                          {/* Evaluator Title */}
                          <div className="bg-brand-blue/10 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-brand-blue text-xs font-black uppercase tracking-wider">
                              Avaliador {idx + 1}
                            </span>
                            <span className="text-xs font-black text-brand-blue bg-white border border-brand-blue/20 px-2 py-0.5 rounded-md">
                              {corr.score} pts
                            </span>
                          </div>

                          {/* Competencies Details */}
                          <div className="p-4 border-b border-slate-100 grid grid-cols-5 gap-1.5 text-center bg-slate-50/50">
                            {[
                              { label: 'C1', val: corr.comp_1 },
                              { label: 'C2', val: corr.comp_2 },
                              { label: 'C3', val: corr.comp_3 },
                              { label: 'C4', val: corr.comp_4 },
                              { label: 'C5', val: corr.comp_5 },
                            ].map((c) => (
                              <div key={c.label} className="bg-white border border-slate-200/50 rounded-lg p-1.5 shadow-sm">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
                                <p className="text-xs font-black text-slate-700 mt-0.5">{c.val}</p>
                              </div>
                            ))}
                          </div>

                          {/* Comments block */}
                          <div className="p-4 flex-1 space-y-3">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Feedback Geral</p>
                              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-xl leading-relaxed italic">
                                {generalFeedback || 'Sem observações gerais.'}
                              </p>
                            </div>

                            {/* Page annotations summary */}
                            {Object.keys(pageNotes).length > 0 && (
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <MessageSquare size={10} /> Notas por Página
                                </p>
                                <div className="space-y-1.5">
                                  {Object.entries(pageNotes).map(([page, text]) => (
                                    <div key={page} className="text-[11px] text-slate-500 flex gap-1 items-start bg-slate-50 p-1.5 rounded-md">
                                      <span className="bg-slate-200/80 text-[8px] font-black uppercase text-slate-500 px-1 py-0.5 rounded shrink-0">Pág. {parseInt(page) + 1}</span>
                                      <span className="truncate max-w-[200px]" title={text}>{text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Footer pdf button */}
                          {corr.corrected_pdf_url && (
                            <div className="p-3 border-t border-slate-100 shrink-0">
                              <a
                                href={corr.corrected_pdf_url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-slate-900/10"
                              >
                                <Eye size={12} /> Ver PDF Corrigido
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex justify-end">
              <button
                onClick={() => setSelectedEssay(null)}
                className="px-5 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm font-bold rounded-xl"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Double confirmation deletion modal --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 text-center select-none">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 animate-bounce">
              <ShieldAlert size={24} />
            </div>
            
            <div>
              <h3 className="text-lg font-black text-slate-800">Deseja apagar esta redação?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Esta ação é **definitiva** e irá deletar permanentemente a redação, os arquivos PDFs e **todas as correções dos professores** associadas a ela.
              </p>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingId != null}
                className="flex-1 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-bold text-sm rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteEssay(showDeleteConfirm)}
                disabled={deletingId != null}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white transition-all font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/10"
              >
                {deletingId ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Apagando...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Confirmar Exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
