# OpenRead — Free Online Book Reading Platform

A starter version of OpenRead, built to deploy on **GitHub Pages only — no Vercel needed**.

Next.js + TypeScript + Tailwind, exported as a fully static site (`output: 'export'`),
with Supabase (free tier) handling auth, database, and file storage. GitHub Actions
builds and publishes it automatically every time you push to `main`.

## What's included (working, real code)
- Cyber-themed homepage with Trending / Popular / Recently Added / category rows
- Simple email + password login and sign-up (Supabase Auth)
- Category browser (`/categories/?slug=Cybersecurity`)
- Book upload (PDF/EPUB + cover) with admin-approval workflow
- PDF reader (`/reader/?id=...`) with page navigation, dark/sepia/light modes, reading-progress sync
- Dashboard: continue reading, stats, your uploads
- Full Postgres schema with Row Level Security (RLS) for every table
- A GitHub Actions workflow that builds and deploys the site on every push

## Why routes look like `/reader/?id=...` instead of `/reader/123`
GitHub Pages only serves static files — there's no server to generate pages on
demand. So book pages use a query parameter (`?id=`) instead of a dynamic
`/reader/[id]` path, and everything renders in the browser with client-side
JavaScript, the same way a single-page app would. This also means there's no
`middleware.ts` for route protection — the dashboard and upload pages check
login state in the browser and redirect if needed. That's a UX convenience
only; the actual security boundary is Supabase's Row Level Security, which
applies no matter how someone reaches your data.

## Not yet built (roadmap — add these next, one at a time)
- EPUB reader (use `epub.js` the same way `react-pdf` is used here)
- Notes / highlights / bookmarks UI (tables already exist in `supabase/schema.sql`)
- Reviews, ratings, reading lists, follow system (tables already exist)
- Admin panel (approve/reject uploads — query `books` where `status = 'pending'`)
- Global search page — use Postgres full-text search on `books`
- Notifications, reading streaks/goals, text-to-speech, dictionary/translate

Build these the same way you built EasyToLearn in stages — one feature, tested, then the next.

---

## Part 1 — Set up Supabase (free tier)

1. Go to https://supabase.com → **New project**. Pick a name and a strong database password (save it).
2. Go to **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, click **Run**.
3. Go to **Storage** → create two buckets: `books` and `covers`. Set both to **Public**.
4. Go to **Authentication → Providers** — Email is on by default, and that's all this starter uses. No need to touch Google/GitHub providers.
5. Go to **Project Settings → API** and copy the `Project URL` and `anon public` key — you'll need these twice (local `.env.local` and GitHub Secrets, below).

## Part 2 — Run it locally first

```bash
cd openread
npm install
cp .env.example .env.local
# paste your Supabase URL and anon key into .env.local
npm run dev
```

Open http://localhost:3000. Test the flow:
1. Sign up with email → confirm via inbox → log in.
2. Go to `/upload`, upload a PDF — it lands as "pending".
3. In Supabase Table Editor → `books` table, change that row's `status` to `approved`.
4. Refresh the homepage — the book appears. Click it to open the reader.

## Part 3 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial OpenRead scaffold"
git branch -M main
git remote add origin https://github.com/<your-username>/openread.git
git push -u origin main
```

## Part 4 — Turn on GitHub Pages (via GitHub Actions — this replaces Vercel)

1. On your repo: **Settings → Pages → Build and deployment → Source** → select **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → New repository secret**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (The workflow at `.github/workflows/deploy.yml` reads these automatically.)
3. **Important:** in `.github/workflows/deploy.yml`, the line `BASE_PATH: /openread` must match your actual repo name exactly (with the leading slash). If you rename the repo, update this line.
   - Exception: if your repo is named `<your-username>.github.io` (a *user* page, not a project page), delete the `BASE_PATH` line entirely — user pages are served from the domain root.
4. Push to `main` (or re-run the workflow from the **Actions** tab). Watch it build under the **Actions** tab.
5. Once it finishes, your site is live at:
   - `https://<your-username>.github.io/openread/` (project page), or
   - `https://<your-username>.github.io/` (user page)

## Part 5 — Point Supabase auth at your live URL

Go to Supabase → **Authentication → URL Configuration**:
- Set **Site URL** to your GitHub Pages URL.
- Add the same URL (and `http://localhost:3000` for local testing) to **Redirect URLs**.

This matters for email confirmation links — Supabase uses the Site URL to build the "confirm your email" link it sends out.

## Part 6 — (Optional) Custom domain, still 100% GitHub

1. In your repo, add a `public/CNAME` file containing just your domain, e.g. `openread.yourdomain.com`.
2. At your domain registrar (or Cloudflare, like you did for bharatdarsanamtravels.com), add a CNAME record pointing your subdomain to `<your-username>.github.io`.
3. In **Settings → Pages**, GitHub will detect the CNAME and issue an HTTPS certificate automatically.
4. Update Supabase's Site URL/Redirect URLs to the custom domain.

---

## Making changes after this is live
Every time you `git push` to `main`, the GitHub Actions workflow rebuilds and
redeploys automatically — no manual steps, no Vercel dashboard. You can watch
progress under the **Actions** tab of your repo.

## Notes on scale and safety
- All data access is protected by Postgres Row Level Security — even though the `anon` key is public by design, users can't read each other's private notes/progress or unapproved books.
- Supabase's free tier is enough for a personal project or small user base; if sudo.learner sends this real traffic, you'll eventually need to upgrade the Supabase plan for more storage/bandwidth (GitHub Pages hosting itself stays free either way).
- Book uploads should be things you have the right to share (your own notes, public-domain books, or content you have permission for) — hosting copyrighted books without permission is a legal risk for any platform, not just a technical one.
