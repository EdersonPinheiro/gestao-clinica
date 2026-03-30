-- Add phone number for second emergency contact
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'patients' and column_name = 'emergency_contact2_phone') then
    alter table patients add column emergency_contact2_phone text;
  end if;
end $$;
