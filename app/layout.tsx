import "./globals.css";
import Navbar from "@/components/Navbar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata = {
  title: "OpenRead — Read Anything, Anywhere",
  description: "A free online book reading platform.",
  manifest: "/OpenRead/manifest.json",
  themeColor: "#0A0A0A",
 icons: {
  icon: [
    {
      url: "/OpenRead/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      url: "/OpenRead/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
  apple: [
    {
      url: "/OpenRead/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
  ],
},
}
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OpenRead",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
