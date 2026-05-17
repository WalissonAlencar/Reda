import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, CheckCircle2, AlertCircle, History } from 'lucide-react';

interface TeacherFinance {
  id: string;
  name: string;
  email: string;
  unpaidCorrections: number;
}

interface PaymentHistory {
  id: string;
  teacher_id: string;
  amount: number;
  corrections_count: number;
  paid_at: string;
  teacher_name?: string;
}

export function AdminFinance() {
  const [teachers, setTeachers] = useState<TeacherFinance[]>([]);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [fee, setFee] = useState(3.50);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      // 1. Fetch correction fee
      const { data: settingsData } = await supabase.from('platform_settings').select('correction_fee').limit(1).single();
      const currentFee = settingsData ? Number(settingsData.correction_fee) : 3.50;
      setFee(currentFee);

      // 2. Fetch all teachers
      const { data: usersData, error: usersError } = await supabase.from('users').select('*').eq('role', 'TEACHER');
      if (usersError) throw usersError;

      // 3. Fetch all UNPAID corrections
      const { data: correctionsData, error: corrError } = await supabase
        .from('essay_corrections')
        .select('teacher_id')
        .is('paid_at', null);
      if (corrError) throw corrError;

      // 4. Group corrections by teacher_id
      const correctionsByTeacher = (correctionsData || []).reduce((acc: Record<string, number>, curr) => {
        acc[curr.teacher_id] = (acc[curr.teacher_id] || 0) + 1;
        return acc;
      }, {});

      // 5. Merge data
      const financeList: TeacherFinance[] = (usersData || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        unpaidCorrections: correctionsByTeacher[u.id] || 0
      }));

      // Sort by unpaidCorrections descending
      financeList.sort((a, b) => b.unpaidCorrections - a.unpaidCorrections);
      
      setTeachers(financeList);

      // 6. Fetch payment history
      const { data: histData, error: histError } = await supabase
        .from('teacher_payments')
        .select('*, users(name)')
        .order('paid_at', { ascending: false })
        .limit(20);
        
      if (!histError && histData) {
        setHistory(histData.map(h => ({
          ...h,
          teacher_name: h.users?.name
        })));
      }
    } catch (err) {
      console.error("Erro ao carregar dados financeiros", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (teacherId: string, teacherName: string, amount: number, count: number) => {
    if (!window.confirm(`Confirmar o registro de pagamento de R$ ${amount.toFixed(2)} para ${teacherName}? Isso zerará o ciclo atual do professor.`)) {
      return;
    }

    try {
      setProcessingId(teacherId);
      
      const now = new Date().toISOString();

      // Update corrections
      const { error: updError } = await supabase
        .from('essay_corrections')
        .update({ paid_at: now })
        .eq('teacher_id', teacherId)
        .is('paid_at', null);

      if (updError) throw updError;

      // Log payment
      const { error: insError } = await supabase
        .from('teacher_payments')
        .insert({
          teacher_id: teacherId,
          amount: amount,
          corrections_count: count,
          paid_at: now
        });
        
      if (insError) throw insError;
      
      // Reload to reflect zero balance
      await loadFinanceData();
      alert('Pagamento registrado com sucesso! O ciclo deste professor foi zerado.');

    } catch (err) {
      console.error("Erro ao registrar pagamento", err);
      alert('Erro ao registrar o pagamento.');
    } finally {
      setProcessingId(null);
    }
  };

  const totalOwed = teachers.reduce((acc, t) => acc + (t.unpaidCorrections * fee), 0);
  const totalCorrectionsPending = teachers.reduce((acc, t) => acc + t.unpaidCorrections, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Financeiro</h1>
          <p className="text-slate-500 mt-1">Gerencie os pagamentos por ciclo de correção dos professores.</p>
        </div>
        <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl px-4 py-2 flex flex-col items-end">
           <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Valor Base</span>
           <span className="text-lg font-black text-slate-800">R$ {fee.toFixed(2)} / redação</span>
        </div>
      </div>

      {/* Global Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-100">
              <AlertCircle size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Correções Pendentes de Pagto</p>
              <h3 className="text-3xl font-black text-slate-800">{totalCorrectionsPending}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <DollarSign size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total a Pagar (Ciclo Atual)</p>
              <h3 className="text-3xl font-black text-slate-800">R$ {totalOwed.toFixed(2)}</h3>
            </div>
          </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-sm font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-6">Professor</th>
                <th className="p-6 text-center">Volume no Ciclo</th>
                <th className="p-6 text-right">Valor a Receber</th>
                <th className="p-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((teacher) => {
                const amount = teacher.unpaidCorrections * fee;
                const isZero = amount === 0;

                return (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-bold text-slate-800">{teacher.name}</p>
                      <p className="text-sm text-slate-500">{teacher.email}</p>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${isZero ? 'bg-slate-100 text-slate-400' : 'bg-brand-orange/10 text-brand-orange'}`}>
                        {teacher.unpaidCorrections}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <p className={`text-lg font-black ${isZero ? 'text-slate-300' : 'text-slate-800'}`}>
                        R$ {amount.toFixed(2)}
                      </p>
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => handlePay(teacher.id, teacher.name, amount, teacher.unpaidCorrections)}
                        disabled={isZero || processingId === teacher.id}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                          ${isZero 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          }
                        `}
                      >
                        {processingId === teacher.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        Registrar Pagto
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    Nenhum professor encontrado no sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <History size={24} className="text-slate-400" />
          <h2 className="text-xl font-bold text-slate-800">Histórico de Pagamentos</h2>
        </div>
        
        {history.length === 0 ? (
          <p className="text-slate-500 text-center py-6">Nenhum pagamento registrado ainda.</p>
        ) : (
          <div className="space-y-4">
            {history.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-slate-800">{item.teacher_name || 'Professor'}</p>
                  <p className="text-sm text-slate-500">{new Date(item.paid_at).toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600">R$ {item.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 font-medium">{item.corrections_count} correções no ciclo</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
