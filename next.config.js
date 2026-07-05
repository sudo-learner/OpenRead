/** @type {import('next').NextConfig} */
// BASE_PATH must equal "/your-repo-name" when deployed as a GitHub Pages
// project site (https://username.github.io/your-repo-name/). Leave it
// unset (empty string) if you deploy to a user/org page or a custom domain.
const basePath = process.env.BASE_PATH || "";

const nextConfig = {
  output: "export",       // produces a static /out folder — no Node server needed
  trailingSlash: true,    // so GitHub Pages serves folder/index.html correctly
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,    // next/image optimization needs a server; disable for static export
  },
};

module.exports = nextConfig;
