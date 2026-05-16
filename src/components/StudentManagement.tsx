import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { Users, Search, Mail, Calendar, Loader2, ShieldCheck, GraduationCap, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

export function StudentManagement() {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Alterado para buscar todos, ou você pode manter apenas STUDENT se quiser que a tela seja só de alunos.
      // Como a ideia é trocar o perfil, talvez seja melhor mostrar todo mundo, ou pelo menos avisar que sumirá da lista.
      // Vamos buscar só os alunos por enquanto (role = 'STUDENT') ou todo mundo?
      // Pelo print, a tela se chama "Alunos", mas mudar o perfil faz ele sair da tela. 
      // Vou mudar a busca para pegar todos para que o Admin veja para quem ele mudou.
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsersList(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingId(userId);
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Update local state without refetching all
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar o perfil do usuário.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Gestão de Usuários</h1>
          <p className="text-slate-500 mt-1">Gerencie os perfis de acesso da plataforma.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Cadastro</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Perfil de Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={32} className="animate-spin text-brand-blue" />
                      <p>Carregando usuários...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users size={32} className="text-slate-300" />
                      <p>Nenhum usuário encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold shadow-sm shrink-0 overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-bold text-slate-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail size={16} />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={16} />
                        <span className="text-sm">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end">
                         {updatingId === user.id ? (
                            <div className="flex items-center gap-2 text-brand-orange text-sm font-bold">
                              <Loader2 size={16} className="animate-spin" /> Atualizando...
                            </div>
                         ) : (
                           <div className="relative inline-block">
                             <select
                               value={user.role}
                               onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                               className={cn(
                                 "appearance-none pl-8 pr-8 py-2 rounded-lg text-xs font-bold uppercase tracking-wider outline-none border cursor-pointer transition-all",
                                 user.role === 'ADMIN' ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' :
                                 user.role === 'TEACHER' ? 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue hover:bg-brand-blue/20' :
                                 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                               )}
                             >
                               <option value="STUDENT">Aluno</option>
                               <option value="TEACHER">Professor</option>
                               <option value="ADMIN">Administrador</option>
                             </select>
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                {user.role === 'ADMIN' && <ShieldCheck size={14} className="text-red-700" />}
                                {user.role === 'TEACHER' && <GraduationCap size={14} className="text-brand-blue" />}
                                {user.role === 'STUDENT' && <BookOpen size={14} className="text-emerald-700" />}
                             </div>
                           </div>
                         )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
