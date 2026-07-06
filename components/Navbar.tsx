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
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-primary tracking-wide">
        &lt;OpenRead/&gt;
      </Link>
      <nav className="hidden md:flex gap-6 text-sm text-white/80">
        <Link href="/" className="hover:text-primary">Home</Link>
        <Link href="/categories/?slug=All" className="hover:text-primary">Categories</Link>
        <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
        <Link href="/lists" className="hover:text-primary">My Lists</Link>
        <Link href="/upload" className="hover:text-primary">Upload</Link>
        {isAdmin && <Link href="/admin" className="hover:text-accent text-accent/80">Admin</Link>}
      </nav>
      <div className="flex gap-3 items-center">
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
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl2 text-sm border border-primary/40 hover:bg-primary/10 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl2 text-sm bg-primary text-black font-semibold glow-primary hover:opacity-90 transition"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
