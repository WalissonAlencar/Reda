import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { Users, Search, Mail, Calendar, Loader2, BookOpen, Save, Check, FileText, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { StudentProfileModal } from './StudentProfileModal';

export function StudentManagement() {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [creditsInput, setCreditsInput] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'STUDENT')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsersList(data || []);
      
      const inputs: Record<string, string> = {};
      (data || []).forEach(u => {
        inputs[u.id] = (u.essay_credits || 0).toString();
      });
      setCreditsInput(inputs);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreditsChange = (id: string, value: string) => {
    setCreditsInput(prev => ({ ...prev, [id]: value }));
  };

  const saveCredits = async (userId: string) => {
    try {
      setUpdatingId(userId);
      const val = parseInt(creditsInput[userId] || '0', 10);
      
      const { error } = await supabase
        .from('users')
        .update({ essay_credits: val })
        .eq('id', userId);

      if (error) throw error;

      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, essay_credits: val } : u));
      
      setSavedId(userId);
      setTimeout(() => setSavedId(null), 2000);
      
    } catch (error) {
      console.error('Erro ao atualizar limite de redações:', error);
      alert('Erro ao atualizar limite de redações do aluno.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!window.confirm("Atenção: Ao alterar o cargo, este usuário deixará de ser listado como aluno. Continuar?")) {
      return;
    }

    try {
      setUpdatingId(userId);
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      if (newRole !== 'STUDENT') {
        setUsersList(prev => prev.filter(u => u.id !== userId));
      }
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Gestão de Alunos</h1>
          <p className="text-slate-500 mt-1">Controle o acesso e os limites de envio dos alunos.</p>
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aluno</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Cadastro</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Limite de Redações</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={32} className="animate-spin text-brand-blue" />
                      <p>Carregando alunos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users size={32} className="text-slate-300" />
                      <p>Nenhum aluno encontrado.</p>
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
                        <div>
                          <span className="font-bold text-slate-800 block">{user.name}</span>
                          <div className="flex items-center gap-1 text-slate-500 text-sm">
                            <Mail size={12} />
                            <span>{user.email}</span>
                          </div>
                        </div>
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
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <div className="relative w-24">
                           <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                           <input
                             type="number"
                             min="0"
                             value={creditsInput[user.id] || ''}
                             onChange={(e) => handleCreditsChange(user.id, e.target.value)}
                             className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                           />
                         </div>
                         <button
                           onClick={() => saveCredits(user.id)}
                           disabled={updatingId === user.id}
                           className={cn(
                             "p-1.5 rounded-lg transition-colors border",
                             savedId === user.id 
                               ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                               : "bg-white border-slate-200 text-brand-blue hover:bg-slate-50"
                           )}
                           title="Salvar Limite"
                         >
                           {updatingId === user.id ? (
                             <Loader2 size={16} className="animate-spin text-slate-400" />
                           ) : savedId === user.id ? (
                             <Check size={16} />
                           ) : (
                             <Save size={16} />
                           )}
                         </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setEditingStudent(user)}
                        className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all"
                        title="Ajustar Cadastro"
                      >
                        <Settings2 size={18} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end">
                         {updatingId === user.id ? (
                            <div className="flex items-center gap-2 text-brand-orange text-sm font-bold">
                              <Loader2 size={16} className="animate-spin" /> ...
                            </div>
                         ) : (
                           <div className="relative inline-block">
                             <select
                               value={user.role}
                               onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                               className="appearance-none pl-8 pr-8 py-2 rounded-lg text-xs font-bold uppercase tracking-wider outline-none border cursor-pointer transition-all bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                             >
                               <option value="STUDENT">Aluno</option>
                               <option value="TEACHER">Promover a Professor</option>
                               <option value="ADMIN">Promover a Admin</option>
                             </select>
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <BookOpen size={14} className="text-emerald-700" />
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

      {editingStudent && (
        <StudentProfileModal
          user={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSaved={(updatedUser) => {
            setUsersList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
          }}
        />
      )}
    </div>
  );
}
