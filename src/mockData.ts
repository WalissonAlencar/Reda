import { Essay, User } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Walisson Admin', email: 'admin@redatrack.com', role: 'ADMIN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin' },
  { id: '2', name: 'Prof. Ricardo Santos', email: 'ricardo@redatrack.com', role: 'TEACHER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher1' },
  { id: '3', name: 'João Silva', email: 'joao@estudante.com', role: 'STUDENT', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student1' },
  { id: '4', name: 'Ana Oliveira', email: 'ana@estudante.com', role: 'STUDENT', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student2' },
];

export const MOCK_ESSAYS: Essay[] = [
  {
    id: 'e1',
    studentId: '3',
    studentName: 'João Silva',
    teacherId: '2',
    title: 'A Importância da Tecnologia na Educação Pós-Pandemia',
    status: 'corrected',
    submittedAt: '2024-05-10T10:00:00Z',
    correctedAt: '2024-05-12T15:30:00Z',
    score: 840,
    competencies: { c1: 160, c2: 180, c3: 160, c4: 180, c5: 160 },
    feedback: 'Excelente desenvolvimento argumentativo. Atente-se apenas à concordância verbal no segundo parágrafo.',
    pdfUrl: '#',
    correctedPdfUrl: '#'
  },
  {
    id: 'e2',
    studentId: '3',
    studentName: 'João Silva',
    title: 'Desafios da Mobilidade Urbana nas Metrópoles Brasileiras',
    status: 'correcting',
    submittedAt: '2024-05-14T09:00:00Z',
    pdfUrl: '#'
  },
  {
    id: 'e3',
    studentId: '4',
    studentName: 'Ana Oliveira',
    title: 'Os Impactos da Inteligência Artificial no Mercado de Trabalho',
    status: 'sent',
    submittedAt: '2024-05-15T14:20:00Z',
    pdfUrl: '#'
  }
];
