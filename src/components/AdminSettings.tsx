import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Save, DollarSign } from 'lucide-react';

export function AdminSettings() {
  const [fee, setFee] = useState<string>('3.50');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('platform_settings').select('correction_fee').limit(1).single();
      if (data) {
        setFee(data.correction_fee.toString());
      }
    } catch (err) {
      console.error("Erro ao buscar configurações", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMsg('');
      
      const parsedFee = parseFloat(fee.replace(',', '.'));
      if (isNaN(parsedFee) || parsedFee < 0) {
        alert("Por favor, insira um valor válido.");
        return;
      }

      // Tenta atualizar. Como há só uma linha, damos update nela toda
      const { error } = await supabase.from('platform_settings').update({ correction_fee: parsedFee }).neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      setSuccessMsg('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-xl">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Configurações Gerais</h1>
          <p className="text-slate-500">Ajuste parâmetros financeiros e regras da plataforma.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">Financeiro dos Professores</h2>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Valor pago por redação corrigida (R$)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-slate-400 font-bold">R$</span>
            </div>
            <input
              type="text"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all font-medium text-slate-700"
              placeholder="Ex: 3,50"
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Este valor será multiplicado pelo total de correções do professor para estimar seus ganhos no painel de produtividade.
          </p>
        </div>

        <div className="pt-4 flex items-center justify-between">
            {successMsg ? (
                <span className="text-emerald-500 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-lg">{successMsg}</span>
            ) : <span />}
            
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-brand-blue hover:bg-blue-800 text-white rounded-xl font-bold transition-all disabled:opacity-50 ml-auto"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
