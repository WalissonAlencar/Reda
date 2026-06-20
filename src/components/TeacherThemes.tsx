import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, FileText } from 'lucide-react';

export function TeacherThemes() {
  const { user } = useAuth();
  const [themes, setThemes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    supporting_text: '',
    is_active: true
  });

  useEffect(() => {
    if (user?.id) fetchThemes();
  }, [user?.id]);

  async function fetchThemes() {
    if (!user) return;
    const { data, error } = await supabase
      .from('essay_themes')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setThemes(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    
    if (editingTheme) {
      const { error } = await supabase
        .from('essay_themes')
        .update(formData)
        .eq('id', editingTheme.id)
        .eq('teacher_id', user.id);
    } else {
      const { error } = await supabase
        .from('essay_themes')
        .insert([{ ...formData, teacher_id: user.id }]);
    }

    setIsModalOpen(false);
    setEditingTheme(null);
    setFormData({ title: '', description: '', supporting_text: '', is_active: true });
    fetchThemes();
  }

  function openEditModal(theme: any) {
    setEditingTheme(theme);
    setFormData({
      title: theme.title,
      description: theme.description,
      supporting_text: theme.supporting_text,
      is_active: theme.is_active
    });
    setIsModalOpen(true);
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    if (!user) return;
    await supabase
      .from('essay_themes')
      .update({ is_active: !currentStatus })
      .eq('id', id)
      .eq('teacher_id', user.id);
    fetchThemes();
  }

  async function deleteTheme(id: string) {
    if (!user) return;
    if (window.confirm('Tem certeza que deseja excluir este tema? Ele deixará de aparecer para os alunos.')) {
      await supabase.from('essay_themes').delete().eq('id', id).eq('teacher_id', user.id);
      fetchThemes();
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Temas</h1>
          <p className="text-slate-500 mt-1">Crie temas e receba royalties (R$) sempre que os alunos escolherem escrever sobre eles.</p>
        </div>
        <button 
          onClick={() => {
            setEditingTheme(null);
            setFormData({ title: '', description: '', supporting_text: '', is_active: true });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/20 transition-colors"
        >
          <Plus size={16} />
          Cadastrar Tema
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <FileText size={24} className="text-brand-orange" />
          <h2 className="text-xl font-bold text-slate-800">Temas de sua autoria</h2>
        </div>
        
        {themes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText size={24} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Nenhum tema criado</h3>
            <p className="text-slate-500 max-w-sm mt-2">
              Você ainda não criou nenhum tema. Cadastre novos temas e ganhe royalties cada vez que um aluno escolher sua proposta!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-sm font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Título do Tema</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Criado em</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {themes.map((theme) => (
                  <tr key={theme.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{theme.title}</p>
                      <p className="text-xs text-slate-500 truncate max-w-md">{theme.description}</p>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => toggleStatus(theme.id, theme.is_active)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors border ${
                          theme.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {theme.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {theme.is_active ? 'Visível' : 'Oculto'}
                      </button>
                    </td>
                    <td className="p-4 text-center text-slate-500">
                      {new Date(theme.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(theme)}
                          className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Tema"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteTheme(theme.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir Tema"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTheme ? 'Editar Tema' : 'Cadastrar Novo Tema'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="themeForm" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título do Tema</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-shadow"
                    placeholder="Ex: O papel da arte na sociedade contemporânea"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Breve</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-shadow"
                    placeholder="Dica ou direcionamento inicial sobre o tema"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Textos Motivadores</label>
                  <textarea 
                    rows={8}
                    value={formData.supporting_text}
                    onChange={e => setFormData({...formData, supporting_text: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-shadow resize-none"
                    placeholder="Cole aqui as notícias, dados, trechos de livros ou imagens descritivas..."
                  ></textarea>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 rounded text-brand-blue focus:ring-brand-blue"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Deixar tema público (alunos já poderão usá-lo)
                  </label>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200/50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="themeForm"
                className="px-5 py-2.5 bg-brand-blue text-white font-medium rounded-xl hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all"
              >
                {editingTheme ? 'Salvar Alterações' : 'Publicar Tema'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
