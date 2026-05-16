import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, Filter, FileText, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

const mockSlaData = [
  { name: 'Seg', media: 24, p90: 48 },
  { name: 'Ter', media: 22, p90: 45 },
  { name: 'Qua', media: 26, p90: 50 },
  { name: 'Qui', media: 18, p90: 38 },
  { name: 'Sex', media: 20, p90: 42 },
  { name: 'Sáb', media: 35, p90: 60 },
  { name: 'Dom', media: 40, p90: 72 },
];

const mockDiscrepancyData = [
  { name: 'Competência 1', divergencias: 145 },
  { name: 'Competência 2', divergencias: 89 },
  { name: 'Competência 3', divergencias: 210 },
  { name: 'Competência 4', divergencias: 65 },
  { name: 'Competência 5', divergencias: 120 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AdminReports() {
  const [period, setPeriod] = useState('7d');
  const [stats, setStats] = useState({
    totalCorrecoes: 0,
    redacoesComDivergencia: 0,
    professoresAtivos: 0,
    taxaDivergencia: '0%'
  });
  const [discrepancyData, setDiscrepancyData] = useState(mockDiscrepancyData);

  useEffect(() => {
    async function loadData() {
      // Fetch total teachers
      const { count: countTeachers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'TEACHER');

      // Fetch all corrections
      const { data: corrections } = await supabase
        .from('essay_corrections')
        .select('*');

      if (corrections) {
        // Group by essay_id
        const byEssay: Record<string, any[]> = {};
        corrections.forEach(c => {
          if (!byEssay[c.essay_id]) byEssay[c.essay_id] = [];
          byEssay[c.essay_id].push(c);
        });

        let divergencias = 0;
        let totalDuplas = 0;
        
        let diffs = { comp1: 0, comp2: 0, comp3: 0, comp4: 0, comp5: 0 };

        Object.values(byEssay).forEach(corrList => {
          if (corrList.length === 2) {
            totalDuplas++;
            const [c1, c2] = corrList;
            
            let hasDiscrepancy = false;
            
            // Check for > 100 overall score difference
            if (Math.abs((c1.score || 0) - (c2.score || 0)) > 100) hasDiscrepancy = true;
            
            // Check for > 40 in any comp
            const comps = ['comp_1', 'comp_2', 'comp_3', 'comp_4', 'comp_5'];
            comps.forEach((comp, idx) => {
              const diff = Math.abs((c1[comp] || 0) - (c2[comp] || 0));
              if (diff > 40) {
                hasDiscrepancy = true;
                const key = `comp${idx+1}` as keyof typeof diffs;
                diffs[key]++;
              }
            });

            if (hasDiscrepancy) divergencias++;
          }
        });

        const percDivergencia = totalDuplas > 0 ? Math.round((divergencias / totalDuplas) * 100) : 0;

        setStats({
          totalCorrecoes: corrections.length,
          redacoesComDivergencia: divergencias,
          professoresAtivos: countTeachers || 0,
          taxaDivergencia: `${percDivergencia}%`
        });

        setDiscrepancyData([
          { name: 'Competência 1', divergencias: diffs.comp1 },
          { name: 'Competência 2', divergencias: diffs.comp2 },
          { name: 'Competência 3', divergencias: diffs.comp3 },
          { name: 'Competência 4', divergencias: diffs.comp4 },
          { name: 'Competência 5', divergencias: diffs.comp5 },
        ]);
      }
    }
    
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Gestão</h1>
          <p className="text-slate-500 mt-1">Métricas avançadas, SLA e análise de dupla correção.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/20 transition-colors">
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Tempo Médio (SLA)', value: '24h', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Meta: 48h (Mock)' },
          { label: 'Taxa de Divergência', value: stats.taxaDivergencia, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Acima de 40pts por comp' },
          { label: 'Total de Correções', value: stats.totalCorrecoes.toString(), icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'No período' },
          { label: 'Professores Ativos', value: stats.professoresAtivos.toString(), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Cadastrados' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-800">{stat.value}</h3>
            <p className="text-xs text-slate-400 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SLA Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold">Evolução do SLA de Correção (horas)</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockSlaData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="media" name="Média (Mock)" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="p90" name="Percentil 90 (Mock)" stroke="#f43f5e" strokeWidth={3} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Discrepancies by Competency */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold">Divergências por Competência</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Diferença &gt; 40pts</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={discrepancyData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="divergencias" name="Casos" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                  {discrepancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
