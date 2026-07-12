"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, role")
          .eq("id", user.id)
          .single();
        setUsername(profile?.username ?? user.email ?? "You");
        setIsAdmin(profile?.role === "admin");
      }
      setChecked(true);
    }
    load();

    const { data: listener } = supabase.auth.onAuthStateChange(() => load());
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUsername(null);
    setIsAdmin(false);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const navLinks = (
    <>
      <Link href="/" onClick={() => setMenuOpen(false)} className="hover:text-primary">Home</Link>
      <Link href="/categories/?slug=All" onClick={() => setMenuOpen(false)} className="hover:text-primary">Categories</Link>
      <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="hover:text-primary">Dashboard</Link>
      <Link href="/lists" onClick={() => setMenuOpen(false)} className="hover:text-primary">My Lists</Link>
      <Link href="/upload" onClick={() => setMenuOpen(false)} className="hover:text-primary">Upload</Link>
      {isAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)} className="hover:text-accent text-accent/80">Admin</Link>}
    </>
  );

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary tracking-wide">
          &lt;OpenRead/&gt;
        </Link>

        <nav className="hidden md:flex gap-6 text-sm text-white/80">{navLinks}</nav>

        <div className="flex gap-3 items-center">
          <div className="hidden md:flex gap-3 items-center">
            {!checked ? null : username ? (
              <>
                <span className="text-sm text-white/60 hidden sm:inline">Hi, {username}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl2 text-sm border border-white/20 hover:bg-white/5 transition"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded-xl2 text-sm border border-primary/40 hover:bg-primary/10 transition">
                  Log in
                </Link>
                <Link href="/signup" className="px-4 py-2 rounded-xl2 text-sm bg-primary text-black font-semibold glow-primary hover:opacity-90 transition">
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-white/20"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-4 text-sm text-white/80 border-t border-white/10">
          <div className="flex flex-col gap-3 pt-4">{navLinks}</div>
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            {!checked ? null : username ? (
              <>
                <span className="text-white/60">Hi, {username}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl2 border border-white/20 hover:bg-white/5 transition text-center"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="px-4 py-2 rounded-xl2 border border-primary/40 text-center">
                  Log in
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="px-4 py-2 rounded-xl2 bg-primary text-black font-semibold text-center">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
