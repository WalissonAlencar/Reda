import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, PartnerSchool } from '../types';
import { X, Save, Loader2, BookOpen } from 'lucide-react';

interface StudentProfileModalProps {
  user: User;
  onClose: () => void;
  onSaved: (updatedUser: User) => void;
}

export function StudentProfileModal({ user, onClose, onSaved }: StudentProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerSchools, setPartnerSchools] = useState<PartnerSchool[]>([]);

  // Form states
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [age, setAge] = useState(user.age?.toString() || '');
  const [schoolName, setSchoolName] = useState(user.school_name || '');
  const [schoolType, setSchoolType] = useState(user.school_type || '');
  const [schoolYear, setSchoolYear] = useState(user.school_year || '');
  const [targetCourse, setTargetCourse] = useState(user.target_course || '');

  useEffect(() => {
    async function fetchSchools() {
      const { data } = await supabase.from('partner_schools').select('*').order('name');
      if (data) setPartnerSchools(data);
    }
    fetchSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        name,
        phone,
        age: age ? parseInt(age, 10) : null,
        school_name: schoolName,
        school_type: schoolType,
        school_year: schoolYear,
        target_course: targetCourse
      };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      onSaved({ ...user, ...updateData });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao salvar os dados do aluno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Editar Cadastro do Aluno</h2>
              <p className="text-slate-500 text-xs">Ajuste as informações de perfil de {user.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <form id="edit-student-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm transition-all"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-[2]">
                <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm transition-all"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Idade</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm transition-all"
                  placeholder="17"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Escola / Instituição</label>
              <select
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm transition-all"
              >
                <option value="">Selecione a Escola...</option>
                {partnerSchools.map(school => (
                  <option key={school.id} value={school.name}>{school.name}</option>
                ))}
                <option value="Outra (Não listada)">Outra (Não listada)</option>
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Escola</label>
                <select
                  value={schoolType}
                  onChange={(e) => setSchoolType(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm transition-all"
                >
                  <option value="">Selecione...</option>
                  <option value="Pública">Pública</option>
                  <option value="Privada">Privada</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Ano Escolar</label>
                <select
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm transition-all"
                >
                  <option value="">Selecione...</option>
                  <option value="1º Ano do Ensino Médio">1º Ano do Ensino Médio</option>
                  <option value="2º Ano do Ensino Médio">2º Ano do Ensino Médio</option>
                  <option value="3º Ano do Ensino Médio">3º Ano do Ensino Médio</option>
                  <option value="Cursinho / Pré-vestibular">Cursinho / Pré-vestibular</option>
                  <option value="Já concluiu">Já concluí o Ensino Médio</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Curso Pretendido (Foco)</label>
              <input
                type="text"
                value={targetCourse}
                onChange={(e) => setTargetCourse(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm transition-all"
                placeholder="Ex: Medicina, Direito, Engenharia..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-student-form"
            disabled={loading}
            className="px-6 py-2 text-sm font-bold text-white bg-brand-blue rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-blue/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
