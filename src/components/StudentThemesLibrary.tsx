import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, BookOpen, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export function StudentThemesLibrary({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [themes, setThemes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedThemeId, setExpandedThemeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThemes() {
      setLoading(true);
      const { data } = await supabase
        .from('essay_themes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (data) setThemes(data);
      setLoading(false);
    }
    loadThemes();
  }, []);

  const filteredThemes = themes.filter(theme => 
    theme.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (theme.description && theme.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Biblioteca de Temas</h1>
          <p className="text-slate-500 mt-1">Pesquise e estude os temas antes de escrever sua redação.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por palavras-chave ou título do tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-slate-700"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mb-4"></div>
            <p>Carregando temas...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredThemes.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="font-medium">Nenhum tema encontrado com esse termo.</p>
                <p className="text-sm mt-1">Tente pesquisar usando outras palavras.</p>
              </div>
            ) : (
              filteredThemes.map((theme) => (
                <div 
                  key={theme.id} 
                  className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                    expandedThemeId === theme.id 
                      ? 'border-brand-blue/30 shadow-md shadow-brand-blue/5 bg-white' 
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <button
                    onClick={() => setExpandedThemeId(expandedThemeId === theme.id ? null : theme.id)}
                    className="w-full text-left p-6 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800 leading-tight mb-2">
                        {theme.title}
                      </h3>
                      {theme.description && (
                        <p className="text-slate-500 text-sm line-clamp-2">
                          {theme.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 p-2 bg-slate-50 rounded-full text-slate-400">
                      {expandedThemeId === theme.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {expandedThemeId === theme.id && (
                    <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2">
                      <div className="p-5 bg-brand-blue/5 border border-brand-blue/10 rounded-xl">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                          <FileText size={16} className="text-brand-orange" />
                          Textos Motivadores e Instruções
                        </h4>
                        
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                          {theme.supporting_text || "Não há textos motivadores cadastrados para este tema."}
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                          <button 
                            onClick={() => setActiveTab && setActiveTab('submit')}
                            className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-bold shadow-lg shadow-brand-blue/20 hover:bg-blue-700 transition-colors"
                          >
                            Escrever sobre este tema
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
