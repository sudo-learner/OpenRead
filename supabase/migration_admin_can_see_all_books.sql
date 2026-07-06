-- Migration: lets admins see ALL books (including other users' pending
-- and rejected ones) in the /admin panel. Without this, an admin can only
-- see books that are already approved, or ones they personally uploaded —
-- which made the Pending Uploads tab look empty even when uploads existed.
--
-- Run this once in Supabase -> SQL Editor.

drop policy if exists "Approved books are public" on public.books;

create policy "Books visible to public, owners, and admins" on public.books for select using (
  status = 'approved'
  or uploaded_by = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
