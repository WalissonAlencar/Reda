import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Coins, 
  Loader2 
} from 'lucide-react';

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

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  title: string;
  description: string;
  popular: boolean;
  discount: string | null;
}

export function AdminFinance() {
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'config'>('teachers');
  
  // Teacher Finance States
  const [teachers, setTeachers] = useState<TeacherFinance[]>([]);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [fee, setFee] = useState(3.50);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Config States
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [inputFee, setInputFee] = useState<string>('3.50');
  const [savingFee, setSavingFee] = useState(false);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgCredits, setPkgCredits] = useState<number>(1);
  const [pkgPrice, setPkgPrice] = useState<number>(15.00);
  const [pkgPopular, setPkgPopular] = useState(false);
  const [pkgDiscount, setPkgDiscount] = useState('');
  const [savingPackage, setSavingPackage] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'teachers') {
      loadFinanceData();
    } else {
      loadConfigData();
    }
  }, [activeSubTab]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      // 1. Fetch correction fee
      const { data: settingsData } = await supabase.from('platform_settings').select('*').limit(1).single();
      const currentFee = settingsData ? Number(settingsData.correction_fee) : 3.50;
      setFee(currentFee);
      if (settingsData) {
        setSettingsId(settingsData.id);
      }

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

  const loadConfigData = async () => {
    try {
      setLoadingPackages(true);
      // 1. Fetch platform settings
      const { data: settingsData } = await supabase.from('platform_settings').select('*').limit(1).single();
      if (settingsData) {
        setSettingsId(settingsData.id);
        setInputFee(Number(settingsData.correction_fee).toFixed(2));
      }

      // 2. Fetch packages
      const { data: pkgsData, error: pkgsError } = await supabase
        .from('credit_packages')
        .select('*')
        .order('price', { ascending: true });
        
      if (pkgsError) throw pkgsError;
      
      if (pkgsData) {
        setCreditPackages(pkgsData.map(p => ({
          id: p.id,
          credits: Number(p.credits),
          price: Number(p.price),
          title: p.title,
          description: p.description,
          popular: !!p.popular,
          discount: p.discount
        })));
      }
    } catch (err) {
      console.error("Erro ao carregar configurações de preços e pacotes", err);
    } finally {
      setLoadingPackages(false);
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

  const handleSaveFee = async () => {
    if (!settingsId) {
      alert('Configurações da plataforma não encontradas.');
      return;
    }
    try {
      setSavingFee(true);
      const numericFee = parseFloat(inputFee);
      if (isNaN(numericFee) || numericFee <= 0) {
        alert('Por favor, insira um valor válido de taxa.');
        return;
      }
      
      const { error } = await supabase
        .from('platform_settings')
        .update({ correction_fee: numericFee })
        .eq('id', settingsId);
        
      if (error) throw error;
      setFee(numericFee);
      alert('Valor base por correção atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar taxa de correção:', err);
      alert('Erro ao atualizar a taxa.');
    } finally {
      setSavingFee(false);
    }
  };

  const handleOpenPackageModal = (pkg: CreditPackage | null = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPkgTitle(pkg.title);
      setPkgDescription(pkg.description || '');
      setPkgCredits(pkg.credits);
      setPkgPrice(pkg.price);
      setPkgPopular(pkg.popular);
      setPkgDiscount(pkg.discount || '');
    } else {
      setEditingPackage(null);
      setPkgTitle('');
      setPkgDescription('');
      setPkgCredits(5);
      setPkgPrice(60.00);
      setPkgPopular(false);
      setPkgDiscount('');
    }
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle || pkgCredits <= 0 || pkgPrice <= 0) {
      alert('Preencha os campos obrigatórios corretamente.');
      return;
    }

    try {
      setSavingPackage(true);
      const payload = {
        title: pkgTitle,
        description: pkgDescription || null,
        credits: Number(pkgCredits),
        price: Number(pkgPrice),
        popular: !!pkgPopular,
        discount: pkgDiscount || null,
        updated_at: new Date().toISOString()
      };

      if (editingPackage) {
        const { error } = await supabase
          .from('credit_packages')
          .update(payload)
          .eq('id', editingPackage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('credit_packages')
          .insert(payload);
        if (error) throw error;
      }

      await loadConfigData();
      setIsPackageModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar pacote:', err);
      alert('Erro ao salvar pacote.');
    } finally {
      setSavingPackage(false);
    }
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o pacote "${name}"? Isso impedirá novas compras deste pacote pelos alunos.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('credit_packages')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      await loadConfigData();
    } catch (err) {
      console.error('Erro ao deletar pacote:', err);
      alert('Erro ao deletar o pacote.');
    }
  };

  const totalOwed = teachers.reduce((acc, t) => acc + (t.unpaidCorrections * fee), 0);
  const totalCorrectionsPending = teachers.reduce((acc, t) => acc + t.unpaidCorrections, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Financeiro</h1>
          <p className="text-slate-500 mt-1">Gerencie pagamentos de professores e configure preços de créditos.</p>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('teachers')}
          className={`pb-4 px-6 font-bold text-sm transition-all border-b-2
            ${activeSubTab === 'teachers' 
              ? 'border-brand-blue text-brand-blue' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
            }
          `}
        >
          Ciclos dos Professores
        </button>
        <button
          onClick={() => setActiveSubTab('config')}
          className={`pb-4 px-6 font-bold text-sm transition-all border-b-2
            ${activeSubTab === 'config' 
              ? 'border-brand-blue text-brand-blue' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
            }
          `}
        >
          Preços e Pacotes de Créditos
        </button>
      </div>

      {/* Loading state for primary tabs */}
      {loading && activeSubTab === 'teachers' && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Sub-Tab 1: Teacher Payments */}
      {!loading && activeSubTab === 'teachers' && (
        <>
          <div className="flex justify-end">
            <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl px-4 py-2 flex flex-col items-end">
               <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Valor Base Atual</span>
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
        </>
      )}

      {/* Sub-Tab 2: Price and Credit Packages Settings */}
      {activeSubTab === 'config' && (
        <div className="space-y-8">
          
          {/* Base Correction Fee Card */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <DollarSign className="text-brand-blue" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Valor Pago ao Professor</h2>
            </div>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              Defina o valor base que os professores recebem por cada correção de redação realizada na plataforma. Esse valor será usado para calcular o saldo devedor de cada ciclo.
            </p>
            <div className="flex items-center gap-4 max-w-sm">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={inputFee}
                  onChange={(e) => setInputFee(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white transition-all"
                  placeholder="0.00"
                />
              </div>
              <button
                onClick={handleSaveFee}
                disabled={savingFee}
                className="px-6 py-3.5 bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-md shadow-brand-blue/10 flex items-center gap-2"
              >
                {savingFee ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Salvar Valor
              </button>
            </div>
          </div>

          {/* Credit Packages Management Card */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <Coins className="text-brand-orange" size={24} />
                <h2 className="text-xl font-bold text-slate-800">Pacotes de Créditos de Redação</h2>
              </div>
              <button
                onClick={() => handleOpenPackageModal(null)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-brand-orange/10"
              >
                <Plus size={16} />
                Adicionar Novo Pacote
              </button>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Estes são os pacotes de compra rápida que aparecem para os alunos no modal de compra direta pelo aplicativo.
            </p>

            {loadingPackages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brand-orange" size={32} />
              </div>
            ) : (
              <div className="overflow-hidden border border-slate-100 rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-5">Pacote</th>
                        <th className="p-5 text-center">Créditos</th>
                        <th className="p-5 text-right">Preço Total</th>
                        <th className="p-5 text-right">Preço Unitário</th>
                        <th className="p-5 text-center">Destaque / Recomendado</th>
                        <th className="p-5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {creditPackages.map((pkg) => {
                        const perCredit = pkg.credits > 0 ? pkg.price / pkg.credits : pkg.price;
                        return (
                          <tr key={pkg.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-5">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 text-base">{pkg.title}</span>
                                  {pkg.discount && (
                                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                      {pkg.discount}
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-400 text-xs mt-1">{pkg.description}</p>
                              </div>
                            </td>
                            <td className="p-5 text-center font-bold text-slate-700 text-base">
                              {pkg.credits}
                            </td>
                            <td className="p-5 text-right font-black text-slate-800 text-base">
                              R$ {pkg.price.toFixed(2)}
                            </td>
                            <td className="p-5 text-right font-semibold text-slate-500">
                              R$ {perCredit.toFixed(2)} / redação
                            </td>
                            <td className="p-5 text-center">
                              {pkg.popular ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-100 text-amber-700">
                                  Sim (Recomendado)
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs font-medium">-</span>
                              )}
                            </td>
                            <td className="p-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleOpenPackageModal(pkg)}
                                  className="p-2 text-slate-500 hover:text-brand-blue hover:bg-slate-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePackage(pkg.id, pkg.title)}
                                  className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {creditPackages.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                            Nenhum pacote cadastrado. Cadastre um novo pacote acima.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Package Form Modal (Create or Edit) */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Coins className="text-brand-orange" size={22} />
                <h3 className="text-lg font-bold text-slate-800">
                  {editingPackage ? 'Editar Pacote de Créditos' : 'Novo Pacote de Créditos'}
                </h3>
              </div>
              <button
                onClick={() => setIsPackageModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Título do Pacote *
                </label>
                <input
                  type="text"
                  required
                  value={pkgTitle}
                  onChange={(e) => setPkgTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-brand-orange focus:bg-white transition-all"
                  placeholder="Ex: 5 Redações"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Descrição / Subtítulo
                </label>
                <input
                  type="text"
                  value={pkgDescription}
                  onChange={(e) => setPkgDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-brand-orange focus:bg-white transition-all"
                  placeholder="Ex: Melhor custo-benefício mensal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Créditos *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pkgCredits}
                    onChange={(e) => setPkgCredits(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-brand-orange focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Preço Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    required
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-brand-orange focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Texto do Selo de Desconto (opcional)
                </label>
                <input
                  type="text"
                  value={pkgDiscount}
                  onChange={(e) => setPkgDiscount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-brand-orange focus:bg-white transition-all"
                  placeholder="Ex: Economize 20%"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="popular"
                  checked={pkgPopular}
                  onChange={(e) => setPkgPopular(e.target.checked)}
                  className="w-5 h-5 accent-brand-orange rounded cursor-pointer"
                />
                <label htmlFor="popular" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  Marcar como Recomendado (Destaque visual)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPackage}
                  className="flex-1 py-3.5 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-brand-orange/10 flex items-center justify-center gap-2"
                >
                  {savingPackage ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Salvar Pacote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

