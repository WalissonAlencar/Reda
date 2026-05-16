-- SQL para habilitar a dupla correção no Supabase

-- Criação da tabela de correções
CREATE TABLE IF NOT EXISTS essay_corrections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  essay_id uuid REFERENCES essays(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  score integer,
  comp_1 integer,
  comp_2 integer,
  comp_3 integer,
  comp_4 integer,
  comp_5 integer,
  feedback text,
  corrected_pdf_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- (Opcional) Migrar as correções antigas da tabela essays para a nova tabela
INSERT INTO essay_corrections (essay_id, teacher_id, score, comp_1, comp_2, comp_3, comp_4, comp_5, feedback, corrected_pdf_url)
SELECT id, teacher_id, score, comp_1, comp_2, comp_3, comp_4, comp_5, feedback, corrected_pdf_url
FROM essays
WHERE status = 'corrected' AND teacher_id IS NOT NULL;
