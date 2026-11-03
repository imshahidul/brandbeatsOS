/** @type {import('next').NextConfig} */
const nextConfig = {
  // The storefront is a pure renderer: no client JS is needed for the
  // sandboxed preview (static HTML in an iframe). Keep it lean.
  reactStrictMode: true,
};

export default nextConfig;
