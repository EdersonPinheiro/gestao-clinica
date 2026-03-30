-- Create a table for notifications
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  message text not null,
  type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
  read boolean default false,
  -- Links to specific entities (optional)
  patient_id uuid references patients(id),
  appointment_id uuid references appointments(id)
);

-- Policy to allow anyone to insert (since we are using client-side calls for now)
-- In a real production app with auth, you would restrict this to the authenticated user
alter table notifications enable row level security;

create policy "Enable all access for authenticated users" 
on notifications for all 
using (auth.role() = 'authenticated');
