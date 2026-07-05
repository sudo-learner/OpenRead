import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "OpenRead — Read Anything, Anywhere",
  description: "A free online book reading platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
