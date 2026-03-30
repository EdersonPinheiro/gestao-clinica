-- Allow anonymous users to insert notifications
drop policy if exists "Enable insert for everyone" on notifications;

create policy "Enable insert for everyone" 
on notifications for insert 
to anon, authenticated 
with check (true);

-- Also allow anonymous users to insert patients (if you have a public registration form)
drop policy if exists "Enable insert for everyone" on patients;

create policy "Enable insert for everyone" 
on patients for insert 
to anon, authenticated 
with check (true);

-- Ensure they can't read/update everything (Security Best Practice)
-- Assuming 'Enable all access for authenticated users' already exists for read/update.
-- If not, you might need to ensure 'anon' can't read all patient data.
