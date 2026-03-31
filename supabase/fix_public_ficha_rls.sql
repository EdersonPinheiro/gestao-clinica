-- 1. Permite criação de PACIENTE na Ficha Pública
DROP POLICY IF EXISTS "Enable insert for anon users" ON patients;
DROP POLICY IF EXISTS "Enable insert for everyone" ON patients;

CREATE POLICY "Enable insert for everyone" 
ON patients FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 2. Permite criação do AGENDAMENTO após pagamento na Ficha Pública
DROP POLICY IF EXISTS "Enable insert for everyone" ON appointments;

CREATE POLICY "Enable insert for everyone" 
ON appointments FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);
