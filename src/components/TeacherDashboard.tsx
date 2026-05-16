import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter,
  Play,
  User,
  Eye,
  Loader2,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface TeacherDashboardProps {
  onStartCorrection: (essay: any) => void;
}

export function TeacherDashboard({ onStartCorrection }: TeacherDashboardProps) {
  const { user } = useAuth();
  const [essays, setEssays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'corrected'>('all');

  useEffect(() => {
    fetchEssays();
  }, []);

  const fetchEssays = async () => {
    try {
      setLoading(true);
      // Fetch all essays and their corrections
      // We assume essay_corrections table exists
      let dataToProcess: any[] = [];
      const { data, error } = await supabase
        .from('essays')
        .select(`
          *,
          essay_corrections (id, teacher_id)
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.warn('Tabela essay_corrections pode não existir ainda. Erro:', error);
        // Fallback: fetch without the join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('essays')
          .select('*')
          .order('submitted_at', { ascending: false });
          
        if (fallbackError) throw fallbackError;
        dataToProcess = fallbackData || [];
      } else {
        dataToProcess = data || [];
      }
      
      const relevantEssays = dataToProcess.map(e => {
        // Detect if we are in fallback mode (no essay_corrections property returned from Supabase)
        const inFallbackMode = !('essay_corrections' in e);
        
        if (inFallbackMode) {
          const isCorrectedByMe = e.status === 'corrected' && e.teacher_id === user?.id;
          const isPendingForMe = e.status === 'sent';
          return {
            ...e,
            isPendingForMe,
            isCorrectedByMe,
            myCorrectionId: null
          };
        }

        const corrections = e.essay_corrections || [];
        const myCorrection = corrections.find((c: any) => c.teacher_id === user?.id);
        const isPendingForMe = !myCorrection && corrections.length < 2;
        const isCorrectedByMe = !!myCorrection;
        
        return {
          ...e,
          isPendingForMe,
          isCorrectedByMe,
          myCorrectionId: myCorrection?.id
        };
      }).filter(e => e.isPendingForMe || e.isCorrectedByMe);

      setEssays(relevantEssays);
    } catch (error) {
      console.error('Erro ao buscar redações:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = essays.filter(e => e.isPendingForMe).length;
  const correctedCount = essays.filter(e => e.isCorrectedByMe).length;

  const filteredEssays = essays.filter(essay => {
    const anonymousName = `Redação #${essay.id.substring(0, 8).toUpperCase()}`;
    const matchesSearch = essay.title.toLowerCase().includes(search.toLowerCase()) || 
                          anonymousName.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeFilter === 'pending' && !essay.isPendingForMe) return false;
    if (activeFilter === 'corrected' && !essay.isCorrectedByMe) return false;
    
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Suas Correções</h1>
        <p className="text-slate-500 mt-1">Modo Anônimo Ativado: As correções são duplas e os nomes ocultos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-brand-blue/30 transition-colors" onClick={() => setActiveFilter('pending')}>
          <p className="text-slate-500 text-sm font-medium mb-1">Pendentes (Fila)</p>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-bold text-slate-800">{pendingCount}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-emerald-500/30 transition-colors" onClick={() => setActiveFilter('corrected')}>
          <p className="text-slate-500 text-sm font-medium mb-1">Suas Correções (Mês)</p>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-bold text-slate-800">{correctedCount}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Privacidade</p>
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-brand-blue" />
            <span className="bg-brand-blue/10 text-brand-blue text-xs font-bold px-2 py-0.5 rounded-full">Anônimo</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-lg text-slate-800">Fila Dupla-Cega</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveFilter('all')}
                className={cn("text-xs font-bold px-3 py-1.5 rounded-full transition-colors", activeFilter === 'all' ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300")}
              >
                Todas
              </button>
              <button 
                onClick={() => setActiveFilter('pending')}
                className={cn("text-xs font-bold px-3 py-1.5 rounded-full transition-colors", activeFilter === 'pending' ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600 hover:bg-slate-300")}
              >
                Pendentes
              </button>
              <button 
                onClick={() => setActiveFilter('corrected')}
                className={cn("text-xs font-bold px-3 py-1.5 rounded-full transition-colors", activeFilter === 'corrected' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600 hover:bg-slate-300")}
              >
                Corrigidas
              </button>
            </div>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar redação..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 italic text-slate-400 text-xs">
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Candidato</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Título da Redação</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Data de Envio</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                     <Loader2 size={32} className="animate-spin text-brand-blue mx-auto mb-4" />
                     <p>Carregando redações...</p>
                   </td>
                 </tr>
              ) : filteredEssays.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                     <FileText size={32} className="text-slate-300 mx-auto mb-4" />
                     <p>Nenhuma redação encontrada para os filtros atuais.</p>
                   </td>
                 </tr>
              ) : (
                filteredEssays.map((essay) => (
                  <tr key={essay.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs overflow-hidden shrink-0">
                          <User size={14} />
                        </div>
                        <span className="font-mono font-semibold text-sm text-slate-700">#{essay.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 truncate max-w-xs block font-medium">{essay.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock size={14} />
                        {essay.submitted_at ? new Date(essay.submitted_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-1 rounded-full border",
                        essay.isPendingForMe ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                        essay.isCorrectedByMe ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      )}>
                        {essay.isPendingForMe ? 'Pendente' : essay.isCorrectedByMe ? 'Sua Correção Feita' : essay.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {essay.isPendingForMe ? (
                        <button 
                          onClick={() => onStartCorrection({
                            id: essay.id,
                            studentName: `Candidato #${essay.id.substring(0, 8).toUpperCase()}`,
                            title: essay.title,
                            pdfUrl: essay.pdf_url,
                            status: 'sent',
                            myCorrectionId: null
                          })}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-brand-blue/90 transition-all shadow-md shadow-brand-blue/10"
                        >
                          <Play size={14} />
                          Corrigir
                        </button>
                      ) : (
                        <button 
                          onClick={() => onStartCorrection({
                            id: essay.id,
                            studentName: `Candidato #${essay.id.substring(0, 8).toUpperCase()}`,
                            title: essay.title,
                            pdfUrl: essay.pdf_url, // For revision we will fetch the specific corrected_pdf_url from essay_corrections later
                            status: 'corrected',
                            myCorrectionId: essay.myCorrectionId
                          })}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-emerald-500 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-all shadow-sm"
                        >
                          <Eye size={14} />
                          Revisar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
