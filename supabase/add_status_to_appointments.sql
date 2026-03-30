-- Add status column to appointments table if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'appointments' and column_name = 'status') then
    alter table appointments add column status text default 'scheduled'; -- scheduled, completed, cancelled
  end if;
end $$;
