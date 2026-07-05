import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-primary tracking-wide">
        &lt;OpenRead/&gt;
      </Link>
      <nav className="hidden md:flex gap-6 text-sm text-white/80">
        <Link href="/" className="hover:text-primary">Home</Link>
        <Link href="/categories/?slug=Cybersecurity" className="hover:text-primary">Categories</Link>
        <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
        <Link href="/upload" className="hover:text-primary">Upload</Link>
      </nav>
      <div className="flex gap-3">
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
      </div>
    </header>
  );
}
