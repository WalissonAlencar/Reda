import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminEssays } from './components/AdminEssays';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { LoginPage } from './components/LoginPage';
import { CorrectionInterface } from './components/CorrectionInterface';
import { StudentManagement } from './components/StudentManagement';
import { TeacherManagement } from './components/TeacherManagement';
import { StudentSubmitEssay } from './components/StudentSubmitEssay';
import { StudentEssayHistory } from './components/StudentEssayHistory';
import { TeacherPendingEssays } from './components/TeacherPendingEssays';
import { TeacherProductivity } from './components/TeacherProductivity';
import { AdminReports } from './components/AdminReports';
import { AdminThemes } from './components/AdminThemes';
import { AdminSettings } from './components/AdminSettings';
import { AdminFinance } from './components/AdminFinance';
import { AdminSchools } from './components/AdminSchools';
import { StudentThemesLibrary } from './components/StudentThemesLibrary';
import { Essay } from './types';
import { AuthProvider } from './context/AuthContext';
import { CompleteProfile } from './components/CompleteProfile';
import { supabase } from './lib/supabase';
import { GraduationCap } from 'lucide-react';
import { LandingPage } from './components/LandingPage';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  if (!user) {
    if (showLogin) {
      return <LoginPage onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onNavigateToLogin={() => setShowLogin(true)} />;
  }

  // Intercept incomplete profiles (e.g., Google login or newly added fields)
  if (!user.phone && user.role !== 'ADMIN') {
    return <CompleteProfile user={user} onComplete={() => window.location.reload()} />;
  }

  if (user.role === 'PENDING_TEACHER') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 items-center justify-center p-6 text-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <div className="bg-white p-8 rounded-[2rem] max-w-md w-full shadow-2xl border border-slate-100">
           <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <GraduationCap size={40} className="text-brand-orange" />
           </div>
           <h2 className="text-2xl font-bold mb-3 text-slate-800">Cadastro em Análise</h2>
           <p className="text-slate-500 mb-8 leading-relaxed">
             Seu perfil de professor foi recebido e está sob análise da coordenação da Redarum. 
             Você poderá acessar a plataforma assim que for aprovado.
           </p>
           <button 
             onClick={() => supabase.auth.signOut()} 
             className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
           >
              Sair do Sistema
           </button>
        </div>
      </div>
    );
  }

  // Handle special "Correction" view for teachers
  if (selectedEssay) {
    return (
      <CorrectionInterface 
        essay={selectedEssay} 
        onClose={() => setSelectedEssay(null)} 
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-light">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <Header />
        
        <div className="p-8 pb-12">
          {user.role === 'ADMIN' && (
            <>
              {activeTab === 'dashboard' && <AdminDashboard />}
              {activeTab === 'essays' && <AdminEssays />}
              {activeTab === 'students' && <StudentManagement />}
              {activeTab === 'teachers' && <TeacherManagement />}
              {activeTab === 'schools' && <AdminSchools />}
              {activeTab === 'themes' && <AdminThemes />}
              {activeTab === 'reports' && <AdminReports />}
              {activeTab === 'finance' && <AdminFinance />}
              {activeTab === 'settings' && <AdminSettings />}
            </>
          )}

          {user.role === 'TEACHER' && (
            <>
              {activeTab === 'dashboard' && <TeacherDashboard onStartCorrection={setSelectedEssay} />}
              {activeTab === 'pending' && <TeacherPendingEssays onStartCorrection={setSelectedEssay} />}
              {activeTab === 'reports' && <TeacherProductivity />}
            </>
          )}

          {user.role === 'STUDENT' && (
            <>
              {activeTab === 'dashboard' && <StudentDashboard onNavigate={setActiveTab} />}
              {activeTab === 'essays' && <StudentEssayHistory />}
              {activeTab === 'submit' && <StudentSubmitEssay />}
              {activeTab === 'themes_library' && <StudentThemesLibrary setActiveTab={setActiveTab} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
