-- Seed sample books: Self Improvement & Motivation collections
-- Run this in Supabase SQL Editor AFTER schema.sql has already been run.
--
-- IMPORTANT — read this first:
-- These rows give your homepage real book LISTINGS (title, author,
-- a short original description, category) so it doesn't look empty.
-- They do NOT include an actual PDF/EPUB file, because I have no way to
-- upload files into your Supabase storage from here — only you can do that.
--
-- All ten titles below are genuine public-domain classics (published long
-- enough ago that copyright has expired), so it's safe to host the real
-- files once you attach them. To make each one actually readable:
--   1. Download the free PDF/EPUB from Project Gutenberg (gutenberg.org —
--      search the title) or another public-domain source.
--   2. Log in to your own OpenRead site and use the normal /upload page
--      to upload that file under the matching title.
--   3. Delete the placeholder row below for that title (or just leave
--      both — duplicates don't break anything, they just show twice).
--
-- Until a real file is attached, clicking these in the reader will show
-- a friendly "file not uploaded yet" message instead of crashing.

insert into public.books
  (title, author, description, category, language, tags, publication_year, file_path, file_type, status)
values
  ('As a Man Thinketh', 'James Allen',
   'A short, foundational essay on how habitual thought shapes character, circumstances, and results — one of the most quoted self-help texts ever written.',
   'Self Improvement', 'English', array['mindset','classic','short-read'], 1903,
   'placeholder/as-a-man-thinketh.pdf', 'pdf', 'approved'),

  ('The Science of Getting Rich', 'Wallace D. Wattles',
   'An early classic on wealth-building through focused thought and deliberate action, later a major influence on modern success literature.',
   'Self Improvement', 'English', array['wealth','mindset','classic'], 1910,
   'placeholder/science-of-getting-rich.pdf', 'pdf', 'approved'),

  ('Acres of Diamonds', 'Russell H. Conwell',
   'A widely delivered lecture arguing that opportunity is usually already within reach, if you look carefully at what you already have.',
   'Motivation', 'English', array['opportunity','classic','speech'], 1890,
   'placeholder/acres-of-diamonds.pdf', 'pdf', 'approved'),

  ('Self-Reliance', 'Ralph Waldo Emerson',
   'A landmark essay on individuality, nonconformity, and trusting your own judgment — a cornerstone of personal-development writing.',
   'Self Improvement', 'English', array['philosophy','classic','essay'], 1841,
   'placeholder/self-reliance.pdf', 'pdf', 'approved'),

  ('Meditations', 'Marcus Aurelius',
   'The private journal of a Roman emperor reflecting on discipline, resilience, and calm under pressure — foundational Stoic philosophy.',
   'Self Improvement', 'English', array['stoicism','philosophy','classic'], 180,
   'placeholder/meditations.pdf', 'pdf', 'approved'),

  ('The Art of War', 'Sun Tzu',
   'An ancient strategy text on discipline, preparation, and decision-making, widely applied today to business and personal goals.',
   'Motivation', 'English', array['strategy','discipline','classic'], -500,
   'placeholder/art-of-war.pdf', 'pdf', 'approved'),

  ('How to Live on 24 Hours a Day', 'Arnold Bennett',
   'A practical, no-nonsense guide to using time deliberately — an early and still-relevant take on productivity and daily discipline.',
   'Self Improvement', 'English', array['productivity','time-management','classic'], 1910,
   'placeholder/24-hours-a-day.pdf', 'pdf', 'approved'),

  ('The Kybalion', 'Three Initiates',
   'A study of hermetic principles framed as universal laws of mind and cause-and-effect, popular in early 20th-century self-development circles.',
   'Self Improvement', 'English', array['philosophy','mindset','classic'], 1908,
   'placeholder/the-kybalion.pdf', 'pdf', 'approved'),

  ('Public Speaking: A Practical Course', 'Dale Carnegie',
   'An early guide from Dale Carnegie on building confidence and clarity in front of an audience — the seed of his later, more famous work.',
   'Motivation', 'English', array['confidence','communication','classic'], 1912,
   'placeholder/public-speaking.pdf', 'pdf', 'approved'),

  ('The Prophet', 'Kahlil Gibran',
   'A collection of poetic essays on love, work, freedom, and self-knowledge, widely read as reflective, motivational writing.',
   'Motivation', 'English', array['poetry','reflection','classic'], 1923,
   'placeholder/the-prophet.pdf', 'pdf', 'approved');
