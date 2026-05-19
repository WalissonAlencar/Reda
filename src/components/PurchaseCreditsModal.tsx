import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, CreditCard, Check, Loader2, Coins } from 'lucide-react';

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  title: string;
  description: string;
  popular: boolean;
  discount: string | null;
}

export function PurchaseCreditsModal({ isOpen, onClose, onSuccess }: PurchaseCreditsModalProps) {
  const { user } = useAuth();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [fetchingPackages, setFetchingPackages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'failed' | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPackages();
    } else {
      // Reset state on close
      setPaymentUrl(null);
      setPurchaseId(null);
      setPaymentStatus(null);
      setLoading(false);
    }
  }, [isOpen]);

  const loadPackages = async () => {
    try {
      setFetchingPackages(true);
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .order('price', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        const formatted: CreditPackage[] = data.map(p => ({
          id: p.id,
          credits: Number(p.credits),
          price: Number(p.price),
          title: p.title,
          description: p.description,
          popular: !!p.popular,
          discount: p.discount
        }));
        setPackages(formatted);
        const popular = formatted.find(p => p.popular) || formatted[0];
        setSelectedPackage(popular);
      }
    } catch (err) {
      console.error('Error fetching credit packages:', err);
    } finally {
      setFetchingPackages(false);
    }
  };

  // Poll purchase status if purchaseId is generated
  useEffect(() => {
    if (!purchaseId || paymentStatus === 'approved') return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('student_purchases')
          .select('status')
          .eq('id', purchaseId)
          .single();

        if (!error && data) {
          if (data.status === 'approved') {
            setPaymentStatus('approved');
            clearInterval(interval);
            if (onSuccess) onSuccess();
          } else if (data.status && data.status !== 'pending' && data.status !== 'approved') {
            setPaymentStatus('failed');
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [purchaseId, paymentStatus, onSuccess]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!user || !selectedPackage) return;
    try {
      setLoading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      console.log('handleCheckout: Session token is', token ? 'present' : 'missing');

      const { data, error: invokeError } = await supabase.functions.invoke('create-checkout-preference', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          packageId: selectedPackage.id,
          redirectUrl: window.location.origin
        }
      });

      if (invokeError || !data) {
        let errorMessage = 'Falha ao gerar o link de pagamento. Tente novamente.';
        if (invokeError && 'context' in invokeError) {
          try {
            const context = (invokeError as any).context;
            if (context && typeof context.clone === 'function') {
              const errJson = await context.clone().json();
              if (errJson?.details) {
                errorMessage = `Erro da Edge Function: ${errJson.details}`;
              } else if (errJson?.error) {
                errorMessage = `Erro da Edge Function: ${errJson.error}`;
              }
            }
          } catch (e) {
            console.warn('Erro ao ler detalhes do erro:', e);
          }
        }
        throw new Error(errorMessage || invokeError?.message);
      }
      
      // Save purchaseId (from preference items id/external_reference or returned in response)
      setPurchaseId(data.id); // Our backend updates preference_id in DB, but let's query using preference_id or search external reference
      
      // Let's query student_purchases by preference_id or query the latest pending purchase
      const { data: latestPending } = await supabase
        .from('student_purchases')
        .select('id')
        .eq('student_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (latestPending) {
        setPurchaseId(latestPending.id);
      }

      setPaymentUrl(data.init_point);
      setPaymentStatus('pending');
      
      // Attempt to open in a new tab
      window.open(data.init_point, '_blank');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao gerar o link de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Coins className="text-brand-orange" size={24} />
            <h2 className="text-xl font-bold text-slate-800">Comprar Créditos</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {fetchingPackages ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-brand-orange" size={40} />
              <p className="text-slate-500 text-sm mt-3">Carregando pacotes...</p>
            </div>
          ) : !paymentStatus ? (
            <>
              <p className="text-slate-600 text-sm">
                Selecione o pacote ideal para você. Cada redação enviada consome 1 crédito. Seus créditos não expiram e a correção é feita em até 48h por professores especializados.
              </p>

              {/* Packages List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  const pricePerCredit = pkg.credits > 0 ? pkg.price / pkg.credits : pkg.price;
                  return (
                    <div 
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02]
                        ${isSelected 
                          ? 'border-brand-blue bg-blue-50/20 shadow-md shadow-brand-blue/5' 
                          : 'border-slate-200 hover:border-slate-300'
                        }
                      `}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-orange text-white text-[10px] font-bold uppercase rounded-full shadow-sm tracking-wider">
                          Recomendado
                        </span>
                      )}

                      {pkg.discount && (
                        <span className="absolute top-3 right-3 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          {pkg.discount}
                        </span>
                      )}

                      <div className="mt-2">
                        <h4 className="font-bold text-slate-800 text-lg">{pkg.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{pkg.description}</p>
                      </div>

                      <div className="my-5 flex-1 flex flex-col justify-end">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-slate-500">R$</span>
                          <span className="text-3xl font-black text-slate-800">{pkg.price.toFixed(0)}</span>
                          <span className="text-sm font-bold text-slate-500">,00</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          R$ {pricePerCredit.toFixed(2)} por redação
                        </p>
                      </div>

                      <div className={`mt-2 py-2.5 rounded-xl text-center text-xs font-bold transition-all
                        ${isSelected 
                          ? 'bg-brand-blue text-white' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }
                      `}>
                        {isSelected ? 'Selecionado' : 'Escolher'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary and Pay */}
              {selectedPackage && (
                <div className="p-4 bg-slate-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Pacote Selecionado</p>
                    <p className="font-bold text-slate-800">{selectedPackage.credits} Crédito(s) para Redação</p>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Gerando link...
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        Pagar R$ {selectedPackage.price.toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in duration-300">
              {paymentStatus === 'pending' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center animate-pulse">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Aguardando Pagamento...</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-md">
                      Uma nova guia foi aberta com o checkout do Mercado Pago. Caso não tenha aberto, clique no botão abaixo para pagar com PIX ou Cartão.
                    </p>
                  </div>
                  {paymentUrl && (
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md"
                    >
                      Pagar no Mercado Pago
                    </a>
                  )}
                  <p className="text-xs text-slate-400">
                    Seus créditos serão liberados automaticamente assim que o pagamento for confirmado.
                  </p>
                </>
              )}

              {paymentStatus === 'approved' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center">
                    <Check size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Pagamento Confirmado!</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Parabéns! Seus {selectedPackage.credits} créditos de redação já foram adicionados à sua conta.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all"
                  >
                    Fechar e Voltar
                  </button>
                </>
              )}

              {paymentStatus === 'failed' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center">
                    <X size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Falha no Pagamento</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Não conseguimos processar o seu pagamento. Por favor, tente novamente ou escolha outro método de pagamento.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentStatus(null)}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                    >
                      Tentar Novamente
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
