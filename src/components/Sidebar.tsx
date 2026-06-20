import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  FileText, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  GraduationCap,
  Library,
  DollarSign,
  Building2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = {
    ADMIN: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'essays', label: 'Gerenciar Redações', icon: FileText },
      { id: 'students', label: 'Alunos', icon: Users },
      { id: 'teachers', label: 'Professores', icon: GraduationCap },
      { id: 'schools', label: 'Escolas Parceiras', icon: Building2 },
      { id: 'themes', label: 'Temas', icon: FileText },
      { id: 'reports', label: 'Relatórios', icon: BarChart3 },
      { id: 'finance', label: 'Financeiro', icon: DollarSign },
      { id: 'settings', label: 'Configurações', icon: Settings },
    ],
    TEACHER: [
      { id: 'dashboard', label: 'Minhas Correções', icon: LayoutDashboard },
      { id: 'pending', label: 'Pendentes', icon: BookOpen },
      { id: 'reports', label: 'Produtividade', icon: BarChart3 },
      { id: 'finance', label: 'Financeiro', icon: DollarSign },
      { id: 'themes', label: 'Meus Temas', icon: Library },
    ],
    STUDENT: [
      { id: 'dashboard', label: 'Meu Progresso', icon: LayoutDashboard },
      { id: 'essays', label: 'Redações', icon: FileText },
      { id: 'submit', label: 'Enviar Redação', icon: BookOpen },
      { id: 'themes_library', label: 'Biblioteca de Temas', icon: Library },
    ]
  };

  const currentMenu = user ? menuItems[user.role] : [];

  return (
    <aside className="w-64 bg-slate-950 text-white flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center font-bold text-white italic">
            R
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Redarum
          </span>
        </div>

        <nav className="space-y-1">
          {currentMenu.map((item) => (
            <button
              key={item.id}
              id={`sidebar-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all text-sm font-medium",
                activeTab === item.id 
                  ? "bg-brand-orange text-white" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-900">
        <div className="flex items-center gap-3 mb-4 px-2">
          <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full border border-slate-700" />
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'TEACHER' ? 'Professor' : 'Aluno'}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm font-medium"
        >
          <LogOut size={20} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
