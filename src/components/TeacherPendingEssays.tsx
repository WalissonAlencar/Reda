import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Loader2, Calendar, User, Search, Play } from 'lucide-react';
import { Essay } from '../types';

interface TeacherPendingEssaysProps {
  onStartCorrection: (essay: any) => void;
}

export function TeacherPendingEssays({ onStartCorrection }: TeacherPendingEssaysProps) {
  const [essays, setEssays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingEssays();
  }, []);

  const fetchPendingEssays = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      // Busca redações com status "sent" (Pendentes) e traz os dados do aluno atrelado
      const { data, error } = await supabase
        .from('essays')
        .select(`
          *,
          student:users!essays_student_id_fkey (name, avatar)
        `)
        .eq('status', 'sent')
        .order('submitted_at', { ascending: true });

      if (error) throw error;
      setEssays(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar redações pendentes:', error);
      setFetchError(error.message || JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const filteredEssays = essays.filter(essay => {
    const anonymousName = `Candidato #${essay.id.substring(0, 8).toUpperCase()}`;
    return (
      essay.title.toLowerCase().includes(search.toLowerCase()) || 
      anonymousName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Trabalhos Pendentes</h1>
          <p className="text-slate-500 mt-1">Selecione uma redação da fila para iniciar a correção.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por aluno ou tema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidato</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tema / Título</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Envio</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fetchError ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-red-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <p className="font-bold">Erro ao carregar:</p>
                      <p className="text-sm font-mono bg-red-50 p-4 rounded">{fetchError}</p>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={32} className="animate-spin text-brand-blue" />
                      <p>Buscando redações na fila...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEssays.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileText size={32} className="text-slate-300" />
                      <p>Fila zerada! Nenhuma redação pendente no momento.</p>
                    </div>
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
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                          <FileText size={16} />
                        </div>
                        <span className="font-medium text-slate-700 line-clamp-1 max-w-xs">{essay.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={16} />
                        <span className="text-sm">
                          {essay.submitted_at ? new Date(essay.submitted_at).toLocaleDateString('pt-BR') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          // Map the DB object to match what CorrectionInterface expects if needed
                          onStartCorrection({
                            id: essay.id,
                            studentName: `Candidato #${essay.id.substring(0, 8).toUpperCase()}`,
                            title: essay.title,
                            pdfUrl: essay.pdf_url,
                            status: essay.status
                          });
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-brand-orange/20 transition-colors"
                      >
                        <Play size={16} />
                        Corrigir
                      </button>
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
