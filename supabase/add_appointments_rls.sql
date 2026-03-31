-- Permite que usuários anônimos (pacientes preenchendo a ficha) possam INSERIR agendamentos
DROP POLICY IF EXISTS "Enable insert for everyone" ON appointments;

CREATE POLICY "Enable insert for everyone" 
ON appointments FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);
