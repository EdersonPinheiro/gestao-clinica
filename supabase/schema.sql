-- Tabela de Pacientes (Dados Pessoais e Ficha Inicial)
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Dados Pessoais
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  profession TEXT,
  gender TEXT,
  cpf TEXT,
  
  -- Endereço
  address_zip TEXT,
  address_full TEXT,
  
  -- Contatos de Emergência
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact2_name TEXT,
  emergency_contact2_phone TEXT,
  
  -- Dados Clínicos Básicos (Preenchidos na ficha pública)
  allergies TEXT,
  medications TEXT,
  main_complaint TEXT, -- Motivo da visita
  
  -- Metadados
  is_active BOOLEAN DEFAULT true
);

-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 50,
  
  type TEXT DEFAULT 'presencial', -- 'presencial', 'online'
  status TEXT DEFAULT 'agendado', -- 'agendado', 'concluido', 'cancelado', 'falta'
  
  price DECIMAL(10,2),
  notes TEXT
);

-- Tabela de Prontuários (Evoluções, Anotações Privadas do Psicólogo)
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id), -- Opcional, pode estar ligado a uma sessão específica
  
  date DATE DEFAULT CURRENT_DATE,
  title TEXT, -- Ex: "Evolução Sessão 1", "Anamnese Completa"
  content TEXT, -- Conteúdo rico ou texto simples
  
  is_private BOOLEAN DEFAULT true -- Apenas profissionais podem ver
);

-- Row Level Security (RLS) Policies

-- Habilitar RLS nas tabelas
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Policies para PACIENTES
-- Permitir leitura pública (ou restrita, dependendo da regra de negócio, mas para o dashboard funcionar simples vamos liberar leitura autenticada e insert anonimo para a ficha)

-- 1. Qualquer um pode CRIAR um paciente (Ficha Pública)
DROP POLICY IF EXISTS "Enable insert for anon users" ON patients;
CREATE POLICY "Enable insert for anon users" ON patients FOR INSERT WITH CHECK (true);

-- 2. Apenas usuários autenticados (Médicos/Admin) podem LER tudo
DROP POLICY IF EXISTS "Enable view for authenticated users" ON patients;
CREATE POLICY "Enable view for authenticated users" ON patients FOR SELECT TO authenticated USING (true);

-- 3. Apenas usuários autenticados podem ATUALIZAR
DROP POLICY IF EXISTS "Enable update for authenticated users" ON patients;
CREATE POLICY "Enable update for authenticated users" ON patients FOR UPDATE TO authenticated USING (true);


-- Policies para AGENDAMENTOS
-- Apenas autenticados podem ver e manipular agendamentos (Painel administrativo)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON appointments;
CREATE POLICY "Enable all for authenticated users" ON appointments FOR ALL TO authenticated USING (true);


-- Policies para PRONTUÁRIOS
-- Apenas autenticados podem ver e manipular
DROP POLICY IF EXISTS "Enable all for authenticated users" ON medical_records;
CREATE POLICY "Enable all for authenticated users" ON medical_records FOR ALL TO authenticated USING (true);
