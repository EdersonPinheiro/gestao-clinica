-- Add missing columns if they don't exist yet
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'medical_records' and column_name = 'complaints') then
    alter table medical_records add column complaints text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'medical_records' and column_name = 'diagnosis') then
    alter table medical_records add column diagnosis text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'medical_records' and column_name = 'treatment_plan') then
    alter table medical_records add column treatment_plan text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'medical_records' and column_name = 'evolution') then
    alter table medical_records add column evolution text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'medical_records' and column_name = 'medications') then
    alter table medical_records add column medications text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'medical_records' and column_name = 'session_type') then
    alter table medical_records add column session_type text default 'Presencial';
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'medical_records' and column_name = 'doctor_id') then
    alter table medical_records add column doctor_id uuid default auth.uid();
  end if;
end $$;

-- Enable RLS just in case it wasn't
alter table medical_records enable row level security;

-- Re-apply policy (drop first to avoid error if exists)
drop policy if exists "Enable all access for authenticated users" on medical_records;
create policy "Enable all access for authenticated users" 
on medical_records for all 
using (auth.role() = 'authenticated');
