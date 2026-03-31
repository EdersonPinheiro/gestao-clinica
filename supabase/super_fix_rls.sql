-- 1. Políticas para a Tabela de Pacientes (patients)
DROP POLICY IF EXISTS "Enable insert for everyone" ON patients;
CREATE POLICY "Enable insert for everyone" ON patients FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for anon" ON patients;
CREATE POLICY "Enable select for anon" ON patients FOR SELECT TO anon, authenticated USING (true);

-- 2. Políticas para a Tabela de Agendamentos (appointments)
DROP POLICY IF EXISTS "Enable insert for everyone" ON appointments;
CREATE POLICY "Enable insert for everyone" ON appointments FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for anon" ON appointments;
CREATE POLICY "Enable select for anon" ON appointments FOR SELECT TO anon, authenticated USING (true);
