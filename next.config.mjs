// Static export: the demo is plain files (HTML, JS, data, a sample .xlsx) that any free static host can serve.
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
}
export default nextConfig
