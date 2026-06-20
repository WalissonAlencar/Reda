import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, 
  History, 
  AlertCircle,
  Loader2,
  Wallet,
  BookOpen,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  List,
  CheckCircle2,
  X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type TransactionType = 'correction' | 'royalty' | 'payment';

interface LedgerTransaction {
  id: string;
  date: string;
  type: TransactionType;
  title: string;
  amount: number;
}

export function TeacherFinance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Taxas
  const [correctionFee, setCorrectionFee] = useState(3.50);
  const [royaltyFee, setRoyaltyFee] = useState(0.10);
  
  // Saldos
  const [unpaidCorrections, setUnpaidCorrections] = useState<any[]>([]);
  const [unpaidRoyalties, setUnpaidRoyalties] = useState<any[]>([]);
  
  // Extrato Completo
  const [ledger, setLedger] = useState<LedgerTransaction[]>([]);

  // Saque
  const [pixKey, setPixKey] = useState('');
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadFinanceData();
    }
  }, [user?.id]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch fees
      const { data: settingsData } = await supabase.from('platform_settings').select('*').limit(1).single();
      const currentCorrFee = settingsData ? Number(settingsData.correction_fee) : 3.50;
      const currentRoyaltyFee = settingsData?.theme_royalty_fee ? Number(settingsData.theme_royalty_fee) : 0.10;
      setCorrectionFee(currentCorrFee);
      setRoyaltyFee(currentRoyaltyFee);

      // 2. Fetch payment history (for Extrato and for last payment date)
      const { data: histData, error: histError } = await supabase
        .from('teacher_payments')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('paid_at', { ascending: false });
        
      if (histError) throw histError;
      const payments = histData || [];
      const lastPaymentDate = payments.length > 0 ? payments[0].paid_at : null;

      // 3. Fetch ALL corrections for Extrato
      const { data: allCorrections } = await supabase
        .from('essay_corrections')
        .select('id, created_at, paid_at, essays(title)')
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(200);

      const corrections = allCorrections || [];
      const pendingCorrections = corrections.filter(c => !c.paid_at);
      setUnpaidCorrections(pendingCorrections);

      // 4. Fetch ALL Royalties for Extrato
      const { data: themesData } = await supabase.from('essay_themes').select('id').eq('teacher_id', user?.id);
      const themeIds = themesData?.map(t => t.id) || [];
      
      let royalties: any[] = [];
      let pendingRoyalties: any[] = [];
      
      if (themeIds.length > 0) {
        const { data: essaysData } = await supabase
          .from('essays')
          .select('id, created_at, title')
          .in('theme_id', themeIds)
          .order('created_at', { ascending: false })
          .limit(200);
          
        royalties = essaysData || [];
        
        if (lastPaymentDate) {
          pendingRoyalties = royalties.filter(r => new Date(r.created_at) > new Date(lastPaymentDate));
        } else {
          pendingRoyalties = royalties;
        }
        
        setUnpaidRoyalties(pendingRoyalties);
      } else {
        setUnpaidRoyalties([]);
      }

      // 5. Fetch User PIX Key and Active Withdrawal Request
      const { data: userData } = await supabase.from('users').select('pix_key').eq('id', user?.id).single();
      if (userData?.pix_key) setPixKey(userData.pix_key);

      const { data: reqData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('teacher_id', user?.id)
        .eq('status', 'pending')
        .limit(1)
        .single();
        
      setActiveRequest(reqData || null);

      // 6. Build Ledger (Extrato)
      const allTransactions: LedgerTransaction[] = [];

      payments.forEach(p => {
        allTransactions.push({
          id: p.id,
          date: p.paid_at,
          type: 'payment',
          title: `Pagamento de Ciclo (${p.corrections_count} corr, ${p.royalties_count || 0} roy)`,
          amount: p.amount
        });
      });

      corrections.forEach(c => {
        if (!c.created_at) return;
        const essayTitle = c.essays && !Array.isArray(c.essays) ? c.essays.title : 'Redação';
        allTransactions.push({
          id: `corr_${c.id}`,
          date: c.created_at,
          type: 'correction',
          title: `Correção: ${essayTitle}`,
          amount: currentCorrFee
        });
      });

      royalties.forEach(r => {
        if (!r.created_at) return;
        allTransactions.push({
          id: `roy_${r.id}`,
          date: r.created_at,
          type: 'royalty',
          title: `Royalty: ${r.title}`,
          amount: currentRoyaltyFee
        });
      });

      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLedger(allTransactions.slice(0, 200));

    } catch (err) {
      console.error("Erro ao carregar dados financeiros do professor", err);
    } finally {
      setLoading(false);
    }
  };

  const totalOwedCorrections = unpaidCorrections.length * correctionFee;
  const totalOwedRoyalties = unpaidRoyalties.length * royaltyFee;
  const totalOwed = totalOwedCorrections + totalOwedRoyalties;

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey.trim() || totalOwed <= 0) return;

    try {
      setRequestingWithdrawal(true);
      
      // Update PIX Key on User if changed
      await supabase.from('users').update({ pix_key: pixKey }).eq('id', user?.id);

      // Create Request
      const { error } = await supabase.from('withdrawal_requests').insert({
        teacher_id: user?.id,
        amount: totalOwed,
        pix_key: pixKey
      });

      if (error) throw error;

      await loadFinanceData();
      setIsPixModalOpen(false);
      alert('Solicitação de saque enviada com sucesso! Aguarde a aprovação do administrador.');
    } catch (err) {
      console.error('Erro ao solicitar saque', err);
      alert('Erro ao solicitar saque.');
    } finally {
      setRequestingWithdrawal(false);
    }
  };

  // Gerar dados para o gráfico
  const chartData = useMemo(() => {
    const dailyData: Record<string, { date: string, income: number, count: number }> = {};
    
    unpaidCorrections.forEach(corr => {
      if (!corr.created_at) return;
      const date = new Date(corr.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      if (!dailyData[date]) dailyData[date] = { date, income: 0, count: 0 };
      dailyData[date].income += correctionFee;
      dailyData[date].count += 1;
    });

    unpaidRoyalties.forEach(royalty => {
      if (!royalty.created_at) return;
      const date = new Date(royalty.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      if (!dailyData[date]) dailyData[date] = { date, income: 0, count: 0 };
      dailyData[date].income += royaltyFee;
    });

    const sortedData = Object.values(dailyData).sort((a, b) => 1);
    return sortedData;
  }, [unpaidCorrections, unpaidRoyalties, correctionFee, royaltyFee]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Seu Financeiro</h1>
          <p className="text-slate-500 mt-1">Acompanhe seu saldo a receber, ganhos por dia e seu extrato completo.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl px-4 py-2 flex flex-col items-end">
             <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Por Correção</span>
             <span className="text-lg font-black text-slate-800">R$ {correctionFee.toFixed(2)}</span>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 flex flex-col items-end">
             <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Royalty de Tema</span>
             <span className="text-lg font-black text-slate-800">R$ {royaltyFee.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <AlertCircle size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Correções no Ciclo</p>
                <h3 className="text-3xl font-black text-slate-800">{unpaidCorrections.length} <span className="text-base text-slate-400 font-normal">redações</span></h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                <BookOpen size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Uso de seus Temas</p>
                <h3 className="text-3xl font-black text-slate-800">{unpaidRoyalties.length} <span className="text-base text-slate-400 font-normal">usos</span></h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-500/20 shadow-md shadow-emerald-500/5 flex items-center gap-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                <Wallet size={28} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 mb-1">Saldo a Receber</p>
                <h3 className="text-4xl font-black text-emerald-600">R$ {totalOwed.toFixed(2)}</h3>
              </div>
              
              {/* Saque Button / Status */}
              <div className="ml-auto">
                {activeRequest ? (
                  <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold flex flex-col items-center shadow-sm border border-amber-200">
                    <Loader2 size={16} className="animate-spin mb-1" />
                    <span>Em Análise</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsPixModalOpen(true)}
                    disabled={totalOwed <= 0}
                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-all flex flex-col items-center justify-center
                      ${totalOwed > 0
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/30 hover:-translate-y-0.5'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <span>Solicitar</span>
                    <span>Saque</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico de Desempenho Diário */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={24} className="text-brand-orange" />
              <h2 className="text-xl font-bold text-slate-800">Faturamento Diário no Ciclo Atual</h2>
            </div>
            
            {chartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <p>Nenhuma atividade registrada ainda neste ciclo financeiro.</p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800">
                              <p className="font-bold text-sm mb-1">{payload[0].payload.date}</p>
                              <p className="text-emerald-400 font-black text-lg">R$ {Number(payload[0].value).toFixed(2)}</p>
                              <p className="text-slate-400 text-xs mt-1">{payload[0].payload.count} correções no dia</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="income" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Ledger (Extrato) Section */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <List size={24} className="text-slate-400" />
              <h2 className="text-xl font-bold text-slate-800">Extrato Completo</h2>
            </div>
            
            {ledger.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <History size={24} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Nenhuma movimentação</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                  Seu extrato ainda está vazio. Comece a corrigir redações para ver seus ganhos aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ledger.map(item => {
                  const isPayment = item.type === 'payment';
                  return (
                    <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-brand-blue/30 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
                          ${isPayment 
                            ? 'bg-red-50 text-red-600 border-red-100' 
                            : item.type === 'royalty' 
                              ? 'bg-purple-50 text-purple-600 border-purple-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }
                        `}>
                          {isPayment ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 truncate max-w-xs md:max-w-md" title={item.title}>
                            {item.title}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(item.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-lg font-black ${isPayment ? 'text-red-500' : 'text-emerald-500'}`}>
                          {isPayment ? '-' : '+'} R$ {item.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                          {item.type === 'payment' ? 'Saque' : item.type === 'royalty' ? 'Royalty' : 'Correção'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* PIX Modal */}
      {isPixModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Solicitar Saque</h2>
              <button 
                onClick={() => setIsPixModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRequestWithdrawal} className="p-6">
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 mb-6">
                <Wallet className="shrink-0" />
                <div>
                  <p className="text-sm font-medium">Valor a sacar</p>
                  <p className="text-2xl font-black">R$ {totalOwed.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Sua Chave PIX
                  </label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    required
                    placeholder="CPF, E-mail, Telefone ou Aleatória"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Esta chave será salva para os próximos saques. Verifique cuidadosamente antes de confirmar.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPixModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={requestingWithdrawal || !pixKey.trim()}
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {requestingWithdrawal ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={20} className="mr-2" />
                      Confirmar Saque
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
