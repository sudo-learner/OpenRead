"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setMessage("Check your email to confirm your account.");
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-8 text-center">Create your account</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <input
          placeholder="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-card border border-white/10 rounded-xl2 px-4 py-3 outline-none focus:border-primary"
        />
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
          placeholder="Password (min 6 characters)"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-card border border-white/10 rounded-xl2 px-4 py-3 outline-none focus:border-primary"
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        {message && <p className="text-primary text-sm">{message}</p>}
        <button
          disabled={loading}
          className="w-full bg-primary text-black font-semibold py-3 rounded-xl2 glow-primary"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="text-center text-sm text-white/50 mt-6">
        Already have an account? <a href="/login" className="text-primary">Log in</a>
      </p>
    </div>
  );
}
