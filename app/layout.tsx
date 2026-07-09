import "./globals.css";
import Navbar from "@/components/Navbar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

// Next.js's metadata API does NOT automatically prepend the configured
// basePath to manifest/icon URLs the way it does for next/link and
// next/image — so without this, the browser looks for the manifest at
// the wrong address (site root instead of /OpenRead/) and reports
// "No manifest detected" even though the file itself is fine.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata = {
  title: "OpenRead — Read Anything, Anywhere",
  description: "A free online book reading platform.",
<<<<<<< HEAD
  manifest: `${basePath}/manifest.json`,
  themeColor: "#0A0A0A",
  icons: {
    icon: [
      { url: `${basePath}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: `${basePath}/icons/icon-192.png`, sizes: "192x192", type: "image/png" }],
  },
=======
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
>>>>>>> 2b518006e15d4d31b609471bf270428daf915960
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
