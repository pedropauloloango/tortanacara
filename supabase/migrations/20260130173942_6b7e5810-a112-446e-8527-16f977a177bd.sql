-- Criar tabela de perguntas para armazenamento em lote
CREATE TABLE public.perguntas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tema TEXT NOT NULL,
  nivel TEXT NOT NULL,
  faixa_etaria TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  usada BOOLEAN NOT NULL DEFAULT false,
  criada_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice para busca eficiente por combinação não usada
CREATE INDEX idx_perguntas_filtros ON public.perguntas (tema, nivel, faixa_etaria, usada);

-- Habilitar RLS
ALTER TABLE public.perguntas ENABLE ROW LEVEL SECURITY;

-- Política pública para leitura (não requer login)
CREATE POLICY "Perguntas são públicas para leitura" 
ON public.perguntas 
FOR SELECT 
USING (true);

-- Política pública para inserção (edge function usa service role)
CREATE POLICY "Permitir inserção de perguntas" 
ON public.perguntas 
FOR INSERT 
WITH CHECK (true);

-- Política pública para atualização (marcar como usada)
CREATE POLICY "Permitir atualizar status de pergunta" 
ON public.perguntas 
FOR UPDATE 
USING (true);