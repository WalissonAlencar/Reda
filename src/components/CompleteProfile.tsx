import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { User, PartnerSchool } from '../types';

interface CompleteProfileProps {
  user: User;
  onComplete: () => void;
}

export function CompleteProfile({ user, onComplete }: CompleteProfileProps) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>('STUDENT');
  const [error, setError] = useState<string | null>(null);

  // Shared
  const [phone, setPhone] = useState('');

  // Teacher
  const [stateUF, setStateUF] = useState('');
  const [city, setCity] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [isEnemEvaluator, setIsEnemEvaluator] = useState(false);

  // Student
  const [age, setAge] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [schoolType, setSchoolType] = useState('');
  const [targetCourse, setTargetCourse] = useState('');
  const [partnerSchools, setPartnerSchools] = useState<PartnerSchool[]>([]);

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
      const finalRole = role === 'TEACHER' ? 'PENDING_TEACHER' : 'STUDENT';
      
      const updateData: any = {
        role: finalRole,
        phone,
      };

      if (role === 'TEACHER') {
        updateData.state = stateUF;
        updateData.city = city;
        updateData.education_level = educationLevel;
        updateData.is_enem_evaluator = isEnemEvaluator;
      } else {
        updateData.school_name = schoolName;
        updateData.school_year = schoolYear;
        updateData.age = parseInt(age);
        updateData.school_type = schoolType;
        updateData.target_course = targetCourse;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      onComplete();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Complete seu Cadastro</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Notamos que faltam algumas informações no seu perfil. Por favor, escolha seu tipo de conta e preencha os dados abaixo para acessar a plataforma.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Qual o seu perfil?</label>
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`flex-1 py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${role === 'STUDENT' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-bold shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <BookOpen size={24} />
                <span>Aluno</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('TEACHER')}
                className={`flex-1 py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${role === 'TEACHER' ? 'border-brand-orange bg-brand-orange/5 text-brand-orange font-bold shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <GraduationCap size={24} />
                <span>Professor</span>
              </button>
            </div>
          </div>

          {role === 'TEACHER' && (
            <div className="space-y-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl animate-in slide-in-from-top-2">
              <h3 className="font-bold text-slate-800 text-sm">Dados do Professor</h3>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none text-sm"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    required
                    value={stateUF}
                    onChange={(e) => setStateUF(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none text-sm"
                  >
                    <option value="">Selecione...</option>
                    <option value="AC">Acre</option><option value="AL">Alagoas</option><option value="AP">Amapá</option><option value="AM">Amazonas</option><option value="BA">Bahia</option><option value="CE">Ceará</option><option value="DF">Distrito Federal</option><option value="ES">Espírito Santo</option><option value="GO">Goiás</option><option value="MA">Maranhão</option><option value="MT">Mato Grosso</option><option value="MS">Mato Grosso do Sul</option><option value="MG">Minas Gerais</option><option value="PA">Pará</option><option value="PB">Paraíba</option><option value="PR">Paraná</option><option value="PE">Pernambuco</option><option value="PI">Piauí</option><option value="RJ">Rio de Janeiro</option><option value="RN">Rio Grande do Norte</option><option value="RS">Rio Grande do Sul</option><option value="RO">Rondônia</option><option value="RR">Roraima</option><option value="SC">Santa Catarina</option><option value="SP">São Paulo</option><option value="SE">Sergipe</option><option value="TO">Tocantins</option>
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none text-sm"
                    placeholder="Nome da Cidade"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Escolaridade</label>
                <select
                  required
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none text-sm"
                >
                  <option value="">Selecione...</option>
                  <option value="Superior Cursando">Ensino Superior (Cursando)</option>
                  <option value="Superior Completo">Ensino Superior (Completo)</option>
                  <option value="Pós-graduação">Pós-graduação / Especialização</option>
                  <option value="Mestrado">Mestrado</option>
                  <option value="Doutorado">Doutorado</option>
                </select>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-2 border-t border-orange-200/50">
                <input
                  type="checkbox"
                  id="enem_evaluator"
                  checked={isEnemEvaluator}
                  onChange={(e) => setIsEnemEvaluator(e.target.checked)}
                  className="w-4 h-4 text-brand-orange rounded border-slate-300 focus:ring-brand-orange"
                />
                <label htmlFor="enem_evaluator" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Sou corretor(a) oficial do ENEM
                </label>
              </div>
            </div>
          )}

          {role === 'STUDENT' && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl animate-in slide-in-from-top-2">
              <h3 className="font-bold text-slate-800 text-sm">Dados do Aluno</h3>
              
              <div className="flex gap-4">
                <div className="flex-[2]">
                  <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Idade</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                    placeholder="17"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nome da Escola / Instituição</label>
                <select
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
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
                    required
                    value={schoolType}
                    onChange={(e) => setSchoolType(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                  >
                    <option value="">Selecione...</option>
                    <option value="Pública">Pública</option>
                    <option value="Privada">Privada</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ano Escolar</label>
                  <select
                    required
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
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
                  required
                  value={targetCourse}
                  onChange={(e) => setTargetCourse(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                  placeholder="Ex: Medicina, Direito, Engenharia..."
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-6 bg-brand-orange text-white rounded-xl font-bold shadow-xl shadow-brand-orange/20 hover:bg-orange-500 hover:shadow-orange-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Salvar e Acessar Plataforma'}
          </button>
          
          <div className="mt-4 text-center">
             <button 
               type="button"
               onClick={() => supabase.auth.signOut()} 
               className="text-sm font-medium text-slate-500 hover:text-slate-700"
             >
                Sair
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
