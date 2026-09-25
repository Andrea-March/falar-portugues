/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Gli audio hanno il nome ricavato dal testo: non cambiano mai, il browser può tenerli per sempre
  async headers() {
    return [{ source: '/audio/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }];
  },
};

export default nextConfig;
