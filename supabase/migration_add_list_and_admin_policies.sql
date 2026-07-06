-- Migration: adds permissions needed for Reading Lists (add/remove books)
-- and Admin role management. Safe to run even if you already ran
-- schema.sql before these features existed — it only adds new policies,
-- it doesn't touch existing tables or data.
--
-- Run this once in Supabase → SQL Editor.

create policy "Users manage items in their own lists" on public.reading_list_items for insert with check (
  exists (select 1 from public.reading_lists l where l.id = list_id and l.user_id = auth.uid())
);
create policy "Users remove items from their own lists" on public.reading_list_items for delete using (
  exists (select 1 from public.reading_lists l where l.id = list_id and l.user_id = auth.uid())
);

create policy "Admins can update any profile" on public.profiles for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Make yourself the first admin (needed to use the /admin panel at all).
-- Replace 'your_username' with your actual username, then run this line
-- separately:
-- update public.profiles set role = 'admin' where username = 'your_username';
