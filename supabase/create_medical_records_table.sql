-- Create medical_records table
create table medical_records (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references patients(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date default CURRENT_DATE,
  
  -- Record Fields
  complaints text, -- Queixas principais
  diagnosis text,  -- Hipótese diagnóstica
  treatment_plan text, -- Plano de tratamento
  evolution text, -- Evolução da sessão (anotações gerais)
  medications text, -- Medicamentos (opcional)
  
  -- Metadata
  session_type text default 'Presencial', -- Presencial/Online
  doctor_id uuid default auth.uid() -- Link to the doctor who created it
);

-- Enable RLS
alter table medical_records enable row level security;

-- Policy
create policy "Enable all access for authenticated users" 
on medical_records for all 
using (auth.role() = 'authenticated');
