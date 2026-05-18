import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Save, CheckCircle, MessageSquare, Type, Highlighter, 
  ChevronLeft, ChevronRight, Send, Info, Loader2,
  PenTool, Eraser, Palette, Undo, Trash2, Bold, Italic
} from 'lucide-react';
import { Essay } from '../types';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Document, Page, pdfjs } from 'react-pdf';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface TextAnnotation {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  color: string;
  isBold: boolean;
  isItalic: boolean;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
};

const hexToRgba = (hex: string, alpha: number) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : `rgba(0,0,0,${alpha})`;
};

const dataURIToArrayBuffer = (dataURI: string): ArrayBuffer => {
  const base64Parts = dataURI.split(',');
  if (base64Parts.length < 2) {
    throw new Error('Format de URI de dados inválido');
  }
  const byteString = atob(base64Parts[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return ab;
};

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

interface CorrectionInterfaceProps {
  essay: Essay & { myCorrectionId?: string | null };
  onClose: () => void;
}

export function CorrectionInterface({ essay, onClose }: CorrectionInterfaceProps) {
  const [competencies, setCompetencies] = useState<Record<string, number>>({
    c1: essay.competencies?.c1 || 0,
    c2: essay.competencies?.c2 || 0,
    c3: essay.competencies?.c3 || 0,
    c4: essay.competencies?.c4 || 0,
    c5: essay.competencies?.c5 || 0,
  });
  const [feedback, setFeedback] = useState(() => {
    try {
      const parsed = JSON.parse(essay.feedback || '');
      return parsed.general || '';
    } catch (e) {
      return essay.feedback || '';
    }
  });
  const [sidebarNotes, setSidebarNotes] = useState<Record<number, string>>(() => {
    try {
      const parsed = JSON.parse(essay.feedback || '');
      return parsed.pageNotes || {};
    } catch (e) {
      return {};
    }
  });
  const [saving, setSaving] = useState(false);
  const [pdfUrlToRender, setPdfUrlToRender] = useState(essay.pdfUrl);

  const handleSidebarNoteChange = (pageIndex: number, text: string) => {
    setSidebarNotes(prev => ({ ...prev, [pageIndex]: text }));
  };

  useEffect(() => {
    const fetchCorrection = async () => {
      if (essay.myCorrectionId) {
        const { data, error } = await supabase
          .from('essay_corrections')
          .select('*')
          .eq('id', essay.myCorrectionId)
          .single();
        
        if (data) {
          setCompetencies({
            c1: data.comp_1,
            c2: data.comp_2,
            c3: data.comp_3,
            c4: data.comp_4,
            c5: data.comp_5,
          });
          try {
            const parsed = JSON.parse(data.feedback);
            setFeedback(parsed.general || '');
            setSidebarNotes(parsed.pageNotes || {});
          } catch (e) {
            setFeedback(data.feedback || '');
            setSidebarNotes({});
          }
          if (data.corrected_pdf_url) {
            setPdfUrlToRender(data.corrected_pdf_url);
          }
        } else if (error) {
          console.warn('Tabela essay_corrections não existe ou erro ao buscar:', error);
        }
      }
    };
    fetchCorrection();
  }, [essay.myCorrectionId]);

  // PDF & Tools States
  const [numPages, setNumPages] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser' | 'text' | 'highlighter'>('pen');
  const [strokeColor, setStrokeColor] = useState('#ef4444'); // Red
  const [strokeWidth, setStrokeWidth] = useState(3);
  
  // Text Tool States
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [activeInput, setActiveInput] = useState<{pageIndex: number, x: number, y: number, text: string} | null>(null);
  const [pageWidths, setPageWidths] = useState<Record<number, number>>({});
  const [pageHeights, setPageHeights] = useState<Record<number, number>>({});

  const canvasRefs = useRef<(ReactSketchCanvasRef | null)[]>([]);

  const totalScore = Object.values(competencies).reduce((a: number, b: number) => a + b, 0);

  const handleCompChange = (key: string, value: number) => {
    setCompetencies(prev => ({ ...prev, [key]: value }));
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    canvasRefs.current = canvasRefs.current.slice(0, numPages);
  };

  useEffect(() => {
    canvasRefs.current.forEach(canvas => {
      if (canvas) canvas.eraseMode(activeTool === 'eraser');
    });
  }, [activeTool]);

  const handleUndo = () => {
    canvasRefs.current.forEach(canvas => canvas?.undo());
  };

  const handleClear = () => {
    if(confirm('Tem certeza que deseja apagar todos os desenhos e textos?')) {
      canvasRefs.current.forEach(canvas => canvas?.clearCanvas());
      setTextAnnotations([]);
    }
  };

  const commitText = () => {
    if (activeInput && activeInput.text.trim()) {
      setTextAnnotations(prev => [...prev, {
        id: Math.random().toString(),
        ...activeInput,
        color: strokeColor,
        isBold,
        isItalic
      }]);
    }
    setActiveInput(null);
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    if (activeTool !== 'text') return;
    if (activeInput) {
      commitText();
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setActiveInput({ pageIndex, x, y, text: '' });
  };

  const handleDeleteText = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTextAnnotations(prev => prev.filter(t => t.id !== id));
  };
  const normalizePage = (
    pdfDoc: PDFDocument, 
    originalPage: any, 
    embeddedPage: any,
    visibleWidth: number,
    visibleHeight: number
  ) => {
    const rotation = originalPage.getRotation().angle;
    const newWidth = visibleWidth;
    const newHeight = visibleHeight;
    
    // Create a brand new page with rotation = 0
    const newPage = pdfDoc.addPage([newWidth, newHeight]);
    
    // Draw the original page contents
    if (rotation === 0) {
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: visibleWidth,
        height: visibleHeight,
      });
    } else if (rotation === 90) {
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: visibleHeight,
        width: visibleHeight, // Since it is unrotated in embeddedPage, its width is the original height
        height: visibleWidth, // and its height is the original width
        rotate: degrees(-90),
      });
    } else if (rotation === 180) {
      newPage.drawPage(embeddedPage, {
        x: visibleWidth,
        y: visibleHeight,
        width: visibleWidth,
        height: visibleHeight,
        rotate: degrees(180),
      });
    } else if (rotation === 270) {
      newPage.drawPage(embeddedPage, {
        x: visibleWidth,
        y: 0,
        width: visibleHeight,
        height: visibleWidth,
        rotate: degrees(90),
      });
    }
    
    return newPage;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // 1. Fetch Original PDF
      const pdfBytes = await fetch(pdfUrlToRender).then(res => res.arrayBuffer());
      const originalPdfDoc = await PDFDocument.load(pdfBytes);
      const originalPages = originalPdfDoc.getPages();

      // Create a brand new PDF document to ensure 100% unrotated layout templates
      const pdfDoc = await PDFDocument.create();
      const embeddedPages = await pdfDoc.embedPages(originalPages);

      // Embed Fonts for Text Tool
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

      // 2. Loop pages, normalize each, and stamp drawings + texts
      for (let i = 0; i < numPages; i++) {
        const originalPage = originalPages[i];
        const embeddedPage = embeddedPages[i];
        
        const { width: visibleWidth, height: visibleHeight } = originalPage.getSize();

        // Create the normalized, unrotated flat page template with the exact original dimensions
        const pdfPage = normalizePage(
          pdfDoc,
          originalPage,
          embeddedPage,
          visibleWidth,
          visibleHeight
        );
        
        // --- Stamp Drawings ---
        const canvas = canvasRefs.current[i];
        if (canvas) {
          try {
            const paths = await canvas.exportPaths();
            if (paths.length > 0) {
              const base64Image = await canvas.exportImage("png");
              const imageBytes = dataURIToArrayBuffer(base64Image);
              const pngImage = await pdfDoc.embedPng(imageBytes);
              
              // Stamp drawings canvas perfectly covering the normalized page area
              pdfPage.drawImage(pngImage, {
                x: 0,
                y: 0,
                width: visibleWidth,
                height: visibleHeight,
              });
            }
          } catch (canvasErr) {
            console.error(`Erro ao exportar/gravar desenhos da página ${i + 1}:`, canvasErr);
          }
        }

        // --- Stamp Texts ---
        const pageTexts = textAnnotations.filter(t => t.pageIndex === i);
        if (pageTexts.length > 0) {
          pageTexts.forEach(t => {
            const { r, g, b } = hexToRgb(t.color);
            let font = helvetica;
            if (t.isBold && t.isItalic) font = helveticaBoldOblique;
            else if (t.isBold) font = helveticaBold;
            else if (t.isItalic) font = helveticaOblique;

            const fontSize = 16; 
            
            pdfPage.drawText(t.text, {
              x: t.x * visibleWidth,
              y: visibleHeight - (t.y * visibleHeight) - fontSize, // Adjusting baseline
              size: fontSize,
              font: font,
              color: rgb(r, g, b)
            });
          });
        }
      }

      const savedPdfBytes = await pdfDoc.save();
      
      // 3. Upload Corrected PDF to Supabase
      const fileName = `corrections/${essay.id}_${userData.user.id}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('essays_pdfs')
        .upload(fileName, savedPdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('essays_pdfs')
        .getPublicUrl(fileName);

      // Serialize sidebar notes and general feedback
      const feedbackPayload = JSON.stringify({
        general: feedback,
        pageNotes: sidebarNotes
      });

      // 4. Update Database Record in essay_corrections
      if (essay.myCorrectionId) {
         const { error: dbError } = await supabase
           .from('essay_corrections')
           .update({
             score: totalScore,
             comp_1: competencies.c1,
             comp_2: competencies.c2,
             comp_3: competencies.c3,
             comp_4: competencies.c4,
             comp_5: competencies.c5,
             feedback: feedbackPayload,
             corrected_pdf_url: publicUrlData.publicUrl
           })
           .eq('id', essay.myCorrectionId);

         if (dbError) {
             console.warn('Erro ao atualizar essay_corrections, falhando silenciosamente se tabela não existir', dbError);
         }
      } else {
         const { error: dbError } = await supabase
           .from('essay_corrections')
           .insert({
             essay_id: essay.id,
             teacher_id: userData.user.id,
             score: totalScore,
             comp_1: competencies.c1,
             comp_2: competencies.c2,
             comp_3: competencies.c3,
             comp_4: competencies.c4,
             comp_5: competencies.c5,
             feedback: feedbackPayload,
             corrected_pdf_url: publicUrlData.publicUrl
           });
         
         if (dbError) {
             console.warn('Erro ao inserir em essay_corrections, falhando silenciosamente se tabela não existir', dbError);
         }
      }

      // Fallback: also update the main essays table so old functionality doesn't break
      await supabase.from('essays').update({ 
        status: 'corrected',
        score: totalScore,
        comp_1: competencies.c1,
        comp_2: competencies.c2,
        comp_3: competencies.c3,
        comp_4: competencies.c4,
        comp_5: competencies.c5,
        feedback: feedbackPayload,
        teacher_id: userData.user.id,
        corrected_at: new Date().toISOString(),
        corrected_pdf_url: publicUrlData.publicUrl
      }).eq('id', essay.id);
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar correção:', error);
      alert('Erro ao salvar a correção. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const levelOptions = [0, 40, 80, 120, 160, 200];

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in fade-in duration-300">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <X size={20} />
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <div>
            <h2 className="font-bold text-slate-800 leading-tight">{essay.studentName}</h2>
            <p className="text-xs text-slate-500 truncate max-w-md">{essay.title}</p>
          </div>
        </div>

        {/* Drawing Toolbar */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button 
            onClick={() => setActiveTool('pen')}
            className={cn("p-2 rounded-lg transition-all", activeTool === 'pen' ? "bg-white shadow-sm text-brand-blue font-bold" : "text-slate-500 hover:bg-slate-200")}
            title="Caneta"
          >
            <PenTool size={18} />
          </button>
          <button 
            onClick={() => setActiveTool('highlighter')}
            className={cn("p-2 rounded-lg transition-all", activeTool === 'highlighter' ? "bg-white shadow-sm text-brand-blue font-bold" : "text-slate-500 hover:bg-slate-200")}
            title="Marca Texto"
          >
            <Highlighter size={18} />
          </button>
          <button 
            onClick={() => setActiveTool('text')}
            className={cn("p-2 rounded-lg transition-all", activeTool === 'text' ? "bg-white shadow-sm text-brand-blue font-bold" : "text-slate-500 hover:bg-slate-200")}
            title="Texto Livre"
          >
            <Type size={18} />
          </button>
          <button 
            onClick={() => setActiveTool('eraser')}
            className={cn("p-2 rounded-lg transition-all", activeTool === 'eraser' ? "bg-white shadow-sm text-brand-blue font-bold" : "text-slate-500 hover:bg-slate-200")}
            title="Borracha"
          >
            <Eraser size={18} />
          </button>
          
          <div className="w-px h-6 bg-slate-300 mx-1"></div>
          
          <div className="flex items-center gap-1 px-2">
            {['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#000000'].map(color => (
               <button 
                 key={color}
                 onClick={() => { setStrokeColor(color); setActiveTool(activeTool === 'eraser' ? 'pen' : activeTool); }}
                 className={cn("w-6 h-6 rounded-full border-2 transition-all", strokeColor === color && activeTool !== 'eraser' ? "border-slate-800 scale-110" : "border-transparent")}
                 style={{ backgroundColor: color }}
               />
            ))}
          </div>

          {activeTool === 'text' && (
            <>
              <div className="w-px h-6 bg-slate-300 mx-1"></div>
              <button 
                onClick={() => setIsBold(!isBold)}
                className={cn("p-2 rounded-lg transition-all font-serif font-bold text-sm", isBold ? "bg-white shadow-sm text-brand-blue" : "text-slate-500 hover:bg-slate-200")}
                title="Negrito"
              >
                B
              </button>
              <button 
                onClick={() => setIsItalic(!isItalic)}
                className={cn("p-2 rounded-lg transition-all font-serif italic text-sm", isItalic ? "bg-white shadow-sm text-brand-blue" : "text-slate-500 hover:bg-slate-200")}
                title="Itálico"
              >
                I
              </button>
            </>
          )}

          <div className="w-px h-6 bg-slate-300 mx-1"></div>
          
          <button onClick={handleUndo} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg" title="Desfazer">
            <Undo size={18} />
          </button>
          <button onClick={handleClear} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Limpar Tudo">
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nota Final</p>
            <p className="text-2xl font-black text-brand-blue leading-none">{totalScore}</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-white rounded-xl font-bold shadow-lg shadow-brand-orange/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {saving ? 'Salvando PDF...' : 'Finalizar Correção'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden bg-slate-100">
        {/* Left: PDF + Canvas Wrapper */}
        <div className="flex-1 overflow-auto p-8 flex flex-col custom-scrollbar">
            {pdfUrlToRender ? (
                <Document 
                  file={pdfUrlToRender} 
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="flex flex-col items-center py-20 text-slate-400"><Loader2 className="animate-spin mb-4" size={32}/> Carregando PDF...</div>}
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <div 
                      key={`page_wrapper_${index + 1}`} 
                      className="flex flex-row items-stretch gap-6 mx-auto mb-16 select-none max-w-full justify-center"
                    >
                      {/* Left: PDF Page Container with Canvas Overlay */}
                      <div 
                        className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl transition-all overflow-hidden shrink-0"
                        style={{ 
                          width: pageWidths[index] ? pageWidths[index] : 'auto',
                          height: pageHeights[index] ? pageHeights[index] : 'auto'
                        }}
                        onClick={(e) => handlePageClick(e, index)}
                      >
                        <div className="relative shrink-0">
                          <Page 
                            pageNumber={index + 1} 
                            scale={1.1} 
                            renderTextLayer={false} 
                            renderAnnotationLayer={false} 
                            onLoadSuccess={(page) => {
                              setPageWidths(prev => ({ ...prev, [index]: page.width * 1.1 }));
                              setPageHeights(prev => ({ ...prev, [index]: page.height * 1.1 }));
                            }}
                          />
                        </div>
                        
                        {pageWidths[index] && pageHeights[index] && (
                          <>
                            {/* Drawing Canvas */}
                            <div className={cn("absolute inset-0", activeTool === 'text' ? "pointer-events-none" : "z-10")}>
                              <ReactSketchCanvas 
                                ref={(ref) => canvasRefs.current[index] = ref}
                                width={`${pageWidths[index]}px`}
                                height={`${pageHeights[index]}px`}
                                strokeWidth={activeTool === 'highlighter' ? 24 : strokeWidth}
                                eraserWidth={20}
                                strokeColor={activeTool === 'highlighter' ? hexToRgba(strokeColor, 0.4) : strokeColor}
                                canvasColor="transparent"
                                style={{ border: 'none', background: 'transparent' }}
                              />
                            </div>

                            {/* Text Annotations */}
                            <div className={cn("absolute inset-0 z-20", activeTool === 'text' ? "pointer-events-auto" : "pointer-events-none")}>
                              {textAnnotations.filter(t => t.pageIndex === index).map(t => (
                                <div 
                                  key={t.id} 
                                  className={cn(
                                    "absolute font-sans pointer-events-auto cursor-pointer hover:bg-red-100/50 hover:ring-1 hover:ring-red-400 px-1 rounded transition-colors group", 
                                    t.isBold && "font-bold", 
                                    t.isItalic && "italic",
                                    activeTool !== 'text' && "pointer-events-none"
                                  )}
                                  style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%`, color: t.color, fontSize: '16px' }}
                                  onClick={(e) => handleDeleteText(t.id, e)}
                                  title="Clique para apagar"
                                >
                                  {t.text}
                                </div>
                              ))}
                              
                              {/* Active Input Overlay */}
                              {activeInput?.pageIndex === index && (
                                  <input
                                    autoFocus
                                    className={cn(
                                      "absolute bg-transparent border border-dashed border-brand-blue outline-none px-1 py-0", 
                                      isBold && "font-bold", 
                                      isItalic && "italic"
                                    )}
                                    style={{ left: `${activeInput.x * 100}%`, top: `${activeInput.y * 100}%`, color: strokeColor, fontSize: '16px' }}
                                    value={activeInput.text}
                                    onChange={e => setActiveInput({...activeInput, text: e.target.value})}
                                    onBlur={commitText}
                                    onKeyDown={e => e.key === 'Enter' && commitText()}
                                    onClick={e => e.stopPropagation()}
                                  />
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Right: Independent Notes Column next to each page */}
                      <div 
                        className="w-[300px] bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 shrink-0 self-stretch"
                      >
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
                          <div className="bg-brand-blue/10 p-2.5 rounded-xl text-brand-blue flex items-center justify-center">
                            <MessageSquare size={18} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Anotações do Professor</h4>
                            <p className="text-[10px] text-slate-400 font-medium">Escreva observações para a Página {index + 1}</p>
                          </div>
                        </div>
                        <textarea
                          value={sidebarNotes[index] || ''}
                          onChange={(e) => handleSidebarNoteChange(index, e.target.value)}
                          placeholder="Digite aqui as observações específicas sobre esta folha da redação..."
                          className="flex-1 w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/15 focus:border-brand-blue transition-all resize-none shadow-sm leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </Document>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400 font-bold">Nenhum arquivo PDF atrelado a esta redação.</p>
                </div>
            )}
        </div>

        {/* Right: Correction Panel */}
        <div className="w-[400px] border-l border-slate-200 bg-white overflow-y-auto z-20 shadow-xl">
            <div className="p-8 space-y-8">
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800">Avaliação por Competências</h3>
                        <div className="text-slate-400">
                            <Info size={16} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {[
                            { id: 'c1', name: 'Domínio da norma culta' },
                            { id: 'c2', name: 'Compreensão do tema' },
                            { id: 'c3', name: 'Organização de informações' },
                            { id: 'c4', name: 'Conhecimento linguístico' },
                            { id: 'c5', name: 'Proposta de intervenção' },
                        ].map((comp) => (
                            <div key={comp.id}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{comp.name}</span>
                                    <span className="text-sm font-bold text-brand-blue">{competencies[comp.id as keyof typeof competencies]} pts</span>
                                </div>
                                <div className="grid grid-cols-6 gap-1">
                                    {levelOptions.map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => handleCompChange(comp.id, level)}
                                            className={cn(
                                                "h-8 rounded-md text-[10px] font-bold border transition-all",
                                                competencies[comp.id as keyof typeof competencies] === level
                                                    ? "bg-brand-blue border-brand-blue text-white shadow-md shadow-brand-blue/20"
                                                    : "bg-slate-50 border-slate-200 text-slate-400 hover:border-brand-blue/30"
                                            )}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="h-px bg-slate-100"></div>

                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare size={18} className="text-brand-orange" />
                        <h3 className="font-bold text-slate-800">Feedback Final</h3>
                    </div>
                    <textarea 
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Insira aqui as observações gerais para o aluno..."
                        className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue transition-all resize-none shadow-inner"
                    />
                </section>
            </div>
        </div>
      </div>
    </div>
  );
}
