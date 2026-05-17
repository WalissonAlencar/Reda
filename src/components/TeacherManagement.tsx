import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { Search, Mail, Loader2, ShieldCheck, GraduationCap, BookOpen, BarChart2, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { TeacherProfileModal } from './TeacherProfileModal';

interface TeacherStats extends User {
  totalCorrections: number;
  amountPaid: number;
  amountPending: number;
}

export function TeacherManagement() {
  const [teachersList, setTeachersList] = useState<TeacherStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<TeacherStats | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      
      // 1. Buscar todos os professores (ativos e pendentes)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('role', ['TEACHER', 'PENDING_TEACHER'])
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // 2. Buscar configurações (fee)
      const { data: settingsData } = await supabase.from('platform_settings').select('correction_fee').limit(1).single();
      const fee = settingsData ? Number(settingsData.correction_fee) : 3.50;

      // 3. Buscar correções para calcular pendentes e total
      const { data: correctionsData, error: corrError } = await supabase
        .from('essay_corrections')
        .select('teacher_id, paid_at');
        
      if (corrError) throw corrError;

      // 4. Buscar pagamentos já realizados
      const { data: paymentsData, error: payError } = await supabase
        .from('teacher_payments')
        .select('teacher_id, amount');

      if (payError) throw payError;

      // Agrupar correções por professor
      const corrMap = (correctionsData || []).reduce((acc, curr) => {
        if (!acc[curr.teacher_id]) {
          acc[curr.teacher_id] = { total: 0, pending: 0 };
        }
        acc[curr.teacher_id].total += 1;
        if (!curr.paid_at) {
          acc[curr.teacher_id].pending += 1;
        }
        return acc;
      }, {} as Record<string, { total: number, pending: number }>);

      // Agrupar pagamentos
      const payMap = (paymentsData || []).reduce((acc, curr) => {
        acc[curr.teacher_id] = (acc[curr.teacher_id] || 0) + Number(curr.amount);
        return acc;
      }, {} as Record<string, number>);

      const enrichedTeachers = (usersData || []).map(u => {
        const cStats = corrMap[u.id] || { total: 0, pending: 0 };
        const paid = payMap[u.id] || 0;
        
        return {
          ...u,
          totalCorrections: cStats.total,
          amountPaid: paid,
          amountPending: cStats.pending * fee
        };
      });

      setTeachersList(enrichedTeachers);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!window.confirm("Atenção: Ao remover o cargo de professor, este usuário não aparecerá mais nesta lista. Deseja continuar?")) {
      return;
    }

    try {
      setUpdatingId(userId);
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Se mudou de professor, remove da lista local
      if (newRole !== 'TEACHER') {
        setTeachersList(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar o perfil do usuário.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTeachers = teachersList.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Gestão de Professores</h1>
          <p className="text-slate-500 mt-1">Acompanhe a equipe de corretores e suas métricas.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar corretor..."
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Professor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total Corrigido</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Já Recebido</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Pendente (Ciclo)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={32} className="animate-spin text-brand-blue" />
                      <p>Carregando professores...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <GraduationCap size={32} className="text-slate-300" />
                      <p>Nenhum professor encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold shadow-sm shrink-0 overflow-hidden">
                          {teacher.avatar ? (
                            <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                          ) : (
                            teacher.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 block">{teacher.name}</span>
                            {teacher.role === 'PENDING_TEACHER' && (
                              <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">Pendente</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 text-sm mt-0.5">
                            <Mail size={12} />
                            <span>{teacher.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full text-sm">
                         {teacher.totalCorrections}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(teacher.amountPaid)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${teacher.amountPending > 0 ? 'text-brand-orange' : 'text-slate-400'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(teacher.amountPending)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setEditingTeacher(teacher)}
                        className="p-2 text-slate-400 hover:text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-all"
                        title="Ajustar Cadastro"
                      >
                        <Settings2 size={18} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end">
                         {updatingId === teacher.id ? (
                            <div className="flex items-center gap-2 text-brand-orange text-sm font-bold">
                              <Loader2 size={16} className="animate-spin" /> Atualizando...
                            </div>
                         ) : (
                           <div className="relative inline-block">
                             <select
                               value={teacher.role}
                               onChange={(e) => handleRoleChange(teacher.id, e.target.value as UserRole)}
                               className={cn(
                                 "appearance-none pl-8 pr-8 py-2 rounded-lg text-xs font-bold uppercase tracking-wider outline-none border cursor-pointer transition-all",
                                 teacher.role === 'ADMIN' ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' :
                                 teacher.role === 'PENDING_TEACHER' ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' :
                                 teacher.role === 'TEACHER' ? 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue hover:bg-brand-blue/20' :
                                 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                               )}
                             >
                               {teacher.role === 'PENDING_TEACHER' && <option value="PENDING_TEACHER">Aguardando...</option>}
                               <option value="TEACHER">{teacher.role === 'PENDING_TEACHER' ? 'Aprovar Professor' : 'Professor'}</option>
                               <option value="STUDENT">Rebaixar a Aluno</option>
                               <option value="ADMIN">Promover a Admin</option>
                             </select>
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                {(teacher.role === 'TEACHER' || teacher.role === 'PENDING_TEACHER') && <GraduationCap size={14} className={teacher.role === 'PENDING_TEACHER' ? 'text-amber-700' : 'text-brand-blue'} />}
                             </div>
                           </div>
                         )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTeacher && (
        <TeacherProfileModal
          user={editingTeacher}
          onClose={() => setEditingTeacher(null)}
          onSaved={(updatedUser) => {
            setTeachersList(prev => prev.map(t => 
              t.id === updatedUser.id 
                ? { ...t, ...updatedUser }
                : t
            ));
          }}
        />
      )}
    </div>
  );
}
