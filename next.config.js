/** @type {import('next').NextConfig} */
// BASE_PATH must equal "/your-repo-name" when deployed as a GitHub Pages
// project site (https://username.github.io/your-repo-name/). Leave it
// unset (empty string) if you deploy to a user/org page or a custom domain.
const nextConfig = {
  output: "export",
  basePath: "/OpenRead",
  assetPrefix: "/OpenRead/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
