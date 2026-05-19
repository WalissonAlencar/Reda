import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  ArrowUpRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEssays: 0,
    totalCorrections: 0,
    activeStudents: 0,
    teachers: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const { data: usersData } = await supabase.from('users').select('role');
      const studentsCount = (usersData || []).filter(u => u.role === 'STUDENT').length;
      const teachersCount = (usersData || []).filter(u => u.role === 'TEACHER').length;

      // Fetch essays with details for recent activity
      const { data: essaysData } = await supabase
        .from('essays')
        .select('id, created_at, status, users!essays_student_id_fkey(name), themes(title)')
        .order('created_at', { ascending: false });

      // Fetch corrections count
      const { count: correctionsCount } = await supabase
        .from('essay_corrections')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalEssays: essaysData?.length || 0,
        totalCorrections: correctionsCount || 0,
        activeStudents: studentsCount,
        teachers: teachersCount
      });

      // Recent Activity
      if (essaysData) {
        setRecentActivity(essaysData.slice(0, 5));

        // Chart Data (Group essays by month for current year)
        const currentYear = new Date().getFullYear();
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthlyData = Array(12).fill(0).map((_, i) => ({ name: months[i], essays: 0 }));

        essaysData.forEach(essay => {
          const date = new Date(essay.created_at);
          if (date.getFullYear() === currentYear) {
            monthlyData[date.getMonth()].essays += 1;
          }
        });

        const currentMonthIndex = new Date().getMonth();
        // Show last 6 months up to current
        const startIndex = Math.max(0, currentMonthIndex - 5);
        setChartData(monthlyData.slice(startIndex, currentMonthIndex + 1));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-slate-500 mt-1">Visão geral da plataforma RedPrime.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Exportar CSV
          </button>
          <button className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/20 transition-colors">
            Gerar Relatório Completo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total de Redações', value: stats.totalEssays, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
              { label: 'Correções Concluídas', value: stats.totalCorrections, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+8%' },
              { label: 'Alunos Ativos', value: stats.activeStudents, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+15%' },
              { label: 'Professores', value: stats.teachers, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Estável' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                    <stat.icon size={24} />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded-full">
                    {stat.trend} <ArrowUpRight size={12} className="ml-1" />
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-800">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold">Volume de Redações (2024)</h3>
                <select className="text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none">
                  <option>Últimos meses</option>
                  <option>Este ano</option>
                </select>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEssays" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="essays" stroke="#fb923c" strokeWidth={3} fillOpacity={1} fill="url(#colorEssays)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Latest Activity */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Atividade Recente</h3>
              <div className="space-y-6">
                {recentActivity.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center">Nenhuma redação enviada ainda.</p>
                ) : (
                  recentActivity.map((essay) => (
                    <div key={essay.id} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{essay.users?.name || 'Aluno Desconhecido'}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">{essay.themes?.title || 'Tema sem título'}</p>
                        <div className="flex items-center mt-2">
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                            essay.status === 'CORRECTED' ? 'bg-emerald-100 text-emerald-700' : 
                            essay.status === 'CORRECTING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                          )}>
                            {essay.status === 'CORRECTED' ? 'Corrigida' : essay.status === 'CORRECTING' ? 'Em correção' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button className="w-full mt-8 py-2 text-sm font-medium text-brand-blue hover:underline">
                Ver todas as atividades
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
