import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, FileCheck, TrendingUp, Calendar, DollarSign } from 'lucide-react';

export function TeacherProductivity() {
  const { user } = useAuth();
  const [corrections, setCorrections] = useState<any[]>([]);
  const [correctionFee, setCorrectionFee] = useState<number>(3.50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('essay_corrections')
          .select('*, essays(title)')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setCorrections(data || []);

        const { data: settingsData } = await supabase.from('platform_settings').select('correction_fee').limit(1).single();
        if (settingsData && settingsData.correction_fee) {
            setCorrectionFee(Number(settingsData.correction_fee));
        }
      } catch (err) {
        console.error("Erro ao carregar produtividade:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Estatísticas Rápidas
  const totalCorrections = corrections.length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const correctionsToday = corrections.filter(c => new Date(c.created_at) >= today).length;

  const averageScoreGiven = totalCorrections > 0 
    ? Math.round(corrections.reduce((acc, c) => acc + (c.score || 0), 0) / totalCorrections) 
    : 0;

  const unpaidCorrectionsCount = corrections.filter(c => c.paid_at === null).length;
  const estimatedEarnings = unpaidCorrectionsCount * correctionFee;

  // Dados para o Gráfico (Últimos 7 dias)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => {
    const count = corrections.filter(c => c.created_at.startsWith(date)).length;
    // Format date to DD/MM
    const [year, month, day] = date.split('-');
    return {
      name: `${day}/${month}`,
      correções: count
    };
  });

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Sua Produtividade</h1>
          <p className="text-slate-500 mt-1">Acompanhe suas correções e ganhos estimados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
            <FileCheck size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Corrigido</p>
            <h3 className="text-3xl font-black text-slate-800">{totalCorrections}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <Calendar size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Feitas Hoje</p>
            <h3 className="text-3xl font-black text-slate-800">{correctionsToday}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
            <Award size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Média Atribuída</p>
            <h3 className="text-3xl font-black text-slate-800">{averageScoreGiven}</h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-brand-orange to-orange-600 p-6 rounded-3xl text-white shadow-lg shadow-brand-orange/20 flex items-center gap-5 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-sm z-10">
            <DollarSign size={28} />
          </div>
          <div className="z-10">
            <p className="text-sm font-medium text-orange-100 mb-1">Ganhos (Ciclo Atual)</p>
            <h3 className="text-3xl font-black text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedEarnings)}
            </h3>
            <p className="text-xs text-white/70 mt-1">{unpaidCorrectionsCount} redações no ciclo</p>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Correções nos Últimos 7 Dias</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="correções" fill="#1e3a8a" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Últimas Avaliações</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {corrections.slice(0, 5).map((correction, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-brand-blue/20 hover:bg-white transition-all">
                <p className="font-bold text-slate-800 truncate mb-2">
                  {correction.essays?.title || "Redação sem título"}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {new Date(correction.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="px-2.5 py-1 bg-brand-orange/10 text-brand-orange rounded-lg text-sm font-bold">
                    {correction.score} pts
                  </span>
                </div>
              </div>
            ))}
            {corrections.length === 0 && (
              <p className="text-center text-slate-500 py-10">Você ainda não realizou nenhuma correção.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
