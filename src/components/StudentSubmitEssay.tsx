import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, FileText, Loader2, CheckCircle, X, FileDown, Image as ImageIcon, Coins } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { PurchaseCreditsModal } from './PurchaseCreditsModal';
import { cn } from '../lib/utils';

const convertImageToPdf = async (imageFile: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const img = document.createElement('img');
      img.onload = async () => {
        try {
          const pdfDoc = await PDFDocument.create();
          
          // Use a canvas to normalize format, resolution, orientation and colors
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Não foi possível obter o contexto 2D do Canvas.');
          }
          
          // Max dimension to optimize PDF file size while keeping high resolution
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1600;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Fill background with white in case of transparent PNG/WebP images
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress canvas output to standard JPEG format
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const response = await fetch(jpegDataUrl);
          const imageBytes = await response.arrayBuffer();
          
          const embeddedImage = await pdfDoc.embedJpg(imageBytes);
          const page = pdfDoc.addPage([width, height]);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          });
          
          const pdfBytes = await pdfDoc.save();
          resolve(new Blob([pdfBytes], { type: 'application/pdf' }));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Erro ao processar imagem. Certifique-se de que é um formato válido (JPEG/PNG/WEBP).'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Erro ao carregar o arquivo.'));
    reader.readAsDataURL(imageFile);
  });
};

export function StudentSubmitEssay() {
  const { user, refreshProfile } = useAuth();
  const [title, setTitle] = useState('');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themes, setThemes] = useState<any[]>([]);
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [correctionType, setCorrectionType] = useState<'simple' | 'double'>('simple');

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

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Por favor, selecione apenas arquivos PDF ou imagens (PNG, JPG, JPEG, WEBP).');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
        setError('O arquivo deve ter no máximo 10MB.');
        return;
      }
      
      setFile(selectedFile);
      setError(null);

      // Create preview if it's an image
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !title) return;

    const requiredCredits = correctionType === 'double' ? 2 : 1;
    if ((user.essay_credits || 0) < requiredCredits) {
      setError(`Você não possui créditos de redação suficientes. Esta operação exige ${requiredCredits} crédito(s).`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let uploadFile: File = file;

      // If the file is an image, convert it to PDF
      if (file.type.startsWith('image/')) {
        setIsConverting(true);
        try {
          const pdfBlob = await convertImageToPdf(file);
          const pdfName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
          uploadFile = new File([pdfBlob], pdfName, { type: 'application/pdf' });
        } catch (err: any) {
          throw new Error('Falha ao converter a imagem para PDF: ' + err.message);
        } finally {
          setIsConverting(false);
        }
      }

      // 1. Upload the PDF to Supabase Storage
      const fileName = `${user.id}_${Date.now()}.pdf`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('essays_pdfs')
        .upload(filePath, uploadFile);

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
          correction_type: correctionType,
        });

      if (dbError) throw dbError;

      // Reset form on success
      setSuccess(true);
      setTitle('');
      handleRemoveFile();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

    } catch (err: any) {
      console.error('Erro ao enviar redação:', err);
      setError(err.message || 'Ocorreu um erro ao enviar sua redação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Enviar Redação</h1>
        <p className="text-slate-500 mt-1">Envie sua redação em formato PDF ou imagem para correção.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8">
          {/* Credit balance display */}
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
                <Coins size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Seus Créditos de Redação</p>
                <p className="text-2xl font-black text-slate-800">{user?.essay_credits ?? 0} crédito(s) restante(s)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(true)}
              className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-orange/10"
            >
              Comprar Créditos
            </button>
          </div>

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
                    Escreva sua redação na folha oficial do Redarum para garantir uma correção padronizada.
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

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Modalidade de Correção
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setCorrectionType('simple')}
                  className={cn(
                    "p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 bg-slate-50/30",
                    correctionType === 'simple' 
                      ? "border-brand-blue bg-brand-blue/5 shadow-sm" 
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-md", correctionType === 'simple' ? "bg-brand-blue/10 text-brand-blue" : "bg-slate-200 text-slate-500")}>
                      Correção Simples
                    </span>
                    <span className="font-bold text-xs text-slate-500">1 crédito</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mt-2">Um professor corrigirá sua redação</h4>
                    <p className="text-xs text-slate-500 mt-1">Correção padrão com comentários gerais, observações por página e nota por competência.</p>
                  </div>
                </div>

                <div 
                  onClick={() => setCorrectionType('double')}
                  className={cn(
                    "p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 bg-slate-50/30",
                    correctionType === 'double' 
                      ? "border-purple-600 bg-purple-50/50 shadow-sm" 
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-md", correctionType === 'double' ? "bg-purple-100 text-purple-700" : "bg-slate-200 text-slate-500")}>
                      Correção Dupla (Dupla-Cega)
                    </span>
                    <span className="font-bold text-xs text-slate-500">2 créditos</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mt-2">Dois avaliadores de forma independente</h4>
                    <p className="text-xs text-slate-500 mt-1">Sua nota final será a média aritmética das duas notas e você verá o feedback de ambos avaliadores.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Arquivo da Redação (PDF ou Imagem)
              </label>
              
              {!file ? (
                <div className="relative group">
                  <input
                    type="file"
                    accept="application/pdf, image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 group-hover:bg-slate-100 group-hover:border-brand-blue/50 transition-all">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="text-brand-blue" size={32} />
                    </div>
                    <p className="text-slate-800 font-bold mb-1">Clique ou arraste seu PDF ou Imagem aqui</p>
                    <p className="text-slate-500 text-sm">PDF, PNG, JPG, JPEG ou WEBP de até 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-brand-blue/30 bg-brand-blue/5 rounded-xl gap-4">
                  <div className="flex items-center gap-3">
                    {previewUrl ? (
                      <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-sm">
                        <img src={previewUrl} alt="Preview da Redação" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText className="text-brand-orange" size={24} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800 line-clamp-1">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-end sm:self-auto"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              {(user?.essay_credits ?? 0) < (correctionType === 'double' ? 2 : 1) ? (
                <div className="text-center space-y-3">
                  <p className="text-sm font-bold text-red-500">
                    Você não possui créditos suficientes para esta modalidade ({correctionType === 'double' ? 'necessita de 2 créditos' : 'necessita de 1 crédito'}).
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPurchaseModalOpen(true)}
                    className="w-full py-4 bg-brand-orange hover:bg-brand-orange/95 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Coins size={20} />
                    Comprar Créditos
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !file || !title}
                  className={cn(
                    "w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    correctionType === 'double' 
                      ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20" 
                      : "bg-brand-blue hover:bg-blue-700 shadow-brand-blue/20"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {isConverting ? 'Processando e convertendo imagem para PDF...' : 'Enviando...'}
                    </>
                  ) : (
                    <>
                      <UploadCloud size={20} />
                      Enviar Redação ({correctionType === 'double' ? 'Consumirá 2 créditos' : 'Consumirá 1 crédito'})
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      <PurchaseCreditsModal 
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={() => refreshProfile()}
      />
    </div>
  );
}
