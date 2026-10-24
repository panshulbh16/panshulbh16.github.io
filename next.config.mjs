/** @type {import('next').NextConfig} */
const nextConfig = {
  // GitHub Pages serves static files only, so `next build` writes the whole site to out/.
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  // Pin the project root; a package-lock.json higher up the disk confuses Next's guess.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
