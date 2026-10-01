import { courseConfig } from '@/content';

/**
 * Digital Asset Links per l'app Android (TWA) del corso, da courseConfig.android.
 * Generato al build: un corso senza app Android risponde 404.
 */
export const dynamic = 'force-static';

export function GET() {
  const android = courseConfig.android;
  if (!android) return new Response('Not found', { status: 404 });
  return Response.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: android.packageName,
        sha256_cert_fingerprints: android.sha256CertFingerprints,
      },
    },
  ]);
}
