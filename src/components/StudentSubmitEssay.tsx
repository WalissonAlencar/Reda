import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, FileText, Loader2, CheckCircle, X, FileDown } from 'lucide-react';

export function StudentSubmitEssay() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [sheetUrl, setSheetUrl] = useState<string>('');

  useEffect(() => {
    async function loadThemes() {
      const { data } = await supabase
        .from('essay_themes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data) setThemes(data);
    }

    async function loadSettings() {
      const { data } = await supabase
        .from('platform_settings')
        .select('essay_sheet_url')
        .limit(1)
        .single();
      if (data && data.essay_sheet_url) {
        setSheetUrl(data.essay_sheet_url);
      }
    }

    loadThemes();
    loadSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Por favor, selecione apenas arquivos PDF.');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
        setError('O arquivo deve ter no máximo 5MB.');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !title) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Upload the PDF to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('essays_pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('essays_pdfs')
        .getPublicUrl(filePath);

      // 3. Create the essay record in the database
      const { error: dbError } = await supabase
        .from('essays')
        .insert({
          student_id: user.id,
          title: title,
          pdf_url: publicUrl,
          status: 'sent',
        });

      if (dbError) throw dbError;

      // Reset form on success
      setSuccess(true);
      setTitle('');
      setFile(null);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

    } catch (err: any) {
      console.error('Erro ao enviar redação:', err);
      setError('Ocorreu um erro ao enviar sua redação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Enviar Redação</h1>
        <p className="text-slate-500 mt-1">Envie sua redação em formato PDF para correção.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8">
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="text-emerald-500" size={24} />
              <div>
                <p className="font-bold">Redação enviada com sucesso!</p>
                <p className="text-sm opacity-80">Sua redação já está na fila para ser corrigida.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <X className="text-red-500" size={24} />
              <p className="font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-slate-700 mb-2">
                Tema / Título da Redação
              </label>
              <select
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="" disabled>Selecione um tema cadastrado</option>
                {themes.map((theme, index) => (
                  <option key={index} value={theme.title}>
                    {theme.title}
                  </option>
                ))}
              </select>
              
              {themes.find(t => t.title === title) && (
                <div className="mt-4 p-5 bg-brand-blue/5 border border-brand-blue/20 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={16} className="text-brand-orange" />
                    Detalhes do Tema
                  </h4>
                  {themes.find(t => t.title === title)?.description && (
                    <p className="text-sm text-slate-600">
                      <strong>Descrição:</strong> {themes.find(t => t.title === title)?.description}
                    </p>
                  )}
                  {themes.find(t => t.title === title)?.supporting_text && (
                    <div className="text-sm text-slate-600 bg-white p-4 rounded-lg border border-slate-200 shadow-sm whitespace-pre-wrap">
                      <strong>Textos Motivadores:</strong><br/><br/>
                      {themes.find(t => t.title === title)?.supporting_text}
                    </div>
                  )}
                </div>
              )}
            </div>

            {sheetUrl && (
              <div className="p-5 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="w-12 h-12 bg-white text-brand-orange rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-amber-100">
                  <FileDown size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 leading-tight">Folha de Redação Oficial</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Escreva sua redação na folha oficial do Redatto para garantir uma correção padronizada.
                  </p>
                  <a 
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-brand-orange text-white rounded-lg text-xs font-bold hover:bg-brand-orange/90 transition-all shadow-md shadow-brand-orange/10"
                  >
                    <FileDown size={14} />
                    Baixar Folha Oficial (PDF)
                  </a>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Arquivo PDF
              </label>
              
              {!file ? (
                <div className="relative group">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 group-hover:bg-slate-100 group-hover:border-brand-blue/50 transition-all">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="text-brand-blue" size={32} />
                    </div>
                    <p className="text-slate-800 font-bold mb-1">Clique ou arraste seu PDF aqui</p>
                    <p className="text-slate-500 text-sm">Tamanho máximo: 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border border-brand-blue/30 bg-brand-blue/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FileText className="text-brand-orange" size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 line-clamp-1">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading || !file || !title}
                className="w-full py-4 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-brand-blue/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <UploadCloud size={20} />
                    Enviar Redação
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
