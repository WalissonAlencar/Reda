import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PartnerSchool } from '../types';
import { Building2, Plus, Trash2, Loader2, Search } from 'lucide-react';

export function AdminSchools() {
  const [schools, setSchools] = useState<PartnerSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partner_schools')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setSchools(data || []);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar escolas parceiras.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    setAdding(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('partner_schools')
        .insert([{ name: newSchoolName.trim() }])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setSchools([...schools, data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewSchoolName('');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === '23505') { // Unique violation
        setError('Uma escola com este nome já existe.');
      } else {
        setError('Erro ao adicionar escola.');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta escola parceira?')) return;

    try {
      const { error } = await supabase
        .from('partner_schools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSchools(schools.filter(s => s.id !== id));
    } catch (err: any) {
      console.error(err);
      setError('Erro ao remover escola.');
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Escolas Parceiras</h2>
          <p className="text-slate-500">Gerencie as instituições de ensino parceiras da Redatto.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-brand-blue" />
              Nova Escola Parceira
            </h3>
            
            <form onSubmit={handleAddSchool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Instituição</label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  placeholder="Ex: Colégio Progresso"
                />
              </div>
              
              <button
                type="submit"
                disabled={adding || !newSchoolName.trim()}
                className="w-full py-2 bg-brand-blue text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
              >
                {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Cadastrar Escola
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar escola parceira..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <Loader2 size={32} className="animate-spin mb-4" />
                  <p>Carregando escolas...</p>
                </div>
              ) : filteredSchools.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <Building2 size={48} className="mb-4 opacity-20" />
                  <p>Nenhuma escola encontrada.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSchools.map((school) => (
                    <div 
                      key={school.id} 
                      className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                          <Building2 size={20} className="text-brand-blue" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{school.name}</p>
                          <p className="text-xs text-slate-500">Cadastrada em {new Date(school.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSchool(school.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Remover Escola"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
