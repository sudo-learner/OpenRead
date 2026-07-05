"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-8 text-center">Log in to OpenRead</h1>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-card border border-white/10 rounded-xl2 px-4 py-3 outline-none focus:border-primary"
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-card border border-white/10 rounded-xl2 px-4 py-3 outline-none focus:border-primary"
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-primary text-black font-semibold py-3 rounded-xl2 glow-primary"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="text-center text-sm text-white/50 mt-6">
        No account? <a href="/signup" className="text-primary">Sign up</a>
      </p>
    </div>
  );
}
