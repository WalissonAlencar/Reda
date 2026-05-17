import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { X, Save, Loader2, GraduationCap, ShieldCheck } from 'lucide-react';

interface TeacherProfileModalProps {
  user: User;
  onClose: () => void;
  onSaved: (updatedUser: User) => void;
}

export function TeacherProfileModal({ user, onClose, onSaved }: TeacherProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [stateUF, setStateUF] = useState(user.state || '');
  const [city, setCity] = useState(user.city || '');
  const [educationLevel, setEducationLevel] = useState(user.education_level || '');
  const [isEnemEvaluator, setIsEnemEvaluator] = useState(user.is_enem_evaluator || false);
  const [role, setRole] = useState(user.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        name,
        phone,
        state: stateUF,
        city,
        education_level: educationLevel,
        is_enem_evaluator: isEnemEvaluator,
        role: role
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
      setError('Erro ao salvar os dados do professor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center text-brand-orange">
              <GraduationCap size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Editar Cadastro do Professor</h2>
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

          <form id="edit-teacher-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none text-sm transition-all"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                <select
                  value={stateUF}
                  onChange={(e) => setStateUF(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none text-sm transition-all"
                >
                  <option value="">Selecione...</option>
                  <option value="AC">Acre</option><option value="AL">Alagoas</option><option value="AP">Amapá</option><option value="AM">Amazonas</option><option value="BA">Bahia</option><option value="CE">Ceará</option><option value="DF">Distrito Federal</option><option value="ES">Espírito Santo</option><option value="GO">Goiás</option><option value="MA">Maranhão</option><option value="MT">Mato Grosso</option><option value="MS">Mato Grosso do Sul</option><option value="MG">Minas Gerais</option><option value="PA">Pará</option><option value="PB">Paraíba</option><option value="PR">Paraná</option><option value="PE">Pernambuco</option><option value="PI">Piauí</option><option value="RJ">Rio de Janeiro</option><option value="RN">Rio Grande do Norte</option><option value="RS">Rio Grande do Sul</option><option value="RO">Rondônia</option><option value="RR">Roraima</option><option value="SC">Santa Catarina</option><option value="SP">São Paulo</option><option value="SE">Sergipe</option><option value="TO">Tocantins</option>
                </select>
              </div>
              <div className="flex-[2]">
                <label className="block text-xs font-medium text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none text-sm transition-all"
                  placeholder="Nome da Cidade"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Escolaridade</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none text-sm transition-all"
              >
                <option value="">Selecione...</option>
                <option value="Superior Cursando">Ensino Superior (Cursando)</option>
                <option value="Superior Completo">Ensino Superior (Completo)</option>
                <option value="Pós-graduação">Pós-graduação / Especialização</option>
                <option value="Mestrado">Mestrado</option>
                <option value="Doutorado">Doutorado</option>
              </select>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
              <input
                type="checkbox"
                id="enem_evaluator"
                checked={isEnemEvaluator}
                onChange={(e) => setIsEnemEvaluator(e.target.checked)}
                className="w-4 h-4 text-brand-orange rounded border-slate-300 focus:ring-brand-orange"
              />
              <label htmlFor="enem_evaluator" className="text-sm font-medium text-slate-700 cursor-pointer">
                É corretor(a) oficial do ENEM
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-2">Validação e Acesso</label>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className={`p-2 rounded-lg ${role === 'PENDING_TEACHER' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                   <ShieldCheck size={20} />
                </div>
                <div className="flex-1">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-transparent font-bold outline-none text-slate-700 cursor-pointer"
                  >
                    <option value="PENDING_TEACHER">Cadastro Pendente (Aguardando Aprovação)</option>
                    <option value="TEACHER">Professor Ativo (Aprovado)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {role === 'PENDING_TEACHER' 
                      ? 'Este usuário não pode acessar a plataforma até ser aprovado.' 
                      : 'O professor tem acesso total e pode corrigir redações.'}
                  </p>
                </div>
              </div>
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
            form="edit-teacher-form"
            disabled={loading}
            className="px-6 py-2 text-sm font-bold text-white bg-brand-orange rounded-xl hover:bg-orange-500 hover:shadow-lg hover:shadow-brand-orange/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
