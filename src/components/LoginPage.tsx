import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, GraduationCap, ShieldCheck, Mail, Lock, User, Loader2 } from 'lucide-react';
import { PartnerSchool } from '../types';

interface LoginPageProps {
  onBack?: () => void;
}

export function LoginPage({ onBack }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'STUDENT'>('STUDENT');
  
  // Extra fields (Shared)
  const [phone, setPhone] = useState('');

  // Teacher extra fields
  const [stateUF, setStateUF] = useState('');
  const [city, setCity] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [isEnemEvaluator, setIsEnemEvaluator] = useState(false);

  // Student extra fields
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao conectar com Google.');
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const finalRole = role === 'TEACHER' ? 'PENDING_TEACHER' : 'STUDENT';
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: finalRole,
              phone: phone || undefined,
              state: role === 'TEACHER' ? stateUF : undefined,
              city: role === 'TEACHER' ? city : undefined,
              education_level: role === 'TEACHER' ? educationLevel : undefined,
              is_enem_evaluator: role === 'TEACHER' ? isEnemEvaluator : undefined,
              school_name: role === 'STUDENT' ? schoolName : undefined,
              school_year: role === 'STUDENT' ? schoolYear : undefined,
              age: role === 'STUDENT' ? parseInt(age) : undefined,
              school_type: role === 'STUDENT' ? schoolType : undefined,
              target_course: role === 'STUDENT' ? targetCourse : undefined,
            }
          }
        });
        if (signUpError) throw signUpError;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-brand-orange rounded-2xl flex items-center justify-center font-bold text-white italic text-3xl mb-4 shadow-xl shadow-brand-orange/20">
          R
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Redarum</h1>
        <p className="text-slate-400 mt-2 text-center text-lg max-w-xs">Plataforma Inteligente de Correção de Redações</p>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100">
        {onBack && (
          <button 
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-brand-blue transition-colors cursor-pointer"
          >
            &larr; Voltar para o início
          </button>
        )}
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isLogin ? 'Seja bem-vindo de volta' : 'Crie sua conta'}
        </h2>
        <p className="text-slate-500 mb-8">
          {isLogin ? 'Faça login para acessar o sistema' : 'Preencha os dados abaixo para se cadastrar'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mb-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            <path fill="none" d="M1 1h22v22H1z" />
          </svg>
          Continuar com Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500 font-medium">Ou use seu e-mail</span>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                    placeholder="João Silva"
                  />
                </div>
              </div>
              
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
                  <h3 className="font-bold text-slate-800 text-sm">Dados Adicionais do Professor</h3>
                  
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
                  <h3 className="font-bold text-slate-800 text-sm">Dados Adicionais do Aluno</h3>
                  
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
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-6 bg-brand-orange text-white rounded-xl font-bold shadow-xl shadow-brand-orange/20 hover:bg-orange-500 hover:shadow-orange-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? 'Entrar no Sistema' : 'Criar Conta')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm font-semibold text-slate-500 hover:text-brand-blue transition-colors"
          >
            {isLogin ? 'Ainda não tem conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">&copy; 2024 Redarum Education</p>
        </div>
      </div>
    </div>
  );
}
