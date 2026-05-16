import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

export function AdminThemes() {
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
    fetchThemes();
  }, []);

  async function fetchThemes() {
    const { data, error } = await supabase
      .from('essay_themes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setThemes(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (editingTheme) {
      const { error } = await supabase
        .from('essay_themes')
        .update(formData)
        .eq('id', editingTheme.id);
    } else {
      const { error } = await supabase
        .from('essay_themes')
        .insert([formData]);
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
    await supabase
      .from('essay_themes')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    fetchThemes();
  }

  async function deleteTheme(id: string) {
    if (window.confirm('Tem certeza que deseja excluir este tema?')) {
      await supabase.from('essay_themes').delete().eq('id', id);
      fetchThemes();
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Temas de Redação</h1>
          <p className="text-slate-500 mt-1">Gerencie os temas disponíveis para os alunos.</p>
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
          Novo Tema
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm text-slate-500">
              <th className="p-4 font-medium">Título do Tema</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Criado em</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {themes.map((theme) => (
              <tr key={theme.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <p className="font-semibold text-slate-800">{theme.title}</p>
                  <p className="text-xs text-slate-500 truncate max-w-md">{theme.description}</p>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => toggleStatus(theme.id, theme.is_active)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                      theme.is_active 
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {theme.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {theme.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {new Date(theme.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-4">
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
            {themes.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Nenhum tema cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTheme ? 'Editar Tema' : 'Novo Tema de Redação'}
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
                    placeholder="Ex: Os desafios da inteligência artificial no Brasil"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Breve</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-shadow"
                    placeholder="Uma frase de apoio para o aluno entender o contexto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Textos Motivadores</label>
                  <textarea 
                    rows={6}
                    value={formData.supporting_text}
                    onChange={e => setFormData({...formData, supporting_text: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-shadow resize-none"
                    placeholder="Cole aqui os textos motivadores para a redação..."
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
                    Tema ativo (visível para os alunos enviarem redação)
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
                {editingTheme ? 'Salvar Alterações' : 'Cadastrar Tema'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
