import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { LoginPage } from './components/LoginPage';
import { CorrectionInterface } from './components/CorrectionInterface';
import { StudentManagement } from './components/StudentManagement';
import { StudentSubmitEssay } from './components/StudentSubmitEssay';
import { StudentEssayHistory } from './components/StudentEssayHistory';
import { TeacherPendingEssays } from './components/TeacherPendingEssays';
import { AdminReports } from './components/AdminReports';
import { AdminThemes } from './components/AdminThemes';
import { Essay } from './types';
import { AuthProvider } from './context/AuthContext';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);

  if (!user) {
    return <LoginPage />;
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
              {activeTab === 'students' && <StudentManagement />}
              {activeTab === 'teachers' && <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">Gestão de Professores (Mock)</div>}
              {activeTab === 'themes' && <AdminThemes />}
              {activeTab === 'reports' && <AdminReports />}
            </>
          )}

          {user.role === 'TEACHER' && (
            <>
              {activeTab === 'dashboard' && <TeacherDashboard onStartCorrection={setSelectedEssay} />}
              {activeTab === 'pending' && <TeacherPendingEssays onStartCorrection={setSelectedEssay} />}
              {activeTab === 'reports' && <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">Relatórios de Produtividade (Mock)</div>}
            </>
          )}

          {user.role === 'STUDENT' && (
            <>
              {activeTab === 'dashboard' && <StudentDashboard />}
              {activeTab === 'essays' && <StudentEssayHistory />}
              {activeTab === 'submit' && <StudentSubmitEssay />}
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
