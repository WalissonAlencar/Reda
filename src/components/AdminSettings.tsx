import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Save, UploadCloud, FileText, Trash2, Eye } from 'lucide-react';

export function AdminSettings() {
  const [fee, setFee] = useState<string>('3.50');
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('platform_settings').select('correction_fee, essay_sheet_url').limit(1).single();
      if (data) {
        setFee(data.correction_fee.toString());
        setSheetUrl(data.essay_sheet_url || '');
      }
    } catch (err) {
      console.error("Erro ao buscar configurações", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor, selecione apenas arquivos PDF.');
        return;
      }
      setSheetFile(file);
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

      let currentSheetUrl = sheetUrl;

      // Se um novo arquivo foi selecionado, faz o upload primeiro
      if (sheetFile) {
        const fileExt = sheetFile.name.split('.').pop();
        const fileName = `templates/folha_redacao_${Date.now()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from('essays_pdfs')
          .upload(fileName, sheetFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('essays_pdfs')
          .getPublicUrl(fileName);

        currentSheetUrl = publicUrl;
        setSheetUrl(publicUrl);
        setSheetFile(null);
      }

      // Tenta atualizar. Como há só uma linha, damos update nela toda
      const { error } = await supabase.from('platform_settings')
        .update({ 
          correction_fee: parsedFee,
          essay_sheet_url: currentSheetUrl
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
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

  const handleRemoveSheet = async () => {
    if (!confirm('Deseja realmente remover a folha de redação atual?')) return;
    
    try {
      setSaving(true);
      const { error } = await supabase.from('platform_settings')
        .update({ essay_sheet_url: null })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      setSheetUrl('');
      setSheetFile(null);
      setSuccessMsg('Folha de redação removida com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao remover folha de redação.');
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

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
        {/* Financeiro Section */}
        <div className="space-y-4">
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
        </div>

        {/* Folha de Redação Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">Folha de Redação Oficial</h2>
          <p className="text-sm text-slate-500">
            Envie o modelo oficial em PDF da folha de redação para que os alunos possam baixar, imprimir e utilizar para redigir seus textos.
          </p>

          {sheetUrl && !sheetFile ? (
            <div className="flex items-center justify-between p-4 border border-emerald-200 bg-emerald-50/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Folha de Redação Ativa</p>
                  <p className="text-xs text-slate-500">O PDF já está disponível para os alunos baixarem.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white text-slate-600 hover:text-brand-blue hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Visualizar PDF"
                >
                  <Eye size={16} />
                  Visualizar
                </a>
                <button
                  type="button"
                  onClick={handleRemoveSheet}
                  className="p-2 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg shadow-sm transition-colors"
                  title="Remover folha de redação"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {sheetUrl ? 'Substituir Folha de Redação (PDF)' : 'Fazer Upload da Folha de Redação (PDF)'}
            </label>

            {!sheetFile ? (
              <div className="relative group">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 group-hover:bg-slate-100/70 group-hover:border-brand-blue/40 transition-all text-center">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-brand-blue group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-slate-700 text-sm font-bold mb-0.5">Selecione o arquivo PDF oficial</p>
                  <p className="text-slate-400 text-xs">Arraste ou clique para navegar (máx. 10MB)</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border border-brand-orange/30 bg-brand-orange/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white text-brand-orange rounded-xl shadow-sm">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 line-clamp-1">{sheetFile.name}</p>
                    <p className="text-xs text-slate-500">{(sheetFile.size / 1024 / 1024).toFixed(2)} MB • PDF selecionado</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSheetFile(null)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
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
